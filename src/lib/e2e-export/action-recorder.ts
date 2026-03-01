/**
 * Action Recorder — captures real user interactions on the page.
 *
 * When recording is active, attaches event listeners to the document to
 * capture fills, clicks, selects, checks, key presses, and form submissions.
 * A MutationObserver detects DOM changes (new fields loading, elements
 * appearing/disappearing) and inserts wait steps automatically.
 *
 * Runs in the content-script context (DOM access required).
 */

import type {
  CapturedHttpResponse,
  RecordedStep,
  RecordedStepType,
  RecordingSession,
  RecordingStatus,
  SmartSelector,
} from "./e2e-export.types";
import { extractSmartSelectors } from "./smart-selector";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let session: RecordingSession | null = null;
/**
 * Holds the last stopped session so it can be exported after recording ends.
 * Cleared by `clearSession()` or when a new recording starts.
 */
let stoppedSession: RecordingSession | null = null;
let mutationObserver: MutationObserver | null = null;
let lastActionTimestamp = 0;
let pendingMutationTimer: ReturnType<typeof setTimeout> | null = null;
let listeners: Array<{
  target: EventTarget;
  event: string;
  handler: EventListener;
}> = [];

// Network tracking state
let pendingNetworkRequests = 0;
let networkIdleTimer: ReturnType<typeof setTimeout> | null = null;
let lastNetworkActivityTimestamp = 0;
let origFetch: typeof globalThis.fetch | null = null;
let origXhrOpen: XMLHttpRequest["open"] | null = null;
let origXhrSend: XMLHttpRequest["send"] | null = null;

/** Per-instance XHR request info to avoid race conditions between concurrent requests */
const xhrRequestInfo = new WeakMap<
  XMLHttpRequest,
  { method: string; url: string }
>();

let capturedResponses: CapturedHttpResponse[] = [];
/** Preserved responses from the last stopped session — available until clearSession() */
let stoppedResponses: CapturedHttpResponse[] = [];

/** Optional callback invoked whenever a step is added or updated */
type StepCallback = (step: RecordedStep, index: number) => void;
let onStepAddedCallback: StepCallback | null = null;
let onStepUpdatedCallback: StepCallback | null = null;

const MUTATION_DEBOUNCE_MS = 400;
const FORM_FIELD_SELECTOR = "input, select, textarea, [contenteditable='true']";

/** sessionStorage key used to persist the recording session across page navigations. */
const RECORDING_SESSION_KEY = "fill-all-recording";

interface PersistedRecording {
  session: RecordingSession;
  capturedResponses: CapturedHttpResponse[];
}

/**
 * Selectors for Fill All extension UI elements.
 * Interactions with these elements must be ignored during recording.
 */
const EXTENSION_UI_SELECTORS = [
  "#fill-all-field-icon",
  "#fill-all-rule-popup",
  "#fill-all-notification",
  "#fill-all-record-indicator",
  "[id^='fa-btn-']",
  "[id^='fa-record-']",
  ".fa-action-card",
  ".fa-record-dialog",
  ".fa-record-overlay",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): number {
  return Date.now();
}

/**
 * Serializes the current session and captured responses to sessionStorage.
 * Called before page navigation (beforeunload / form submit) to survive reloads.
 */
function persistSession(): void {
  if (!session) return;
  try {
    const data: PersistedRecording = {
      session: { ...session, steps: [...session.steps] },
      capturedResponses: [...capturedResponses],
    };
    sessionStorage.setItem(RECORDING_SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage may be unavailable in sandboxed iframes — ignore silently
  }
}

function clearPersistedSession(): void {
  try {
    sessionStorage.removeItem(RECORDING_SESSION_KEY);
  } catch {
    // ignore
  }
}

function buildQuickSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const testId =
    el.getAttribute("data-testid") ?? el.getAttribute("data-test-id");
  if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

  const name = el.getAttribute("name");
  if (name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;

  const tag = el.tagName.toLowerCase();
  const type = el.getAttribute("type");
  if (type) return `${tag}[type="${CSS.escape(type)}"]`;

  return tag;
}

function resolveLabel(el: Element): string | undefined {
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    const id = el.id;
    if (id) {
      const labelEl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
    }
  }

  // Try closest label ancestor
  const parentLabel = el.closest("label");
  if (parentLabel?.textContent?.trim()) return parentLabel.textContent.trim();

  // aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // placeholder
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.placeholder) return el.placeholder;
  }

  return undefined;
}

