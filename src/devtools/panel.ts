/**
 * DevTools Panel — Full panel UI inside Chrome DevTools.
 *
 * Communicates with the inspected page's content script via background relay
 * (DEVTOOLS_RELAY) and directly with the background for storage operations.
 */

import type {
  DetectedFieldSummary,
  ExtensionMessage,
  IgnoredField,
  SavedForm,
  FormTemplateField,
  FormFieldMode,
  FieldType,
  StreamedFieldMessage,
} from "@/types";
import { FIELD_TYPES } from "@/types";
import {
  renderTypeBadge,
  renderMethodBadge,
  renderConfidenceBadge,
} from "@/lib/ui";
import { openAIContextModal } from "@/popup/popup-ai-context-modal";
import { t, initI18n } from "@/lib/i18n";
import {
  getFieldTypeGroupedOptions,
  getFieldTypeLabel,
} from "@/lib/shared/field-type-catalog";
import { createLogger } from "@/lib/logger";
import type { LogViewer } from "@/lib/logger/log-viewer";
import { createLogViewer, getLogViewerStyles } from "@/lib/logger/log-viewer";

// ── Constants ────────────────────────────────────────────────────────────────

const TAB_IDS = ["actions", "fields", "forms", "record", "log"] as const;

function buildGroupedFieldTypeOptions(selected?: string): string {
  return getFieldTypeGroupedOptions(FIELD_TYPES)
    .map(
      (group) =>
        `<optgroup label="${group.label}">${group.options
          .map(
            (entry) =>
              `<option value="${entry.value}"${
                entry.value === selected ? " selected" : ""
              }>${entry.label} (${entry.value})</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
}
type TabId = (typeof TAB_IDS)[number];

function getTabLabels(): Record<TabId, string> {
  return {
    actions: `⚡ ${t("tabActions")}`,
    fields: `🔍 ${t("tabFields")}`,
    forms: `📄 ${t("tabForms")}`,
    record: `🔴 ${t("tabRecord")}`,
    log: `📋 ${t("tabLog")}`,
  };
}

// ── State ────────────────────────────────────────────────────────────────────

const inspectedTabId = chrome.devtools.inspectedWindow.tabId;

let activeTab: TabId = "actions";
let detectedFields: DetectedFieldSummary[] = [];
let savedForms: SavedForm[] = [];
let formsLoaded = false;
let watcherActive = false;
let ignoredSelectors = new Set<string>();
let logViewerInstance: LogViewer | null = null;

// ── Record Mode State ────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "paused" | "stopped";
let recordingState: RecordingState = "idle";
let recordedStepsPreview: Array<{
  type: string;
  selector?: string;
  value?: string;
  waitMs?: number;
  url?: string;
  label?: string;
}> = [];

const STEP_ICONS: Record<string, string> = {
  fill: "✏️",
  click: "🖱️",
  select: "📋",
  check: "☑️",
  submit: "🚀",
  wait: "⏱️",
  navigate: "🔗",
  scroll: "📜",
};

let optimizeWithAI = false;
let isOptimizing = false;
let readyScript: { script: string; framework: string } | null = null;

const log = createLogger("DevToolsPanel");

// ── Messaging ────────────────────────────────────────────────────────────────

async function sendToPage(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage({
    type: "DEVTOOLS_RELAY",
    payload: { tabId: inspectedTabId, message },
  });
}

async function sendToBackground(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

function getInspectedPageInfo(): Promise<
  [string | undefined, string | undefined]
> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      "[location.href, document.title]",
      (result: unknown) => {
        if (Array.isArray(result) && result.length === 2) {
          resolve([result[0] as string, result[1] as string]);
        } else {
          resolve([undefined, undefined]);
        }
      },
    );
  });
}

// ── Logging ──────────────────────────────────────────────────────────────────

const LOG_TYPE_MAP: Record<string, "info" | "warn" | "error" | "debug"> = {
  info: "info",
  success: "info",
  error: "error",
  warn: "warn",
};

function addLog(
  text: string,
  type: "info" | "success" | "error" | "warn" = "info",
): void {
  const level = LOG_TYPE_MAP[type] ?? "info";
  log[level](text);
}

// ── Watcher ──────────────────────────────────────────────────────────────────

function updateWatcherButton(): void {
  const btn = document.getElementById("btn-watch");
  if (!btn) return;
  btn.innerHTML = watcherActive
    ? `<span class="card-icon">⏹️</span><span class="card-label">${t("stopWatch")}</span><span class="card-desc">${t("stopWatchDesc")}</span>`
    : `<span class="card-icon">👁️</span><span class="card-label">${t("watch")}</span><span class="card-desc">${t("watchDesc")}</span>`;
  btn.classList.toggle("active", watcherActive);
}

async function toggleWatch(): Promise<void> {
  if (watcherActive) {
    await sendToPage({ type: "STOP_WATCHING" });
    watcherActive = false;
    addLog(t("logWatchDeactivated"), "info");
  } else {
    await sendToPage({
      type: "START_WATCHING",
      payload: { autoRefill: true },
    });
    watcherActive = true;
    addLog(t("logWatchActivated"), "success");
  }
  updateWatcherButton();
}

// ── Detect Fields ────────────────────────────────────────────────────────────

/**
 * Stream-based field detection — receives fields incrementally as they are
 * detected, updating the UI in real-time instead of waiting for all.
 */
