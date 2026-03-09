/**
 * Field Icon — CSS styles injection and removal
 */

export const ICON_ID = "fill-all-field-icon";
export const RULE_POPUP_ID = "fill-all-rule-popup";
export const MODAL_ID = "fill-all-inspect-modal";

const STYLE_ID = "fill-all-field-icon-styles";

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${ICON_ID} {
      position: absolute;
      z-index: 2147483646;
      display: none;
      align-items: center;
      gap: 3px;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: auto;
    }
    #${ICON_ID}.visible {
      opacity: 1;
      transform: scale(1);
    }
    #fill-all-field-icon-btn,
    #fill-all-field-rule-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      margin: 0;
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(79, 70, 229, 0.4);
      transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
      line-height: 1;
    }
    #fill-all-field-icon-btn {
      background: #4f46e5;
    }
    #fill-all-field-icon-btn:hover {
      background: #4338ca;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.5);
      transform: scale(1.1);
    }
    #fill-all-field-icon-btn:active {
      transform: scale(0.95);
    }
    #fill-all-field-icon-btn.loading {
      pointer-events: none;
      animation: fill-all-icon-spin 0.6s linear infinite;
    }
    #fill-all-field-rule-btn {
      background: #7c3aed;
    }
    #fill-all-field-rule-btn:hover {
      background: #6d28d9;
      box-shadow: 0 2px 8px rgba(124, 58, 237, 0.5);
      transform: scale(1.1);
    }
    #fill-all-field-rule-btn:active {
      transform: scale(0.95);
    }
    @keyframes fill-all-icon-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    #fill-all-field-inspect-btn {
      background: #0ea5e9;
    }
    #fill-all-field-inspect-btn:hover {
      background: #0284c7;
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.5);
      transform: scale(1.1);
    }
    #fill-all-field-inspect-btn:active {
      transform: scale(0.95);
    }
    /* ── Inspection Modal ──────────────────────────────────────────────── */
    #${MODAL_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #fa-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(2px);
    }
    #fa-modal-box {
      position: relative;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.22);
      width: min(480px, calc(100vw - 32px));
      max-height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 13px;
      color: #1e293b;
      opacity: 0;
      transform: scale(0.94) translateY(8px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #fa-modal-box.fa-modal-visible {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    #fa-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #e2e8f0;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      border-radius: 14px 14px 0 0;
    }
    #fa-modal-title {
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }
    #fa-modal-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: #fff;
      border-radius: 6px;
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: background 0.15s;
    }
    #fa-modal-close:hover { background: rgba(255,255,255,0.35); }
    #fa-modal-body {
      padding: 14px 16px;
      overflow-y: auto;
      flex: 1;
    }
    #fa-modal-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 12px;
    }
    #fa-modal-table th,
    #fa-modal-table td {
      padding: 5px 8px;
      vertical-align: top;
      border-bottom: 1px solid #f1f5f9;
    }
    #fa-modal-table th {
      width: 110px;
      color: #64748b;
      font-weight: 700;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }
    #fa-modal-table td code {
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }
    #fa-modal-override {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
    }
    #fa-modal-type-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
    }
    #fa-modal-type-select {
      width: 100%;
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      color: #1e293b;
      background: #fff;
      outline: none;
      cursor: pointer;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    #fa-modal-type-select:focus { border-color: #6366f1; }
    #fa-modal-override-hint {
      margin: 8px 0 0;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
    #fa-modal-footer {
      padding: 10px 16px 14px;
      display: flex;
      gap: 8px;
      border-top: 1px solid #f1f5f9;
    }
    #fa-modal-save {
      flex: 1;
      padding: 8px 14px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
    }
    #fa-modal-save:hover { background: #4338ca; }
    #fa-modal-save:disabled { cursor: default; }
    #fa-modal-cancel {
      padding: 8px 14px;
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      transition: background 0.15s;
    }
    #fa-modal-cancel:hover { background: #f1f5f9; }
    /* ── Rule Popup — Host CSS isolation reset ───────────────────── */
    #${RULE_POPUP_ID},
    #${RULE_POPUP_ID} *,
    #${RULE_POPUP_ID} *::before,
    #${RULE_POPUP_ID} *::after {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    #${RULE_POPUP_ID} div,
    #${RULE_POPUP_ID} span {
      margin: 0;
      padding: 0;
      border: none;
      background: none;
      line-height: normal;
    }
    #${RULE_POPUP_ID} button {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    /*
     * IMPORTANT: wrap type selectors in :where() (specificity 0) so the reset
     * rule is only (1,0,0). Class rules like .fa-rp-input / .fa-rp-param-input
     * at (1,1,0) will always win the cascade.
     */
    #${RULE_POPUP_ID} :where(input[type="text"],
    input[type="password"],
    input[type="number"],
    input[type="search"]) {
      all: unset;
      box-sizing: border-box;
      display: block;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    /* Restore native checkbox appearance — class rules can override accent-color etc. */
    #${RULE_POPUP_ID} input[type="checkbox"] {
      -webkit-appearance: checkbox;
      appearance: checkbox;
      box-sizing: border-box;
    }
    #${RULE_POPUP_ID} kbd {
      all: unset;
      box-sizing: border-box;
      display: inline-block;
      font-family: inherit;
    }
    #${RULE_POPUP_ID} ul,
    #${RULE_POPUP_ID} li {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    /* ── Rule Popup ──────────────────────────────────────────────────── */
    #${RULE_POPUP_ID} {
      position: absolute;
      z-index: 2147483646;
      box-shadow: 0 16px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.07);
      width: 380px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      display: none;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    /* ── Rule Popup — Header ─────────────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-header {
      padding: 14px 16px 0;
      background: #fff;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
    }
    #${RULE_POPUP_ID} .fa-rp-header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      padding-bottom: 10px;
    }
    #${RULE_POPUP_ID} .fa-rp-header-left {
      flex: 1;
      min-width: 0;
    }
    #${RULE_POPUP_ID} .fa-rp-header-title {
      color: #1e293b;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.3;
    }
    #${RULE_POPUP_ID} .fa-rp-header-subtitle {
      color: #94a3b8;
      font-size: 11px;
      line-height: 1.4;
      margin-top: 3px;
    }
    #${RULE_POPUP_ID} .fa-rp-progress-bar {
      height: 3px;
      background: #e2e8f0;
      overflow: hidden;
    }
    #${RULE_POPUP_ID} .fa-rp-progress-fill {
      height: 100%;
      width: 50%;
      background: linear-gradient(90deg, #7c3aed, #6366f1);
      border-radius: 0 99px 99px 0;
    }
    /* ── Rule Popup — Suggestion Badge ──────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-suggestion {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 4px 10px;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 99px;
      font-size: 10px;
      color: #7c3aed;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    #${RULE_POPUP_ID} #fa-rp-suggestion-type { font-weight: 700; }
    #${RULE_POPUP_ID} .fa-rp-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    /* ── Rule Popup — Cards ──────────────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    #${RULE_POPUP_ID} .fa-rp-card--lavender {
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    #${RULE_POPUP_ID} .fa-rp-card--aqua {
      background: #f8fafc;
      border-color: #e2e8f0;
    }
    #${RULE_POPUP_ID} .fa-rp-card-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    #${RULE_POPUP_ID} .fa-rp-card-icon--lavender { background: #eff6ff; }
    #${RULE_POPUP_ID} .fa-rp-card-icon--aqua { background: #f0fdfa; }
    #${RULE_POPUP_ID} .fa-rp-card-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    #${RULE_POPUP_ID} .fa-rp-card-title {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.3;
    }
    #${RULE_POPUP_ID} .fa-rp-card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    #${RULE_POPUP_ID} .fa-rp-badge-auto {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.4px;
      background: #ccfbf1;
      color: #0d9488;
      padding: 2px 7px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    #${RULE_POPUP_ID} .fa-rp-card-desc {
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 2px;
    }
    /* ── Rule Popup — Inputs ─────────────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-input,
    #${RULE_POPUP_ID} .fa-rp-select {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 12px;
      font-family: inherit;
      color: #1e293b;
      background: #fff;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      margin-top: 6px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-input:focus,
    #${RULE_POPUP_ID} .fa-rp-select:focus {
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
    }
    /* ── Rule Popup — Divider ────────────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-divider {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #${RULE_POPUP_ID} .fa-rp-divider-line {
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }
    #${RULE_POPUP_ID} .fa-rp-divider-text {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #94a3b8;
      white-space: nowrap;
    }
    /* ── Rule Popup — Live Preview ───────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-preview-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    #${RULE_POPUP_ID} .fa-rp-preview-label-badge {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }
    #${RULE_POPUP_ID} .fa-rp-preview-value-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }
    #${RULE_POPUP_ID} #fa-rp-preview-value {
      flex: 1;
      font-weight: 700;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #1e293b;
    }
    #${RULE_POPUP_ID} .fa-rp-preview-fixed { color: #1e293b; }
    #${RULE_POPUP_ID} .fa-rp-preview-generated { color: #1e293b; }
    #${RULE_POPUP_ID} .fa-rp-preview-icon-btn {
      background: #fff;
      border: none;
      color: #333;
      cursor: pointer;
      padding: 2px;
      font-size: 15px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 99px;
      transition: color 0.15s, background 0.15s;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }
    #${RULE_POPUP_ID} .fa-rp-preview-icon-btn:hover {
      color: #7c3aed;
      background: #ede9fe;
    }
    #${RULE_POPUP_ID} .fa-rp-preview-icon-btn--copied {
      color: #16a34a !important;
      background: #dcfce7 !important;
    }
    #${RULE_POPUP_ID} .fa-rp-preview-icon-btn--copied {
      color: #16a34a !important;
      background: #dcfce7 !important;
    }
    /* ── Rule Popup — Actions ────────────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary {
      flex: 1;
      padding: 10px 12px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: #fff;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      font-family: inherit;
      transition: opacity 0.15s, transform 0.1s;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:not(:disabled)::before {
      content: '✓';
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      font-size: 10px;
      font-weight: 900;
      margin-right: 6px;
      vertical-align: middle;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:hover { opacity: 0.9; }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:active { transform: scale(0.97); }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:disabled {
      background: #16a34a;
      opacity: 1;
      cursor: default;
      transform: none;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-cancel {
      padding: 10px 14px;
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
      white-space: nowrap;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-cancel:hover { background: #f1f5f9; }
    /* ── Rule Popup — Generator Params ───────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-params {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      background: rgba(241,245,249,0.8);
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-top: 4px;
    }
    #${RULE_POPUP_ID} .fa-rp-params-title {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    #${RULE_POPUP_ID} .fa-rp-param-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #${RULE_POPUP_ID} .fa-rp-param-label {
      font-size: 10px;
      color: #475569;
      min-width: 60px;
      flex-shrink: 0;
    }
    #${RULE_POPUP_ID} .fa-rp-param-input {
      padding: 3px 6px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 11px;
      font-family: inherit;
      color: #1e293b;
      background: #fff;
      outline: none;
      width: 70px;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-param-input:focus { border-color: #8b5cf6; }
    #${RULE_POPUP_ID} .fa-rp-param-check {
      -webkit-appearance: checkbox;
      appearance: checkbox;
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      accent-color: #7c3aed;
      cursor: pointer;
    }
    /* ── Rule Popup — Keyboard Hint ──────────────────────────────── */
    #${RULE_POPUP_ID} .fa-rp-hint {
      font-size: 9px;
      color: #cbd5e1;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      flex-wrap: wrap;
    }
    #${RULE_POPUP_ID} .fa-rp-hint kbd {
      display: inline-block;
      padding: 1px 4px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 9px;
      font-family: inherit;
      color: #64748b;
      line-height: 1.5;
    }
    #${RULE_POPUP_ID} .fa-rp-hint-sep { color: #e2e8f0; }
    /* ── SearchableSelect — scoped to rule popup ─────────────────── */
    #${RULE_POPUP_ID} .fa-ss {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      width: 100%;
      font-size: 12px;
      box-sizing: border-box;
    }
    #${RULE_POPUP_ID} .fa-ss--disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    #${RULE_POPUP_ID} .fa-ss__input-wrap {
      display: flex;
      align-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f8fafc;
      padding: 4px 8px;
      cursor: pointer;
      gap: 4px;
      transition: border-color 0.15s;
    }
    #${RULE_POPUP_ID} .fa-ss__input-wrap:focus-within {
      border-color: #6366f1;
      background: #fff;
    }
    #${RULE_POPUP_ID} .fa-ss__input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-size: 12px;
      font-family: inherit;
      color: #1e293b;
      padding: 0;
    }
    #${RULE_POPUP_ID} .fa-ss__input::placeholder {
      color: #94a3b8;
    }
    #${RULE_POPUP_ID} .fa-ss__arrow {
      flex-shrink: 0;
      color: #94a3b8;
      font-size: 10px;
      line-height: 1;
      pointer-events: none;
    }
    #${RULE_POPUP_ID} .fa-ss__dropdown {
      position: absolute;
      top: calc(100% + 3px);
      left: 0;
      right: 0;
      z-index: 2147483647;
      max-height: 180px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      padding: 2px 0;
      margin: 0;
      list-style: none;
    }
    #${RULE_POPUP_ID} .fa-ss__dropdown[hidden] { display: none; }
    #${RULE_POPUP_ID} .fa-ss__group {
      padding: 4px 8px 2px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      pointer-events: none;
    }
    #${RULE_POPUP_ID} .fa-ss__opt {
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
      margin: 1px 3px;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
    }
    #${RULE_POPUP_ID} .fa-ss__opt:hover,
    #${RULE_POPUP_ID} .fa-ss__opt--highlighted {
      background: #ede9fe;
      color: #3730a3;
    }
    #${RULE_POPUP_ID} .fa-ss__empty {
      padding: 6px 8px;
      color: #94a3b8;
      font-style: italic;
      font-size: 11px;
      list-style: none;
    }
    #${RULE_POPUP_ID} .fa-ss__value { display: none; }

    /* ── Portal dropdown for rule popup (teleported to document.body) ── */
    .fa-rp-gen-dd {
      z-index: 2147483647;
      max-height: 180px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      padding: 2px 0;
      margin: 0;
      list-style: none;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      box-sizing: border-box;
    }
    .fa-rp-gen-dd[hidden] { display: none; }
    .fa-rp-gen-dd .fa-ss__group {
      padding: 4px 8px 2px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      pointer-events: none;
    }
    .fa-rp-gen-dd .fa-ss__opt {
      padding: 4px 8px;
      cursor: pointer;
      border-radius: 4px;
      margin: 1px 3px;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      list-style: none;
      display: block;
    }
    .fa-rp-gen-dd .fa-ss__opt:hover,
    .fa-rp-gen-dd .fa-ss__opt--highlighted {
      background: #ede9fe;
      color: #3730a3;
    }
    .fa-rp-gen-dd .fa-ss__empty {
      padding: 6px 8px;
      color: #94a3b8;
      font-style: italic;
      font-size: 11px;
      list-style: none;
    }
  `;
  document.head.appendChild(style);
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}