function isFormField(el: Element): boolean {
  return el.matches(FORM_FIELD_SELECTOR);
}

/**
 * Returns true if the element belongs to the Fill All extension UI.
 * These elements must be excluded from recording.
 */
function isExtensionUI(el: Element): boolean {
  return EXTENSION_UI_SELECTORS.some(
    (sel) => el.matches?.(sel) || el.closest?.(sel) !== null,
  );
}

function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    (el as HTMLElement).offsetParent !== null
  );
}

function buildStep(
  type: RecordedStepType,
  el: Element | null,
  extra: Partial<RecordedStep> = {},
): RecordedStep {
  const step: RecordedStep = {
    type,
    timestamp: now(),
    ...extra,
  };

  if (el) {
    step.selector = buildQuickSelector(el);
    step.smartSelectors = safeExtractSelectors(el);
    step.label = extra.label ?? resolveLabel(el);
  }

  return step;
}

function safeExtractSelectors(el: Element): SmartSelector[] {
  try {
    return extractSmartSelectors(el);
  } catch {
    return [];
  }
}

function addStep(step: RecordedStep): void {
  if (!session || session.status !== "recording") return;
  session.steps.push(step);
  lastActionTimestamp = step.timestamp;
  onStepAddedCallback?.(step, session.steps.length - 1);
}

function addListener(
  target: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
): void {
  target.addEventListener(event, handler, options);
  listeners.push({ target, event, handler });
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

function onInput(e: Event): void {
  const el = e.target;
  if (
    !(
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    )
  )
    return;
  if (!session || session.status !== "recording") return;
  if (isExtensionUI(el)) return;

  // Debounce rapid typing — only record the last value
  const lastStep = session.steps[session.steps.length - 1];
  if (
    lastStep?.type === "fill" &&
    lastStep.selector === buildQuickSelector(el) &&
    now() - lastStep.timestamp < 500
  ) {
    lastStep.value = el.value;
    lastStep.timestamp = now();
    onStepUpdatedCallback?.(lastStep, session.steps.length - 1);
    return;
  }

  if (el instanceof HTMLSelectElement) {
    addStep(buildStep("select", el, { value: el.value }));
    return;
  }

  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox") {
      addStep(buildStep(el.checked ? "check" : "uncheck", el));
      return;
    }
    if (el.type === "radio") {
      addStep(buildStep("check", el, { value: el.value }));
      return;
    }
  }

  addStep(buildStep("fill", el, { value: el.value }));
}

function onChange(e: Event): void {
  const el = e.target;
  if (!(el instanceof HTMLSelectElement)) return;
  if (!session || session.status !== "recording") return;
  if (isExtensionUI(el)) return;

  // Select changes are captured here if not caught by input
  const lastStep = session.steps[session.steps.length - 1];
  if (
    lastStep?.type === "select" &&
    lastStep.selector === buildQuickSelector(el)
  ) {
    lastStep.value = el.value;
    return;
  }

  addStep(buildStep("select", el, { value: el.value }));
}

function onClick(e: Event): void {
  const el = e.target as Element;
  if (!session || session.status !== "recording") return;

  // Ignore clicks on Fill All extension UI
  if (isExtensionUI(el)) return;

  // Form fields are handled by onInput/onChange
  if (isFormField(el)) return;

  // Detect submit buttons
  const isSubmit =
    (el instanceof HTMLButtonElement && (el.type === "submit" || !el.type)) ||
    (el instanceof HTMLInputElement && el.type === "submit");

  if (isSubmit) {
    addStep(
      buildStep("submit", el, {
        label:
          el instanceof HTMLInputElement ? el.value : el.textContent?.trim(),
      }),
    );
    return;
  }

  // Links and buttons
  const label = el.textContent?.trim()?.slice(0, 80);
  addStep(buildStep("click", el, { label }));
}

/**
 * Captures values of form fields that do not yet have a recorded fill/select/check
 * step. Needed for fields with default values, auto-filled values, or values set
 * programmatically (e.g. by the Fill All extension).
 */
