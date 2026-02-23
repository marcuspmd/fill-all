/**
 * Floating Panel — Painel flutuante fixado na parte inferior da página.
 * Oferece acesso rápido aos controles do Fill All sem abrir o popup.
 */

import {
  fillAllFields,
  fillSingleField,
  captureFormValues,
} from "./form-filler";
import { streamAllFields } from "./form-detector";
import { startWatching, stopWatching, isWatcherActive } from "./dom-watcher";
import {
  saveForm,
  getSavedFormsForUrl,
  deleteForm,
  getIgnoredFieldsForUrl,
  addIgnoredField,
  removeIgnoredField,
} from "@/lib/storage/storage";
import type {
  SavedForm,
  IgnoredField,
  FieldType,
  FieldCategory,
  DetectionMethod,
} from "@/types";
import { showDetectionBadge, clearAllBadges } from "./field-overlay";
import {
  escapeHtml,
  TYPE_COLORS,
  METHOD_COLORS,
  renderTypeBadge,
  renderMethodBadge,
  renderConfidenceBadge,
} from "@/lib/ui";

const PANEL_ID = "fill-all-floating-panel";
const STORAGE_KEY = "fill_all_panel_state";
const BODY_OFFSET_ATTR = "data-fill-all-panel-offset";
const MINIMIZED_HEIGHT = 38;

type TabId = "actions" | "fields" | "forms" | "log";

interface PanelState {
  activeTab: TabId;
  height: number;
  minimized: boolean;
}

const DEFAULT_HEIGHT = 320;
const MIN_HEIGHT = 180;
const MAX_HEIGHT_RATIO = 0.7;

let panelElement: HTMLElement | null = null;
let activeTab: TabId = "actions";
let panelHeight = DEFAULT_HEIGHT;
let logEntries: Array<{ time: string; text: string; type: string }> = [];

/** Map of field selector → IgnoredField for current URL (cached for quick lookups) */
let ignoredFieldsMap = new Map<string, IgnoredField>();

/** Load ignored fields for the current page into the in-memory map */
async function loadIgnoredFields(): Promise<void> {
  const url = window.location.href;
  const ignored = await getIgnoredFieldsForUrl(url);
  ignoredFieldsMap = new Map(ignored.map((f) => [f.selector, f]));
}

/* ─── Body Offset (evita que o painel cubra conteúdo) ─── */

function applyBodyOffset(height: number): void {
  if (!document.body.hasAttribute(BODY_OFFSET_ATTR)) {
    const computed =
      parseInt(getComputedStyle(document.body).paddingBottom, 10) || 0;
    document.body.setAttribute(BODY_OFFSET_ATTR, String(computed));
  }
  const original = parseInt(document.body.getAttribute(BODY_OFFSET_ATTR)!, 10);
  document.body.style.paddingBottom = `${original + height}px`;
}

function removeBodyOffset(): void {
  const original = document.body.getAttribute(BODY_OFFSET_ATTR);
  if (original !== null) {
    const val = parseInt(original, 10);
    document.body.style.paddingBottom = val ? `${val}px` : "";
    document.body.removeAttribute(BODY_OFFSET_ATTR);
  }
}

/**
 * Creates and injects the floating panel into the page
 */
export function createFloatingPanel(): void {
  if (document.getElementById(PANEL_ID)) return;

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  applyPanelStyles(panel);
  panel.innerHTML = getPanelHTML();

  document.body.appendChild(panel);
  panelElement = panel;
  applyBodyOffset(panelHeight);

  restoreState(panel);
  setupResizeHandle(panel);
  setupTabHandlers(panel);
  setupActionHandlers(panel);
  setupFieldHandlers(panel);
  setupFormsHandlers(panel);
  updateWatcherStatus(panel);
  renderActiveTab(panel);

  // Pre-load ignored fields for eye toggle
  loadIgnoredFields();
}

/**
 * Removes the floating panel from the page
 */
export function removeFloatingPanel(): void {
  const panel = document.getElementById(PANEL_ID);
  if (panel) {
    panel.remove();
    panelElement = null;
    removeBodyOffset();
  }
}

/**
 * Toggles panel visibility
 */
export function toggleFloatingPanel(): void {
  if (document.getElementById(PANEL_ID)) {
    removeFloatingPanel();
  } else {
    createFloatingPanel();
  }
}

/* ─── HTML ─── */