async function detectFieldsStreaming(): Promise<void> {
  detectedFields = [];
  addLog(t("logDetecting"));

  try {
    const STREAM_IDLE_TIMEOUT_MS = 4000;

    let detectionComplete = false;
    let receivedAnyMessage = false;
    let streamIdleTimeoutId: number | null = null;

    const clearStreamIdleTimeout = (): void => {
      if (streamIdleTimeoutId !== null) {
        window.clearTimeout(streamIdleTimeoutId);
        streamIdleTimeoutId = null;
      }
    };

    const enableFillActions = (): void => {
      document
        .getElementById("btn-fill-all-fields")
        ?.removeAttribute("disabled");
      document
        .getElementById("btn-fill-empty-fields")
        ?.removeAttribute("disabled");
    };

    const resetDetectButtonToIdle = (): void => {
      const detectButton = document.getElementById("btn-detect-fields");
      if (!detectButton) return;
      detectButton.removeAttribute("disabled");
      detectButton.textContent = `🔍 ${t("detectFields")}`;
    };

    const enableFieldsActions = (): void => {
      resetDetectButtonToIdle();
      enableFillActions();
    };

    const fallbackDetectOnce = async (): Promise<void> => {
      const result = (await sendToPage({ type: "DETECT_FIELDS" })) as {
        fields?: DetectedFieldSummary[];
        error?: string;
      };

      if (result?.error) {
        addLog(`Erro ao detectar: ${result.error}`, "error");
        return;
      }

      detectedFields = Array.isArray(result?.fields) ? result.fields : [];
      if (activeTab === "fields") {
        renderFieldsTab();
      }
      addLog(`${detectedFields.length} ${t("fieldsDetected")}`, "success");
    };

    const finalizeDetection = (
      port: chrome.runtime.Port,
      options?: {
        warning?: string;
      },
    ): void => {
      if (detectionComplete) return;
      detectionComplete = true;
      clearStreamIdleTimeout();

      if (options?.warning) {
        addLog(options.warning, "warn");
      }

      const tbody = document.getElementById("fields-tbody");
      if (tbody && tbody.children.length === 0) {
        tbody.innerHTML = `<tr class="row-empty"><td colspan="7" style="text-align: center; padding: 20px;">${t("logNoFieldDetected")}</td></tr>`;
      }

      enableFieldsActions();

      try {
        port.disconnect();
      } catch {
        // no-op
      }
    };

    const scheduleStreamIdleFinalization = (
      port: chrome.runtime.Port,
    ): void => {
      clearStreamIdleTimeout();
      streamIdleTimeoutId = window.setTimeout(() => {
        if (!detectionComplete && receivedAnyMessage) {
          finalizeDetection(port, {
            warning: "Detecção finalizada por inatividade do stream",
          });
          addLog(`${detectedFields.length} ${t("fieldsDetected")}`, "success");
        }
      }, STREAM_IDLE_TIMEOUT_MS);
    };

    // Render loading state with empty table
    if (activeTab === "fields") {
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `
          <div class="fields-toolbar">
            <button class="btn" id="btn-detect-fields" disabled>🔄 ${t("detectFields")} ...</button>
            <button class="btn" id="btn-fill-all-fields" disabled>⚡ ${t("fillAll")}</button>
            <button class="btn" id="btn-fill-empty-fields" disabled>🟦 ${t("fillOnlyEmpty")}</button>
            <button class="btn btn-danger" id="btn-clear-fields">🗑️ Limpar Detectados</button>
            <button class="btn btn-danger" id="btn-clear-form">🧹 Limpar Form</button>
            <span class="fields-count">0 ${t("fieldCount")}</span>
          </div>
          <div class="table-wrap">
            <table class="fields-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${t("columnType")}</th>
                  <th>${t("columnMethod")}</th>
                  <th>${t("columnConf")}</th>
                  <th>${t("columnIdName")}</th>
                  <th>${t("columnLabel")}</th>
                  <th>${t("columnActions")}</th>
                </tr>
              </thead>
              <tbody id="fields-tbody">
                <tr class="row-loading"><td colspan="7" style="text-align: center; padding: 20px;">⏳ Detectando campos...</td></tr>
              </tbody>
            </table>
          </div>
        `;

        document
          .getElementById("btn-detect-fields")
          ?.addEventListener("click", () => {
            void detectFields();
          });
        document
          .getElementById("btn-fill-all-fields")
          ?.addEventListener("click", () => {
            void fillAll();
          });
        document
          .getElementById("btn-fill-empty-fields")
          ?.addEventListener("click", () => {
            void fillOnlyEmpty();
          });
        document
          .getElementById("btn-clear-fields")
          ?.addEventListener("click", clearDetectedFields);
        document
          .getElementById("btn-clear-form")
          ?.addEventListener("click", clearForm);
      }
    }

    // Open port for streaming
    const port = chrome.tabs.connect(inspectedTabId, {
      name: "field-detection-stream",
    });

    scheduleStreamIdleFinalization(port);

    // Handle incoming fields
    port.onMessage.addListener((message: StreamedFieldMessage) => {
      receivedAnyMessage = true;
      scheduleStreamIdleFinalization(port);

      if (message.type === "field" && message.field) {
        detectedFields.push(message.field);
        enableFillActions();

        // Update table with new field
        const tbody = document.getElementById("fields-tbody");
        if (tbody) {
          // Remove loading row if this is the first field
          const loadingRow = tbody.querySelector(".row-loading");
          if (loadingRow) loadingRow.remove();

          const fieldIndex = detectedFields.length;
          const field = message.field;
          const isIgnored = ignoredSelectors.has(field.selector);
          const displayType = field.contextualType || field.fieldType;
          const method = field.detectionMethod || "-";

          const row = document.createElement("tr");
          row.className = isIgnored ? "row-ignored" : "";
          row.innerHTML = `
            <td class="cell-num">${fieldIndex}</td>
            <td>${renderTypeBadge(displayType)}</td>
            <td>${renderMethodBadge(method)}</td>
            <td>${renderConfidenceBadge(field.detectionConfidence)}</td>
            <td class="cell-mono">${escapeHtml(field.id || field.name || "-")}</td>
            <td>${escapeHtml(field.label || "-")}</td>
            <td class="cell-actions">
              <button class="icon-btn" data-action="fill" data-selector="${escapeAttr(field.selector)}" title="${t("actionFill")}">⚡</button>
              <button class="icon-btn" data-action="inspect" data-selector="${escapeAttr(field.selector)}" title="${t("actionInspect")}">🔎</button>
              <button class="icon-btn ${isIgnored ? "icon-btn-off" : ""}" data-action="toggle-ignore" data-selector="${escapeAttr(field.selector)}" data-label="${escapeAttr(field.label || field.name || field.id || field.selector)}" title="${isIgnored ? t("actionReactivate") : t("actionIgnore")}">
                ${isIgnored ? "🚫" : "👁️"}
              </button>
            </td>
          `;

          tbody.appendChild(row);

          // Attach event listeners to new row
          row
            .querySelectorAll<HTMLButtonElement>("[data-action]")
            .forEach((btn) => {
              btn.addEventListener("click", () => {
                const action = btn.dataset.action;
                const sel = btn.dataset.selector;
                if (!sel) return;

                switch (action) {
                  case "fill":
                    void fillField(sel);
                    break;
                  case "inspect":
                    inspectElement(sel);
                    break;
                  case "toggle-ignore":
                    void toggleIgnore(sel, btn.dataset.label || sel);
                    break;
                }
              });
            });

          // Update count
          const countSpan = document.querySelector(".fields-count");
          if (countSpan) {
            countSpan.textContent = `${detectedFields.length} ${t("fieldCount")}`;
          }
        }
      } else if (message.type === "complete") {
        addLog(`${detectedFields.length} ${t("fieldsDetected")}`, "success");
        finalizeDetection(port);
      } else if (message.type === "error") {
        addLog(`Erro ao detectar: ${message.error}`, "error");
        finalizeDetection(port);
      }
    });

    port.onDisconnect.addListener(() => {
      clearStreamIdleTimeout();
      if (!detectionComplete) {
        const reason = chrome.runtime.lastError?.message;
        addLog(
          reason
            ? `Conexão perdida durante detecção: ${reason}`
            : "Conexão perdida durante detecção",
          "warn",
        );
        if (!receivedAnyMessage) {
          void fallbackDetectOnce().finally(() => {
            detectionComplete = true;
            enableFieldsActions();
          });
          return;
        }
        detectionComplete = true;
        enableFieldsActions();
      }
    });
  } catch (err) {
    addLog(`Erro ao detectar: ${err}`, "error");
    detectedFields = [];
    if (activeTab === "fields") {
      renderFieldsTab();
    }
  }

  await loadIgnoredFields();
  updateStatusBar();
}

