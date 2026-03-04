/**
 * Content script — runs on every page, listens for fill commands
 */

import type {
  AIContextPayload,
  DetectedFieldSummary,
  ExtensionMessage,
  FormField,
  SavedForm,
  StreamedFieldMessage,
} from "@/types";
import {
  fillAllFields,
  fillSingleField,
  captureFormValues,
  applyTemplate,
  fillContextualAI,
} from "@/lib/form/form-filler";
import {
  detectAllFieldsAsync,
  detectFormFields,
  streamAllFields,
} from "@/lib/form/form-detector";
import {
  saveForm,
  getSettings,
  getIgnoredFieldsForUrl,
} from "@/lib/storage/storage";
import { initI18n } from "@/lib/i18n";
import {
  buildCapturedActions,
  detectSubmitActions,
  generateE2EScript,
  generateE2EFromRecording,
  detectAssertions,
  detectNegativeAssertions,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getRecordingStatus,
  getRecordingSession,
  setOnStepAdded,
  setOnStepUpdated,
  removeStep,
  updateStep,
  clearSession,
  tryRestoreRecordingSession,
} from "@/lib/e2e-export";
import type {
  E2EFramework,
  E2EGenerateOptions,
  RecordingGenerateOptions,
} from "@/lib/e2e-export";
import {
  startWatching,
  stopWatching,
  isWatcherActive,
  getWatcherConfig,
} from "@/lib/form/dom-watcher";
import type { WatcherConfig } from "@/lib/form/dom-watcher";
import { initFieldIcon } from "@/lib/form/field-icon";
import {
  loadPretrainedModel,
  invalidateClassifier,
  reloadClassifier,
} from "@/lib/form/detectors/strategies";
import {
  setActiveClassifiers,
  buildClassifiersFromSettings,
} from "@/lib/form/detectors/classifiers";
import {
  parseIncomingMessage,
  parseSavedFormPayload,
  parseStartWatchingPayload,
  parseStringPayload,
  parseExportE2EPayload,
  parseExportRecordingPayload,
} from "@/lib/messaging/light-validators";
import { initLogger } from "@/lib/logger";

type FillableElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

let lastContextMenuElement: FillableElement | null = null;

// guard against test environment without DOM
if (typeof document !== "undefined") {
  document.addEventListener(
    "contextmenu",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const field = target.closest("input, select, textarea");
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
      ) {
        lastContextMenuElement = field;
      }
    },
    true,
  );
}

function generateId(): string {
  return crypto.randomUUID();
}

// Listen for messages from background / popup
chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    const parsed = parseIncomingMessage(message);
    if (!parsed) {
      sendResponse({ error: "Invalid message format" });
      return false;
    }

    handleContentMessage(parsed as ExtensionMessage)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: (err as Error).message }));
    return true;
  },
);

