/**
 * Popup script — tabbed UI orchestrator.
 *
 * Architecture mirrors devtools/panel.ts: one central orchestrator that
 * manages tabs, renders content, and delegates to sub-modules for logic.
 */

import "./popup.css";

import type {
  DetectedFieldSummary,
  FieldDetectionCacheEntry,
  FieldType,
  IgnoredField,
  SavedForm,
} from "@/types";
import { FIELD_TYPES, getRange } from "@/types";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";
import { generate, generateMoney, generateNumber } from "@/lib/generators";
import { generateWithConstraints } from "@/lib/generators/adaptive";
import { getFieldTypeOptions } from "@/lib/shared/field-type-catalog";
import {
  renderTabBar,
  renderConfidenceBadge,
  renderTypeBadge,
  renderMethodBadge,
  TYPE_COLORS,
} from "@/lib/ui";
import {
  sendToActiveTab,
  sendToBackground,
  getActivePageUrl,
  escapeHtml,
} from "./popup-messaging";
import { initChromeAIStatus } from "./popup-chrome-ai";
import { t, initI18n } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────────────

// const TAB_IDS = ["actions", "fields", "forms", "generators"] as const;
const TAB_IDS = ["actions", "generators"] as const;
type TabId = (typeof TAB_IDS)[number];

// const TAB_LABELS: Record<TabId, string> = {
//   actions: "⚡ Ações",
//   fields: "🔍 Campos",
//   forms: "📄 Forms",
//   generators: "🎲 Gerar",
// };

const TAB_LABELS: Record<TabId, string> = {
  get actions() {
    return `⚡ ${t("tabActions")}`;
  },
  get generators() {
    return `🎲 ${t("tabGenerators")}`;
  },
};

// ── State ────────────────────────────────────────────────────────────────────

let activeTab: TabId = "actions";
let detectedFields: DetectedFieldSummary[] = [];
let savedForms: SavedForm[] = [];
let ignoredFields: IgnoredField[] = [];
let ignoredSelectors = new Set<string>();
let watcherActive = false;
let panelActive = false;
let fillEmptyOnly = false;
let pageUrl = "";

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> =
  getFieldTypeOptions(FIELD_TYPES);

// ── Tab Management ───────────────────────────────────────────────────────────

function initTabs(): void {
  const tabsEl = document.getElementById("tabs");
  if (!tabsEl) return;

  tabsEl.innerHTML = renderTabBar(
    TAB_IDS.map((id) => ({
      id,
      label: TAB_LABELS[id],
      active: id === activeTab,
    })),
  );

  tabsEl.querySelectorAll<HTMLButtonElement>(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab as TabId;
      if (tab) switchTab(tab);
    });
  });
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
    case "generators":
      renderGeneratorsTab();
      break;
  }
}

// ── Actions Tab ──────────────────────────────────────────────────────────────

function renderActionsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="actions-grid">
      <button class="action-card primary" id="btn-fill-all">
        <span class="card-icon">⚡</span>
        <span class="card-label">${t("fillAll")}</span>
        <span class="card-desc">${t("fillAllDesc")}</span>
      </button>
      <button class="action-card secondary" id="btn-save-form">
        <span class="card-icon">💾</span>
        <span class="card-label">${t("saveForm")}</span>
        <span class="card-desc">${t("saveFormDesc")}</span>
      </button>
      <button class="action-card ${watcherActive ? "active" : ""}" id="btn-toggle-watch">
        <span class="card-icon">${watcherActive ? "⏹️" : "👁️"}</span>
        <span class="card-label">${watcherActive ? t("stopWatch") : t("watch")}</span>
        <span class="card-desc">${watcherActive ? t("stopWatchDesc") : t("watchDesc")}</span>
      </button>
      <button class="action-card ${panelActive ? "active" : ""}" id="btn-toggle-panel">
        <span class="card-icon">📌</span>
        <span class="card-label">${panelActive ? t("panelActive") : t("panelFloating")}</span>
        <span class="card-desc">${t("panelDesc")}</span>
      </button>
      <div class="action-card" id="btn-export-e2e-card">
        <span class="card-icon">🧪</span>
        <span class="card-label" id="export-e2e-label">${t("exportE2E")}</span>
        <span class="card-desc">${t("exportE2EDesc")}</span>
        <select class="e2e-framework-select" id="e2e-framework-select">
          <option value="playwright">Playwright</option>
          <option value="cypress">Cypress</option>
          <option value="pest">Pest/Dusk</option>
        </select>
      </div>
    </div>
    <div class="status-bar" id="status-bar">
      ${detectedFields.length > 0 ? `${detectedFields.length} ${t("fieldsDetected")}` : t("noFieldsDetected")}
    </div>
    <div class="fill-option-row">
      <label class="fill-option-label" for="toggle-fill-empty-only">${t("fillEmptyOnly")}</label>
      <label class="fill-option-toggle">
        <input type="checkbox" id="toggle-fill-empty-only" ${fillEmptyOnly ? "checked" : ""} />
        <span class="slider"></span>
      </label>
    </div>
    <a href="#" id="btn-options" class="btn-settings-link">${t("btnSettings")}</a>
  `;

  document
    .getElementById("btn-fill-all")
    ?.addEventListener("click", handleFillAll);
  document
    .getElementById("btn-save-form")
    ?.addEventListener("click", handleSaveForm);
  document
    .getElementById("btn-toggle-watch")
    ?.addEventListener("click", handleToggleWatch);
  document
    .getElementById("btn-toggle-panel")
    ?.addEventListener("click", handleTogglePanel);
  document
    .getElementById("btn-export-e2e-card")
    ?.addEventListener("click", handleExportE2E);
  document
    .getElementById("e2e-framework-select")
    ?.addEventListener("click", (e) => e.stopPropagation());
  document
    .getElementById("toggle-fill-empty-only")
    ?.addEventListener("change", handleFillEmptyOnlyToggle);
  bindOptionsLink();
}

async function handleFillAll(): Promise<void> {
  const btn = document.getElementById("btn-fill-all");
  if (!btn) return;
  const result = await sendToActiveTab({ type: "FILL_ALL_FIELDS" });
  const res = result as { filled?: number } | null;
  const label = btn.querySelector(".card-label");
  if (label) {
    label.textContent =
      result === null
        ? t("notAvailable")
        : `✓ ${res?.filled ?? 0} ${t("filled")}`;
    setTimeout(() => {
      label.textContent = t("fillAll");
    }, 2000);
  }
}

async function handleSaveForm(): Promise<void> {
  await sendToActiveTab({ type: "SAVE_FORM" });
  await loadFormsData();
}

async function handleToggleWatch(): Promise<void> {
  if (watcherActive) {
    await sendToActiveTab({ type: "STOP_WATCHING" });
    watcherActive = false;
  } else {
    await sendToActiveTab({
      type: "START_WATCHING",
      payload: { autoRefill: true },
    });
    watcherActive = true;
  }
  renderActionsTab();
}

async function handleFillEmptyOnlyToggle(): Promise<void> {
  fillEmptyOnly = !fillEmptyOnly;
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: { fillEmptyOnly },
  });
}

async function handleTogglePanel(): Promise<void> {
  panelActive = !panelActive;
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: { showPanel: panelActive },
  });
  if (panelActive) {
    await sendToActiveTab({ type: "SHOW_PANEL" });
  } else {
    await sendToActiveTab({ type: "HIDE_PANEL" });
  }
  renderActionsTab();
}

async function handleExportE2E(): Promise<void> {
  const label = document.getElementById("export-e2e-label");
  const select = document.getElementById(
    "e2e-framework-select",
  ) as HTMLSelectElement | null;
  const framework = select?.value ?? "playwright";

  if (label) label.textContent = t("exportE2EGenerating");

  try {
    const result = (await sendToActiveTab({
      type: "EXPORT_E2E",
      payload: { framework },
    })) as { success?: boolean; script?: string; actionsCount?: number } | null;

    if (!result?.success || !result.script) {
      if (label) label.textContent = t("exportE2EFail");
      return;
    }

    // Download as file
    downloadScript(result.script, framework);

    // Also copy to clipboard as fallback
    await navigator.clipboard.writeText(result.script);
    if (label)
      label.textContent = `${t("exportE2ESuccess")} (${result.actionsCount})`;
  } catch {
    if (label) label.textContent = t("exportE2EFail");
  } finally {
    setTimeout(() => {
      if (label) label.textContent = t("exportE2E");
    }, 3000);
  }
}

function downloadScript(script: string, framework: string): void {
  const extensions: Record<string, string> = {
    playwright: ".spec.ts",
    cypress: ".cy.ts",
    pest: ".php",
  };

  const ext = extensions[framework] ?? ".txt";
  const filename = `form-fill${ext}`;
  const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

// ── Fields Tab ───────────────────────────────────────────────────────────────

function renderFieldsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn btn-primary-solid" id="btn-detect">🔍 ${t("btnDetect")}</button>
      <button class="btn" id="btn-fill-all-fields">⚡ ${t("btnFillAll")}</button>
      <span class="fields-count">${detectedFields.length} ${t("fieldCount")}</span>
    </div>
    <div id="fields-list"></div>
  `;

  document
    .getElementById("btn-detect")
    ?.addEventListener("click", handleDetect);
  document
    .getElementById("btn-fill-all-fields")
    ?.addEventListener("click", handleFillAll);

  renderFieldsList();
}

