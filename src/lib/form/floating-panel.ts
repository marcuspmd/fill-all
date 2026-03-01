/**
 * Floating Panel — Painel flutuante fixado na parte inferior da página.
 * Oferece acesso rápido aos controles do Fill All sem abrir o popup.
 */

import {
  fillAllFields,
  fillSingleField,
  captureFormValues,
  applyTemplate,
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
import { FIELD_TYPES } from "@/types";
import type {
  SavedForm,
  IgnoredField,
  FieldType,
  FieldCategory,
  DetectionMethod,
  FormTemplateField,
  FormFieldMode,
} from "@/types";
import { showDetectionBadge, clearAllBadges } from "./field-overlay";
import {
  escapeHtml,
  renderTypeBadge,
  renderMethodBadge,
  renderConfidenceBadge,
} from "@/lib/ui";
import { t } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";
import {
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getRecordingSession,
  getRecordingStatus,
  generateE2EFromRecording,
  getCapturedResponses,
  E2E_GENERATORS,
  setOnStepAdded,
  setOnStepUpdated,
  removeStep,
  updateStep,
  clearSession,
} from "@/lib/e2e-export";
import type {
  E2EFramework,
  RecordedStep,
  RecordingGenerateOptions,
} from "@/lib/e2e-export";
import {
  createLogViewer,
  getLogViewerStyles,
  type LogViewer,
} from "@/lib/logger/log-viewer";

const log = createLogger("FloatingPanel");

const STEP_ICONS: Record<string, string> = {
  fill: "✏️",
  click: "🖱️",
  select: "📋",
  check: "☑️",
  submit: "🚀",
  navigate: "🔗",
  wait: "⏳",
  "network-wait": "🌐",
  scroll: "📜",
  hover: "👆",
  keypress: "⌨️",
};

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
let logViewerInstance: LogViewer | null = null;

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
  setupLogViewer(panel);
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
    if (logViewerInstance) {
      logViewerInstance.dispose();
      logViewerInstance = null;
    }
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
          <button class="fa-tab active" data-tab="actions">⚡ ${t("tabActions")}</button>
          <button class="fa-tab" data-tab="fields">🔍 ${t("tabFields")}</button>
          <button class="fa-tab" data-tab="forms">📄 ${t("tabForms")}</button>
          <button class="fa-tab" data-tab="log">📋 ${t("tabLog")}</button>
        </div>
      </div>
      <div class="fa-toolbar-right">
        <button class="fa-toolbar-btn fa-btn-fill-minimized" id="fa-btn-fill-minimized" title="${t("fillAll")}">⚡</button>
        <button class="fa-toolbar-btn" id="fa-btn-options" title="${t("fpOpenOptions")}">⚙️</button>
        <button class="fa-toolbar-btn" id="fa-btn-minimize" data-action="minimize" title="${t("fpMinimize")}">▼</button>
        <button class="fa-toolbar-btn" id="fa-btn-close" data-action="close" title="${t("fpClose")}">✕</button>
      </div>
    </div>
    <div class="fa-content" id="fa-content">
      <!-- Tab: Ações -->
      <div class="fa-tab-panel active" id="fa-tab-actions" data-panel="actions">
        <div class="fa-actions-grid">
          <button class="fa-action-card fa-card-primary" id="fa-btn-fill">
            <span class="fa-card-icon">⚡</span>
            <span class="fa-card-label">${t("fillAll")}</span>
            <span class="fa-card-desc">${t("fillAllDesc")}</span>
          </button>
          <button class="fa-action-card fa-card-secondary" id="fa-btn-fill-empty">
            <span class="fa-card-icon">🟦</span>
            <span class="fa-card-label">${t("fillOnlyEmpty")}</span>
            <span class="fa-card-desc">${t("fillOnlyEmptyDesc")}</span>
          </button>
          <button class="fa-action-card fa-card-secondary" id="fa-btn-save">
            <span class="fa-card-icon">💾</span>
            <span class="fa-card-label">${t("saveForm")}</span>
            <span class="fa-card-desc">${t("saveFormDesc")}</span>
          </button>
          <button class="fa-action-card fa-card-outline" id="fa-btn-watch">
            <span class="fa-card-icon">👁️</span>
            <span class="fa-card-label">${t("watch")}</span>
            <span class="fa-card-desc">${t("watchDesc")}</span>
          </button>
          <button class="fa-action-card fa-card-outline" id="fa-btn-clear-badges">
            <span class="fa-card-icon">🧹</span>
            <span class="fa-card-label">${t("fpClearBadgesLabel")}</span>
            <span class="fa-card-desc">${t("fpClearBadgesDesc")}</span>
          </button>
          <button class="fa-action-card fa-card-outline" id="fa-btn-record">
            <span class="fa-card-icon">🔴</span>
            <span class="fa-card-label">${t("fpRecordLabel")}</span>
            <span class="fa-card-desc">${t("fpRecordDesc")}</span>
          </button>
          <div id="fa-live-steps" class="fa-live-steps" style="display:none">
            <div class="fa-live-steps-header">
              <span class="fa-live-steps-title">📹 <span id="fa-live-steps-count">0</span> ${t("fpSteps")}</span>
              <div class="fa-live-steps-actions">
                <button class="fa-btn fa-btn-sm" id="fa-live-pause" title="${t("fpPauseRecording")}">⏸</button>
                <button class="fa-btn fa-btn-sm fa-btn-primary" id="fa-live-export" title="${t("fpExport")}" style="display:none">📤</button>
                <button class="fa-btn fa-btn-sm fa-btn-danger" id="fa-live-clear" title="${t("fpClear")}" style="display:none">🗑️</button>
              </div>
            </div>
            <div class="fa-live-steps-list" id="fa-live-steps-list"></div>
          </div>
        </div>
        <div class="fa-status-bar" id="fa-status-bar"></div>
      </div>
      <!-- Tab: Campos -->
      <div class="fa-tab-panel" id="fa-tab-fields" data-panel="fields">
        <div class="fa-fields-toolbar">
          <button class="fa-fields-btn" id="fa-btn-detect">🔍 ${t("detectFields")}</button>
          <span class="fa-fields-count" id="fa-fields-count"></span>
        </div>
        <div class="fa-fields-table-wrap" id="fa-fields-table-wrap">
          <table class="fa-fields-table">
            <thead>
              <tr>
                <th>#</th>
                <th>${t("columnType")}</th>
                <th>${t("columnMethod")}</th>
                <th>${t("columnConf")}</th>
                <th>${t("columnIdName")}</th>
                <th>${t("columnLabel")}</th>
                <th>${t("columnSelector")}</th>
                <th>${t("columnActions")}</th>
              </tr>
            </thead>
            <tbody id="fa-fields-tbody"></tbody>
          </table>
        </div>
      </div>
      <!-- Tab: Forms -->
      <div class="fa-tab-panel" id="fa-tab-forms" data-panel="forms">
        <div class="fa-forms-toolbar">
          <button class="fa-fields-btn" id="fa-btn-load-forms">🔄 ${t("btnLoadForms")}</button>
          <span class="fa-fields-count" id="fa-forms-count"></span>
        </div>
        <div class="fa-forms-list" id="fa-forms-list">
          <div class="fa-log-empty">${t("noFormsForPage")}</div>
        </div>
      </div>
      <!-- Tab: Log -->
      <div class="fa-tab-panel" id="fa-tab-log" data-panel="log">
        <div class="fa-log-viewer-container" id="fa-log-viewer-container" style="display:flex;flex-direction:column;height:100%;"></div>
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
    style.textContent = getPanelCSS() + "\n" + getLogViewerStyles("panel");
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
    #${PANEL_ID} .fa-form-edit-btn {
      background: rgba(245,158,11,0.15);
      border-color: #d97706 !important;
      color: #fbbf24;
    }
    #${PANEL_ID} .fa-form-edit-btn:hover {
      background: #d97706;
      color: #fff;
    }
    #${PANEL_ID} .fa-form-edit-drawer {
      background: rgba(30,41,59,0.98);
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #${PANEL_ID} .fa-edit-meta-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    #${PANEL_ID} .fa-edit-input-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    #${PANEL_ID} .fa-edit-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    #${PANEL_ID} .fa-edit-input {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 5px;
      color: #e2e8f0;
      font-size: 12px;
      padding: 4px 8px;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    #${PANEL_ID} .fa-edit-input:focus {
      outline: none;
      border-color: #4f46e5;
    }
    #${PANEL_ID} .fa-edit-fields-header {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    #${PANEL_ID} .fa-edit-field-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 6px;
      align-items: start;
      padding: 6px 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid #1e293b;
      border-radius: 5px;
    }
    #${PANEL_ID} .fa-edit-field-key {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      grid-column: 1 / -1;
    }
    #${PANEL_ID} .fa-edit-field-controls {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 6px;
      align-items: center;
      grid-column: 1 / -1;
    }
    #${PANEL_ID} .fa-edit-select {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 5px;
      color: #e2e8f0;
      font-size: 11px;
      padding: 3px 6px;
      font-family: inherit;
      cursor: pointer;
    }
    #${PANEL_ID} .fa-edit-field-value {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 5px;
      color: #e2e8f0;
      font-size: 11px;
      padding: 3px 6px;
      font-family: inherit;
      min-width: 0;
    }
    #${PANEL_ID} .fa-edit-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 4px;
    }
    #${PANEL_ID} .fa-edit-save-btn {
      background: rgba(34,197,94,0.15);
      border: 1px solid #16a34a !important;
      color: #4ade80;
      padding: 5px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    #${PANEL_ID} .fa-edit-save-btn:hover {
      background: #16a34a;
      color: #fff;
    }
    #${PANEL_ID} .fa-edit-cancel-btn {
      background: rgba(100,116,139,0.15);
      border: 1px solid #475569 !important;
      color: #94a3b8;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    #${PANEL_ID} .fa-edit-cancel-btn:hover {
      background: #475569;
      color: #fff;
    }

    #${PANEL_ID} .fa-log-empty {
      color: #475569;
      padding: 16px;
      text-align: center;
      font-style: italic;
    }

    /* ─── Record Mode ─── */
    #${PANEL_ID} .fa-card-outline.active .fa-card-icon {
      animation: fa-pulse 1.2s ease-in-out infinite;
    }
    @keyframes fa-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    #${PANEL_ID} #fa-record-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15,23,42,0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: 12px;
    }
    #${PANEL_ID} .fa-record-dialog {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 20px;
      width: 320px;
      max-width: 90%;
    }
    #${PANEL_ID} .fa-record-dialog h3 {
      margin: 0 0 12px;
      font-size: 15px;
      color: #e2e8f0;
    }
    #${PANEL_ID} .fa-record-dialog p {
      margin: 0 0 14px;
      font-size: 13px;
      color: #94a3b8;
    }
    #${PANEL_ID} .fa-record-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }
    #${PANEL_ID} .fa-record-form label {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
    }
    #${PANEL_ID} .fa-record-form input,
    #${PANEL_ID} .fa-record-form select {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 13px;
      color: #e2e8f0;
      font-family: inherit;
    }
    #${PANEL_ID} .fa-record-form input:focus,
    #${PANEL_ID} .fa-record-form select:focus {
      outline: none;
      border-color: #6366f1;
    }
    #${PANEL_ID} .fa-record-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    #${PANEL_ID} .fa-btn {
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #334155;
      background: rgba(255,255,255,0.05);
      color: #cbd5e1;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    #${PANEL_ID} .fa-btn:hover {
      background: rgba(255,255,255,0.1);
    }
    #${PANEL_ID} .fa-btn-primary {
      background: #4f46e5;
      border-color: #4f46e5;
      color: #fff;
    }
    #${PANEL_ID} .fa-btn-primary:hover {
      background: #4338ca;
    }
    #${PANEL_ID} .fa-btn-secondary {
      background: rgba(251,191,36,0.15);
      border-color: #f59e0b;
      color: #fbbf24;
    }
    #${PANEL_ID} .fa-btn-secondary:hover {
      background: rgba(251,191,36,0.25);
    }
    #${PANEL_ID} .fa-btn-danger {
      background: rgba(239,68,68,0.15);
      border-color: #ef4444;
      color: #f87171;
    }
    #${PANEL_ID} .fa-btn-danger:hover {
      background: rgba(239,68,68,0.25);
    }
    #${PANEL_ID} .fa-record-dialog-wide {
      width: 520px;
      max-width: 95%;
      max-height: 80vh;
      overflow-y: auto;
    }
    #${PANEL_ID} .fa-record-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      border-bottom: 1px solid #334155;
      padding-bottom: 8px;
    }
    #${PANEL_ID} .fa-record-tabs .fa-tab {
      padding: 5px 12px;
      border-radius: 6px 6px 0 0;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: #94a3b8;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    #${PANEL_ID} .fa-record-tabs .fa-tab.active {
      background: #1e293b;
      border-color: #334155;
      border-bottom-color: #1e293b;
      color: #e2e8f0;
    }
    #${PANEL_ID} .fa-record-tabs .fa-tab:hover:not(.active) {
      color: #cbd5e1;
      background: rgba(255,255,255,0.05);
    }
    #${PANEL_ID} .fa-tab-content {
      display: none;
    }
    #${PANEL_ID} .fa-tab-content.active {
      display: block;
    }
    #${PANEL_ID} .fa-preview-table-wrap {
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 12px;
      border: 1px solid #334155;
      border-radius: 6px;
    }
    #${PANEL_ID} .fa-preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    #${PANEL_ID} .fa-preview-table th {
      background: #0f172a;
      color: #94a3b8;
      font-weight: 600;
      padding: 6px 8px;
      text-align: left;
      position: sticky;
      top: 0;
    }
    #${PANEL_ID} .fa-preview-table td {
      padding: 5px 8px;
      border-top: 1px solid #1e293b;
      color: #cbd5e1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }
    #${PANEL_ID} .fa-preview-table code {
      font-size: 11px;
      color: #a5b4fc;
      background: rgba(99,102,241,0.1);
      padding: 1px 4px;
      border-radius: 3px;
    }
    #${PANEL_ID} .fa-preview-table tbody tr:hover {
      background: rgba(255,255,255,0.03);
    }
    #${PANEL_ID} .fa-checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #94a3b8;
      cursor: pointer;
      margin-top: 4px;
    }
    #${PANEL_ID} .fa-checkbox-label input[type="checkbox"] {
      accent-color: #6366f1;
      width: 14px;
      height: 14px;
    }

    /* ─── Live Steps List ─── */
    #${PANEL_ID} .fa-live-steps {
      margin-top: 10px;
      border: 1px solid #334155;
      border-radius: 8px;
      background: #1e293b;
      overflow: hidden;
    }
    #${PANEL_ID} .fa-live-steps-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }
    #${PANEL_ID} .fa-live-steps-title {
      font-size: 12px;
      font-weight: 600;
      color: #a5b4fc;
    }
    #${PANEL_ID} .fa-live-steps-actions {
      display: flex;
      gap: 4px;
    }
    #${PANEL_ID} .fa-btn-sm {
      padding: 3px 8px;
      font-size: 11px;
      border-radius: 4px;
      min-width: 28px;
    }
    #${PANEL_ID} .fa-live-steps-list {
      max-height: 180px;
      overflow-y: auto;
    }
    #${PANEL_ID} .fa-live-step-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-bottom: 1px solid #1e293b;
      font-size: 11px;
      transition: background 0.1s;
    }
    #${PANEL_ID} .fa-live-step-row:hover {
      background: rgba(255,255,255,0.03);
    }
    #${PANEL_ID} .fa-live-step-num {
      color: #64748b;
      font-weight: 700;
      min-width: 18px;
      text-align: right;
    }
    #${PANEL_ID} .fa-live-step-icon {
      font-size: 13px;
    }
    #${PANEL_ID} .fa-live-step-type {
      color: #94a3b8;
      font-weight: 600;
      min-width: 48px;
    }
    #${PANEL_ID} .fa-live-step-desc {
      color: #cbd5e1;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    #${PANEL_ID} .fa-live-step-value,
    #${PANEL_ID} .fa-live-step-timeout {
      flex-shrink: 0;
    }
    #${PANEL_ID} .fa-live-edit-value,
    #${PANEL_ID} .fa-live-edit-timeout {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      color: #e2e8f0;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    #${PANEL_ID} .fa-live-edit-value {
      width: 80px;
    }
    #${PANEL_ID} .fa-live-edit-timeout {
      width: 50px;
    }
    #${PANEL_ID} .fa-live-edit-value:focus,
    #${PANEL_ID} .fa-live-edit-timeout:focus {
      outline: none;
      border-color: #6366f1;
    }
    #${PANEL_ID} .fa-live-step-delete {
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 12px;
      padding: 2px 4px;
      border-radius: 3px;
      transition: all 0.15s;
      font-family: inherit;
      line-height: 1;
    }
    #${PANEL_ID} .fa-live-step-delete:hover {
      background: rgba(239,68,68,0.15);
      color: #f87171;
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

      tabs.forEach((tab) => tab.classList.remove("active"));
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
        const results = await fillAllFields({ fillEmptyOnly: false });
        addLog(`${results.length} ${t("fieldsFillCount")}`, "success");
      } catch {
        addLog(t("fpFillErrorLog"), "error");
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
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === activeTab);
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
    label.textContent = t("fpFilling");
    card.style.opacity = "0.6";
    card.style.pointerEvents = "none";

    try {
      const results = await fillAllFields({ fillEmptyOnly: false });
      setStatus(
        panel,
        `✓ ${results.length} ${t("fieldsFillStatus")}`,
        "success",
      );
      addLog(`${results.length} ${t("fieldsFillCount")}`, "success");
      label.textContent = t("fillAll");
    } catch {
      setStatus(panel, t("fpFillError"), "error");
      addLog(t("fpFillErrorLog"), "error");
      label.textContent = t("fillAll");
    }

    card.style.opacity = "";
    card.style.pointerEvents = "";
  });

  // Fill Only Empty
  panel
    .querySelector("#fa-btn-fill-empty")
    ?.addEventListener("click", async () => {
      const card = panel.querySelector(
        "#fa-btn-fill-empty",
      ) as HTMLButtonElement;
      const label = card.querySelector(".fa-card-label") as HTMLElement;
      label.textContent = t("fpFilling");
      card.style.opacity = "0.6";
      card.style.pointerEvents = "none";

      try {
        const results = await fillAllFields({ fillEmptyOnly: true });
        setStatus(
          panel,
          `✓ ${results.length} ${t("fieldsFillStatus")}`,
          "success",
        );
        addLog(`${results.length} ${t("fieldsFillCount")}`, "success");
        label.textContent = t("fillOnlyEmpty");
      } catch {
        setStatus(panel, t("fpFillError"), "error");
        addLog(t("fpFillErrorLog"), "error");
        label.textContent = t("fillOnlyEmpty");
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
    setStatus(
      panel,
      `💾 ${t("savedStatus")} (${fieldCount} ${t("fieldCount")})`,
      "success",
    );
    addLog(
      `${t("logFormSavedWith")} ${fieldCount} ${t("fieldCount")}t("fieldCount")}`,
      "success",
    );
  });

  // Watch toggle
  panel.querySelector("#fa-btn-watch")?.addEventListener("click", () => {
    const card = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
    if (isWatcherActive()) {
      stopWatching();
      card.classList.remove("active");
      card.querySelector<HTMLElement>(".fa-card-label")!.textContent =
        t("watch");
      card.querySelector<HTMLElement>(".fa-card-desc")!.textContent =
        t("watchDesc");
      setStatus(panel, t("logWatchDeactivated"), "info");
      addLog(t("logWatchDeactivated"), "info");
    } else {
      startWatcherWithUI(panel);
    }
  });

  // Clear badges
  panel.querySelector("#fa-btn-clear-badges")?.addEventListener("click", () => {
    clearAllBadges();
    setStatus(panel, t("fpBadgesCleared"), "info");
    addLog(t("logBadgesRemoved"), "info");
  });

  // Record mode toggle
  panel.querySelector("#fa-btn-record")?.addEventListener("click", () => {
    handleRecordToggle(panel);
  });

  // Live step controls
  panel.querySelector("#fa-live-pause")?.addEventListener("click", () => {
    const status = getRecordingStatus();
    if (status === "recording") {
      pauseRecording();
      setOnStepAdded(null);
      setOnStepUpdated(null);
      const card = panel.querySelector("#fa-btn-record") as HTMLButtonElement;
      const iconEl = card?.querySelector<HTMLElement>(".fa-card-icon");
      const labelEl = card?.querySelector<HTMLElement>(".fa-card-label");
      if (iconEl) iconEl.textContent = "▶️";
      if (labelEl) labelEl.textContent = t("fpRecordResumeLabel");
      setStatus(panel, t("fpRecordingPaused"), "info");
      addLog(t("fpRecordingPaused"), "info");
    }
  });

  panel.querySelector("#fa-live-export")?.addEventListener("click", () => {
    showExportRecordingDialog(panel);
  });

  panel.querySelector("#fa-live-clear")?.addEventListener("click", () => {
    clearSession();
    resetRecordButton(panel);
    setStatus(panel, t("fpRecordingDiscarded"), "info");
    addLog(t("fpRecordingDiscarded"), "info");
  });

  // Open options page
  panel.querySelector("#fa-btn-options")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    addLog(t("logOpeningOptions"), "info");
  });
}

