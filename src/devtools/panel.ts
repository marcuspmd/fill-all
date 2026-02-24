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

// ── Constants ────────────────────────────────────────────────────────────────

const TAB_IDS = ["actions", "fields", "forms", "log"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
  actions: "⚡ Ações",
  fields: "🔍 Campos",
  forms: "📄 Forms",
  log: "📋 Log",
};

// ── State ────────────────────────────────────────────────────────────────────

const inspectedTabId = chrome.devtools.inspectedWindow.tabId;

let activeTab: TabId = "actions";
let detectedFields: DetectedFieldSummary[] = [];
let savedForms: SavedForm[] = [];
let logEntries: Array<{ time: string; text: string; type: string }> = [];
let watcherActive = false;
let ignoredSelectors = new Set<string>();

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

function addLog(
  text: string,
  type: "info" | "success" | "error" | "warn" = "info",
): void {
  const time = new Date().toLocaleTimeString("pt-BR");
  logEntries.unshift({ time, text, type });
  if (logEntries.length > 200) logEntries.length = 200;
  if (activeTab === "log") renderLogTab();
}

// ── Watcher ──────────────────────────────────────────────────────────────────

function updateWatcherButton(): void {
  const btn = document.getElementById("btn-watch");
  if (!btn) return;
  btn.innerHTML = watcherActive
    ? '<span class="card-icon">⏹️</span><span class="card-label">Stop Watch</span><span class="card-desc">Parar observação do DOM</span>'
    : '<span class="card-icon">👁️</span><span class="card-label">Watch</span><span class="card-desc">Observa mudanças no DOM e preenche novos</span>';
  btn.classList.toggle("active", watcherActive);
}

async function toggleWatch(): Promise<void> {
  if (watcherActive) {
    await sendToPage({ type: "STOP_WATCHING" });
    watcherActive = false;
    addLog("Watch desativado", "info");
  } else {
    await sendToPage({
      type: "START_WATCHING",
      payload: { autoRefill: true },
    });
    watcherActive = true;
    addLog("Watch ativado", "success");
  }
  updateWatcherButton();
}

// ── Detect Fields ────────────────────────────────────────────────────────────

async function detectFields(): Promise<void> {
  addLog("Detectando campos...");
  try {
    const result = (await sendToPage({ type: "DETECT_FIELDS" })) as {
      count?: number;
      fields?: DetectedFieldSummary[];
    };
    if (result?.fields) {
      detectedFields = result.fields;
      addLog(`${result.count} campos detectados`, "success");
    } else {
      detectedFields = [];
      addLog("Nenhum campo detectado", "warn");
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
        addLog(`Campo reativado: ${label}`, "info");
      }
    } else {
      await sendToBackground({
        type: "ADD_IGNORED_FIELD",
        payload: { urlPattern, selector, label },
      });
      ignoredSelectors.add(selector);
      addLog(`Campo ignorado: ${label}`, "warn");
    }
  } catch (err) {
    addLog(`Erro ao alternar ignore: ${err}`, "error");
  }

  if (activeTab === "fields") renderFieldsTab();
}

// ── Fill ──────────────────────────────────────────────────────────────────────