function renderFieldsList(): void {
  const list = document.getElementById("fields-list");
  if (!list) return;

  if (detectedFields.length === 0) {
    list.innerHTML = `<div class="empty">${t("clickToDetect")}</div>`;
    return;
  }

  list.innerHTML = `
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
                <button class="icon-btn" data-action="fill" data-selector="${escapeHtml(f.selector)}" title="${t("actionFill")}">⚡</button>
                <button class="icon-btn ${isIgnored ? "icon-btn-off" : ""}" data-action="toggle-ignore" data-selector="${escapeHtml(f.selector)}" data-label="${escapeHtml(f.label || f.name || f.id || f.selector)}" title="${isIgnored ? t("actionReactivate") : t("actionIgnore")}">
                  ${isIgnored ? "🚫" : "👁️"}
                </button>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const selector = btn.dataset.selector;
      if (!selector) return;
      if (action === "fill") {
        void sendToActiveTab({
          type: "FILL_FIELD_BY_SELECTOR",
          payload: selector,
        });
      } else if (action === "toggle-ignore") {
        void handleToggleIgnore(selector, btn.dataset.label || selector);
      }
    });
  });
}

async function handleDetect(): Promise<void> {
  const btn = document.getElementById("btn-detect") as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("detecting");
  }

  try {
    pageUrl = await getActivePageUrl();
    const result = (await sendToActiveTab({ type: "DETECT_FIELDS" })) as {
      count: number;
      fields: DetectedFieldSummary[];
    } | null;

    if (result?.fields) {
      detectedFields = result.fields;
      await sendToBackground({
        type: "SAVE_FIELD_CACHE",
        payload: { url: pageUrl, fields: result.fields },
      });
    } else {
      detectedFields = [];
    }

    await loadIgnoredData();
    renderFieldsList();
    updateStatusBar();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = `🔍 ${t("btnDetect")}`;
    }
  }
}

async function handleToggleIgnore(
  selector: string,
  label: string,
): Promise<void> {
  const isIgnored = ignoredSelectors.has(selector);

  if (isIgnored) {
    const entry = ignoredFields.find(
      (f) => f.selector === selector && matchUrlPattern(pageUrl, f.urlPattern),
    );
    if (entry) {
      await sendToBackground({
        type: "REMOVE_IGNORED_FIELD",
        payload: entry.id,
      });
    }
  } else {
    const origin = new URL(pageUrl).origin;
    const pathname = new URL(pageUrl).pathname;
    const urlPattern = `${origin}${pathname}*`;
    await sendToBackground({
      type: "ADD_IGNORED_FIELD",
      payload: { urlPattern, selector, label },
    });
  }

  await loadIgnoredData();
  renderFieldsList();
}

// ── Forms Tab ────────────────────────────────────────────────────────────────

function renderFormsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn" id="btn-load-forms">🔄 ${t("btnLoadForms")}</button>
      <span class="fields-count">${savedForms.length} ${t("fieldCount")}</span>
    </div>
    <div class="forms-list" id="forms-list">
      ${
        savedForms.length === 0
          ? `<div class="empty">${t("clickToLoadForms")}</div>`
          : savedForms
              .map(
                (form) => `
          <div class="form-card">
            <div class="form-info">
              <span class="form-name">${escapeHtml(form.name)}</span>
              <span class="form-meta">${Object.keys(form.fields).length} campos · ${new Date(form.updatedAt).toLocaleDateString("pt-BR")}</span>
              <span class="form-url">${escapeHtml(form.urlPattern)}</span>
            </div>
            <div class="form-actions">
              <button class="btn btn-sm btn-load" data-form-id="${escapeHtml(form.id)}" data-action="apply">▶️</button>
              <button class="btn btn-sm btn-delete" data-form-id="${escapeHtml(form.id)}" data-action="delete">🗑️</button>
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
    ?.addEventListener("click", async () => {
      await loadFormsData();
      renderFormsTab();
    });

  content
    .querySelectorAll<HTMLButtonElement>("[data-form-id]")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const formId = btn.dataset.formId;
        const action = btn.dataset.action;
        const form = savedForms.find((f) => f.id === formId);
        if (!form) return;
        if (action === "apply") {
          await sendToActiveTab({ type: "LOAD_SAVED_FORM", payload: form });
        } else if (action === "delete") {
          await sendToBackground({ type: "DELETE_FORM", payload: form.id });
          await loadFormsData();
          renderFormsTab();
        }
      });
    });

  content
    .querySelectorAll<HTMLButtonElement>("[data-ignored-id]")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.ignoredId;
        if (id) {
          await sendToBackground({ type: "REMOVE_IGNORED_FIELD", payload: id });
          await loadIgnoredData();
          renderFormsTab();
        }
      });
    });
}