async function detectFields(): Promise<void> {
  await detectFieldsStreaming();
}

// ── Clear Fields & Form ──────────────────────────────────────────────────────

async function clearDetectedFields(): Promise<void> {
  detectedFields = [];
  addLog("Campos detectados limpos", "info");
  if (activeTab === "fields") renderFieldsTab();
  updateStatusBar();
}

async function clearForm(): Promise<void> {
  addLog("Limpando formulário...", "info");
  try {
    const response = await sendToPage({
      type: "CLEAR_FORM",
      payload: undefined,
    });
    addLog("✓ Formulário limpo com sucesso", "success");
  } catch (err) {
    addLog(`✗ Erro ao limpar formulário: ${err}`, "error");
    log.error("Error clearing form:", err);
  }
}

// ── Ignored Fields ───────────────────────────────────────────────────────────

async function loadIgnoredFields(): Promise<void> {
  try {
    const result = (await sendToBackground({
      type: "GET_IGNORED_FIELDS",
    })) as IgnoredField[] | { error?: string };
    if (Array.isArray(result)) {
      ignoredSelectors = new Set(result.map((f) => f.selector));
    }
  } catch {
    // silent
  }
}

async function toggleIgnore(selector: string, label: string): Promise<void> {
  const isIgnored = ignoredSelectors.has(selector);

  try {
    const pageUrl = await getInspectedUrl();
    const origin = new URL(pageUrl).origin;
    const urlPattern = `${origin}/*`;

    if (isIgnored) {
      const allIgnored = (await sendToBackground({
        type: "GET_IGNORED_FIELDS",
      })) as IgnoredField[];
      const entry = Array.isArray(allIgnored)
        ? allIgnored.find((f) => f.selector === selector)
        : null;
      if (entry) {
        await sendToBackground({
          type: "REMOVE_IGNORED_FIELD",
          payload: entry.id,
        });
        ignoredSelectors.delete(selector);
        addLog(`${t("logFieldReactivated")}: ${label}`, "info");
      }
    } else {
      await sendToBackground({
        type: "ADD_IGNORED_FIELD",
        payload: { urlPattern, selector, label },
      });
      ignoredSelectors.add(selector);
      addLog(`${t("logFieldIgnored")}: ${label}`, "warn");
    }
  } catch (err) {
    addLog(`Erro ao alternar ignore: ${err}`, "error");
  }

  if (activeTab === "fields") renderFieldsTab();
}

// ── Fill ──────────────────────────────────────────────────────────────────────

async function fillAll(): Promise<void> {
  addLog(t("logFilling"));
  try {
    const result = (await sendToPage({
      type: "FILL_ALL_FIELDS",
      payload: { fillEmptyOnly: false },
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro ao preencher: ${err}`, "error");
  }
}

async function fillOnlyEmpty(): Promise<void> {
  addLog(t("logFillingEmpty"));
  try {
    const result = (await sendToPage({
      type: "FILL_ALL_FIELDS",
      payload: { fillEmptyOnly: true },
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro ao preencher: ${err}`, "error");
  }
}

async function fillContextualAI(): Promise<void> {
  const context = await openAIContextModal();
  if (!context) return;

  addLog(t("fillContextualAI"));
  const btn = document.getElementById("btn-fill-contextual-ai");
  const label = btn?.querySelector(".card-label");
  if (label) label.textContent = "⏳...";
  try {
    const result = (await sendToPage({
      type: "FILL_CONTEXTUAL_AI",
      payload: context,
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro ao preencher com IA: ${err}`, "error");
  } finally {
    if (label) label.textContent = t("fillContextualAI");
  }
}

async function fillField(selector: string): Promise<void> {
  addLog(`Preenchendo: ${selector}`);
  try {
    const result = (await sendToPage({
      type: "FILL_FIELD_BY_SELECTOR",
      payload: selector,
    })) as { error?: string };
    if (result?.error) {
      addLog(`Erro: ${result.error}`, "error");
    } else {
      addLog(`Campo preenchido: ${selector}`, "success");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

// ── Inspect ──────────────────────────────────────────────────────────────────

function inspectElement(selector: string): void {
  const escaped = selector.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  chrome.devtools.inspectedWindow.eval(
    `inspect(document.querySelector('${escaped}'))`,
  );
  addLog(`Inspecionando: ${selector}`);
}

// ── Forms ────────────────────────────────────────────────────────────────────

async function saveCurrentForm(): Promise<void> {
  addLog(t("logSavingForm"));
  try {
    const result = (await sendToPage({ type: "SAVE_FORM" })) as {
      success?: boolean;
      form?: SavedForm;
    };
    if (result?.success) {
      addLog(`${t("logFormSaved")}: ${result.form?.name ?? ""}`, "success");
    } else {
      addLog(t("logErrorSavingForm"), "error");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

async function loadForms(): Promise<void> {
  addLog(t("logLoadingForms"));
  try {
    const result = (await sendToBackground({ type: "GET_SAVED_FORMS" })) as
      | SavedForm[]
      | { error?: string };
    if (Array.isArray(result)) {
      savedForms = result;
      addLog(`${result.length} ${t("formCount")}`, "success");
    } else {
      savedForms = [];
      addLog(t("logNoFormsSaved"), "warn");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
    savedForms = [];
  }
  formsLoaded = true;
  if (activeTab === "forms") renderFormsTab();
}

async function applySavedForm(form: SavedForm): Promise<void> {
  addLog(t("logApplyingTemplate") + ": " + form.name);
  try {
    const result = (await sendToPage({
      type: "APPLY_TEMPLATE",
      payload: form,
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

async function deleteFormById(formId: string): Promise<void> {
  try {
    await sendToBackground({ type: "DELETE_FORM", payload: formId });
    savedForms = savedForms.filter((f) => f.id !== formId);
    addLog(t("logFormRemoved"), "info");
    renderFormsTab();
  } catch (err) {
    addLog(`Erro ao remover: ${err}`, "error");
  }
}

async function setFormAsDefault(formId: string): Promise<void> {
  try {
    await sendToBackground({ type: "SET_DEFAULT_FORM", payload: formId });
    savedForms = savedForms.map((f) => ({
      ...f,
      isDefault: f.id === formId ? true : undefined,
    }));
    addLog(t("logFormSetDefault"), "success");
    renderFormsTab();
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

function showNewFormScreen(): void {
  const blankForm: SavedForm = {
    id: crypto.randomUUID(),
    name: t("newFormTitle"),
    urlPattern: "*",
    fields: {},
    templateFields: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  showEditFormScreen(blankForm, true);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInspectedUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      "window.location.href",
      (result: unknown) => {
        resolve(String(result ?? ""));
      },
    );
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function updateStatusBar(): void {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.textContent =
    detectedFields.length > 0
      ? `${detectedFields.length} ${t("fieldsDetected")}`
      : t("noFieldsDetected");
}

// ── Rendering ────────────────────────────────────────────────────────────────

function renderApp(): void {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">🔧 Fill All</span>
        <div class="tabs">
          ${TAB_IDS.map(
            (id) => `
            <button class="tab ${id === activeTab ? "active" : ""}" data-tab="${id}">
              ${getTabLabels()[id]}
            </button>
          `,
          ).join("")}
        </div>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" id="btn-options" title="${t("fpOpenOptions")}">⚙️</button>
      </div>
    </div>
    <div class="content" id="content"></div>
  `;

  app.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab as TabId;
      if (tab) switchTab(tab);
    });
  });

  app.querySelector("#btn-options")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    addLog(t("logOpeningOptions"), "info");
  });

  renderActiveTab();
}