function getPanelHTML(): string {
  return `
    <div class="fa-resize-handle" id="fa-resize-handle"></div>
    <div class="fa-toolbar" id="fa-toolbar">
      <div class="fa-toolbar-left">
        <span class="fa-toolbar-title">🔧 Fill All</span>
        <div class="fa-tabs" id="fa-tabs">
          <button class="fa-tab active" data-tab="actions">⚡ Ações</button>
          <button class="fa-tab" data-tab="fields">🔍 Campos</button>
          <button class="fa-tab" data-tab="forms">📄 Forms</button>
          <button class="fa-tab" data-tab="log">📋 Log</button>
        </div>
      </div>
      <div class="fa-toolbar-right">
        <button class="fa-toolbar-btn fa-btn-fill-minimized" id="fa-btn-fill-minimized" title="Preencher Tudo">⚡</button>
        <button class="fa-toolbar-btn" id="fa-btn-minimize" title="Minimizar">▼</button>
        <button class="fa-toolbar-btn" id="fa-btn-close" title="Fechar">✕</button>
      </div>
    </div>
    <div class="fa-content" id="fa-content">
      <!-- Tab: Ações -->
      <div class="fa-tab-panel active" id="fa-tab-actions">
        <div class="fa-actions-grid">
          <button class="fa-action-card fa-card-primary" id="fa-btn-fill">
            <span class="fa-card-icon">⚡</span>
            <span class="fa-card-label">Preencher Tudo</span>
            <span class="fa-card-desc">Preenche todos os campos detectados</span>
          </button>
          <button class="fa-action-card fa-card-secondary" id="fa-btn-save">
            <span class="fa-card-icon">💾</span>
            <span class="fa-card-label">Salvar Form</span>
            <span class="fa-card-desc">Salva os valores atuais do formulário</span>
          </button>
          <button class="fa-action-card fa-card-outline" id="fa-btn-watch">
            <span class="fa-card-icon">👁️</span>
            <span class="fa-card-label">Watch</span>
            <span class="fa-card-desc">Observa mudanças no DOM e preenche novos campos</span>
          </button>
          <button class="fa-action-card fa-card-outline" id="fa-btn-clear-badges">
            <span class="fa-card-icon">🧹</span>
            <span class="fa-card-label">Limpar Badges</span>
            <span class="fa-card-desc">Remove badges de detecção da página</span>
          </button>
        </div>
        <div class="fa-status-bar" id="fa-status-bar"></div>
      </div>
      <!-- Tab: Campos -->
      <div class="fa-tab-panel" id="fa-tab-fields">
        <div class="fa-fields-toolbar">
          <button class="fa-fields-btn" id="fa-btn-detect">🔍 Detectar Campos</button>
          <span class="fa-fields-count" id="fa-fields-count"></span>
        </div>
        <div class="fa-fields-table-wrap" id="fa-fields-table-wrap">
          <table class="fa-fields-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Método</th>
                <th>Confiança</th>
                <th>ID / Name</th>
                <th>Label</th>
                <th>Seletor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="fa-fields-tbody"></tbody>
          </table>
        </div>
      </div>
      <!-- Tab: Forms -->
      <div class="fa-tab-panel" id="fa-tab-forms">
        <div class="fa-forms-toolbar">
          <button class="fa-fields-btn" id="fa-btn-load-forms">🔄 Carregar Forms</button>
          <span class="fa-fields-count" id="fa-forms-count"></span>
        </div>
        <div class="fa-forms-list" id="fa-forms-list">
          <div class="fa-log-empty">Nenhum formulário salvo para esta página</div>
        </div>
      </div>
      <!-- Tab: Log -->
      <div class="fa-tab-panel" id="fa-tab-log">
        <div class="fa-log-toolbar">
          <button class="fa-fields-btn" id="fa-btn-clear-log">🗑️ Limpar</button>
        </div>
        <div class="fa-log-wrap" id="fa-log-wrap">
          <div class="fa-log-entries" id="fa-log-entries">
            <div class="fa-log-empty">Nenhuma atividade registrada</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ─── Styles ─── */

function applyPanelStyles(panel: HTMLElement): void {
  const styleId = "fill-all-panel-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = getPanelCSS();
    document.head.appendChild(style);
  }

  Object.assign(panel.style, {
    position: "fixed",
    zIndex: "2147483647",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    fontSize: "13px",
    lineHeight: "1.4",
    color: "#1e293b",
  });
}

function getPanelCSS(): string {
  return `
    #${PANEL_ID} {
      left: 0;
      right: 0;
      bottom: 0;
      height: ${DEFAULT_HEIGHT}px;
      background: #0f172a;
      color: #e2e8f0;
      border-top: 2px solid #4f46e5;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
      user-select: none;
      transition: height 0.15s ease;
    }
    #${PANEL_ID}.fa-minimized {
      height: 38px !important;
    }
    #${PANEL_ID}.fa-minimized .fa-content,
    #${PANEL_ID}.fa-minimized .fa-resize-handle {
      display: none;
    }
    #${PANEL_ID} .fa-btn-fill-minimized {
      display: none;
      width: auto;
      padding: 0 10px;
      background: #4f46e5;
      border-color: #6366f1;
      color: #fff;
      font-weight: 600;
      font-size: 12px;
    }
    #${PANEL_ID} .fa-btn-fill-minimized:hover {
      background: #6366f1;
      color: #fff;
    }
    #${PANEL_ID}.fa-minimized .fa-btn-fill-minimized {
      display: flex;
    }
    #${PANEL_ID}.fa-minimized .fa-tabs {
      display: none;
    }

    /* Resize handle */
    #${PANEL_ID} .fa-resize-handle {
      position: absolute;
      top: -4px;
      left: 0;
      right: 0;
      height: 8px;
      cursor: ns-resize;
      z-index: 10;
    }
    #${PANEL_ID} .fa-resize-handle:hover {
      background: rgba(79,70,229,0.3);
    }

    /* Toolbar */
    #${PANEL_ID} .fa-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      height: 38px;
      min-height: 38px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      gap: 12px;
    }
    #${PANEL_ID} .fa-toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    #${PANEL_ID} .fa-toolbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #${PANEL_ID} .fa-toolbar-title {
      font-size: 13px;
      font-weight: 700;
      color: #a5b4fc;
      white-space: nowrap;
    }

    /* Tabs */
    #${PANEL_ID} .fa-tabs {
      display: flex;
      gap: 2px;
    }
    #${PANEL_ID} .fa-tab {
      padding: 6px 14px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    #${PANEL_ID} .fa-tab:hover {
      color: #e2e8f0;
      background: rgba(255,255,255,0.05);
    }
    #${PANEL_ID} .fa-tab.active {
      color: #a5b4fc;
      border-bottom-color: #6366f1;
      background: rgba(99,102,241,0.1);
    }

    /* Toolbar buttons */
    #${PANEL_ID} .fa-toolbar-btn {
      background: transparent;
      border: 1px solid #334155;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      padding: 0;
      line-height: 1;
      font-family: inherit;
    }
    #${PANEL_ID} .fa-toolbar-btn:hover {
      background: #334155;
      color: #e2e8f0;
    }

    /* Content */
    #${PANEL_ID} .fa-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    #${PANEL_ID} .fa-tab-panel {
      display: none;
      height: 100%;
      overflow: auto;
      padding: 12px 16px;
    }
    #${PANEL_ID} .fa-tab-panel.active {
      display: flex;
      flex-direction: column;
    }

    /* ─── Tab: Ações ─── */
    #${PANEL_ID} .fa-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    #${PANEL_ID} .fa-action-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 10px;
      cursor: pointer;
      border: 1px solid #334155;
      font-family: inherit;
      text-align: left;
      transition: all 0.15s ease;
    }
    #${PANEL_ID} .fa-card-icon {
      font-size: 20px;
      margin-bottom: 6px;
    }
    #${PANEL_ID} .fa-card-label {
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
    }
    #${PANEL_ID} .fa-card-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    #${PANEL_ID} .fa-card-primary {
      background: rgba(79,70,229,0.15);
      border-color: #4f46e5;
    }
    #${PANEL_ID} .fa-card-primary:hover {
      background: rgba(79,70,229,0.3);
    }
    #${PANEL_ID} .fa-card-secondary {
      background: rgba(34,197,94,0.1);
      border-color: #16a34a;
    }
    #${PANEL_ID} .fa-card-secondary:hover {
      background: rgba(34,197,94,0.2);
    }
    #${PANEL_ID} .fa-card-outline {
      background: rgba(255,255,255,0.03);
    }
    #${PANEL_ID} .fa-card-outline:hover {
      background: rgba(255,255,255,0.08);
    }
    #${PANEL_ID} .fa-card-outline.active {
      background: rgba(79,70,229,0.2);
      border-color: #6366f1;
    }
    #${PANEL_ID} .fa-card-outline.active .fa-card-desc {
      color: #a5b4fc;
    }
    #${PANEL_ID} .fa-status-bar {
      margin-top: 12px;
      font-size: 12px;
      color: #64748b;
      min-height: 20px;
      padding: 4px 8px;
    }
    #${PANEL_ID} .fa-status-bar.success { color: #4ade80; }
    #${PANEL_ID} .fa-status-bar.info { color: #a5b4fc; }
    #${PANEL_ID} .fa-status-bar.error { color: #f87171; }

    /* ─── Tab: Campos ─── */
    #${PANEL_ID} .fa-fields-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      flex-shrink: 0;
    }
    #${PANEL_ID} .fa-fields-btn {
      padding: 6px 14px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    #${PANEL_ID} .fa-fields-btn:hover {
      background: #4338ca;
    }
    #${PANEL_ID} .fa-fields-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    #${PANEL_ID} .fa-fields-count {
      font-size: 12px;
      color: #94a3b8;
    }
    #${PANEL_ID} .fa-fields-table-wrap {
      flex: 1;
      overflow: auto;
    }
    #${PANEL_ID} .fa-fields-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    #${PANEL_ID} .fa-fields-table th {
      position: sticky;
      top: 0;
      background: #1e293b;
      color: #94a3b8;
      text-align: left;
      padding: 6px 10px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #334155;
      white-space: nowrap;
    }
    #${PANEL_ID} .fa-fields-table td {
      padding: 5px 10px;
      border-bottom: 1px solid #1e293b;
      color: #cbd5e1;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #${PANEL_ID} .fa-fields-table tr:hover td {
      background: rgba(255,255,255,0.04);
    }
    #${PANEL_ID} .fa-type-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
    }
    #${PANEL_ID} .fa-method-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      background: #334155;
      color: #94a3b8;
    }
    #${PANEL_ID} .fa-confidence-bar {
      display: inline-block;
      width: 50px;
      height: 6px;
      background: #334155;
      border-radius: 3px;
      overflow: hidden;
      vertical-align: middle;
      margin-right: 4px;
    }
    #${PANEL_ID} .fa-confidence-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* ─── Tab: Log ─── */
    #${PANEL_ID} .fa-log-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    #${PANEL_ID} .fa-log-wrap {
      flex: 1;
      overflow: auto;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      font-size: 11px;
    }
    #${PANEL_ID} .fa-log-entries {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    #${PANEL_ID} .fa-log-entry {
      padding: 3px 8px;
      border-radius: 3px;
      display: flex;
      gap: 8px;
    }
    #${PANEL_ID} .fa-log-entry:hover {
      background: rgba(255,255,255,0.04);
    }
    #${PANEL_ID} .fa-log-time {
      color: #475569;
      flex-shrink: 0;
    }
    #${PANEL_ID} .fa-log-text {
      color: #cbd5e1;
    }
    #${PANEL_ID} .fa-log-entry.success .fa-log-text { color: #4ade80; }
    #${PANEL_ID} .fa-log-entry.info .fa-log-text { color: #a5b4fc; }
    #${PANEL_ID} .fa-log-entry.error .fa-log-text { color: #f87171; }
    #${PANEL_ID} .fa-log-entry.warn .fa-log-text { color: #fbbf24; }
    /* Field action buttons */
    #${PANEL_ID} .fa-field-actions {
      display: flex;
      gap: 3px;
      white-space: nowrap;
    }
    #${PANEL_ID} .fa-field-action-btn {
      padding: 2px 6px;
      border: 1px solid #334155;
      background: rgba(255,255,255,0.05);
      color: #94a3b8;
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.12s ease;
      white-space: nowrap;
    }
    #${PANEL_ID} .fa-field-action-btn:hover {
      background: #4f46e5;
      border-color: #6366f1;
      color: #fff;
    }
    #${PANEL_ID} .fa-field-action-btn.fa-eye-btn {
      font-size: 12px;
      min-width: 22px;
      text-align: center;
    }
    #${PANEL_ID} .fa-field-action-btn.fa-eye-btn.ignored {
      background: rgba(239,68,68,0.15);
      border-color: #ef4444;
      color: #f87171;
    }

    /* ─── Tab: Forms ─── */
    #${PANEL_ID} .fa-forms-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      flex-shrink: 0;
    }
    #${PANEL_ID} .fa-forms-list {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #${PANEL_ID} .fa-form-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid #334155;
      border-radius: 8px;
      transition: all 0.12s ease;
    }
    #${PANEL_ID} .fa-form-card:hover {
      border-color: #475569;
      background: rgba(255,255,255,0.07);
    }
    #${PANEL_ID} .fa-form-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    #${PANEL_ID} .fa-form-name {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #${PANEL_ID} .fa-form-meta {
      font-size: 11px;
      color: #64748b;
    }
    #${PANEL_ID} .fa-form-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
      margin-left: 12px;
    }
    #${PANEL_ID} .fa-form-actions button {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      border: 1px solid #334155;
      transition: all 0.12s ease;
    }
    #${PANEL_ID} .fa-form-load-btn {
      background: rgba(79,70,229,0.15);
      border-color: #4f46e5 !important;
      color: #a5b4fc;
    }
    #${PANEL_ID} .fa-form-load-btn:hover {
      background: #4f46e5;
      color: #fff;
    }
    #${PANEL_ID} .fa-form-delete-btn {
      background: rgba(239,68,68,0.1);
      border-color: #dc2626 !important;
      color: #f87171;
    }
    #${PANEL_ID} .fa-form-delete-btn:hover {
      background: #dc2626;
      color: #fff;
    }

    #${PANEL_ID} .fa-log-empty {
      color: #475569;
      padding: 16px;
      text-align: center;
      font-style: italic;
    }
  `;
}

/* ─── Tab Switching ─── */

function setupTabHandlers(panel: HTMLElement): void {
  const tabs = panel.querySelectorAll<HTMLButtonElement>(".fa-tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab as TabId;
      if (!tabId) return;

      activeTab = tabId;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      panel
        .querySelectorAll<HTMLElement>(".fa-tab-panel")
        .forEach((p) => p.classList.remove("active"));

      const targetPanel = panel.querySelector<HTMLElement>(`#fa-tab-${tabId}`);
      targetPanel?.classList.add("active");

      savePanelState();
    });
  });

  // Minimize
  panel.querySelector("#fa-btn-minimize")?.addEventListener("click", () => {
    const isMinimized = panel.classList.toggle("fa-minimized");
    const btn = panel.querySelector("#fa-btn-minimize") as HTMLButtonElement;
    btn.textContent = isMinimized ? "▲" : "▼";
    applyBodyOffset(isMinimized ? MINIMIZED_HEIGHT : panelHeight);
    savePanelState();
  });

  // Fill All (minimized quick button)
  panel
    .querySelector("#fa-btn-fill-minimized")
    ?.addEventListener("click", async () => {
      const btn = panel.querySelector(
        "#fa-btn-fill-minimized",
      ) as HTMLButtonElement;
      btn.textContent = "⏳...";
      btn.style.pointerEvents = "none";
      try {
        const results = await fillAllFields();
        addLog(`${results.length} campos preenchidos com sucesso`, "success");
      } catch {
        addLog("Erro ao preencher campos", "error");
      } finally {
        btn.textContent = "⚡";
        btn.style.pointerEvents = "";
      }
    });

  // Close
  panel.querySelector("#fa-btn-close")?.addEventListener("click", () => {
    removeFloatingPanel();
  });
}