function captureUnrecordedFormFields(form: HTMLFormElement): void {
  if (!session) return;

  // Build a set of selectors that already have a recorded step in this session
  const recordedSelectors = new Set(
    session.steps
      .filter((s) =>
        (["fill", "select", "check", "uncheck"] as RecordedStepType[]).includes(
          s.type,
        ),
      )
      .map((s) => s.selector)
      .filter(Boolean),
  );

  const fields = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >("input, select, textarea");

  for (const field of fields) {
    if (isExtensionUI(field)) continue;
    if (!isVisible(field)) continue;

    const sel = buildQuickSelector(field);
    if (recordedSelectors.has(sel)) continue; // already recorded

    if (field instanceof HTMLSelectElement && field.value) {
      addStep(buildStep("select", field, { value: field.value }));
    } else if (field instanceof HTMLInputElement) {
      if (field.type === "checkbox") {
        if (field.checked) addStep(buildStep("check", field));
      } else if (field.type === "radio") {
        if (field.checked)
          addStep(buildStep("check", field, { value: field.value }));
      } else if (
        !["submit", "button", "reset", "image"].includes(field.type) &&
        field.value
      ) {
        addStep(buildStep("fill", field, { value: field.value }));
      }
    } else if (field instanceof HTMLTextAreaElement && field.value) {
      addStep(buildStep("fill", field, { value: field.value }));
    }
  }
}

function onSubmit(e: Event): void {
  const form = e.target as HTMLFormElement;
  if (!session || session.status !== "recording") return;
  if (isExtensionUI(form)) return;

  // Snapshot all current field values into the recording (captures values that
  // were pre-filled, auto-filled, or set by Fill All and thus never triggered
  // an 'input' event).
  captureUnrecordedFormFields(form);

  const lastStep = session.steps[session.steps.length - 1];
  // Avoid duplicate if we already captured the submit button click
  if (lastStep?.type === "submit" && now() - lastStep.timestamp < 200) return;

  const action = form.getAttribute("action");
  addStep(
    buildStep("submit", form, {
      url: action ?? undefined,
      label: "Form submit",
    }),
  );

  // Persist the session to sessionStorage so it survives a traditional
  // (non-AJAX) form submit that causes a full page navigation.
  persistSession();
}

function onKeyDown(e: KeyboardEvent): void {
  if (!session || session.status !== "recording") return;

  // Only capture meaningful keys (Enter, Escape, Tab)
  const capturedKeys = ["Enter", "Escape", "Tab"];
  if (!capturedKeys.includes(e.key)) return;

  const el = e.target as Element;
  if (isExtensionUI(el)) return;
  addStep(buildStep("press-key", el, { key: e.key }));
}

function onBeforeUnload(): void {
  if (!session || session.status !== "recording") return;

  addStep({
    type: "navigate",
    timestamp: now(),
    url: window.location.href,
    label: "Page navigation",
  });

  // Persist session including the navigate step so it is available after reload
  persistSession();
}

function onHashChange(): void {
  if (!session || session.status !== "recording") return;

  addStep({
    type: "wait-for-url",
    timestamp: now(),
    url: window.location.href,
    value: window.location.hash,
    label: "URL hash changed",
  });
}

function onPopState(): void {
  if (!session || session.status !== "recording") return;

  addStep({
    type: "wait-for-url",
    timestamp: now(),
    url: window.location.href,
    label: "URL changed (popstate)",
  });
}

// ---------------------------------------------------------------------------
// Mutation Observer — auto-detect waits
// ---------------------------------------------------------------------------

function startMutationObserver(): void {
  if (mutationObserver) return;

  mutationObserver = new MutationObserver((mutations) => {
    if (!session || session.status !== "recording") return;

    // Debounce rapid mutations
    if (pendingMutationTimer) clearTimeout(pendingMutationTimer);
    pendingMutationTimer = setTimeout(() => {
      processMutations(mutations);
    }, MUTATION_DEBOUNCE_MS);
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class", "hidden", "disabled", "aria-hidden"],
  });
}

function processMutations(mutations: MutationRecord[]): void {
  if (!session || session.status !== "recording") return;

  const addedElements = new Set<Element>();
  const removedElements = new Set<Element>();

  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          addedElements.add(node);
          // Also check for form fields inside added containers
          for (const child of node.querySelectorAll(FORM_FIELD_SELECTOR)) {
            addedElements.add(child);
          }
        }
      }
      for (const node of mutation.removedNodes) {
        if (node instanceof Element) {
          removedElements.add(node);
        }
      }
    }
  }

  // Detect new visible form fields (cascading selects, dynamic fields)
  const newFormFields = [...addedElements].filter(
    (el) => isFormField(el) && isVisible(el) && !isExtensionUI(el),
  );

  if (newFormFields.length > 0) {
    const firstField = newFormFields[0];
    addStep(
      buildStep("wait-for-element", firstField, {
        label: `Wait for ${newFormFields.length} new field(s)`,
        waitTimeout: 5000,
      }),
    );
  }

  // Detect loading spinners disappearing
  const spinnerSelectors = [
    ".loading",
    ".spinner",
    ".loader",
    "[aria-busy='true']",
    ".ant-spin",
    ".MuiCircularProgress-root",
    ".sk-spinner",
  ];

  for (const el of removedElements) {
    const isSpinner = spinnerSelectors.some(
      (sel) => el.matches?.(sel) || el.querySelector?.(sel),
    );
    if (isSpinner) {
      addStep({
        type: "wait-for-hidden",
        timestamp: now(),
        selector: buildQuickSelector(el),
        label: "Wait for loading to finish",
        waitTimeout: 10000,
      });
      break;
    }
  }
}

