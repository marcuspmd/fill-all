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
  FieldRule,
  FieldType,
  IgnoredField,
  SavedForm,
} from "@/types";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";
import { generate, generateMoney, generateNumber } from "@/lib/generators";
import { generateWithConstraints } from "@/lib/generators/adaptive";
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

// ── Types ────────────────────────────────────────────────────────────────────

const TAB_IDS = ["actions", "fields", "forms", "generators"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  actions: "⚡ Ações",
  fields: "🔍 Campos",
  forms: "📄 Forms",
  generators: "🎲 Gerar",
};

// ── State ────────────────────────────────────────────────────────────────────

let activeTab: TabId = "actions";
let detectedFields: DetectedFieldSummary[] = [];
let savedForms: SavedForm[] = [];
let ignoredFields: IgnoredField[] = [];
let ignoredSelectors = new Set<string>();
let watcherActive = false;
let panelActive = false;
let pageUrl = "";

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = (
  [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "E-mail" },
    { value: "phone", label: "Telefone" },
    { value: "full-name", label: "Nome Completo" },
    { value: "first-name", label: "Primeiro Nome" },
    { value: "last-name", label: "Sobrenome" },
    { value: "rg", label: "RG" },
    { value: "company", label: "Empresa" },
    { value: "cep", label: "CEP" },
    { value: "address", label: "Endereço" },
    { value: "city", label: "Cidade" },
    { value: "state", label: "Estado" },
    { value: "date", label: "Data" },
    { value: "birth-date", label: "Nascimento" },
    { value: "money", label: "Dinheiro" },
    { value: "number", label: "Número" },
    { value: "password", label: "Senha" },
    { value: "username", label: "Username" },
    { value: "text", label: "Texto" },
    { value: "select", label: "Select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "unknown", label: "Desconhecido" },
  ] as Array<{ value: FieldType; label: string }>
).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

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
    case "fields":
      renderFieldsTab();
      break;
    case "forms":
      renderFormsTab();
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
        <span class="card-label">Preencher Tudo</span>
        <span class="card-desc">Preenche todos os campos detectados</span>
      </button>
      <button class="action-card secondary" id="btn-save-form">
        <span class="card-icon">💾</span>
        <span class="card-label">Salvar Form</span>
        <span class="card-desc">Salva os valores atuais do formulário</span>
      </button>
      <button class="action-card ${watcherActive ? "active" : ""}" id="btn-toggle-watch">
        <span class="card-icon">${watcherActive ? "⏹️" : "👁️"}</span>
        <span class="card-label">${watcherActive ? "Stop Watch" : "Watch"}</span>
        <span class="card-desc">${watcherActive ? "Parar observação do DOM" : "Observa mudanças e preenche novos"}</span>
      </button>
      <button class="action-card ${panelActive ? "active" : ""}" id="btn-toggle-panel">
        <span class="card-icon">📌</span>
        <span class="card-label">${panelActive ? "Painel Ativo" : "Painel Flutuante"}</span>
        <span class="card-desc">Mostra painel flutuante na página</span>
      </button>
    </div>
    <div class="status-bar" id="status-bar">
      ${detectedFields.length > 0 ? `${detectedFields.length} campos detectados` : "Nenhum campo detectado ainda"}
    </div>
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
        ? "⚠️ Não disponível"
        : `✓ ${res?.filled ?? 0} preenchidos`;
    setTimeout(() => {
      label.textContent = "Preencher Tudo";
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

// ── Fields Tab ───────────────────────────────────────────────────────────────

function renderFieldsTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn btn-primary-solid" id="btn-detect">🔍 Detectar</button>
      <button class="btn" id="btn-fill-all-fields">⚡ Preencher Todos</button>
      <span class="fields-count">${detectedFields.length} campo(s)</span>
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
    list.innerHTML =
      '<div class="empty">Clique em "Detectar" para escanear os campos</div>';
    return;
  }

  list.innerHTML = `
    <div class="table-wrap">
      <table class="fields-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tipo</th>
            <th>Método</th>
            <th>Conf.</th>
            <th>ID / Name</th>
            <th>Label</th>
            <th>Ações</th>
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
                <button class="icon-btn" data-action="fill" data-selector="${escapeHtml(f.selector)}" title="Preencher">⚡</button>
                <button class="icon-btn ${isIgnored ? "icon-btn-off" : ""}" data-action="toggle-ignore" data-selector="${escapeHtml(f.selector)}" data-label="${escapeHtml(f.label || f.name || f.id || f.selector)}" title="${isIgnored ? "Reativar" : "Ignorar"}">
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
    btn.textContent = "⏳ Detectando...";
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
      btn.textContent = "🔍 Detectar";
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

  const ignoredHtml =
    ignoredFields.length > 0
      ? `
      <h3 style="font-size:12px;font-weight:600;color:#475569;margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.5px">
        🚫 Campos Ignorados (${ignoredFields.length})
      </h3>
      <div class="forms-list">
        ${ignoredFields
          .map((field) => {
            let displayUrl = field.urlPattern;
            try {
              displayUrl = new URL(field.urlPattern).hostname;
            } catch {
              /* keep */
            }
            return `
            <div class="form-card">
              <div class="form-info">
                <span class="form-name">${escapeHtml(field.label)}</span>
                <span class="form-url">${escapeHtml(displayUrl)}</span>
              </div>
              <div class="form-actions">
                <button class="btn btn-sm btn-delete" data-ignored-id="${escapeHtml(field.id)}" title="Parar de ignorar">✕</button>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `
      : "";

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn" id="btn-load-forms">🔄 Carregar</button>
      <span class="fields-count">${savedForms.length} formulário(s)</span>
    </div>
    <div class="forms-list" id="forms-list">
      ${
        savedForms.length === 0
          ? '<div class="empty">Clique em "Carregar" para buscar formulários salvos</div>'
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
    ${ignoredHtml}
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

const GENERATOR_CHIPS: Array<{ type: FieldType; label: string }> = [
  { type: "cpf", label: "CPF" },
  { type: "cnpj", label: "CNPJ" },
  { type: "email", label: "E-mail" },
  { type: "phone", label: "Telefone" },
  { type: "full-name", label: "Nome" },
  { type: "first-name", label: "1º Nome" },
  { type: "last-name", label: "Sobrenome" },
  { type: "rg", label: "RG" },
  { type: "cep", label: "CEP" },
  { type: "address", label: "Endereço" },
  { type: "city", label: "Cidade" },
  { type: "state", label: "Estado" },
  { type: "date", label: "Data" },
  { type: "birth-date", label: "Nascimento" },
  { type: "password", label: "Senha" },
  { type: "username", label: "Username" },
  { type: "company", label: "Empresa" },
  { type: "money", label: "Dinheiro" },
  { type: "number", label: "Número" },
  { type: "text", label: "Texto" },
];

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

  initGeneratorConfigs(content);
  bindGeneratorEvents(content);
}

async function initGeneratorConfigs(container: HTMLElement): Promise<void> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as Record<
    string,
    number
  > | null;
  const moneyMin = container.querySelector<HTMLInputElement>("#money-min");
  const moneyMax = container.querySelector<HTMLInputElement>("#money-max");
  const numMin = container.querySelector<HTMLInputElement>("#number-min");
  const numMax = container.querySelector<HTMLInputElement>("#number-max");
  if (moneyMin) moneyMin.value = String(settings?.moneyMin ?? 1);
  if (moneyMax) moneyMax.value = String(settings?.moneyMax ?? 10000);
  if (numMin) numMin.value = String(settings?.numberMin ?? 1);
  if (numMax) numMax.value = String(settings?.numberMax ?? 99999);
}

function bindGeneratorEvents(container: HTMLElement): void {
  const saveCfg = (
    key: string,
    minId: string,
    maxId: string,
    parser: (v: string) => number,
  ): void => {
    const min = parser(
      container.querySelector<HTMLInputElement>(`#${minId}`)?.value ?? "",
    );
    const max = parser(
      container.querySelector<HTMLInputElement>(`#${maxId}`)?.value ?? "",
    );
    if (!isNaN(min) && !isNaN(max)) {
      sendToBackground({
        type: "SAVE_SETTINGS",
        payload: { [`${key}Min`]: min, [`${key}Max`]: max },
      });
    }
  };

  container
    .querySelector("#money-min")
    ?.addEventListener("change", () =>
      saveCfg("money", "money-min", "money-max", parseFloat),
    );
  container
    .querySelector("#money-max")
    ?.addEventListener("change", () =>
      saveCfg("money", "money-min", "money-max", parseFloat),
    );
  container
    .querySelector("#number-min")
    ?.addEventListener("change", () =>
      saveCfg("number", "number-min", "number-max", parseInt),
    );
  container
    .querySelector("#number-max")
    ?.addEventListener("change", () =>
      saveCfg("number", "number-min", "number-max", parseInt),
    );

  container
    .querySelectorAll<HTMLButtonElement>("[data-generator]")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
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
          const min = parseFloat(
            container.querySelector<HTMLInputElement>("#money-min")?.value ??
              "1",
          );
          const max = parseFloat(
            container.querySelector<HTMLInputElement>("#money-max")?.value ??
              "10000",
          );
          value = generateWithConstraints(
            () => generateMoney(isNaN(min) ? 1 : min, isNaN(max) ? 10000 : max),
            { requireValidity: true },
          );
        } else if (type === "number") {
          const min = parseInt(
            container.querySelector<HTMLInputElement>("#number-min")?.value ??
              "1",
            10,
          );
          const max = parseInt(
            container.querySelector<HTMLInputElement>("#number-max")?.value ??
              "99999",
            10,
          );
          value = generateWithConstraints(
            () =>
              generateNumber(isNaN(min) ? 1 : min, isNaN(max) ? 99999 : max),
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
        ? `${detectedFields.length} campos detectados`
        : "Nenhum campo detectado ainda";
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
    } | null>,
    sendToActiveTab({ type: "GET_WATCHER_STATUS" }).catch(
      () => null,
    ) as Promise<{ watching: boolean } | null>,
  ]);

  panelActive = settings?.showPanel ?? false;
  watcherActive = watcherStatus?.watching ?? false;

  // Load forms in background
  void loadFormsData();

  renderActiveTab();
}

void init();