function renderActiveTab(panel: HTMLElement): void {
  const tabs = panel.querySelectorAll<HTMLButtonElement>(".fa-tab");
  tabs.forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === activeTab);
  });

  panel
    .querySelectorAll<HTMLElement>(".fa-tab-panel")
    .forEach((p) => p.classList.remove("active"));

  panel
    .querySelector<HTMLElement>(`#fa-tab-${activeTab}`)
    ?.classList.add("active");
}

/* ─── Resize ─── */

function setupResizeHandle(panel: HTMLElement): void {
  const handle = panel.querySelector("#fa-resize-handle") as HTMLElement;
  if (!handle) return;

  let isResizing = false;
  let startY = 0;
  let startHeight = 0;

  handle.addEventListener("mousedown", (e: MouseEvent) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = panel.offsetHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isResizing) return;
    const delta = startY - e.clientY;
    const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
    const newHeight = Math.max(
      MIN_HEIGHT,
      Math.min(startHeight + delta, maxHeight),
    );
    panelHeight = newHeight;
    panel.style.height = `${newHeight}px`;
    applyBodyOffset(newHeight);
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      savePanelState();
    }
  });
}

/* ─── Action Handlers ─── */

function setupActionHandlers(panel: HTMLElement): void {
  // Fill All
  panel.querySelector("#fa-btn-fill")?.addEventListener("click", async () => {
    const card = panel.querySelector("#fa-btn-fill") as HTMLButtonElement;
    const label = card.querySelector(".fa-card-label") as HTMLElement;
    label.textContent = "Preenchendo...";
    card.style.opacity = "0.6";
    card.style.pointerEvents = "none";

    try {
      const results = await fillAllFields();
      setStatus(panel, `✓ ${results.length} campos preenchidos`, "success");
      addLog(`${results.length} campos preenchidos com sucesso`, "success");
      label.textContent = "Preencher Tudo";
    } catch {
      setStatus(panel, "Erro ao preencher", "error");
      addLog("Erro ao preencher campos", "error");
      label.textContent = "Preencher Tudo";
    }

    card.style.opacity = "";
    card.style.pointerEvents = "";
  });

  // Save Form
  panel.querySelector("#fa-btn-save")?.addEventListener("click", async () => {
    const values = captureFormValues();
    const fieldCount = Object.keys(values).length;
    const formData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: `Form - ${new URL(window.location.href).hostname} - ${new Date().toLocaleDateString("pt-BR")}`,
      urlPattern: `${window.location.origin}${window.location.pathname}*`,
      fields: values,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveForm(formData);
    setStatus(panel, `💾 Salvo (${fieldCount} campos)`, "success");
    addLog(`Formulário salvo com ${fieldCount} campos`, "success");
  });

  // Watch toggle
  panel.querySelector("#fa-btn-watch")?.addEventListener("click", () => {
    const card = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
    if (isWatcherActive()) {
      stopWatching();
      card.classList.remove("active");
      card.querySelector<HTMLElement>(".fa-card-label")!.textContent = "Watch";
      card.querySelector<HTMLElement>(".fa-card-desc")!.textContent =
        "Observa mudanças no DOM e preenche novos campos";
      setStatus(panel, "Watch desativado", "info");
      addLog("Watch desativado", "info");
    } else {
      startWatcherWithUI(panel);
    }
  });

  // Clear badges
  panel.querySelector("#fa-btn-clear-badges")?.addEventListener("click", () => {
    clearAllBadges();
    setStatus(panel, "Badges removidos", "info");
    addLog("Badges de detecção removidos", "info");
  });
}