async function fillAll(): Promise<void> {
  addLog("Preenchendo todos os campos...");
  try {
    const result = (await sendToPage({ type: "FILL_ALL_FIELDS" })) as {
      filled?: number;
    };
    addLog(`${result?.filled ?? 0} campos preenchidos`, "success");
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
  addLog("Salvando formulário...");
  try {
    const result = (await sendToPage({ type: "SAVE_FORM" })) as {
      success?: boolean;
      form?: SavedForm;
    };
    if (result?.success) {
      addLog(`Formulário salvo: ${result.form?.name ?? ""}`, "success");
    } else {
      addLog("Erro ao salvar formulário", "error");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

async function loadForms(): Promise<void> {
  addLog("Carregando formulários salvos...");
  try {
    const result = (await sendToBackground({ type: "GET_SAVED_FORMS" })) as
      | SavedForm[]
      | { error?: string };
    if (Array.isArray(result)) {
      savedForms = result;
      addLog(`${result.length} formulário(s) encontrado(s)`, "success");
    } else {
      savedForms = [];
      addLog("Nenhum formulário salvo", "warn");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
    savedForms = [];
  }
  if (activeTab === "forms") renderFormsTab();
}

async function applySavedForm(form: SavedForm): Promise<void> {
  addLog(`Aplicando template: ${form.name}`);
  try {
    const result = (await sendToPage({
      type: "APPLY_TEMPLATE",
      payload: form,
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} campos preenchidos`, "success");
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

async function deleteFormById(formId: string): Promise<void> {
  try {
    await sendToBackground({ type: "DELETE_FORM", payload: formId });
    savedForms = savedForms.filter((f) => f.id !== formId);
    addLog("Formulário removido", "info");
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
      ? `${detectedFields.length} campos detectados`
      : "Nenhum campo detectado ainda";
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
              ${TAB_LABELS[id]}
            </button>
          `,
          ).join("")}
        </div>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" id="btn-options" title="Abrir Opções">⚙️</button>
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
    addLog("Abrindo página de opções", "info");
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
        <span class="card-label">Preencher Tudo</span>
        <span class="card-desc">Preenche todos os campos detectados</span>
      </button>
      <button class="action-card secondary" id="btn-save">
        <span class="card-icon">💾</span>
        <span class="card-label">Salvar Form</span>
        <span class="card-desc">Salva os valores atuais do formulário</span>
      </button>
      <button class="action-card outline ${watcherActive ? "active" : ""}" id="btn-watch">
        <span class="card-icon">${watcherActive ? "⏹️" : "👁️"}</span>
        <span class="card-label">${watcherActive ? "Stop Watch" : "Watch"}</span>
        <span class="card-desc">${watcherActive ? "Parar observação do DOM" : "Observa mudanças no DOM e preenche novos"}</span>
      </button>
      <button class="action-card outline" id="btn-detect">
        <span class="card-icon">🔍</span>
        <span class="card-label">Detectar Campos</span>
        <span class="card-desc">Escaneia a página por campos de formulário</span>
      </button>
    </div>
    <div class="status-bar" id="status-bar">
      ${detectedFields.length > 0 ? `${detectedFields.length} campos detectados` : "Nenhum campo detectado ainda"}
    </div>
  `;

  document.getElementById("btn-fill")?.addEventListener("click", fillAll);
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
      <button class="btn" id="btn-detect-fields">🔍 Detectar</button>
      <button class="btn" id="btn-fill-all-fields">⚡ Preencher Todos</button>
      <span class="fields-count">${detectedFields.length} campo(s)</span>
    </div>
    <div class="table-wrap">
      ${
        detectedFields.length === 0
          ? '<div class="empty">Clique em "Detectar" para escanear os campos da página</div>'
          : `<table class="fields-table">
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
                  <button class="icon-btn" data-action="fill" data-selector="${escapeAttr(f.selector)}" title="Preencher">⚡</button>
                  <button class="icon-btn" data-action="inspect" data-selector="${escapeAttr(f.selector)}" title="Inspecionar no Elements">🔎</button>
                  <button class="icon-btn ${isIgnored ? "icon-btn-off" : ""}" data-action="toggle-ignore" data-selector="${escapeAttr(f.selector)}" data-label="${escapeAttr(f.label || f.name || f.id || f.selector)}" title="${isIgnored ? "Reativar" : "Ignorar"}">
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
      <button class="btn" id="btn-load-forms">🔄 Carregar Forms</button>
      <span class="fields-count">${savedForms.length} formulário(s)</span>
    </div>
    <div class="forms-list">
      ${
        savedForms.length === 0
          ? '<div class="empty">Clique em "Carregar" para buscar formulários salvos</div>'
          : savedForms
              .map(
                (form) => `
          <div class="form-card">
            <div class="form-info">
              <span class="form-name">${escapeHtml(form.name)}</span>
              <span class="form-meta">${form.templateFields?.length ?? Object.keys(form.fields).length} campos · ${new Date(form.updatedAt).toLocaleDateString("pt-BR")}</span>
              <span class="form-url">${escapeHtml(form.urlPattern)}</span>
            </div>
            <div class="form-actions">
              <button class="btn btn-sm" data-form-id="${escapeAttr(form.id)}" data-action="apply">▶️ Aplicar</button>
              <button class="btn btn-sm btn-warning" data-form-id="${escapeAttr(form.id)}" data-action="edit">✏️ Editar</button>
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
            <option value="fixed"${f.mode === "fixed" ? " selected" : ""}>Valor fixo</option>
            <option value="generator"${f.mode === "generator" ? " selected" : ""}>Gerador</option>
          </select>
          <input type="text" class="edit-field-value" data-field-fixed="${i}"
            placeholder="Valor fixo"
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
      <div class="edit-form-title">✏️ Editar Template</div>
      <div class="edit-meta-grid">
        <div class="edit-input-group">
          <label class="edit-label">Nome</label>
          <input class="edit-input" id="edit-form-name" type="text" value="${escapeAttr(form.name)}" />
        </div>
        <div class="edit-input-group">
          <label class="edit-label">URL / Padrão</label>
          <input class="edit-input" id="edit-form-url" type="text" value="${escapeAttr(form.urlPattern)}" />
        </div>
      </div>
      ${
        templateFields.length > 0
          ? `<div class="edit-section-header">Campos</div>
             <div class="edit-fields-list">${fieldsHtml}</div>`
          : ""
      }
      <div class="edit-form-footer">
        <button class="btn" id="edit-form-cancel">✕ Cancelar</button>
        <button class="btn btn-success" id="edit-form-save">💾 Salvar</button>
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

      addLog(`Template "${updated.name}" atualizado`, "success");
      renderFormsTab();
    });
}

function renderLogTab(): void {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="fields-toolbar">
      <button class="btn" id="btn-clear-log">🗑️ Limpar</button>
      <span class="fields-count">${logEntries.length} entradas</span>
    </div>
    <div class="log-wrap">
      ${
        logEntries.length === 0
          ? '<div class="empty">Nenhuma atividade registrada</div>'
          : logEntries
              .map(
                (entry) => `
          <div class="log-entry log-${entry.type}">
            <span class="log-time">${entry.time}</span>
            <span class="log-text">${escapeHtml(entry.text)}</span>
          </div>
        `,
              )
              .join("")
      }
    </div>
  `;

  document.getElementById("btn-clear-log")?.addEventListener("click", () => {
    logEntries = [];
    renderLogTab();
  });
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
  renderApp();
  updateWatcherButton();
}

void init();