function stopMutationObserver(): void {
  if (pendingMutationTimer) {
    clearTimeout(pendingMutationTimer);
    pendingMutationTimer = null;
  }
  mutationObserver?.disconnect();
  mutationObserver = null;
}

// ---------------------------------------------------------------------------
// Network monitoring — intercept fetch/XHR for smart waits
// ---------------------------------------------------------------------------

const NETWORK_IDLE_THRESHOLD_MS = 500;

function onNetworkRequestStart(): void {
  pendingNetworkRequests++;
  lastNetworkActivityTimestamp = now();
  if (networkIdleTimer) {
    clearTimeout(networkIdleTimer);
    networkIdleTimer = null;
  }
}

function onNetworkRequestEnd(
  url: string,
  method: string,
  status: number,
): void {
  pendingNetworkRequests = Math.max(0, pendingNetworkRequests - 1);
  lastNetworkActivityTimestamp = now();

  // Store response for HTTP assertion generation
  capturedResponses.push({ url, method, status, timestamp: now() });

  // Add a visible assert step for state-changing requests (POST/PUT/PATCH/DELETE)
  // so the user can see AJAX calls in the recording panel and assertions are generated.
  // GET/HEAD/OPTIONS are read-only and typically numerous (assets, analytics), we skip them.
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    addStep({
      type: "assert",
      timestamp: now(),
      url,
      value: method,
      label: `HTTP ${method} → ${status}`,
      assertion: {
        type: "response-ok",
        // assertionLine() in generators reads url from assertion.selector
        selector: url,
        expected: String(status),
        description: `${method} ${url} → ${status}`,
      },
    });
  }

  if (pendingNetworkRequests === 0) {
    networkIdleTimer = setTimeout(() => {
      if (!session || session.status !== "recording") return;

      // Only insert network idle step if last user action was recent
      // (indicates the network activity was triggered by user interaction)
      const timeSinceLastAction = now() - lastActionTimestamp;
      if (timeSinceLastAction < 10_000) {
        addStep({
          type: "wait-for-network-idle",
          timestamp: now(),
          label: "Wait for network requests to complete",
          waitTimeout: 10_000,
        });
      }
    }, NETWORK_IDLE_THRESHOLD_MS);
  }
}

function startNetworkMonitoring(): void {
  // --- Intercept fetch ---
  origFetch = globalThis.fetch;
  globalThis.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    if (!session || session.status !== "recording") {
      return origFetch!.call(globalThis, input, init);
    }

    const method = init?.method?.toUpperCase() ?? "GET";
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    onNetworkRequestStart();

    return origFetch!.call(globalThis, input, init).then(
      (response) => {
        onNetworkRequestEnd(url, method, response.status);
        return response;
      },
      (err) => {
        onNetworkRequestEnd(url, method, 0);
        throw err;
      },
    );
  };

  // --- Intercept XMLHttpRequest ---
  origXhrOpen = XMLHttpRequest.prototype.open;
  origXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    // Store per-instance to avoid race conditions between concurrent XHRs
    xhrRequestInfo.set(this, {
      method: method.toUpperCase(),
      url: typeof url === "string" ? url : url.href,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (origXhrOpen as any).apply(this, [method, url, ...rest]);
  } as typeof XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.send = function (
    ...args: Parameters<XMLHttpRequest["send"]>
  ) {
    if (session?.status === "recording") {
      const info = xhrRequestInfo.get(this);
      if (info) {
        const { method: capturedMethod, url: capturedUrl } = info;
        onNetworkRequestStart();
        this.addEventListener("loadend", () => {
          onNetworkRequestEnd(capturedUrl, capturedMethod, this.status);
          xhrRequestInfo.delete(this);
        });
      }
    }
    return origXhrSend!.apply(this, args);
  };
}