function switchTab(tab: TabId): void {
  activeTab = tab;
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  renderActiveTab();
}

function renderActiveTab(): void {
  switch (activeTab) {
    case "actions":
      renderActionsTab();
      break;
    case "fields":
      renderFieldsTab();
      break;
    case "forms":
      renderFormsTab();
      void loadForms();
      break;
    case "record":
      renderRecordTab();
      break;
    case "log":
      renderLogTab();
      break;
  }
}

function renderActionsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="actions-grid">
      <button class="action-card primary" id="btn-fill">
        <span class="card-icon">⚡</span>
        <span class="card-label">${t("fillAll")}</span>
        <span class="card-desc">${t("fillAllDesc")}</span>
      </button>
      <button class="action-card secondary" id="btn-fill-empty">
        <span class="card-icon">🟦</span>
        <span class="card-label">${t("fillOnlyEmpty")}</span>
        <span class="card-desc">${t("fillOnlyEmptyDesc")}</span>
      </button>
      <button class="action-card ai" id="btn-fill-contextual-ai">
        <span class="card-icon">🤖</span>
        <span class="card-label">${t("fillContextualAI")}</span>
        <span class="card-desc">${t("fillContextualAIDesc")}</span>
      </button>
      <button class="action-card secondary" id="btn-save">
        <span class="card-icon">💾</span>
        <span class="card-label">${t("saveForm")}</span>
        <span class="card-desc">${t("saveFormDesc")}</span>
      </button>
      <button class="action-card outline ${watcherActive ? "active" : ""}" id="btn-watch">
        <span class="card-icon">${watcherActive ? "⏹️" : "👁️"}</span>
        <span class="card-label">${watcherActive ? t("stopWatch") : t("watch")}</span>
        <span class="card-desc">${watcherActive ? t("stopWatchDesc") : t("watchDesc")}</span>
      </button>
      <button class="action-card outline" id="btn-detect">
        <span class="card-icon">🔍</span>
        <span class="card-label">${t("detectFields")}</span>
        <span class="card-desc">${t("detectFieldsDesc")}</span>
      </button>
    </div>
    <div class="status-bar" id="status-bar">
      ${detectedFields.length > 0 ? `${detectedFields.length} ${t("fieldsDetected")}` : t("noFieldsDetected")}
    </div>
  `;

  document.getElementById("btn-fill")?.addEventListener("click", fillAll);
  document
    .getElementById("btn-fill-empty")
    ?.addEventListener("click", fillOnlyEmpty);
  document
    .getElementById("btn-fill-contextual-ai")
    ?.addEventListener("click", fillContextualAI);
  document
    .getElementById("btn-save")
    ?.addEventListener("click", saveCurrentForm);
  document.getElementById("btn-watch")?.addEventListener("click", toggleWatch);
  document
    .getElementById("btn-detect")
    ?.addEventListener("click", detectFields);
}

function renderFieldsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn" id="btn-detect-fields">🔍 ${t("detectFields")}</button>
      <button class="btn" id="btn-fill-all-fields">⚡ ${t("fillAll")}</button>
      <button class="btn" id="btn-fill-empty-fields">🟦 ${t("fillOnlyEmpty")}</button>
      <button class="btn btn-danger" id="btn-clear-fields" ${detectedFields.length === 0 ? "disabled" : ""}>🗑️ Limpar Detectados</button>
      <button class="btn btn-danger" id="btn-clear-form">🧹 Limpar Form</button>
      <span class="fields-count">${detectedFields.length} ${t("fieldCount")}</span>
    </div>
    <div class="table-wrap">
      ${
        detectedFields.length === 0
          ? `<div class="empty">${t("clickToDetect")}</div>`
          : `<table class="fields-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t("columnType")}</th>
              <th>${t("columnMethod")}</th>
              <th>${t("columnConf")}</th>
              <th>${t("columnIdName")}</th>
              <th>${t("columnLabel")}</th>
              <th>${t("columnActions")}</th>
            </tr>
          </thead>
          <tbody>
            ${detectedFields
              .map((f, i) => {
                const isIgnored = ignoredSelectors.has(f.selector);
                const displayType = f.contextualType || f.fieldType;
                const method = f.detectionMethod || "-";
                return `<tr class="${isIgnored ? "row-ignored" : ""}">
                <td class="cell-num">${i + 1}</td>
                <td>${renderTypeBadge(displayType)}</td>
                <td>${renderMethodBadge(method)}</td>
                <td>${renderConfidenceBadge(f.detectionConfidence)}</td>
                <td class="cell-mono">${escapeHtml(f.id || f.name || "-")}</td>
                <td>${escapeHtml(f.label || "-")}</td>
                <td class="cell-actions">
                  <button class="icon-btn" data-action="fill" data-selector="${escapeAttr(f.selector)}" title="${t("actionFill")}">⚡</button>
                  <button class="icon-btn" data-action="inspect" data-selector="${escapeAttr(f.selector)}" title="${t("actionInspect")}">🔎</button>
                  <button class="icon-btn ${isIgnored ? "icon-btn-off" : ""}" data-action="toggle-ignore" data-selector="${escapeAttr(f.selector)}" data-label="${escapeAttr(f.label || f.name || f.id || f.selector)}" title="${isIgnored ? t("actionReactivate") : t("actionIgnore")}">
                    ${isIgnored ? "🚫" : "👁️"}
                  </button>
                </td>
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>`
      }
    </div>
  `;

  document
    .getElementById("btn-detect-fields")
    ?.addEventListener("click", detectFields);
  document
    .getElementById("btn-fill-all-fields")
    ?.addEventListener("click", fillAll);
  document
    .getElementById("btn-fill-empty-fields")
    ?.addEventListener("click", fillOnlyEmpty);
  document
    .getElementById("btn-clear-fields")
    ?.addEventListener("click", clearDetectedFields);
  document
    .getElementById("btn-clear-form")
    ?.addEventListener("click", clearForm);

  content
    .querySelectorAll<HTMLButtonElement>("[data-action]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const selector = btn.dataset.selector;
        if (!selector) return;

        switch (action) {
          case "fill":
            void fillField(selector);
            break;
          case "inspect":
            inspectElement(selector);
            break;
          case "toggle-ignore":
            void toggleIgnore(selector, btn.dataset.label || selector);
            break;
        }
      });
    });
}

function renderFormsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn" id="btn-load-forms">🔄 ${t("btnLoadForms")}</button>
      <button class="btn btn-success" id="btn-new-form">+ ${t("btnNewForm")}</button>
      <span class="fields-count">${savedForms.length} ${t("formCount")}</span>
    </div>
    <div class="forms-list">
      ${
        !formsLoaded
          ? `<div class="empty">⏳ ${t("logLoadingForms")}</div>`
          : savedForms.length === 0
            ? `<div class="empty">${t("loadFormsDesc")}</div>`
            : savedForms
                .map(
                  (form) => `
          <div class="form-card">
            <div class="form-info">
              <span class="form-name">
                ${escapeHtml(form.name)}
                ${form.isDefault ? `<span class="badge-default">${t("badgeDefault")}</span>` : ""}
              </span>
              <span class="form-meta">${form.templateFields?.length ?? Object.keys(form.fields).length} ${t("fieldCount")} · ${new Date(form.updatedAt).toLocaleDateString()}</span>
              <span class="form-url">${escapeHtml(form.urlPattern)}</span>
            </div>
            <div class="form-actions">
              <button class="btn btn-sm" data-form-id="${escapeAttr(form.id)}" data-action="apply">▶️ ${t("btnApply")}</button>
              <button class="btn btn-sm btn-warning" data-form-id="${escapeAttr(form.id)}" data-action="edit">✏️ ${t("btnEdit")}</button>
              <button class="btn btn-sm btn-secondary" data-form-id="${escapeAttr(form.id)}" data-action="setDefault" title="${t("btnSetDefault")}">⭐</button>
              <button class="btn btn-sm btn-danger" data-form-id="${escapeAttr(form.id)}" data-action="delete" title="${t("msgConfirmDeleteForm")}">🗑️</button>
            </div>
          </div>
        `,
                )
                .join("")
      }
    </div>
  `;

  document
    .getElementById("btn-load-forms")
    ?.addEventListener("click", loadForms);

  document
    .getElementById("btn-new-form")
    ?.addEventListener("click", showNewFormScreen);

  content
    .querySelectorAll<HTMLButtonElement>("[data-form-id]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const formId = btn.dataset.formId;
        const action = btn.dataset.action;
        const form = savedForms.find((f) => f.id === formId);
        if (!form) return;

        if (action === "apply") void applySavedForm(form);
        else if (action === "edit") showEditFormScreen(form);
        else if (action === "setDefault") void setFormAsDefault(form.id);
        else if (action === "delete") {
          if (window.confirm(t("msgConfirmDeleteForm"))) {
            void deleteFormById(form.id);
          }
        }
      });
    });
}