// ── Generators Tab ───────────────────────────────────────────────────────────

const GENERATOR_CHIPS: Array<{ type: FieldType; label: string }> =
  FIELD_TYPE_OPTIONS.filter(
    (option) =>
      !["select", "checkbox", "radio", "file", "unknown"].includes(
        option.value,
      ),
  ).map((option) => ({ type: option.value, label: option.label }));

function renderGeneratorsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="generators-grid">
      ${GENERATOR_CHIPS.map(
        (g) =>
          `<button class="btn-chip" data-generator="${g.type}">${g.label}</button>`,
      ).join("")}
    </div>

    <div class="range-config" id="money-config" style="display:none">
      <span class="range-label">R$</span>
      <input type="number" class="range-input" id="money-min" placeholder="Mín" value="1">
      <span class="range-sep">–</span>
      <input type="number" class="range-input" id="money-max" placeholder="Máx" value="10000">
    </div>

    <div class="range-config" id="number-config" style="display:none">
      <span class="range-label">#</span>
      <input type="number" class="range-input" id="number-min" placeholder="Mín" value="1">
      <span class="range-sep">–</span>
      <input type="number" class="range-input" id="number-max" placeholder="Máx" value="99999">
    </div>

    <div class="generated-value" id="generated-value" style="display:none">
      <span id="generated-text"></span>
      <button class="btn-copy" id="btn-copy" title="Copiar">📋</button>
    </div>
  `;

  initGeneratorConfigsInContainer(content);
  bindGeneratorEventsInContainer(content);
}

function initGeneratorConfigsInContainer(container: HTMLElement): void {
  const moneyRange = getRange("money", 1, 10_000);
  const numberRange = getRange("number", 1, 99_999);

  const moneyMin = container.querySelector<HTMLInputElement>("#money-min");
  const moneyMax = container.querySelector<HTMLInputElement>("#money-max");
  const numMin = container.querySelector<HTMLInputElement>("#number-min");
  const numMax = container.querySelector<HTMLInputElement>("#number-max");
  if (moneyMin) moneyMin.value = String(moneyRange.min);
  if (moneyMax) moneyMax.value = String(moneyRange.max);
  if (numMin) numMin.value = String(numberRange.min);
  if (numMax) numMax.value = String(numberRange.max);
}

function bindGeneratorEventsInContainer(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLButtonElement>("[data-generator]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.generator as FieldType;

        const moneyConfig =
          container.querySelector<HTMLElement>("#money-config");
        const numberConfig =
          container.querySelector<HTMLElement>("#number-config");
        if (moneyConfig)
          moneyConfig.style.display = type === "money" ? "flex" : "none";
        if (numberConfig)
          numberConfig.style.display = type === "number" ? "flex" : "none";

        let value: string;
        if (type === "money") {
          const defaults = getRange("money", 1, 10_000);
          const min = parseFloat(
            container.querySelector<HTMLInputElement>("#money-min")?.value ??
              "",
          );
          const max = parseFloat(
            container.querySelector<HTMLInputElement>("#money-max")?.value ??
              "",
          );
          value = generateWithConstraints(
            () =>
              generateMoney(
                isNaN(min) ? defaults.min : min,
                isNaN(max) ? defaults.max : max,
              ),
            { requireValidity: true },
          );
        } else if (type === "number") {
          const defaults = getRange("number", 1, 99_999);
          const min = parseInt(
            container.querySelector<HTMLInputElement>("#number-min")?.value ??
              "",
            10,
          );
          const max = parseInt(
            container.querySelector<HTMLInputElement>("#number-max")?.value ??
              "",
            10,
          );
          value = generateWithConstraints(
            () =>
              generateNumber(
                isNaN(min) ? defaults.min : min,
                isNaN(max) ? defaults.max : max,
              ),
            { requireValidity: true },
          );
        } else {
          value = generateWithConstraints(() => generate(type), {
            requireValidity: true,
          });
        }

        const valContainer =
          container.querySelector<HTMLElement>("#generated-value");
        const text = container.querySelector<HTMLElement>("#generated-text");
        if (text) text.textContent = value;
        if (valContainer) valContainer.style.display = "flex";
      });
    });

  container.querySelector("#btn-copy")?.addEventListener("click", () => {
    const text =
      container.querySelector<HTMLElement>("#generated-text")?.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      const btn = container.querySelector<HTMLElement>("#btn-copy");
      if (btn) {
        btn.textContent = "✓";
        setTimeout(() => {
          btn.textContent = "📋";
        }, 1000);
      }
    }
  });
}

// ── Data Loading ─────────────────────────────────────────────────────────────

async function loadFormsData(): Promise<void> {
  const result = (await sendToBackground({ type: "GET_SAVED_FORMS" })) as
    | SavedForm[]
    | null;
  savedForms = Array.isArray(result) ? result : [];
}

async function loadIgnoredData(): Promise<void> {
  const result = (await sendToBackground({ type: "GET_IGNORED_FIELDS" })) as
    | IgnoredField[]
    | null;
  ignoredFields = Array.isArray(result) ? result : [];
  ignoredSelectors = new Set(
    ignoredFields
      .filter((f) => matchUrlPattern(pageUrl, f.urlPattern))
      .map((f) => f.selector),
  );
}

async function loadFieldsFromCache(): Promise<void> {
  if (!pageUrl.startsWith("http://") && !pageUrl.startsWith("https://")) return;

  const cache = (await sendToBackground({
    type: "GET_FIELD_CACHE",
    payload: { url: pageUrl },
  })) as FieldDetectionCacheEntry | null;

  if (cache?.fields) {
    detectedFields = cache.fields;
  }
}

function updateStatusBar(): void {
  const bar = document.getElementById("status-bar");
  if (bar) {
    bar.textContent =
      detectedFields.length > 0
        ? `${detectedFields.length} ${t("fieldsDetected")}`
        : t("noFieldsDetected");
  }
}

// ── Options Link ─────────────────────────────────────────────────────────────

function bindOptionsLink(): void {
  document.getElementById("btn-options")?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  pageUrl = await getActivePageUrl();

  initTabs();
  bindOptionsLink();
  initChromeAIStatus();

  // Load initial state
  const [, , settings, watcherStatus] = await Promise.all([
    loadFieldsFromCache(),
    loadIgnoredData(),
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }) as Promise<{
      showPanel?: boolean;
      uiLanguage?: "auto" | "en" | "pt_BR" | "es";
      fillEmptyOnly?: boolean;
    } | null>,
    sendToActiveTab({ type: "GET_WATCHER_STATUS" }).catch(
      () => null,
    ) as Promise<{ watching: boolean } | null>,
  ]);

  panelActive = settings?.showPanel ?? false;
  fillEmptyOnly = settings?.fillEmptyOnly ?? false;
  watcherActive = watcherStatus?.watching ?? false;

  await initI18n(settings?.uiLanguage ?? "auto");

  // Load forms in background
  void loadFormsData();

  renderActiveTab();
}

void init();
