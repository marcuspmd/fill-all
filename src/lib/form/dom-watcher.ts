/**
 * DOM Watcher — observes DOM mutations after field interactions
 * to detect new/changed form fields and re-fill them
 */

import { detectAllFields } from "./form-detector";
import { fillAllFields } from "./form-filler";
import { createLogger } from "@/lib/logger";

const log = createLogger("DomWatcher");

type DomWatcherCallback = (newFieldsCount: number) => void;

export interface WatcherConfig {
  /** Debounce interval in ms (default 600) */
  debounceMs?: number;
  /** Whether to auto-refill new fields (default false) */
  autoRefill?: boolean;
  /** Whether to observe inside Shadow DOM trees (default false) */
  shadowDOM?: boolean;
}

const DEFAULT_DEBOUNCE_MS = 600;

let observer: MutationObserver | null = null;
let shadowObservers: MutationObserver[] = [];
let isWatching = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastFieldSignature = "";
let onNewFieldsCallback: DomWatcherCallback | null = null;
let isFillingInProgress = false;
let activeConfig: Required<WatcherConfig> = {
  debounceMs: DEFAULT_DEBOUNCE_MS,
  autoRefill: false,
  shadowDOM: false,
};

const OBSERVE_OPTIONS: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["disabled", "hidden", "style", "class"],
};

/**
 * Starts watching the DOM for form changes.
 * When new fields are detected, calls the callback and optionally re-fills.
 */
export function startWatching(
  callback?: DomWatcherCallback,
  autoRefill?: boolean,
  config?: WatcherConfig,
): void {
  if (isWatching) return;

  activeConfig = {
    debounceMs: config?.debounceMs ?? DEFAULT_DEBOUNCE_MS,
    autoRefill: config?.autoRefill ?? autoRefill ?? false,
    shadowDOM: config?.shadowDOM ?? false,
  };

  onNewFieldsCallback = callback ?? null;
  lastFieldSignature = getCurrentFieldSignature();
  isWatching = true;

  observer = new MutationObserver(handleMutations);
  observer.observe(document.body, OBSERVE_OPTIONS);

  if (activeConfig.shadowDOM) {
    observeShadowRoots(document.body);
  }

  log.debug(
    `DOM watcher started (debounce=${activeConfig.debounceMs}ms, autoRefill=${activeConfig.autoRefill}, shadowDOM=${activeConfig.shadowDOM})`,
  );
}

/**
 * Stops watching the DOM
 */
export function stopWatching(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  for (const so of shadowObservers) {
    so.disconnect();
  }
  shadowObservers = [];
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  isWatching = false;
  onNewFieldsCallback = null;
  log.debug("DOM watcher stopped");
}

/**
 * Returns whether the watcher is active
 */
export function isWatcherActive(): boolean {
  return isWatching;
}

/**
 * Returns the active watcher configuration
 */
export function getWatcherConfig(): Required<WatcherConfig> {
  return { ...activeConfig };
}

/**
 * Marks that filling is in progress (to avoid self-triggering)
 */
export function setFillingInProgress(value: boolean): void {
  isFillingInProgress = value;
}

// ── Internal Helpers ──────────────────────────────────────────────────────────

function handleMutations(mutations: MutationRecord[]): void {
  if (isFillingInProgress) return;

  const isRelevant = mutations.some((m) => {
    if (
      m.type === "childList" &&
      (m.addedNodes.length > 0 || m.removedNodes.length > 0)
    ) {
      // When Shadow DOM is enabled, watch newly attached shadow hosts
      if (activeConfig.shadowDOM) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement && node.shadowRoot) {
            observeSingleShadowRoot(node.shadowRoot);
          }
        }
      }
      return true;
    }
    if (m.type === "attributes") {
      const target = m.target as HTMLElement;
      if (target.id === "fill-all-notification") return false;
      if (
        m.attributeName === "disabled" ||
        m.attributeName === "hidden" ||
        m.attributeName === "style" ||
        m.attributeName === "class"
      ) {
        return hasFormContent(target);
      }
    }
    return false;
  });

  if (!isRelevant) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const newSignature = getCurrentFieldSignature();
    if (newSignature !== lastFieldSignature) {
      const oldCount = lastFieldSignature.split("|").filter(Boolean).length;
      const newCount = newSignature.split("|").filter(Boolean).length;
      const diff = newCount - oldCount;

      lastFieldSignature = newSignature;

      if (diff > 0) {
        log.info(`Detected ${diff} new form field(s)`);

        if (onNewFieldsCallback) {
          onNewFieldsCallback(diff);
        }

        if (activeConfig.autoRefill) {
          await refillNewFields();
        }
      } else if (diff !== 0) {
        log.info(`Form structure changed (${diff} fields)`);
        if (onNewFieldsCallback) {
          onNewFieldsCallback(diff);
        }
      }
    }
  }, activeConfig.debounceMs);
}

/**
 * Walks a subtree to find existing open shadow roots and attach observers.
 */
function observeShadowRoots(root: Element | Document): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node instanceof HTMLElement && node.shadowRoot) {
      observeSingleShadowRoot(node.shadowRoot);
    }
    node = walker.nextNode();
  }
}

function observeSingleShadowRoot(shadowRoot: ShadowRoot): void {
  const so = new MutationObserver(handleMutations);
  so.observe(shadowRoot, OBSERVE_OPTIONS);
  shadowObservers.push(so);
  log.debug(`Attached shadow root observer (total=${shadowObservers.length})`);
}

/**
 * Re-fills only the new fields that appeared after a DOM change
 */
async function refillNewFields(): Promise<void> {
  isFillingInProgress = true;
  try {
    await fillAllFields();
    lastFieldSignature = getCurrentFieldSignature();
  } finally {
    isFillingInProgress = false;
  }
}

/**
 * Generates a signature string from current form fields for change detection
 */
function getCurrentFieldSignature(): string {
  const { fields } = detectAllFields();
  const fieldSigs = fields.map((f) => `${f.selector}:${f.fieldType}`);
  return fieldSigs.sort().join("|");
}

/**
 * Checks if an element contains or is a form-related element
 */
function hasFormContent(el: HTMLElement): boolean {
  if (
    el.tagName === "INPUT" ||
    el.tagName === "SELECT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "FORM"
  ) {
    return true;
  }

  if (
    el.classList.contains("ant-select") ||
    el.classList.contains("ant-form-item") ||
    el.className.includes("MuiFormControl") ||
    el.className.includes("react-select")
  ) {
    return true;
  }

  return (
    el.querySelector("input, select, textarea, .ant-select, .ant-form-item") !==
    null
  );
}