function showEditFormScreen(form: SavedForm, isNew = false): void {
  const content = document.getElementById("content");
  if (!content) return;

  // Normalise to templateFields — mutable working copy
  const editingFields: FormTemplateField[] =
    form.templateFields && form.templateFields.length > 0
      ? form.templateFields.map((f) => ({ ...f }))
      : Object.entries(form.fields).map(([key, value]) => ({
          key,
          label: key,
          mode: "fixed" as FormFieldMode,
          fixedValue: value,
        }));

  function buildFieldRowHtml(f: FormTemplateField, i: number): string {
    return `
      <div class="edit-field-row" data-field-index="${i}">
        <div class="edit-field-key-wrap">
          <input type="text" class="edit-input edit-field-key-input" data-field-key="${i}"
            placeholder="Seletor / nome" value="${escapeAttr(f.key)}" />
          <input type="text" class="edit-input edit-field-label-input" data-field-label="${i}"
            placeholder="${t("formName")}" value="${escapeAttr(f.label || f.key)}" />
          <select class="edit-select edit-field-match-type" data-field-match-type="${i}" title="${t("tooltipMatchByFieldType")}">
            <option value=""${!f.matchByFieldType ? " selected" : ""}>${t("matchBySelectorOption")}</option>
            ${buildGroupedFieldTypeOptions(f.matchByFieldType)}
          </select>
        </div>
        <div class="edit-field-controls">
          <select class="edit-select" data-field-mode="${i}">
            <option value="fixed"${f.mode === "fixed" ? " selected" : ""}>${t("fixedValue")}</option>
            <option value="generator"${f.mode === "generator" ? " selected" : ""}>${t("generatorMode")}</option>
          </select>
          <input type="text" class="edit-field-value" data-field-fixed="${i}"
            placeholder="${t("placeholderFixedValue")}"
            value="${escapeAttr(f.fixedValue ?? "")}"
            style="display:${f.mode === "fixed" ? "block" : "none"}" />
          <select class="edit-select edit-field-value" data-field-gen="${i}"
            style="display:${f.mode === "generator" ? "block" : "none"}">
            ${buildGroupedFieldTypeOptions(f.generatorType)}
          </select>
        </div>
        <button class="btn btn-sm btn-danger edit-remove-field" data-remove-field="${i}" title="${t("tooltipRemoveField")}">🗑</button>
      </div>
    `;
  }

  function renderFields(list: HTMLElement): void {
    list.innerHTML = editingFields
      .map((f, i) => buildFieldRowHtml(f, i))
      .join("");

    list
      .querySelectorAll<HTMLSelectElement>("[data-field-mode]")
      .forEach((sel) => {
        sel.addEventListener("change", () => {
          const idx = sel.dataset.fieldMode;
          const fixedInput = list.querySelector<HTMLElement>(
            `[data-field-fixed="${idx}"]`,
          );
          const genSelect = list.querySelector<HTMLElement>(
            `[data-field-gen="${idx}"]`,
          );
          const isFixed = sel.value === "fixed";
          if (fixedInput) fixedInput.style.display = isFixed ? "block" : "none";
          if (genSelect) genSelect.style.display = isFixed ? "none" : "block";
        });
      });

    list
      .querySelectorAll<HTMLButtonElement>("[data-remove-field]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.removeField ?? "", 10);
          if (!isNaN(idx)) {
            editingFields.splice(idx, 1);
            renderFields(list);
          }
        });
      });
  }

  content.innerHTML = `
    <div class="edit-form-screen">
      <div class="edit-form-title">${isNew ? "➕" : "✏️"} ${t(isNew ? "newFormTitle" : "editTemplate")}</div>
      <div class="edit-meta-grid">
        <div class="edit-input-group">
          <label class="edit-label">${t("formName")}</label>
          <input class="edit-input" id="edit-form-name" type="text" value="${escapeAttr(form.name)}" />
        </div>
        <div class="edit-input-group">
          <label class="edit-label">${t("formUrl")}</label>
          <input class="edit-input" id="edit-form-url" type="text" value="${escapeAttr(form.urlPattern)}" />
        </div>
      </div>
      <div class="edit-section-header">${t("editFieldsHeader")}</div>
      <div class="edit-fields-list" id="edit-fields-list"></div>
      <div class="edit-form-footer">
        <button class="btn" id="edit-form-cancel">✕ ${t("btnCancel")}</button>
        <button class="btn btn-secondary" id="edit-add-field">+ ${t("btnAddField")}</button>
        <button class="btn btn-success" id="edit-form-save">💾 ${t("btnSave")}</button>
      </div>
    </div>
  `;

  const fieldsList = content.querySelector<HTMLElement>("#edit-fields-list")!;
  renderFields(fieldsList);

  document.getElementById("edit-form-cancel")?.addEventListener("click", () => {
    renderFormsTab();
  });

  document.getElementById("edit-add-field")?.addEventListener("click", () => {
    editingFields.push({
      key: `field_${editingFields.length + 1}`,
      label: "",
      mode: "fixed",
      fixedValue: "",
    });
    renderFields(fieldsList);
  });

  document
    .getElementById("edit-form-save")
    ?.addEventListener("click", async () => {
      const nameVal = (
        document.getElementById("edit-form-name") as HTMLInputElement
      )?.value.trim();
      const urlVal = (
        document.getElementById("edit-form-url") as HTMLInputElement
      )?.value.trim();

      const updatedFields: FormTemplateField[] = editingFields.map((f, i) => {
        const keyEl = fieldsList.querySelector<HTMLInputElement>(
          `[data-field-key="${i}"]`,
        );
        const labelEl = fieldsList.querySelector<HTMLInputElement>(
          `[data-field-label="${i}"]`,
        );
        const modeEl = fieldsList.querySelector<HTMLSelectElement>(
          `[data-field-mode="${i}"]`,
        );
        const fixedEl = fieldsList.querySelector<HTMLInputElement>(
          `[data-field-fixed="${i}"]`,
        );
        const genEl = fieldsList.querySelector<HTMLSelectElement>(
          `[data-field-gen="${i}"]`,
        );
        const matchTypeEl = fieldsList.querySelector<HTMLSelectElement>(
          `[data-field-match-type="${i}"]`,
        );
        const mode = (modeEl?.value ?? f.mode) as FormFieldMode;
        const matchByFieldType = matchTypeEl?.value
          ? (matchTypeEl.value as FieldType)
          : undefined;
        const keyValue = keyEl?.value.trim() || f.key;
        return {
          key: matchByFieldType ?? keyValue,
          label: labelEl?.value.trim() || f.label || f.key,
          mode,
          matchByFieldType,
          fixedValue:
            mode === "fixed" ? (fixedEl?.value ?? f.fixedValue) : undefined,
          generatorType:
            mode === "generator"
              ? ((genEl?.value ?? f.generatorType) as FieldType)
              : undefined,
        };
      });

      const updated: SavedForm = {
        ...form,
        name: nameVal || form.name,
        urlPattern: urlVal || form.urlPattern,
        templateFields: updatedFields,
      };

      await sendToBackground({ type: "UPDATE_FORM", payload: updated });

      if (isNew) {
        savedForms = [...savedForms, updated];
        addLog(`${t("logFormSaved")}: ${updated.name}`, "success");
      } else {
        const idx = savedForms.findIndex((f) => f.id === form.id);
        if (idx >= 0) savedForms[idx] = updated;
        addLog(`${t("logTemplateUpdated")}: ${updated.name}`, "success");
      }

      renderFormsTab();
    });
}