export async function handleContentMessage(
  message: ExtensionMessage,
): Promise<unknown> {
  switch (message.type) {
    case "FILL_ALL_FIELDS": {
      const override =
        message.payload != null &&
        typeof message.payload === "object" &&
        "fillEmptyOnly" in (message.payload as object)
          ? {
              fillEmptyOnly: (message.payload as { fillEmptyOnly: boolean })
                .fillEmptyOnly,
            }
          : undefined;
      const results = await fillAllFields(override);
      showNotification(`✓ ${results.length} campos preenchidos`);
      return { success: true, filled: results.length };
    }

    case "FILL_CONTEXTUAL_AI": {
      const context = message.payload as AIContextPayload | undefined;
      const results = await fillContextualAI(context);
      showNotification(
        `✓ ${results.length} campos preenchidos com IA contextual`,
      );
      return { success: true, filled: results.length };
    }

    case "SAVE_FORM": {
      const values = await captureFormValues();
      const formData: SavedForm = {
        id: generateId(),
        name: `Form - ${new URL(window.location.href).hostname} - ${new Date().toLocaleDateString("pt-BR")}`,
        urlPattern: `${window.location.origin}${window.location.pathname}*`,
        fields: values,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveForm(formData);
      showNotification(
        `✓ Formulário salvo com ${Object.keys(values).length} campos`,
      );
      return { success: true, form: formData };
    }

    case "LOAD_SAVED_FORM": {
      const form = parseSavedFormPayload(message.payload);
      if (!form) return { error: "Invalid payload for LOAD_SAVED_FORM" };

      // filter out ignored selectors so applyTemplate won't touch them
      const ignoredFields = await getIgnoredFieldsForUrl(window.location.href);
      const ignoredSelectors = new Set(ignoredFields.map((f) => f.selector));
      const sanitizedFields: typeof form.fields = {};
      for (const [key, value] of Object.entries(form.fields)) {
        // we only know selector-level ignores; if a key equals a selector, drop it
        if (ignoredSelectors.has(key)) continue;
        sanitizedFields[key] = value;
      }
      const sanitizedForm: SavedForm = { ...form, fields: sanitizedFields };

      const { filled } = await applyTemplate(sanitizedForm);
      showNotification(`✓ ${filled} campos carregados do template`);
      return { success: true, filled };
    }

    case "APPLY_TEMPLATE": {
      const form = parseSavedFormPayload(message.payload);
      if (!form) return { error: "Invalid payload for APPLY_TEMPLATE" };
      const { filled } = await applyTemplate(form);
      showNotification(`✓ Template "${form.name}" aplicado: ${filled} campos`);
      return { success: true, filled };
    }

    case "FILL_SINGLE_FIELD": {
      const fields = detectFormFields();
      const targetField = findSingleFieldTarget(fields);
      if (!targetField) return { error: "No target field found" };

      const result = await fillSingleField(targetField);
      if (result) {
        showNotification(
          `✓ Campo "${targetField.label || targetField.name || targetField.id || targetField.selector}" preenchido`,
        );
        return { success: true, ...result };
      }
      return { error: "Failed to fill field" };
    }

    case "GET_FORM_FIELDS": {
      const fields = detectFormFields();
      const mapped = fields.map((f) => ({
        selector: f.selector,
        fieldType: f.fieldType,
        label: f.label,
        name: f.name,
        id: f.id,
        placeholder: f.placeholder,
        required: f.required,
      }));
      return { count: mapped.length, fields: mapped };
    }

    case "DETECT_FIELDS": {
      const { fields: detected } = await detectAllFieldsAsync();
      return {
        count: detected.length,
        fields: detected.map((f): DetectedFieldSummary => {
          const item: DetectedFieldSummary = {
            selector: f.selector,
            fieldType: f.fieldType,
            label: f.label || f.name || f.id || "unknown",
            name: f.name,
            id: f.id,
            placeholder: f.placeholder,
            required: f.required,
            contextualType: f.contextualType,
            detectionMethod: f.detectionMethod,
            detectionConfidence: f.detectionConfidence,
          };
          if (f.element instanceof HTMLSelectElement) {
            item.options = Array.from(f.element.options).map((o) => ({
              value: o.value,
              text: o.text.trim(),
            }));
          }
          if (
            f.element instanceof HTMLInputElement &&
            (f.element.type === "checkbox" || f.element.type === "radio")
          ) {
            item.checkboxValue = f.element.value;
            item.checkboxChecked = f.element.checked;
          }
          return item;
        }),
      };
    }

    case "FILL_FIELD_BY_SELECTOR": {
      const selector = parseStringPayload(message.payload);
      if (!selector)
        return { error: "Invalid payload for FILL_FIELD_BY_SELECTOR" };
      const fields = detectFormFields();
      const field = fields.find((f) => f.selector === selector);
      if (!field) return { error: "Field not found" };
      const result = await fillSingleField(field);
      if (result) {
        showNotification(`✓ Campo "${field.label || selector}" preenchido`);
      }
      return result ?? { error: "Failed to fill field" };
    }

    case "START_WATCHING": {
      const payload = parseStartWatchingPayload(message.payload);
      if (!payload) return { error: "Invalid payload for START_WATCHING" };

      // If debounceMs/shadowDOM not provided in payload, read from settings
      let config: WatcherConfig;
      if (payload.debounceMs == null && payload.shadowDOM == null) {
        const settings = await getSettings();
        config = {
          autoRefill: payload.autoRefill ?? settings.watcherAutoRefill ?? true,
          debounceMs: settings.watcherDebounceMs,
          shadowDOM: settings.watcherShadowDOM,
        };
      } else {
        config = {
          autoRefill: payload.autoRefill ?? true,
          debounceMs: payload.debounceMs,
          shadowDOM: payload.shadowDOM,
        };
      }

      startWatching(
        (newFieldsCount) => {
          if (newFieldsCount > 0) {
            showNotification(
              `🔄 ${newFieldsCount} novo(s) campo(s) detectado(s) — re-preenchendo...`,
            );
          }
        },
        config.autoRefill,
        config,
      );
      return { success: true, watching: true };
    }

    case "STOP_WATCHING": {
      stopWatching();
      return { success: true, watching: false };
    }

    case "GET_WATCHER_STATUS": {
      return {
        watching: isWatcherActive(),
        config: isWatcherActive() ? getWatcherConfig() : null,
      };
    }

    case "INVALIDATE_CLASSIFIER": {
      invalidateClassifier();
      return { success: true };
    }

    case "RELOAD_CLASSIFIER": {
      void reloadClassifier();
      return { success: true };
    }

    case "EXPORT_E2E": {
      const parsed = parseExportE2EPayload(message.payload);
      if (!parsed) return { error: "Invalid payload for EXPORT_E2E" };

      const framework = parsed.framework as E2EFramework;
      const { fields } = await detectAllFieldsAsync();
      const results = await fillAllFields();
      const actions = buildCapturedActions(fields, results);

      // Detect submit buttons and append to actions
      const submitActions = detectSubmitActions();
      const allActions = [...actions, ...submitActions];

      // Detect assertions from the page
      const pageUrl = window.location.href;
      const assertions = detectAssertions(allActions, pageUrl);
      const negativeAssertions = detectNegativeAssertions(allActions);

      const options: E2EGenerateOptions = {
        pageUrl,
        includeAssertions: true,
        includeNegativeTest: true,
        useSmartSelectors: true,
        assertions: [...assertions, ...negativeAssertions],
      };

      const script = generateE2EScript(framework, allActions, options);

      if (!script) return { error: `Unsupported framework: ${framework}` };

      showNotification(
        `✓ Script ${framework} gerado (${allActions.length} ações)`,
      );
      return { success: true, script, actionsCount: allActions.length };
    }

    case "START_RECORDING": {
      startRecording();

      setOnStepAdded((step, index) => {
        chrome.runtime
          .sendMessage({
            type: "RECORDING_STEP_ADDED",
            payload: {
              step: {
                type: step.type,
                selector: step.selector,
                value: step.value,
                url: step.url,
                label: step.label,
                assertion: step.assertion,
              },
              index,
            },
          })
          .catch(() => {});
      });

      setOnStepUpdated((step, index) => {
        chrome.runtime
          .sendMessage({
            type: "RECORDING_STEP_UPDATED",
            payload: {
              step: {
                type: step.type,
                selector: step.selector,
                value: step.value,
                url: step.url,
                label: step.label,
                assertion: step.assertion,
              },
              index,
            },
          })
          .catch(() => {});
      });

      showNotification("🔴 Gravação iniciada");
      return { success: true };
    }

    case "STOP_RECORDING": {
      const session = stopRecording();
      if (!session) return { error: "No recording in progress" };
      showNotification(
        `⏹ Gravação finalizada (${session.steps.length} passos)`,
      );
      return { success: true, stepsCount: session.steps.length };
    }

    case "PAUSE_RECORDING": {
      pauseRecording();
      showNotification("⏸ Gravação pausada");
      return { success: true };
    }

    case "RESUME_RECORDING": {
      resumeRecording();
      showNotification("🔴 Gravação retomada");
      return { success: true };
    }

    case "GET_RECORDING_STATUS": {
      return { success: true, status: getRecordingStatus() };
    }

    case "GET_RECORDING_STEPS": {
      const session = getRecordingSession();
      if (!session) return { success: true, steps: [] };
      return {
        success: true,
        steps: session.steps.map((s, i, arr) => ({
          type: s.type,
          selector: s.selector,
          value: s.value,
          waitMs: i > 0 ? s.timestamp - arr[i - 1].timestamp : 0,
          url: s.url,
        })),
      };
    }

    case "EXPORT_RECORDING": {
      const recPayload = parseExportRecordingPayload(message.payload);
      if (!recPayload) return { error: "Invalid payload for EXPORT_RECORDING" };

      const session = getRecordingSession();
      if (!session || session.steps.length === 0) {
        return { error: "No recorded steps available" };
      }

      const recOptions: RecordingGenerateOptions = {
        testName: recPayload.testName,
        pageUrl: session.startUrl,
        includeAssertions: true,
        minWaitThreshold: 500,
      };

      const recScript = generateE2EFromRecording(
        recPayload.framework as E2EFramework,
        session.steps,
        recOptions,
      );

      if (!recScript) {
        return { error: `Unsupported framework: ${recPayload.framework}` };
      }

      showNotification(
        `✓ Script ${recPayload.framework} gerado (${session.steps.length} passos gravados)`,
      );
      return {
        success: true,
        script: recScript,
        stepsCount: session.steps.length,
      };
    }

    case "REMOVE_RECORDING_STEP": {
      const payload = message.payload as { index?: number } | undefined;
      if (typeof payload?.index !== "number") {
        return { error: "Invalid index" };
      }
      const removed = removeStep(payload.index);
      return { success: removed };
    }

    case "UPDATE_RECORDING_STEP": {
      const payload = message.payload as
        | { index?: number; patch?: { value?: string; waitTimeout?: number } }
        | undefined;
      if (typeof payload?.index !== "number" || !payload.patch) {
        return { error: "Invalid payload" };
      }
      const updated = updateStep(payload.index, payload.patch);
      return { success: updated };
    }

    case "CLEAR_RECORDING": {
      clearSession();
      return { success: true };
    }

    case "CLEAR_FORM": {
      const fields = detectFormFields();
      let cleared = 0;

      for (const field of fields) {
        const el = field.element;
        if (el instanceof HTMLInputElement) {
          if (el.type === "checkbox" || el.type === "radio") {
            el.checked = false;
          } else {
            el.value = "";
          }
          cleared++;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (el instanceof HTMLSelectElement) {
          el.value = "";
          cleared++;
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } else if (el instanceof HTMLTextAreaElement) {
          el.value = "";
          cleared++;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      showNotification(`✓ ${cleared} campo(s) limpo(s)`);
      return { success: true, cleared };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

function findSingleFieldTarget(fields: FormField[]): FormField | undefined {
  if (lastContextMenuElement) {
    const byContextMenu = fields.find(
      (f) => f.element === lastContextMenuElement,
    );
    if (byContextMenu) return byContextMenu;
  }

  if (document.activeElement instanceof HTMLElement) {
    const activeField = document.activeElement.closest(
      "input, select, textarea",
    );
    if (
      activeField instanceof HTMLInputElement ||
      activeField instanceof HTMLSelectElement ||
      activeField instanceof HTMLTextAreaElement
    ) {
      const byFocus = fields.find((f) => f.element === activeField);
      if (byFocus) return byFocus;
    }
  }

  return fields.find((f) => !(f.element as HTMLInputElement).disabled);
}

function showNotification(text: string): void {
  const existing = document.getElementById("fill-all-notification");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = "fill-all-notification";
  el.textContent = text;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    background: "#4F46E5",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "opacity 0.3s ease",
  });

  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// --- Init ---
async function initContentScript(): Promise<void> {
  await initLogger();
  const settings = await getSettings();
  await initI18n(settings.uiLanguage ?? "auto");

  // Configure the detection pipeline from user settings
  if (settings.detectionPipeline?.length) {
    setActiveClassifiers(
      buildClassifiersFromSettings(settings.detectionPipeline),
    );
  }

  // Init the per-field icon only if enabled
  if (settings.showFieldIcon !== false) {
    initFieldIcon(settings.fieldIconPosition ?? "inside");
  }

  // Load pre-trained model artefacts (generated by `npm run train:model`).
  // Falls back silently to runtime keyword classifier if artefacts are absent.
  loadPretrainedModel().catch(() => {});

  // Auto-start watcher if enabled in settings
  if (settings.watcherEnabled) {
    startWatching(
      (newFieldsCount) => {
        if (newFieldsCount > 0) {
          showNotification(
            `🔄 ${newFieldsCount} novo(s) campo(s) detectado(s) — re-preenchendo...`,
          );
        }
      },
      settings.watcherAutoRefill,
      {
        autoRefill: settings.watcherAutoRefill,
        debounceMs: settings.watcherDebounceMs,
        shadowDOM: settings.watcherShadowDOM,
      },
    );
  }

  // Restore a recording session that was persisted before a traditional form submit
  // (non-AJAX GET/POST) caused a full page navigation.
  const restoredSession = tryRestoreRecordingSession();
  if (restoredSession) {
    // Notify the devtools panel about the restored session (with all steps captured
    // before and during the form submit) so it can repopulate the action list.
    chrome.runtime
      .sendMessage({
        type: "RECORDING_RESTORED",
        payload: {
          steps: restoredSession.steps.map((step) => ({
            type: step.type,
            selector: step.selector,
            value: step.value,
            url: step.url,
            label: step.label,
            assertion: step.assertion,
          })),
        },
      })
      .catch(() => {});

    setOnStepAdded((step, index) => {
      chrome.runtime
        .sendMessage({
          type: "RECORDING_STEP_ADDED",
          payload: {
            step: {
              type: step.type,
              selector: step.selector,
              value: step.value,
              url: step.url,
              label: step.label,
              assertion: step.assertion,
            },
            index,
          },
        })
        .catch(() => {});
    });

    setOnStepUpdated((step, index) => {
      chrome.runtime
        .sendMessage({
          type: "RECORDING_STEP_UPDATED",
          payload: {
            step: {
              type: step.type,
              selector: step.selector,
              value: step.value,
              url: step.url,
              label: step.label,
              assertion: step.assertion,
            },
            index,
          },
        })
        .catch(() => {});
    });

    showNotification(
      `🔴 Gravação retomada (${restoredSession.steps.length} passos)`,
    );
  }
}

// Only automatically initialize when running in a real browser context.
// In unit tests we import this module directly, so avoid side effects.
if (typeof document !== "undefined" && typeof chrome !== "undefined") {
  void initContentScript();
}

/**
 * Handle streaming detection via Port-based communication.
 * DevTools connects with port name "field-detection-stream" to receive
 * fields incrementally as they are detected (instead of waiting for all).
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "field-detection-stream") return;

  let cancelled = false;

  // Clean up on disconnect
  port.onDisconnect.addListener(() => {
    cancelled = true;
  });

  // Start streaming fields
  (async () => {
    try {
      let index = 0;

      for await (const field of streamAllFields()) {
        if (cancelled) break;

        const summary: DetectedFieldSummary = {
          selector: field.selector,
          fieldType: field.fieldType,
          label: field.label || field.name || field.id || "unknown",
          name: field.name,
          id: field.id,
          placeholder: field.placeholder,
          required: field.required,
          contextualType: field.contextualType,
          detectionMethod: field.detectionMethod,
          detectionConfidence: field.detectionConfidence,
        };

        if (field.element instanceof HTMLSelectElement) {
          summary.options = Array.from(field.element.options).map((o) => ({
            value: o.value,
            text: o.text.trim(),
          }));
        }

        if (
          field.element instanceof HTMLInputElement &&
          (field.element.type === "checkbox" || field.element.type === "radio")
        ) {
          summary.checkboxValue = field.element.value;
          summary.checkboxChecked = field.element.checked;
        }

        index++;

        const message: StreamedFieldMessage = {
          type: "field",
          field: summary,
          current: index,
        };

        port.postMessage(message);
      }

      if (!cancelled) {
        port.postMessage({
          type: "complete",
          total: index,
          current: index,
        } as StreamedFieldMessage);
      }
    } catch (error) {
      if (!cancelled) {
        port.postMessage({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        } as StreamedFieldMessage);
      }
    }
  })().catch(() => {});
});