/* ─── Field Detection Handlers ─── */

function setupFieldHandlers(panel: HTMLElement): void {
  panel.querySelector("#fa-btn-detect")?.addEventListener("click", async () => {
    const btn = panel.querySelector("#fa-btn-detect") as HTMLButtonElement;
    const tbody = panel.querySelector("#fa-fields-tbody") as HTMLElement;
    const countEl = panel.querySelector("#fa-fields-count") as HTMLElement;

    btn.textContent = "⏳ Detectando...";
    btn.disabled = true;
    tbody.innerHTML = "";
    clearAllBadges();

    let count = 0;
    for await (const field of streamAllFields()) {
      count++;
      countEl.textContent = `${count} campo(s)`;
      showDetectionBadge(field.element, field.fieldType, field.detectionMethod);
      appendFieldRow(tbody, count, field);
      console.log(`[Fill All] Campo detectado:`, field);
    }

    btn.textContent = "🔍 Detectar Campos";
    btn.disabled = false;
    countEl.textContent = `${count} campo(s) detectado(s)`;
    addLog(`${count} campo(s) detectado(s) na página`, "success");
  });

  // Clear log
  panel.querySelector("#fa-btn-clear-log")?.addEventListener("click", () => {
    logEntries = [];
    const logEl = panel.querySelector("#fa-log-entries") as HTMLElement;
    logEl.innerHTML = `<div class="fa-log-empty">Nenhuma atividade registrada</div>`;
  });
}