// ── Record Tab ───────────────────────────────────────────────────────────────

async function startRecording(): Promise<void> {
  try {
    await sendToPage({ type: "START_RECORDING" });
    recordingState = "recording";
    recordedStepsPreview = [];
    addLog(t("logRecordStarted"), "success");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

async function stopRecording(): Promise<void> {
  try {
    await sendToPage({ type: "STOP_RECORDING" });
    recordingState = "stopped";
    addLog(t("logRecordStopped"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

async function pauseRecording(): Promise<void> {
  try {
    await sendToPage({ type: "PAUSE_RECORDING" });
    recordingState = "paused";
    addLog(t("logRecordPaused"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

async function resumeRecording(): Promise<void> {
  try {
    await sendToPage({ type: "RESUME_RECORDING" });
    recordingState = "recording";
    addLog(t("logRecordResumed"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

function setExportLoading(loading: boolean, framework?: string): void {
  isOptimizing = loading;
  const exportSection = document.querySelector(".record-export");
  if (!exportSection) return;

  const buttons = exportSection.querySelectorAll<HTMLButtonElement>(".btn");
  const checkbox = document.getElementById(
    "chk-optimize-ai",
  ) as HTMLInputElement | null;
  const existingOverlay = exportSection.querySelector(
    ".export-loading-overlay",
  );

  if (loading) {
    buttons.forEach((btn) => (btn.disabled = true));
    if (checkbox) checkbox.disabled = true;

    if (!existingOverlay) {
      const overlay = document.createElement("div");
      overlay.className = "export-loading-overlay";
      overlay.innerHTML = `
        <div class="export-loading-spinner"></div>
        <span>${t("logRecordOptimizing")}${framework ? ` (${framework})` : ""}</span>
      `;
      exportSection.appendChild(overlay);
    }
  } else {
    buttons.forEach((btn) => (btn.disabled = false));
    if (checkbox) checkbox.disabled = false;
    existingOverlay?.remove();
  }
}

function showReadyState(script: string, framework: string): void {
  readyScript = { script, framework };
  const exportSection = document.querySelector(".record-export");
  if (!exportSection) return;

  const title = exportSection.querySelector(".record-export-title");
  const toggle = exportSection.querySelector(
    ".record-ai-toggle",
  ) as HTMLElement | null;
  const buttonsWrap = exportSection.querySelector(
    ".record-export-buttons",
  ) as HTMLElement | null;

  if (title) title.textContent = `${t("recordScriptReady")} (${framework})`;
  if (toggle) toggle.style.display = "none";
  if (buttonsWrap) {
    buttonsWrap.innerHTML = `
      <button class="btn btn-copy-script" id="btn-copy-script">📋 ${t("recordCopyScript")}</button>
      <button class="btn btn-dismiss-script" id="btn-dismiss-script">✕</button>
    `;
    document
      .getElementById("btn-copy-script")
      ?.addEventListener("click", async () => {
        if (!readyScript) return;
        await navigator.clipboard.writeText(readyScript.script);
        addLog(
          `${t("logRecordExported")} (${readyScript.framework})`,
          "success",
        );
      });
    document
      .getElementById("btn-dismiss-script")
      ?.addEventListener("click", () => {
        readyScript = null;
        renderRecordTab();
      });
  }
}

async function exportRecording(framework: string): Promise<void> {
  if (isOptimizing) return;

  try {
    const result = (await sendToPage({
      type: "EXPORT_RECORDING",
      payload: {
        framework,
        options: {
          includeAssertions: true,
          smartSelectors: true,
          smartWaits: true,
        },
      },
    })) as { script?: string; error?: string };

    if (!result?.script) {
      addLog(result?.error ?? t("logRecordExportError"), "error");
      return;
    }

    let finalScript = result.script;
    let wasOptimized = false;

    if (optimizeWithAI) {
      setExportLoading(true, framework);
      addLog(t("logRecordOptimizing"), "info");

      try {
        const [pageUrl, pageTitle] = await getInspectedPageInfo();

        const optimized = (await sendToBackground({
          type: "AI_OPTIMIZE_SCRIPT",
          payload: {
            script: result.script,
            framework,
            pageUrl,
            pageTitle,
            pageContext: undefined,
          },
        })) as string | null;

        if (optimized) {
          finalScript = optimized;
          wasOptimized = true;
          addLog(`${t("logRecordOptimized")} (${framework})`, "success");
        } else {
          addLog(t("logRecordOptimizeFailed"), "warn");
        }
      } finally {
        setExportLoading(false);
      }
    }

    showReadyState(finalScript, `${framework}${wasOptimized ? " ✨" : ""}`);
  } catch (err) {
    setExportLoading(false);
    addLog(`${t("logRecordExportError")}: ${err}`, "error");
  }
}

async function refreshRecordPreview(): Promise<void> {
  try {
    const result = (await sendToPage({
      type: "GET_RECORDING_STEPS",
    })) as {
      steps?: Array<{
        type: string;
        selector?: string;
        value?: string;
        waitMs?: number;
        url?: string;
      }>;
    };

    if (result?.steps) {
      recordedStepsPreview = result.steps;
    }
  } catch {
    // silent
  }
  renderRecordStepsTable();
}

async function clearRecording(): Promise<void> {
  try {
    await sendToPage({ type: "CLEAR_RECORDING" });
    recordedStepsPreview = [];
    recordingState = "idle";
    addLog(t("logRecordStopped"), "info");
    renderRecordTab();
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

async function removeRecordStep(index: number): Promise<void> {
  try {
    const result = (await sendToPage({
      type: "REMOVE_RECORDING_STEP",
      payload: { index },
    })) as { success?: boolean };
    if (result?.success) {
      recordedStepsPreview.splice(index, 1);
      renderRecordStepsTable();
    }
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

async function updateRecordStep(
  index: number,
  patch: { value?: string; waitTimeout?: number },
): Promise<void> {
  try {
    const result = (await sendToPage({
      type: "UPDATE_RECORDING_STEP",
      payload: { index, patch },
    })) as { success?: boolean };
    if (result?.success) {
      if (patch.value !== undefined) {
        recordedStepsPreview[index].value = patch.value;
      }
      renderRecordStepsTable();
    }
  } catch (err) {
    addLog(`${t("logRecordError")}: ${err}`, "error");
  }
}

function renderRecordStepsTable(): void {
  const tbody = document.getElementById("record-steps-body");
  if (!tbody) return;

  if (recordedStepsPreview.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">${t("recordNoSteps")}</td></tr>`;
    return;
  }

  tbody.innerHTML = recordedStepsPreview
    .map(
      (step, i) => `
      <tr>
        <td class="cell-num">${i + 1}</td>
        <td>${STEP_ICONS[step.type] ?? "❓"} ${escapeHtml(step.type)}</td>
        <td class="cell-mono">${escapeHtml(step.selector ?? step.url ?? "-")}</td>
        <td class="cell-value" data-step-index="${i}">
          <span class="step-value-text" title="${t("actionEdit")}">${escapeHtml(step.value ?? (step.waitMs ? `${step.waitMs}ms` : "-"))}</span>
        </td>
        <td class="cell-actions">
          <button class="icon-btn" data-step-action="edit" data-step-index="${i}" title="${t("actionEdit")}">✏️</button>
          <button class="icon-btn" data-step-action="remove" data-step-index="${i}" title="🗑️">🗑️</button>
        </td>
      </tr>
    `,
    )
    .join("");

  const countEl = document.getElementById("record-step-count");
  if (countEl) {
    countEl.textContent = `${recordedStepsPreview.length} ${t("recordStepCount")}`;
  }

  // Wire step action buttons
  tbody
    .querySelectorAll<HTMLButtonElement>("[data-step-action]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.stepAction;
        const index = Number(btn.dataset.stepIndex);
        if (isNaN(index)) return;

        if (action === "remove") {
          void removeRecordStep(index);
        } else if (action === "edit") {
          showStepValueEditor(index);
        }
      });
    });
}

function showStepValueEditor(index: number): void {
  const step = recordedStepsPreview[index];
  if (!step) return;

  const cell = document.querySelector<HTMLTableCellElement>(
    `td.cell-value[data-step-index="${index}"]`,
  );
  if (!cell) return;

  const currentValue = step.value ?? "";
  cell.innerHTML = `
    <input type="text" class="edit-input step-edit-input" value="${escapeAttr(currentValue)}" />
    <button class="icon-btn step-edit-save" title="✓">✅</button>
    <button class="icon-btn step-edit-cancel" title="✕">❌</button>
  `;

  const input = cell.querySelector<HTMLInputElement>(".step-edit-input");
  input?.focus();

  cell.querySelector(".step-edit-save")?.addEventListener("click", () => {
    const newValue = input?.value ?? currentValue;
    void updateRecordStep(index, { value: newValue });
  });

  cell.querySelector(".step-edit-cancel")?.addEventListener("click", () => {
    renderRecordStepsTable();
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const newValue = input.value ?? currentValue;
      void updateRecordStep(index, { value: newValue });
    } else if (e.key === "Escape") {
      renderRecordStepsTable();
    }
  });
}

function renderRecordTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  const isIdle = recordingState === "idle";
  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isStopped = recordingState === "stopped";
  const hasSteps = recordedStepsPreview.length > 0;

  let controlsHtml = "";

  if (isIdle) {
    controlsHtml = `
      <button class="action-card primary" id="btn-record-start">
        <span class="card-icon">🔴</span>
        <span class="card-label">${t("recordStart")}</span>
        <span class="card-desc">${t("recordStartDesc")}</span>
      </button>`;
  } else if (isRecording || isPaused) {
    controlsHtml = `
      <button class="action-card btn-danger" id="btn-record-stop">
        <span class="card-icon">⏹️</span>
        <span class="card-label">${t("recordStop")}</span>
      </button>
      <button class="action-card secondary" id="btn-record-pause">
        <span class="card-icon">${isPaused ? "▶️" : "⏸️"}</span>
        <span class="card-label">${isPaused ? t("recordResume") : t("recordPause")}</span>
      </button>`;
  } else if (isStopped) {
    controlsHtml = `
      <button class="action-card primary" id="btn-record-start">
        <span class="card-icon">🔴</span>
        <span class="card-label">${t("recordStart")}</span>
        <span class="card-desc">${t("recordStartDesc")}</span>
      </button>
      ${
        hasSteps
          ? `<button class="action-card btn-danger" id="btn-record-clear">
        <span class="card-icon">🗑️</span>
        <span class="card-label">${t("recordClear") ?? "Limpar"}</span>
      </button>`
          : ""
      }`;
  }

  const statusText = isRecording
    ? t("recordStatusRecording")
    : isPaused
      ? t("recordStatusPaused")
      : isStopped
        ? (t("recordStatusStopped") ?? t("recordStatusIdle"))
        : t("recordStatusIdle");

  const indicatorClass = isRecording
    ? "recording"
    : isPaused
      ? "paused"
      : isStopped
        ? "stopped"
        : "";

  const showTable = !isIdle || hasSteps;
  const showExport = (isStopped || isPaused) && hasSteps;

  content.innerHTML = `
    <div class="record-section">
      <div class="record-controls">
        ${controlsHtml}
      </div>

      <div class="record-status">
        <span class="record-indicator ${indicatorClass}"></span>
        <span>${statusText}</span>
        <span class="fields-count" id="record-step-count">${recordedStepsPreview.length} ${t("recordStepCount")}</span>
      </div>

      ${
        showTable
          ? `<div class="table-wrap">
        <table class="fields-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t("recordColAction")}</th>
              <th>${t("recordColSelector")}</th>
              <th>${t("recordColValue")}</th>
              <th>${t("columnActions")}</th>
            </tr>
          </thead>
          <tbody id="record-steps-body">
            <tr><td colspan="5" class="empty">${t("recordNoSteps")}</td></tr>
          </tbody>
        </table>
      </div>`
          : `<div class="table-wrap">
        <div class="empty">${t("recordClickStart")}</div>
      </div>`
      }

      ${
        showExport
          ? `
        <div class="record-export">
          <div class="record-export-title">${t("recordExportTitle")}</div>
          <label class="record-ai-toggle" title="${t("recordOptimizeAIDesc")}">
            <input type="checkbox" id="chk-optimize-ai" ${optimizeWithAI ? "checked" : ""} />
            <span>✨ ${t("recordOptimizeAI")}</span>
          </label>
          <div class="record-export-buttons">
            <button class="btn" data-export-framework="playwright">🎭 Playwright</button>
            <button class="btn" data-export-framework="cypress">🌲 Cypress</button>
            <button class="btn" data-export-framework="pest">🐘 Pest/Dusk</button>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;

  // Wire events
  document
    .getElementById("btn-record-start")
    ?.addEventListener("click", () => void startRecording());
  document
    .getElementById("btn-record-stop")
    ?.addEventListener("click", () => void stopRecording());
  document.getElementById("btn-record-pause")?.addEventListener("click", () => {
    if (isPaused) void resumeRecording();
    else void pauseRecording();
  });
  document
    .getElementById("btn-record-clear")
    ?.addEventListener("click", () => void clearRecording());

  document
    .getElementById("chk-optimize-ai")
    ?.addEventListener("change", (e) => {
      optimizeWithAI = (e.target as HTMLInputElement).checked;
    });

  content
    .querySelectorAll<HTMLButtonElement>("[data-export-framework]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const fw = btn.dataset.exportFramework;
        if (fw) void exportRecording(fw);
      });
    });

  // Render steps if we have them
  if (showTable) {
    renderRecordStepsTable();
  }
}

function renderLogTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `<div id="devtools-log-viewer" style="height:100%;display:flex;flex-direction:column;"></div>`;

  const container = document.getElementById("devtools-log-viewer");
  if (!container) return;

  // Dispose previous instance
  if (logViewerInstance) {
    logViewerInstance.dispose();
    logViewerInstance = null;
  }

  logViewerInstance = createLogViewer({ container, variant: "devtools" });
  void logViewerInstance.refresh();
}

// ── Real-time Recording Listener ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: { type?: string; payload?: Record<string, unknown> }, sender) => {
    if (sender.tab?.id !== inspectedTabId) return;

    if (message.type === "RECORDING_STEP_ADDED") {
      const p = message.payload as
        | {
            step?: {
              type: string;
              selector?: string;
              value?: string;
              url?: string;
              label?: string;
            };
            index?: number;
          }
        | undefined;

      if (p?.step) {
        recordedStepsPreview.push(p.step);
        renderRecordStepsTable();
      }
    }

    if (message.type === "RECORDING_STEP_UPDATED") {
      const p = message.payload as
        | {
            step?: {
              type: string;
              selector?: string;
              value?: string;
              url?: string;
              label?: string;
            };
            index?: number;
          }
        | undefined;

      if (
        p?.step &&
        typeof p.index === "number" &&
        recordedStepsPreview[p.index]
      ) {
        recordedStepsPreview[p.index] = p.step;
        renderRecordStepsTable();
      }
    }
  },
);

// ── Navigation Listener ──────────────────────────────────────────────────────

chrome.devtools.network.onNavigated.addListener(() => {
  detectedFields = [];
  watcherActive = false;
  // Preserve steps if recording is stopped (user hasn't cleared yet)
  if (recordingState !== "stopped") {
    recordedStepsPreview = [];
  }
  if (
    recordingState !== "recording" &&
    recordingState !== "paused" &&
    recordingState !== "stopped"
  ) {
    recordingState = "idle";
  }
  ignoredSelectors.clear();
  renderActiveTab();
  updateStatusBar();
});

// ── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const settings = (await chrome.runtime.sendMessage({
    type: "GET_SETTINGS",
  })) as { uiLanguage?: "auto" | "en" | "pt_BR" } | null;
  await initI18n(settings?.uiLanguage ?? "auto");

  // Sync watcher state from content script
  const watcherStatus = (await sendToPage({ type: "GET_WATCHER_STATUS" }).catch(
    () => null,
  )) as { watching: boolean } | null;
  watcherActive = watcherStatus?.watching ?? false;

  // Inject log viewer styles
  const lvStyle = document.createElement("style");
  lvStyle.textContent = getLogViewerStyles("devtools");
  document.head.appendChild(lvStyle);

  renderApp();
  updateWatcherButton();
}

void init();
