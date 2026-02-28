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
} from "@/types";
import { FIELD_TYPES } from "@/types";
import {
  renderTypeBadge,
  renderMethodBadge,
  renderConfidenceBadge,
} from "@/lib/ui";
import { t, initI18n } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";
import type { LogViewer } from "@/lib/logger/log-viewer";
import { createLogViewer, getLogViewerStyles } from "@/lib/logger/log-viewer";

// ── Constants ────────────────────────────────────────────────────────────────

const TAB_IDS = ["actions", "fields", "forms", "log"] as const;
type TabId = (typeof TAB_IDS)[number];

function getTabLabels(): Record<TabId, string> {
  return {
    actions: `⚡ ${t("tabActions")}`,
    fields: `🔍 ${t("tabFields")}`,
    forms: `📄 ${t("tabForms")}`,
    log: `📋 ${t("tabLog")}`,
  };
}

// ── State ────────────────────────────────────────────────────────────────────

const inspectedTabId = chrome.devtools.inspectedWindow.tabId;

let activeTab: TabId = "actions";
let detectedFields: DetectedFieldSummary[] = [];
let savedForms: SavedForm[] = [];
let watcherActive = false;
let ignoredSelectors = new Set<string>();
let logViewerInstance: LogViewer | null = null;

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

async function detectFields(): Promise<void> {
  addLog(t("logDetecting"));
  try {
    const result = (await sendToPage({ type: "DETECT_FIELDS" })) as {
      count?: number;
      fields?: DetectedFieldSummary[];
    };
    if (result?.fields) {
      detectedFields = result.fields;
      addLog(`${result.count} ${t("fieldsDetected")}`, "success");
    } else {
      detectedFields = [];
      addLog(t("logNoFieldDetected"), "warn");
    }
  } catch (err) {
    addLog(`Erro ao detectar: ${err}`, "error");
    detectedFields = [];
  }

  await loadIgnoredFields();
  if (activeTab === "fields") renderFieldsTab();
  updateStatusBar();
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
      <span class="fields-count">${savedForms.length} ${t("formCount")}</span>
    </div>
    <div class="forms-list">
      ${
        savedForms.length === 0
          ? `<div class="empty">${t("loadFormsDesc")}</div>`
          : savedForms
              .map(
                (form) => `
          <div class="form-card">
            <div class="form-info">
              <span class="form-name">${escapeHtml(form.name)}</span>
              <span class="form-meta">${form.templateFields?.length ?? Object.keys(form.fields).length} ${t("fieldCount")} · ${new Date(form.updatedAt).toLocaleDateString()}</span>
              <span class="form-url">${escapeHtml(form.urlPattern)}</span>
            </div>
            <div class="form-actions">
              <button class="btn btn-sm" data-form-id="${escapeAttr(form.id)}" data-action="apply">▶️ ${t("btnApply")}</button>
              <button class="btn btn-sm btn-warning" data-form-id="${escapeAttr(form.id)}" data-action="edit">✏️ ${t("btnEdit")}</button>
              <button class="btn btn-sm btn-danger" data-form-id="${escapeAttr(form.id)}" data-action="delete">🗑️</button>
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
        else if (action === "delete") void deleteFormById(form.id);
      });
    });
}

function showEditFormScreen(form: SavedForm): void {
  const content = document.getElementById("content");
  if (!content) return;

  // Normalise to templateFields
  const templateFields: FormTemplateField[] =
    form.templateFields && form.templateFields.length > 0
      ? form.templateFields.map((f) => ({ ...f }))
      : Object.entries(form.fields).map(([key, value]) => ({
          key,
          label: key,
          mode: "fixed" as FormFieldMode,
          fixedValue: value,
        }));

  const fieldOptionsHtml = FIELD_TYPES.map(
    (t) => `<option value="${t}">${t}</option>`,
  ).join("");

  const fieldsHtml = templateFields
    .map(
      (f, i) => `
      <div class="edit-field-row" data-field-index="${i}">
        <div class="edit-field-key" title="${escapeAttr(f.key)}">${escapeHtml(f.label || f.key)}</div>
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
            ${FIELD_TYPES.map(
              (t) =>
                `<option value="${t}"${f.generatorType === t ? " selected" : ""}>${t}</option>`,
            ).join("")}
          </select>
        </div>
      </div>
    `,
    )
    .join("");

  content.innerHTML = `
    <div class="edit-form-screen">
      <div class="edit-form-title">✏️ ${t("editTemplate")}</div>
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
      ${
        templateFields.length > 0
          ? `<div class="edit-section-header">${t("editFieldsHeader")}</div>
             <div class="edit-fields-list">${fieldsHtml}</div>`
          : ""
      }
      <div class="edit-form-footer">
        <button class="btn" id="edit-form-cancel">✕ ${t("btnCancel")}</button>
        <button class="btn btn-success" id="edit-form-save">💾 ${t("btnSave")}</button>
      </div>
    </div>
  `;

  // Wire up mode toggles
  content
    .querySelectorAll<HTMLSelectElement>("[data-field-mode]")
    .forEach((sel) => {
      sel.addEventListener("change", () => {
        const idx = sel.dataset.fieldMode;
        const fixedInput = content.querySelector<HTMLElement>(
          `[data-field-fixed="${idx}"]`,
        );
        const genSelect = content.querySelector<HTMLElement>(
          `[data-field-gen="${idx}"]`,
        );
        const isFixed = sel.value === "fixed";
        if (fixedInput) fixedInput.style.display = isFixed ? "block" : "none";
        if (genSelect) genSelect.style.display = isFixed ? "none" : "block";
      });
    });

  document.getElementById("edit-form-cancel")?.addEventListener("click", () => {
    renderFormsTab();
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

      const updatedFields: FormTemplateField[] = templateFields.map((f, i) => {
        const modeEl = content.querySelector<HTMLSelectElement>(
          `[data-field-mode="${i}"]`,
        );
        const fixedEl = content.querySelector<HTMLInputElement>(
          `[data-field-fixed="${i}"]`,
        );
        const genEl = content.querySelector<HTMLSelectElement>(
          `[data-field-gen="${i}"]`,
        );
        const mode = (modeEl?.value ?? f.mode) as FormFieldMode;
        return {
          key: f.key,
          label: f.label,
          mode,
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

      // Update local state
      const idx = savedForms.findIndex((f) => f.id === form.id);
      if (idx >= 0) savedForms[idx] = updated;

      addLog(`${t("logTemplateUpdated")}: ${updated.name}`, "success");
      renderFormsTab();
    });
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

// ── Navigation Listener ──────────────────────────────────────────────────────

chrome.devtools.network.onNavigated.addListener(() => {
  detectedFields = [];
  watcherActive = false;
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

  // Inject log viewer styles
  const lvStyle = document.createElement("style");
  lvStyle.textContent = getLogViewerStyles("devtools");
  document.head.appendChild(lvStyle);

  renderApp();
  updateWatcherButton();
}

void init();