interface DetectedField {
  fieldType: string;
  detectionMethod?: string;
  detectionConfidence?: number;
  id?: string;
  name?: string;
  label?: string;
  selector: string;
  element: Element;
}

// TYPE_COLORS and METHOD_COLORS are now imported from @/lib/ui

// escapeHtml is now imported from @/lib/ui

function createFieldActionBtn(
  icon: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "fa-field-action-btn";
  btn.title = label;
  btn.textContent = icon;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function appendFieldRow(
  tbody: HTMLElement,
  index: number,
  field: DetectedField,
): void {
  const method = field.detectionMethod ?? "unknown";

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${index}</td>
    <td>${renderTypeBadge(field.fieldType, "fa-")}</td>
    <td>${renderMethodBadge(method, "fa-")}</td>
    <td>${renderConfidenceBadge(field.detectionConfidence, "fa-")}</td>
    <td title="${escapeHtml(field.id ?? "")} / ${escapeHtml(field.name ?? "")}">${escapeHtml(field.id || field.name || "—")}</td>
    <td>${escapeHtml(field.label ?? "—")}</td>
    <td title="${escapeHtml(field.selector)}" style="font-size:10px;font-family:monospace">${escapeHtml(field.selector.length > 40 ? field.selector.slice(0, 40) + "…" : field.selector)}</td>
    <td class="fa-field-actions"></td>
  `;

  const actionsCell = tr.querySelector(".fa-field-actions") as HTMLElement;

  // Eye toggle (ignored/active)
  const isIgnored = ignoredFieldsMap.has(field.selector);
  const eyeBtn = createFieldActionBtn(
    isIgnored ? "🚫" : "👁️",
    isIgnored
      ? "Campo ignorado — clique para ativar"
      : "Campo ativo — clique para ignorar",
    async () => {
      const currentlyIgnored = ignoredFieldsMap.has(field.selector);

      if (currentlyIgnored) {
        // Remove from ignored
        const existing = ignoredFieldsMap.get(field.selector);
        if (existing) {
          await removeIgnoredField(existing.id);
          ignoredFieldsMap.delete(field.selector);
        }
        eyeBtn.textContent = "👁️";
        eyeBtn.title = "Campo ativo — clique para ignorar";
        eyeBtn.classList.remove("ignored");
        tr.style.opacity = "";
        addLog(
          `Campo "${field.label || field.id || field.selector}" reativado`,
          "info",
        );
      } else {
        // Add to ignored
        const urlPattern = `${window.location.origin}${window.location.pathname}*`;
        const result = await addIgnoredField({
          urlPattern,
          selector: field.selector,
          label: field.label || field.id || field.name || field.selector,
        });
        if (result) {
          ignoredFieldsMap.set(field.selector, result);
        }
        eyeBtn.textContent = "🚫";
        eyeBtn.title = "Campo ignorado — clique para ativar";
        eyeBtn.classList.add("ignored");
        tr.style.opacity = "0.5";
        addLog(
          `Campo "${field.label || field.id || field.selector}" ignorado`,
          "warn",
        );
      }
    },
  );
  eyeBtn.classList.add("fa-eye-btn");
  if (isIgnored) {
    eyeBtn.classList.add("ignored");
    tr.style.opacity = "0.5";
  }
  actionsCell.appendChild(eyeBtn);

  // Fill button
  actionsCell.appendChild(
    createFieldActionBtn("⚡", "Preencher", async () => {
      // Respect ignored state
      if (ignoredFieldsMap.has(field.selector)) {
        addLog(
          `Campo "${field.label || field.id || field.selector}" está ignorado — não preenchido`,
          "warn",
        );
        return;
      }

      const formField = {
        ...field,
        element: field.element as
          | HTMLInputElement
          | HTMLSelectElement
          | HTMLTextAreaElement,
        selector: field.selector,
        required: false,
        category: "unknown" as FieldCategory,
        fieldType: field.fieldType as FieldType,
        detectionMethod: field.detectionMethod as DetectionMethod | undefined,
      };
      const result = await fillSingleField(formField);
      if (result) {
        addLog(
          `Campo "${field.label || field.id || field.selector}" preenchido`,
          "success",
        );
      } else {
        addLog(
          `Falha ao preencher "${field.label || field.id || field.selector}"`,
          "error",
        );
      }
    }),
  );

  actionsCell.appendChild(
    createFieldActionBtn("📝", "Adicionar Regra", () => {
      const urlPattern = `${window.location.origin}${window.location.pathname}*`;
      const payload = {
        id: crypto.randomUUID(),
        urlPattern,
        fieldSelector: field.selector,
        fieldName: field.name || field.id || "",
        fieldType: field.fieldType,
        generator: "auto",
        priority: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      chrome.runtime.sendMessage({ type: "SAVE_RULE", payload }, (response) => {
        if (response?.success) {
          addLog(
            `Regra criada para "${field.label || field.id || field.selector}"`,
            "success",
          );
        } else {
          addLog(
            `Falha ao criar regra para "${field.label || field.id || field.selector}"`,
            "error",
          );
        }
      });
    }),
  );

  actionsCell.appendChild(
    createFieldActionBtn("🔍", "Inspecionar", () => {
      field.element.scrollIntoView({ behavior: "smooth", block: "center" });
      const el = field.element as HTMLElement;
      el.style.outline = "2px solid #6366f1";
      el.style.outlineOffset = "2px";
      setTimeout(() => {
        el.style.outline = "";
        el.style.outlineOffset = "";
      }, 2000);
    }),
  );

  tbody.appendChild(tr);
}

/* ─── Forms Tab Handlers ─── */

function setupFormsHandlers(panel: HTMLElement): void {
  panel.querySelector("#fa-btn-load-forms")?.addEventListener("click", () => {
    renderFormsList(panel);
  });

  // Auto-load on first tab switch
  const formsTab = panel.querySelector('[data-tab="forms"]');
  formsTab?.addEventListener("click", () => {
    renderFormsList(panel);
  });
}

async function renderFormsList(panel: HTMLElement): Promise<void> {
  const listEl = panel.querySelector("#fa-forms-list") as HTMLElement;
  const countEl = panel.querySelector("#fa-forms-count") as HTMLElement;

  if (!listEl) return;

  listEl.innerHTML = `<div class="fa-log-empty">Carregando...</div>`;

  const url = window.location.href;
  const forms = await getSavedFormsForUrl(url);

  if (forms.length === 0) {
    listEl.innerHTML = `<div class="fa-log-empty">Nenhum formulário salvo para esta página</div>`;
    if (countEl) countEl.textContent = "";
    return;
  }

  if (countEl) countEl.textContent = `${forms.length} formulário(s)`;
  listEl.innerHTML = "";

  for (const form of forms) {
    listEl.appendChild(createFormCard(panel, form));
  }
}

function createFormCard(panel: HTMLElement, form: SavedForm): HTMLElement {
  const fieldCount = Object.keys(form.fields).length;
  const date = new Date(form.updatedAt).toLocaleString("pt-BR");

  const card = document.createElement("div");
  card.className = "fa-form-card";
  card.innerHTML = `
    <div class="fa-form-info">
      <div class="fa-form-name">${escapeHtml(form.name)}</div>
      <div class="fa-form-meta">${fieldCount} campos · ${escapeHtml(date)} · ${escapeHtml(form.urlPattern)}</div>
    </div>
    <div class="fa-form-actions"></div>
  `;

  const actionsEl = card.querySelector(".fa-form-actions") as HTMLElement;

  // Load button
  const loadBtn = document.createElement("button");
  loadBtn.className = "fa-form-load-btn";
  loadBtn.textContent = "📥 Carregar";
  loadBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "LOAD_SAVED_FORM",
      payload: { formId: form.id },
    });
    setStatus(panel, `📥 Formulário "${form.name}" carregado`, "success");
    addLog(`Formulário "${form.name}" carregado`, "success");
  });
  actionsEl.appendChild(loadBtn);

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "fa-form-delete-btn";
  deleteBtn.textContent = "🗑️ Excluir";
  deleteBtn.addEventListener("click", async () => {
    await deleteForm(form.id);
    card.remove();
    addLog(`Formulário "${form.name}" excluído`, "info");

    // Refresh count
    const listEl = panel.querySelector("#fa-forms-list") as HTMLElement;
    const remaining = listEl.querySelectorAll(".fa-form-card").length;
    const countEl = panel.querySelector("#fa-forms-count") as HTMLElement;
    if (remaining === 0) {
      listEl.innerHTML = `<div class="fa-log-empty">Nenhum formulário salvo para esta página</div>`;
      if (countEl) countEl.textContent = "";
    } else {
      if (countEl) countEl.textContent = `${remaining} formulário(s)`;
    }
  });
  actionsEl.appendChild(deleteBtn);

  return card;
}

/* ─── Log ─── */

function addLog(text: string, type: string): void {
  const time = new Date().toLocaleTimeString("pt-BR");
  logEntries.push({ time, text, type });

  if (!panelElement) return;
  const logEl = panelElement.querySelector("#fa-log-entries") as HTMLElement;
  if (!logEl) return;

  const emptyEl = logEl.querySelector(".fa-log-empty");
  if (emptyEl) emptyEl.remove();

  const entry = document.createElement("div");
  entry.className = `fa-log-entry ${type}`;
  entry.innerHTML = `<span class="fa-log-time">${time}</span><span class="fa-log-text">${escapeHtml(text)}</span>`;
  logEl.appendChild(entry);

  const wrap = panelElement.querySelector("#fa-log-wrap") as HTMLElement;
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
}

/* ─── Watcher UI ─── */

function startWatcherWithUI(panel: HTMLElement): void {
  startWatching((newFieldsCount) => {
    if (newFieldsCount > 0 && panelElement) {
      setStatus(
        panelElement,
        `🔄 ${newFieldsCount} campo(s) novo(s) — re-preenchendo...`,
        "info",
      );
      addLog(
        `${newFieldsCount} campo(s) novo(s) detectado(s) via Watch`,
        "info",
      );
    }
  }, true);

  const card = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
  if (card) {
    card.classList.add("active");
    const label = card.querySelector<HTMLElement>(".fa-card-label");
    const desc = card.querySelector<HTMLElement>(".fa-card-desc");
    if (label) label.textContent = "Watch (Ativo)";
    if (desc) desc.textContent = "Clique para desativar";
  }

  setStatus(panel, "Watch ativado — observando mudanças no DOM", "info");
  addLog("Watch ativado", "info");
}

function updateWatcherStatus(panel: HTMLElement): void {
  const card = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
  if (card && isWatcherActive()) {
    card.classList.add("active");
    const label = card.querySelector<HTMLElement>(".fa-card-label");
    const desc = card.querySelector<HTMLElement>(".fa-card-desc");
    if (label) label.textContent = "Watch (Ativo)";
    if (desc) desc.textContent = "Clique para desativar";
  }
}

/* ─── Status ─── */

function setStatus(panel: HTMLElement, text: string, className: string): void {
  const status = panel.querySelector("#fa-status-bar") as HTMLElement;
  if (status) {
    status.textContent = text;
    status.className = `fa-status-bar ${className}`;

    if (!text.includes("Watch")) {
      setTimeout(() => {
        if (status.textContent === text) {
          status.textContent = "";
          status.className = "fa-status-bar";
        }
      }, 4000);
    }
  }
}

/* ─── State Persistence ─── */

function savePanelState(): void {
  const panel = panelElement;
  if (!panel) return;

  const state: PanelState = {
    activeTab,
    height: panelHeight,
    minimized: panel.classList.contains("fa-minimized"),
  };

  try {
    chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch {
    // Silently fail if storage is not available
  }
}

function restoreState(panel: HTMLElement): void {
  try {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const state = result[STORAGE_KEY] as PanelState | undefined;
      if (state) {
        activeTab = state.activeTab;
        panelHeight = state.height || DEFAULT_HEIGHT;
        panel.style.height = `${panelHeight}px`;

        if (state.minimized) {
          panel.classList.add("fa-minimized");
          const btn = panel.querySelector(
            "#fa-btn-minimize",
          ) as HTMLButtonElement;
          if (btn) btn.textContent = "▲";
        }

        applyBodyOffset(state.minimized ? MINIMIZED_HEIGHT : panelHeight);
        renderActiveTab(panel);
      }
    });
  } catch {
    // Silently fail
  }
}