/* ─── Field Detection Handlers ─── */

function setupFieldHandlers(panel: HTMLElement): void {
  panel.querySelector("#fa-btn-detect")?.addEventListener("click", async () => {
    const btn = panel.querySelector("#fa-btn-detect") as HTMLButtonElement;
    const tbody = panel.querySelector("#fa-fields-tbody") as HTMLElement;
    const countEl = panel.querySelector("#fa-fields-count") as HTMLElement;

    btn.textContent = `⏳ ${t("fpDetecting")}`;
    btn.disabled = true;
    tbody.innerHTML = "";
    clearAllBadges();

    let count = 0;
    for await (const field of streamAllFields()) {
      count++;
      countEl.textContent = `${count} ${t("fieldCount")}`;
      showDetectionBadge(field.element, field.fieldType, field.detectionMethod);
      appendFieldRow(tbody, count, field);
    }

    btn.textContent = `🔍 ${t("detectFields")}`;
    btn.disabled = false;
    countEl.textContent = `${count} ${t("fieldCountDetected")}`;
    addLog(`${count} ${t("fieldCountPage")}`, "success");
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
    isIgnored ? t("fpFieldIgnoredTitle") : t("fpFieldActiveTitle"),
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
        eyeBtn.title = t("fpFieldActiveTitle");
        eyeBtn.classList.remove("ignored");
        tr.style.opacity = "";
        addLog(
          `${t("logFieldReactivated")}: "${field.label || field.id || field.selector}"`,
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
        eyeBtn.title = t("fpFieldIgnoredTitle");
        eyeBtn.classList.add("ignored");
        tr.style.opacity = "0.5";
        addLog(
          `${t("logFieldIgnored")}: "${field.label || field.id || field.selector}"`,
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
    createFieldActionBtn("⚡", t("actionFill"), async () => {
      // Respect ignored state
      if (ignoredFieldsMap.has(field.selector)) {
        addLog(
          `${t("logFieldIgnoredSkip")}: "${field.label || field.id || field.selector}"`,
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
          `${t("logFieldFilled")}: "${field.label || field.id || field.selector}"`,
          "success",
        );
      } else {
        addLog(
          `${t("logFillError")}: "${field.label || field.id || field.selector}"`,
          "error",
        );
      }
    }),
  );

  actionsCell.appendChild(
    createFieldActionBtn("📝", t("fpActionAddRule"), () => {
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
            `${t("logRuleCreated")}: "${field.label || field.id || field.selector}"`,
            "success",
          );
        } else {
          addLog(
            `${t("logRuleError")}: "${field.label || field.id || field.selector}"`,
            "error",
          );
        }
      });
    }),
  );

  actionsCell.appendChild(
    createFieldActionBtn("🔍", t("fpActionInspect"), () => {
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

  listEl.innerHTML = `<div class="fa-log-empty">${t("fpLoading")}</div>`;

  const url = window.location.href;
  const forms = await getSavedFormsForUrl(url);

  if (forms.length === 0) {
    listEl.innerHTML = `<div class="fa-log-empty">${t("noFormsForPage")}</div>`;
    if (countEl) countEl.textContent = "";
    return;
  }

  if (countEl) countEl.textContent = `${forms.length} ${t("formCount")}`;
  listEl.innerHTML = "";

  for (const form of forms) {
    listEl.appendChild(createFormCard(panel, form));
  }
}

function createFormCard(panel: HTMLElement, form: SavedForm): HTMLElement {
  const templateCount =
    form.templateFields?.length ?? Object.keys(form.fields).length;
  const date = new Date(form.updatedAt).toLocaleString("pt-BR");

  // Outer wrapper holds both the card row and the collapsible edit drawer
  const wrapper = document.createElement("div");

  const card = document.createElement("div");
  card.className = "fa-form-card";
  card.innerHTML = `
    <div class="fa-form-info">
      <div class="fa-form-name">${escapeHtml(form.name)}</div>
      <div class="fa-form-meta">${templateCount} ${t("fieldCount")} · ${escapeHtml(date)} · ${escapeHtml(form.urlPattern)}</div>
    </div>
    <div class="fa-form-actions"></div>
  `;

  const actionsEl = card.querySelector(".fa-form-actions") as HTMLElement;

  // Apply button
  const applyBtn = document.createElement("button");
  applyBtn.className = "fa-form-load-btn";
  applyBtn.textContent = `📥 ${t("fpApplyTemplate")}`;
  applyBtn.addEventListener("click", async () => {
    const filled = await applyTemplate(form);
    setStatus(
      panel,
      `📥 ${t("fpTemplateApplied")}: "${form.name}" (${filled} ${t("fieldCount")})`,
      "success",
    );
    addLog(
      `${t("logApplyingTemplate")}: "${form.name}" — ${filled} ${t("fieldCount")}`,
      "success",
    );
  });
  actionsEl.appendChild(applyBtn);

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className = "fa-form-edit-btn";
  editBtn.textContent = `✏️ ${t("btnEdit")}`;
  let editDrawer: HTMLElement | null = null;
  editBtn.addEventListener("click", () => {
    if (editDrawer) {
      editDrawer.remove();
      editDrawer = null;
      editBtn.textContent = `✏️ ${t("btnEdit")}`;
      return;
    }
    editDrawer = buildFormEditDrawer(form, wrapper, panel, () => {
      editDrawer = null;
      editBtn.textContent = `✏️ ${t("btnEdit")}`;
    });
    wrapper.appendChild(editDrawer);
    editBtn.textContent = `✕ ${t("fpClose")}`;
  });
  actionsEl.appendChild(editBtn);

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "fa-form-delete-btn";
  deleteBtn.textContent = `🗑️ ${t("btnDelete")}`;
  deleteBtn.addEventListener("click", async () => {
    await deleteForm(form.id);
    wrapper.remove();
    addLog(`${t("logFormRemoved")}: "${form.name}"`, "info");

    // Refresh count
    const listEl = panel.querySelector("#fa-forms-list") as HTMLElement;
    const remaining = listEl.querySelectorAll(".fa-form-card").length;
    const countEl = panel.querySelector("#fa-forms-count") as HTMLElement;
    if (remaining === 0) {
      listEl.innerHTML = `<div class="fa-log-empty">${t("noFormsForPage")}</div>`;
      if (countEl) countEl.textContent = "";
    } else {
      if (countEl) countEl.textContent = `${remaining} ${t("formCount")}`;
    }
  });
  actionsEl.appendChild(deleteBtn);

  wrapper.appendChild(card);
  return wrapper;
}

/** Build the inline edit drawer for a form template */
function buildFormEditDrawer(
  form: SavedForm,
  wrapper: HTMLElement,
  panel: HTMLElement,
  onClose: () => void,
): HTMLElement {
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

  const drawer = document.createElement("div");
  drawer.className = "fa-form-edit-drawer";

  // Meta row: name + urlPattern
  const metaRow = document.createElement("div");
  metaRow.className = "fa-edit-meta-row";

  metaRow.innerHTML = `
    <div class="fa-edit-input-group">
      <span class="fa-edit-label">${t("formName")}</span>
      <input class="fa-edit-input" id="fa-edit-name" type="text" value="${escapeHtml(form.name)}" />
    </div>
    <div class="fa-edit-input-group">
      <span class="fa-edit-label">${t("formUrl")}</span>
      <input class="fa-edit-input" id="fa-edit-url" type="text" value="${escapeHtml(form.urlPattern)}" />
    </div>
  `;
  drawer.appendChild(metaRow);

  if (templateFields.length > 0) {
    const fieldsHeader = document.createElement("div");
    fieldsHeader.className = "fa-edit-fields-header";
    fieldsHeader.textContent = t("editFieldsHeader");
    drawer.appendChild(fieldsHeader);
  }

  const fieldStates: {
    field: FormTemplateField;
    modeSelect: HTMLSelectElement;
    valueInput: HTMLInputElement;
    genSelect: HTMLSelectElement;
  }[] = [];

  for (const field of templateFields) {
    const row = document.createElement("div");
    row.className = "fa-edit-field-row";

    const keyEl = document.createElement("div");
    keyEl.className = "fa-edit-field-key";
    keyEl.textContent = field.label || field.key;
    row.appendChild(keyEl);

    const controls = document.createElement("div");
    controls.className = "fa-edit-field-controls";

    const modeSelect = document.createElement("select");
    modeSelect.className = "fa-edit-select";
    modeSelect.innerHTML = `
      <option value="fixed"${field.mode === "fixed" ? " selected" : ""}>${t("fixedValue")}</option>
      <option value="generator"${field.mode === "generator" ? " selected" : ""}>${t("generatorMode")}</option>
    `;

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "fa-edit-field-value";
    valueInput.placeholder = t("fixedValue");
    valueInput.value = field.fixedValue ?? "";
    valueInput.style.display = field.mode === "fixed" ? "" : "none";

    const genSelect = document.createElement("select");
    genSelect.className = "fa-edit-select fa-edit-field-value";
    genSelect.style.display = field.mode === "generator" ? "" : "none";
    genSelect.innerHTML = FIELD_TYPES.map(
      (ft) =>
        `<option value="${ft}"${field.generatorType === ft ? " selected" : ""}>${ft}</option>`,
    ).join("");

    modeSelect.addEventListener("change", () => {
      const isFixed = modeSelect.value === "fixed";
      valueInput.style.display = isFixed ? "" : "none";
      genSelect.style.display = isFixed ? "none" : "";
    });

    controls.appendChild(modeSelect);
    controls.appendChild(valueInput);
    controls.appendChild(genSelect);
    row.appendChild(controls);
    drawer.appendChild(row);
    fieldStates.push({ field, modeSelect, valueInput, genSelect });
  }

  // Footer
  const footer = document.createElement("div");
  footer.className = "fa-edit-footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "fa-edit-cancel-btn";
  cancelBtn.textContent = `✕ ${t("btnCancel")}`;
  cancelBtn.addEventListener("click", () => {
    drawer.remove();
    onClose();
  });

  const saveBtn = document.createElement("button");
  saveBtn.className = "fa-edit-save-btn";
  saveBtn.textContent = `💾 ${t("btnSave")}`;
  saveBtn.addEventListener("click", async () => {
    const nameInput = drawer.querySelector<HTMLInputElement>("#fa-edit-name");
    const urlInput = drawer.querySelector<HTMLInputElement>("#fa-edit-url");

    const updatedFields: FormTemplateField[] = fieldStates.map(
      ({ field, modeSelect, valueInput, genSelect }) => {
        const mode = modeSelect.value as FormFieldMode;
        return {
          key: field.key,
          label: field.label,
          mode,
          fixedValue: mode === "fixed" ? valueInput.value : undefined,
          generatorType:
            mode === "generator" ? (genSelect.value as FieldType) : undefined,
        };
      },
    );

    const updated: SavedForm = {
      ...form,
      name: nameInput?.value.trim() || form.name,
      urlPattern: urlInput?.value.trim() || form.urlPattern,
      templateFields: updatedFields,
    };

    await saveForm(updated);

    // Refresh info row in card
    const nameEl = wrapper.querySelector(".fa-form-name");
    const metaEl = wrapper.querySelector(".fa-form-meta");
    const date = new Date(
      updated.updatedAt === form.updatedAt ? Date.now() : updated.updatedAt,
    ).toLocaleString("pt-BR");
    if (nameEl) nameEl.textContent = updated.name;
    if (metaEl)
      metaEl.textContent = `${updatedFields.length} ${t("fieldCount")} · ${date} · ${updated.urlPattern}`;

    // Update form reference in memory
    Object.assign(form, updated);

    drawer.remove();
    onClose();
    addLog(`${t("logFormUpdated")}: "${updated.name}"`, "success");
  });

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);
  drawer.appendChild(footer);

  return drawer;
}

/* ─── Log ─── */

const LOG_TYPE_TO_LEVEL: Record<string, "info" | "warn" | "error" | "debug"> = {
  success: "info",
  info: "info",
  warn: "warn",
  error: "error",
  debug: "debug",
};

function addLog(text: string, type: string): void {
  const level = LOG_TYPE_TO_LEVEL[type] ?? "info";
  log[level](text);
}

function setupLogViewer(panel: HTMLElement): void {
  const container = panel.querySelector(
    "#fa-log-viewer-container",
  ) as HTMLElement;
  if (!container) return;

  logViewerInstance = createLogViewer({
    container,
    variant: "panel",
  });
  logViewerInstance.refresh();
}

/* ─── Watcher UI ─── */

function startWatcherWithUI(panel: HTMLElement): void {
  startWatching((newFieldsCount) => {
    if (newFieldsCount > 0 && panelElement) {
      setStatus(
        panelElement,
        `🔄 ${newFieldsCount} ${t("fpNewFieldsRefill")}`,
        "info",
      );
      addLog(`${newFieldsCount} ${t("fpNewFieldsViaWatch")}`, "info");
    }
  }, true);

  const card = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
  if (card) {
    card.classList.add("active");
    const label = card.querySelector<HTMLElement>(".fa-card-label");
    const desc = card.querySelector<HTMLElement>(".fa-card-desc");
    if (label) label.textContent = t("fpWatchActive");
    if (desc) desc.textContent = t("fpWatchClickToStop");
  }

  setStatus(panel, t("fpWatchActivatedDOM"), "info");
  addLog(t("logWatchActivated"), "info");
}

function updateWatcherStatus(panel: HTMLElement): void {
  const card = panel.querySelector("#fa-btn-watch") as HTMLButtonElement;
  if (card && isWatcherActive()) {
    card.classList.add("active");
    const label = card.querySelector<HTMLElement>(".fa-card-label");
    const desc = card.querySelector<HTMLElement>(".fa-card-desc");
    if (label) label.textContent = t("fpWatchActive");
    if (desc) desc.textContent = t("fpWatchClickToStop");
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

/* ─── Record Mode ─── */

function handleRecordToggle(panel: HTMLElement): void {
  const status = getRecordingStatus();
  const card = panel.querySelector("#fa-btn-record") as HTMLButtonElement;
  const iconEl = card?.querySelector<HTMLElement>(".fa-card-icon");
  const labelEl = card?.querySelector<HTMLElement>(".fa-card-label");
  const descEl = card?.querySelector<HTMLElement>(".fa-card-desc");
  const liveSteps = panel.querySelector("#fa-live-steps") as HTMLElement;

  if (status === "stopped") {
    // Start recording
    startRecording();
    card?.classList.add("active");
    if (iconEl) iconEl.textContent = "⏹";
    if (labelEl) labelEl.textContent = t("fpRecordStopLabel");
    if (descEl) descEl.textContent = t("fpRecordStopDesc");
    setStatus(panel, t("fpRecordingStarted"), "info");
    addLog(t("fpRecordingStarted"), "info");

    // Show live step list
    if (liveSteps) {
      liveSteps.style.display = "";
      const listEl = liveSteps.querySelector("#fa-live-steps-list");
      if (listEl) listEl.innerHTML = "";
      updateLiveStepCount(panel, 0);
      showLiveRecordingControls(panel);
    }

    // Set callbacks for real-time updates
    setOnStepAdded((step, index) => {
      appendLiveStepRow(panel, step, index);
      const session = getRecordingSession();
      updateLiveStepCount(panel, session?.steps.length ?? 0);
    });
    setOnStepUpdated((_step, index) => {
      updateLiveStepRow(panel, _step, index);
    });
  } else if (status === "recording") {
    // Stop recording — keep steps for review
    stopRecording();
    setOnStepAdded(null);
    setOnStepUpdated(null);
    card?.classList.remove("active");
    if (iconEl) iconEl.textContent = "🔴";
    if (labelEl) labelEl.textContent = t("fpRecordLabel");
    if (descEl) descEl.textContent = t("fpRecordDesc");
    setStatus(panel, t("fpRecordingStopped"), "info");
    addLog(t("fpRecordingStopped"), "info");

    // Show export + clear buttons
    showLiveReviewControls(panel);
  } else if (status === "paused") {
    resumeRecording();
    card?.classList.add("active");
    if (iconEl) iconEl.textContent = "⏹";
    if (labelEl) labelEl.textContent = t("fpRecordStopLabel");
    setStatus(panel, t("fpRecordingResumed"), "info");
    addLog(t("fpRecordingResumed"), "info");

    showLiveRecordingControls(panel);

    setOnStepAdded((step, index) => {
      appendLiveStepRow(panel, step, index);
      const session = getRecordingSession();
      updateLiveStepCount(panel, session?.steps.length ?? 0);
    });
    setOnStepUpdated((_step, index) => {
      updateLiveStepRow(panel, _step, index);
    });
  }
}

function resetRecordButton(panel: HTMLElement): void {
  const card = panel.querySelector("#fa-btn-record") as HTMLButtonElement;
  const iconEl = card?.querySelector<HTMLElement>(".fa-card-icon");
  const labelEl = card?.querySelector<HTMLElement>(".fa-card-label");
  const descEl = card?.querySelector<HTMLElement>(".fa-card-desc");
  card?.classList.remove("active");
  if (iconEl) iconEl.textContent = "🔴";
  if (labelEl) labelEl.textContent = t("fpRecordLabel");
  if (descEl) descEl.textContent = t("fpRecordDesc");

  // Hide live step list
  const liveSteps = panel.querySelector("#fa-live-steps") as HTMLElement;
  if (liveSteps) {
    liveSteps.style.display = "none";
    const listEl = liveSteps.querySelector("#fa-live-steps-list");
    if (listEl) listEl.innerHTML = "";
  }
}

/* ─── Live Step List Helpers ─── */

function updateLiveStepCount(panel: HTMLElement, count: number): void {
  const el = panel.querySelector("#fa-live-steps-count");
  if (el) el.textContent = String(count);
}

function showLiveRecordingControls(panel: HTMLElement): void {
  const pauseBtn = panel.querySelector("#fa-live-pause") as HTMLElement;
  const exportBtn = panel.querySelector("#fa-live-export") as HTMLElement;
  const clearBtn = panel.querySelector("#fa-live-clear") as HTMLElement;
  if (pauseBtn) pauseBtn.style.display = "";
  if (exportBtn) exportBtn.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
}

function showLiveReviewControls(panel: HTMLElement): void {
  const pauseBtn = panel.querySelector("#fa-live-pause") as HTMLElement;
  const exportBtn = panel.querySelector("#fa-live-export") as HTMLElement;
  const clearBtn = panel.querySelector("#fa-live-clear") as HTMLElement;
  if (pauseBtn) pauseBtn.style.display = "none";
  if (exportBtn) exportBtn.style.display = "";
  if (clearBtn) clearBtn.style.display = "";
}

function buildStepDescription(step: RecordedStep): string {
  return step.label || step.value || step.url || step.key || "";
}

function appendLiveStepRow(
  panel: HTMLElement,
  step: RecordedStep,
  index: number,
): void {
  const listEl = panel.querySelector("#fa-live-steps-list");
  if (!listEl) return;

  const icon = STEP_ICONS[step.type] ?? "❓";
  const desc = buildStepDescription(step);
  const row = document.createElement("div");
  row.className = "fa-live-step-row";
  row.setAttribute("data-step-index", String(index));
  row.innerHTML = `
    <span class="fa-live-step-num">${index + 1}</span>
    <span class="fa-live-step-icon">${icon}</span>
    <span class="fa-live-step-type">${escapeHtml(step.type)}</span>
    <span class="fa-live-step-desc" title="${escapeHtml(desc)}">${escapeHtml(desc.slice(0, 30))}</span>
    <span class="fa-live-step-value">
      ${step.value !== undefined ? `<input class="fa-live-edit-value" type="text" value="${escapeHtml(step.value)}" title="${t("fpEditValue")}" />` : ""}
    </span>
    <span class="fa-live-step-timeout">
      <input class="fa-live-edit-timeout" type="number" value="${step.waitTimeout ?? ""}" min="0" step="500" placeholder="ms" title="${t("fpEditTimeout")}" />
    </span>
    <button class="fa-live-step-delete" title="${t("fpDeleteStep")}">✕</button>
  `;

  // Wire up inline edit for value
  const valueInput = row.querySelector<HTMLInputElement>(".fa-live-edit-value");
  valueInput?.addEventListener("change", () => {
    updateStep(index, { value: valueInput.value });
  });

  // Wire up inline edit for timeout
  const timeoutInput = row.querySelector<HTMLInputElement>(
    ".fa-live-edit-timeout",
  );
  timeoutInput?.addEventListener("change", () => {
    const ms = parseInt(timeoutInput.value, 10);
    updateStep(index, { waitTimeout: isNaN(ms) ? undefined : ms });
  });

  // Wire up delete
  row.querySelector(".fa-live-step-delete")?.addEventListener("click", () => {
    removeStep(index);
    row.remove();
    // Re-index remaining rows
    reindexLiveStepRows(panel);
    const session = getRecordingSession();
    updateLiveStepCount(panel, session?.steps.length ?? 0);
  });

  listEl.appendChild(row);
  // Auto-scroll to bottom
  listEl.scrollTop = listEl.scrollHeight;
}

function updateLiveStepRow(
  panel: HTMLElement,
  step: RecordedStep,
  index: number,
): void {
  const listEl = panel.querySelector("#fa-live-steps-list");
  if (!listEl) return;

  const row = listEl.querySelector(
    `[data-step-index="${index}"]`,
  ) as HTMLElement;
  if (!row) return;

  const desc = buildStepDescription(step);
  const descEl = row.querySelector(".fa-live-step-desc") as HTMLElement;
  if (descEl) {
    descEl.textContent = desc.slice(0, 30);
    descEl.title = desc;
  }

  const valueInput = row.querySelector<HTMLInputElement>(".fa-live-edit-value");
  if (valueInput && step.value !== undefined) {
    valueInput.value = step.value;
  }
}

function reindexLiveStepRows(panel: HTMLElement): void {
  const listEl = panel.querySelector("#fa-live-steps-list");
  if (!listEl) return;

  const rows = listEl.querySelectorAll<HTMLElement>(".fa-live-step-row");
  rows.forEach((row, i) => {
    row.setAttribute("data-step-index", String(i));
    const numEl = row.querySelector(".fa-live-step-num");
    if (numEl) numEl.textContent = String(i + 1);
  });
}

function showExportRecordingDialog(panel: HTMLElement): void {
  const session = getRecordingSession();
  if (!session) return;

  const stepsCount = session.steps.length;
  const httpResponses = getCapturedResponses();
  const frameworkOptions = E2E_GENERATORS.map(
    (g) =>
      `<option value="${g.name}">${g.name.charAt(0).toUpperCase() + g.name.slice(1)}</option>`,
  ).join("");

  // Build preview of recorded steps
  const stepRows = session.steps
    .map((step, i) => {
      const icon = STEP_ICONS[step.type] ?? "❓";
      const desc = step.label || step.value || step.url || step.key || "";
      const sel = step.selector
        ? `<code>${escapeHtml(step.selector)}</code>`
        : "";
      return `<tr>
        <td>${i + 1}</td>
        <td>${icon} ${escapeHtml(step.type)}</td>
        <td title="${escapeHtml(desc)}">${escapeHtml(desc.slice(0, 40))}</td>
        <td title="${escapeHtml(step.selector ?? "")}">${sel}</td>
      </tr>`;
    })
    .join("");

  const httpRows = httpResponses
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.method)}</td><td title="${escapeHtml(r.url)}">${escapeHtml(r.url.slice(0, 50))}</td><td>${r.status}</td></tr>`,
    )
    .join("");

  const overlay = document.createElement("div");
  overlay.id = "fa-record-overlay";
  overlay.innerHTML = `
    <div class="fa-record-dialog fa-record-dialog-wide">
      <h3>📹 ${t("fpExportRecording")}</h3>

      <div class="fa-record-tabs">
        <button class="fa-tab active" data-tab="preview">🔍 ${t("fpPreview")} (${stepsCount})</button>
        <button class="fa-tab" data-tab="export">📤 ${t("fpExport")}</button>
        ${httpResponses.length > 0 ? `<button class="fa-tab" data-tab="http">🌐 HTTP (${httpResponses.length})</button>` : ""}
      </div>

      <div class="fa-tab-content active" id="fa-tab-preview">
        <div class="fa-preview-table-wrap">
          <table class="fa-preview-table">
            <thead><tr><th>#</th><th>${t("fpStepType")}</th><th>${t("fpStepValue")}</th><th>${t("fpStepSelector")}</th></tr></thead>
            <tbody>${stepRows}</tbody>
          </table>
        </div>
      </div>

      <div class="fa-tab-content" id="fa-tab-export">
        <div class="fa-record-form">
          <label>${t("fpTestName")}:</label>
          <input type="text" id="fa-record-test-name" placeholder="${t("fpTestNamePlaceholder")}" />
          <label>${t("fpFramework")}:</label>
          <select id="fa-record-framework">${frameworkOptions}</select>
          <label class="fa-checkbox-label">
            <input type="checkbox" id="fa-record-smart-waits" checked />
            ${t("fpSmartWaits")}
          </label>
          <label class="fa-checkbox-label">
            <input type="checkbox" id="fa-record-assertions" checked />
            ${t("fpIncludeAssertions")}
          </label>
        </div>
      </div>

      ${
        httpResponses.length > 0
          ? `
      <div class="fa-tab-content" id="fa-tab-http">
        <div class="fa-preview-table-wrap">
          <table class="fa-preview-table">
            <thead><tr><th>Method</th><th>URL</th><th>Status</th></tr></thead>
            <tbody>${httpRows}</tbody>
          </table>
        </div>
      </div>`
          : ""
      }

      <div class="fa-record-actions">
        <button class="fa-btn fa-btn-primary" id="fa-record-export">${t("fpExport")}</button>
        <button class="fa-btn fa-btn-secondary" id="fa-record-pause">${t("fpPauseRecording")}</button>
        <button class="fa-btn fa-btn-danger" id="fa-record-discard">${t("fpDiscardRecording")}</button>
        <button class="fa-btn" id="fa-record-cancel">${t("fpContinueRecording")}</button>
      </div>
    </div>
  `;

  panel.appendChild(overlay);

  // Tab switching logic
  overlay.querySelectorAll<HTMLButtonElement>(".fa-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      overlay
        .querySelectorAll(".fa-tab")
        .forEach((t) => t.classList.remove("active"));
      overlay
        .querySelectorAll(".fa-tab-content")
        .forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      overlay.querySelector(`#fa-tab-${target}`)?.classList.add("active");
    });
  });

  overlay.querySelector("#fa-record-export")?.addEventListener("click", () => {
    const framework = (
      overlay.querySelector("#fa-record-framework") as HTMLSelectElement
    )?.value as E2EFramework;
    const testName = (
      overlay.querySelector("#fa-record-test-name") as HTMLInputElement
    )?.value;
    const includeAssertions =
      (overlay.querySelector("#fa-record-assertions") as HTMLInputElement)
        ?.checked ?? true;
    const smartWaits =
      (overlay.querySelector("#fa-record-smart-waits") as HTMLInputElement)
        ?.checked ?? true;

    // Use current session (already stopped or still active)
    const status = getRecordingStatus();
    if (status === "recording" || status === "paused") {
      stopRecording();
    }
    const recordedSession = getRecordingSession();
    if (!recordedSession || recordedSession.steps.length === 0) {
      setStatus(panel, t("fpNoRecordedSteps"), "error");
      overlay.remove();
      resetRecordButton(panel);
      return;
    }

    const options: RecordingGenerateOptions = {
      testName: testName || undefined,
      pageUrl: recordedSession.startUrl,
      includeAssertions,
      minWaitThreshold: smartWaits ? 500 : 0,
    };

    const script = generateE2EFromRecording(
      framework,
      recordedSession.steps,
      options,
    );

    clearSession();
    overlay.remove();
    resetRecordButton(panel);

    if (!script) {
      setStatus(panel, t("fpExportFailed"), "error");
      return;
    }

    downloadScript(script, framework, testName);
    setStatus(
      panel,
      `${t("fpExportSuccess")} (${recordedSession.steps.length} ${t("fpSteps")})`,
      "success",
    );
    addLog(
      `${t("fpExportSuccess")}: ${framework} (${recordedSession.steps.length} ${t("fpSteps")})`,
      "success",
    );
  });

  overlay.querySelector("#fa-record-pause")?.addEventListener("click", () => {
    pauseRecording();
    overlay.remove();
    const card = panel.querySelector("#fa-btn-record") as HTMLButtonElement;
    const iconEl = card?.querySelector<HTMLElement>(".fa-card-icon");
    const labelEl = card?.querySelector<HTMLElement>(".fa-card-label");
    if (iconEl) iconEl.textContent = "▶️";
    if (labelEl) labelEl.textContent = t("fpRecordResumeLabel");
    setStatus(panel, t("fpRecordingPaused"), "info");
    addLog(t("fpRecordingPaused"), "info");
  });

  overlay.querySelector("#fa-record-discard")?.addEventListener("click", () => {
    clearSession();
    overlay.remove();
    resetRecordButton(panel);
    setStatus(panel, t("fpRecordingDiscarded"), "info");
    addLog(t("fpRecordingDiscarded"), "info");
  });

  overlay.querySelector("#fa-record-cancel")?.addEventListener("click", () => {
    overlay.remove();
  });
}

function downloadScript(
  script: string,
  framework: string,
  testName?: string,
): void {
  const ext = framework === "pest" ? ".php" : ".ts";
  const baseName = testName
    ? testName.toLowerCase().replace(/\s+/g, "-")
    : "recorded-test";
  const fileName = `${baseName}.test${ext}`;

  const blob = new Blob([script], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
