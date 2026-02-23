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
    /* ── Rule Popup ──────────────────────────────────────────────────── */
    #${RULE_POPUP_ID} {
      position: absolute;
      z-index: 2147483646;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      width: 264px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      overflow: hidden;
      display: none;
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    #${RULE_POPUP_ID} .fa-rp-header {
      padding: 8px 12px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: #fff;
      font-weight: 700;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #${RULE_POPUP_ID} .fa-rp-body {
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #${RULE_POPUP_ID} .fa-rp-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    #${RULE_POPUP_ID} .fa-rp-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    #${RULE_POPUP_ID} .fa-rp-input,
    #${RULE_POPUP_ID} .fa-rp-select {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 12px;
      font-family: inherit;
      color: #1e293b;
      background: #f8fafc;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-input:focus,
    #${RULE_POPUP_ID} .fa-rp-select:focus {
      border-color: #6366f1;
      background: #fff;
    }
    #${RULE_POPUP_ID} .fa-rp-actions {
      display: flex;
      gap: 6px;
      margin-top: 2px;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary {
      flex: 1;
      padding: 6px 10px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:hover {
      background: #4338ca;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-primary:disabled {
      background: #16a34a;
      cursor: default;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-cancel {
      padding: 6px 12px;
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      transition: background 0.15s;
    }
    #${RULE_POPUP_ID} .fa-rp-btn-cancel:hover {
      background: #f1f5f9;
    }
  `;
  document.head.appendChild(style);
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove();
}