function stopNetworkMonitoring(): void {
  if (origFetch) {
    globalThis.fetch = origFetch;
    origFetch = null;
  }
  if (origXhrOpen) {
    XMLHttpRequest.prototype.open =
      origXhrOpen as typeof XMLHttpRequest.prototype.open;
    origXhrOpen = null;
  }
  if (origXhrSend) {
    XMLHttpRequest.prototype.send = origXhrSend;
    origXhrSend = null;
  }
  if (networkIdleTimer) {
    clearTimeout(networkIdleTimer);
    networkIdleTimer = null;
  }
  pendingNetworkRequests = 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts a new recording session.
 * Attaches event listeners and mutation observer to capture user interactions.
 */
export function startRecording(): RecordingSession {
  // Stop any existing session
  if (session) stopRecording();

  // Clear any previously stopped session so the new recording starts clean.
  // Reset capturedResponses here (not in stopRecording) so that XHR loadend events
  // that arrive after stopRecording can still append to the previous session's stoppedResponses.
  stoppedSession = null;
  stoppedResponses = [];
  capturedResponses = [];
  lastNetworkActivityTimestamp = 0;

  session = {
    steps: [
      {
        type: "navigate",
        timestamp: now(),
        url: window.location.href,
        label: document.title || "Page",
      },
    ],
    startUrl: window.location.href,
    startTime: now(),
    status: "recording",
  };

  lastActionTimestamp = now();

  // Attach event listeners
  addListener(document, "input", onInput, { capture: true });
  addListener(document, "change", onChange, { capture: true });
  addListener(document, "click", onClick, { capture: true });
  addListener(document, "submit", onSubmit, { capture: true });
  addListener(document, "keydown", onKeyDown as EventListener, {
    capture: true,
  });
  addListener(window, "beforeunload", onBeforeUnload);
  addListener(window, "hashchange", onHashChange);
  addListener(window, "popstate", onPopState);

  // Start mutation observer for auto-wait detection
  startMutationObserver();

  // Start network monitoring for smart waits
  startNetworkMonitoring();

  return session;
}

/**
 * Pauses the current recording. Events are still captured but not stored.
 */
export function pauseRecording(): RecordingSession | null {
  if (!session) return null;
  session.status = "paused";
  return session;
}

/**
 * Resumes a paused recording.
 */
export function resumeRecording(): RecordingSession | null {
  if (!session || session.status !== "paused") return null;
  session.status = "recording";
  return session;
}

/**
 * Stops recording and returns the complete session.
 * Cleans up all event listeners and mutation observer.
 */
export function stopRecording(): RecordingSession | null {
  if (!session) return null;

  // If the network-idle timer is pending or requests were recently active,
  // flush a wait-for-network-idle step now (before the session status changes)
  // so the generated test correctly waits for in-flight requests.
  const recentNetworkActivity =
    lastNetworkActivityTimestamp > 0 &&
    now() - lastNetworkActivityTimestamp < 5_000;
  if (
    networkIdleTimer !== null ||
    pendingNetworkRequests > 0 ||
    recentNetworkActivity
  ) {
    if (networkIdleTimer) {
      clearTimeout(networkIdleTimer);
      networkIdleTimer = null;
    }
    const timeSinceLastAction = now() - lastActionTimestamp;
    if (timeSinceLastAction < 10_000) {
      // Push directly (addStep checks session.status === "recording" which is still true here)
      addStep({
        type: "wait-for-network-idle",
        timestamp: now(),
        label: "Wait for network requests to complete",
        waitTimeout: 10_000,
      });
    }
  }

  // Detach all event listeners
  for (const { target, event, handler } of listeners) {
    target.removeEventListener(event, handler, true);
    target.removeEventListener(event, handler);
  }
  listeners = [];

  // Stop mutation observer
  stopMutationObserver();

  // Stop network monitoring
  stopNetworkMonitoring();

  // Keep a reference (not a copy) to capturedResponses so that XHR loadend events
  // that fire after stop (in-flight at stop time) still populate stoppedResponses.
  // capturedResponses is reset to a fresh array in startRecording().
  stoppedResponses = capturedResponses;

  session.status = "stopped";
  lastActionTimestamp = 0;

  const final = session;
  stoppedSession = final; // preserve for export after recording ends
  session = null;

  // The user intentionally stopped recording — clear any persisted session so it
  // is not accidentally restored on the next page load.
  clearPersistedSession();

  return final;
}

/**
 * Returns the current recording session (or null if not recording).
 * After `stopRecording()`, returns the stopped session so it can still be
 * exported. Returns null only after `clearSession()` or a new `startRecording()`.
 */
export function getRecordingSession(): RecordingSession | null {
  return session ?? stoppedSession;
}

/**
 * Returns the current recording status.
 */
export function getRecordingStatus(): RecordingStatus {
  return session?.status ?? "stopped";
}

/**
 * Manually adds a step to the recording (e.g., from extension auto-fill).
 */
export function addManualStep(step: RecordedStep): void {
  addStep(step);
}

/**
 * Returns HTTP responses captured during the recording session.
 * While recording: returns live captured responses.
 * After stopRecording(): returns preserved responses for assertion generation.
 * After clearSession() or startRecording(): returns empty array.
 */
export function getCapturedResponses(): CapturedHttpResponse[] {
  return session ? [...capturedResponses] : [...stoppedResponses];
}

/**
 * Sets a callback that fires whenever a new step is added.
 */
export function setOnStepAdded(cb: StepCallback | null): void {
  onStepAddedCallback = cb;
}

/**
 * Sets a callback that fires whenever a step is updated (e.g. debounced typing).
 */
export function setOnStepUpdated(cb: StepCallback | null): void {
  onStepUpdatedCallback = cb;
}

/**
 * Removes a step by index from the current session.
 * Returns true if removed, false otherwise.
 */
export function removeStep(index: number): boolean {
  if (!session || index < 0 || index >= session.steps.length) return false;
  session.steps.splice(index, 1);
  return true;
}

/**
 * Updates a step's fields at the given index.
 * Supports partial updates (value, waitMs).
 */
export function updateStep(
  index: number,
  patch: Partial<Pick<RecordedStep, "value" | "waitTimeout">>,
): boolean {
  if (!session || index < 0 || index >= session.steps.length) return false;
  const step = session.steps[index];
  if (patch.value !== undefined) step.value = patch.value;
  if (patch.waitTimeout !== undefined) step.waitTimeout = patch.waitTimeout;
  onStepUpdatedCallback?.(step, index);
  return true;
}

/**
 * Clears all steps from the current (or stopped) session,
 * resets session to null.
 */
export function clearSession(): void {
  session = null;
  stoppedSession = null;
  lastActionTimestamp = 0;
  capturedResponses = [];
  stoppedResponses = [];
  clearPersistedSession();
}

/**
 * Checks sessionStorage for a recording session persisted across a page
 * navigation (e.g. traditional form submit). If found, restores the session
 * and resumes recording on the current page.
 *
 * Should be called once on content-script startup.
 */
export function tryRestoreRecordingSession(): RecordingSession | null {
  try {
    const raw = sessionStorage.getItem(RECORDING_SESSION_KEY);
    if (!raw) return null;

    // Remove immediately so subsequent reloads do not re-restore
    sessionStorage.removeItem(RECORDING_SESSION_KEY);

    const data = JSON.parse(raw) as PersistedRecording;
    if (!data?.session?.steps?.length) return null;

    // Stop any currently active recording before restoring
    if (session) stopRecording();

    // Restore state
    stoppedSession = null;
    stoppedResponses = [];
    capturedResponses = data.capturedResponses ?? [];
    lastNetworkActivityTimestamp = 0;

    // Resume the persisted session, adding a navigate step for the new page
    session = {
      ...data.session,
      status: "recording",
      steps: [
        ...data.session.steps,
        {
          type: "navigate" as RecordedStepType,
          timestamp: now(),
          url: window.location.href,
          label: document.title || "New page",
        },
      ],
    };

    lastActionTimestamp = now();

    // Re-attach event listeners on the new document
    addListener(document, "input", onInput, { capture: true });
    addListener(document, "change", onChange, { capture: true });
    addListener(document, "click", onClick, { capture: true });
    addListener(document, "submit", onSubmit, { capture: true });
    addListener(document, "keydown", onKeyDown as EventListener, {
      capture: true,
    });
    addListener(window, "beforeunload", onBeforeUnload);
    addListener(window, "hashchange", onHashChange);
    addListener(window, "popstate", onPopState);

    startMutationObserver();
    startNetworkMonitoring();

    return session;
  } catch {
    return null;
  }
}

export type { CapturedHttpResponse } from "./e2e-export.types";
