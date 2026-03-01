/**
 * Progress Notification
 *
 * Renders a fixed-position panel that shows real-time, per-field feedback
 * during detection and filling. Each field appears as a mini status line
 * with an icon indicating which strategy was used (AI, TF.js, keyword, etc.).
 *
 * Usage:
 *   const progress = createProgressNotification();
 *   progress.show();
 *   progress.addDetecting(field);
 *   progress.updateDetected(field);
 *   progress.addFilling(field);
 *   progress.updateFilled(field, result);
 *   progress.updateError(field, error);
 *   progress.done(totalFilled);
 */

import type { FormField, GenerationResult } from "@/types";
import { t } from "@/lib/i18n";

const CONTAINER_ID = "fill-all-progress";
const STYLE_ID = "fill-all-progress-styles";
const AUTO_HIDE_MS = 4000;

/** Icon per detection strategy */
const METHOD_ICON: Record<string, string> = {
  "html-type": "⚡",
  keyword: "🔑",
  tensorflow: "🧠",
  "chrome-ai": "✨",
  "html-fallback": "❓",
  "custom-select": "📋",
  interactive: "🎛",
  "user-override": "👤",
};

/** Icon per fill source */
const SOURCE_ICON: Record<string, string> = {
  fixed: "📌",
  rule: "📏",
  ai: "✨",
  tensorflow: "🧠",
  generator: "⚙️",
};

export interface ProgressNotification {
  show(): void;
  /** Add field — shows spinner while detecting */
  addDetecting(field: FormField): void;
  /** Update field — detection done, shows type badge */
  updateDetected(field: FormField): void;
  /** Mark field as filling — shows spinner */
  addFilling(field: FormField): void;
  /** Update field — fill done */
  updateFilled(field: FormField, result: GenerationResult): void;
  /** Mark field as errored */
  updateError(field: FormField, error?: string): void;
  /** Show final summary and auto-hide */
  done(totalFilled: number, totalFields: number): void;
  /** Remove immediately */
  destroy(): void;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${CONTAINER_ID} {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483646;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #e2e8f0;
      background: #1e1b4b;
      border: 1px solid rgba(99, 102, 241, 0.4);
      border-radius: 10px;
      padding: 10px 14px;
      min-width: 260px;
      max-width: 360px;
      max-height: 320px;
      overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: opacity 0.3s ease, transform 0.3s ease;
      opacity: 0;
      transform: translateY(12px);
    }
    #${CONTAINER_ID}.fa-progress-visible {
      opacity: 1;
      transform: translateY(0);
    }
    #${CONTAINER_ID} .fa-progress-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #a5b4fc;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    }
    #${CONTAINER_ID} .fa-progress-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 0;
      font-size: 11px;
      line-height: 1.3;
      transition: opacity 0.2s ease;
    }
    #${CONTAINER_ID} .fa-progress-item .fa-progress-icon {
      flex-shrink: 0;
      width: 16px;
      text-align: center;
      font-size: 10px;
    }
    #${CONTAINER_ID} .fa-progress-item .fa-progress-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 180px;
    }
    #${CONTAINER_ID} .fa-progress-item .fa-progress-badge {
      flex-shrink: 0;
      font-size: 9px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    #${CONTAINER_ID} .fa-progress-item.detecting .fa-progress-badge {
      background: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }
    #${CONTAINER_ID} .fa-progress-item.detected .fa-progress-badge {
      background: rgba(34, 197, 94, 0.3);
      color: #86efac;
    }
    #${CONTAINER_ID} .fa-progress-item.filling .fa-progress-badge {
      background: rgba(234, 179, 8, 0.3);
      color: #fde047;
    }
    #${CONTAINER_ID} .fa-progress-item.filled .fa-progress-badge {
      background: rgba(34, 197, 94, 0.3);
      color: #86efac;
    }
    #${CONTAINER_ID} .fa-progress-item.error .fa-progress-badge {
      background: rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    #${CONTAINER_ID} .fa-progress-summary {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px solid rgba(99, 102, 241, 0.2);
      font-weight: 600;
      font-size: 11px;
      color: #86efac;
    }
    @keyframes fa-spin {
      to { transform: rotate(360deg); }
    }
    #${CONTAINER_ID} .fa-spinner {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 2px solid rgba(165, 180, 252, 0.3);
      border-top-color: #a5b4fc;
      border-radius: 50%;
      animation: fa-spin 0.6s linear infinite;
    }
    #${CONTAINER_ID} .fa-spinner.ai {
      border-top-color: #fbbf24;
    }
  `;
  document.head.appendChild(style);
}

function getFieldLabel(field: FormField): string {
  return (
    field.label ?? field.name ?? field.id ?? field.fieldType ?? field.selector
  );
}

function escapeTextContent(text: string): string {
  const div = document.createElement("span");
  div.textContent = text;
  return div.innerHTML;
}

export function createProgressNotification(): ProgressNotification {
  ensureStyles();

  // Remove existing
  document.getElementById(CONTAINER_ID)?.remove();

  const container = document.createElement("div");
  container.id = CONTAINER_ID;

  const header = document.createElement("div");
  header.className = "fa-progress-header";
  header.textContent = t("progressHeaderProcessing");
  container.appendChild(header);

  const list = document.createElement("div");
  list.className = "fa-progress-list";
  container.appendChild(list);

  document.body.appendChild(container);

  const fieldItems = new Map<string, HTMLElement>();
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function getOrCreateItem(field: FormField): HTMLElement {
    const key = field.selector;
    let item = fieldItems.get(key);
    if (!item) {
      item = document.createElement("div");
      item.className = "fa-progress-item";
      list.appendChild(item);
      fieldItems.set(key, item);
      // Auto-scroll to bottom
      container.scrollTop = container.scrollHeight;
    }
    return item;
  }

  return {
    show() {
      requestAnimationFrame(() => {
        container.classList.add("fa-progress-visible");
      });
    },

    addDetecting(field: FormField) {
      const item = getOrCreateItem(field);
      const label = escapeTextContent(getFieldLabel(field));
      const isAi =
        field.detectionMethod === "chrome-ai" ||
        field.detectionMethod === "tensorflow";
      item.className = "fa-progress-item detecting";
      item.innerHTML = `
        <span class="fa-progress-icon"><span class="fa-spinner${isAi ? " ai" : ""}"></span></span>
        <span class="fa-progress-label">${label}</span>
        <span class="fa-progress-badge">${escapeTextContent(t("progressDetecting"))}</span>
      `;
    },

    updateDetected(field: FormField) {
      const item = getOrCreateItem(field);
      const label = escapeTextContent(getFieldLabel(field));
      const method = field.detectionMethod ?? "html-fallback";
      const icon = METHOD_ICON[method] ?? "🔍";
      item.className = "fa-progress-item detected";
      item.innerHTML = `
        <span class="fa-progress-icon">${icon}</span>
        <span class="fa-progress-label">${label}</span>
        <span class="fa-progress-badge">${escapeTextContent(field.fieldType)} ${escapeTextContent(method)}</span>
      `;
    },

    addFilling(field: FormField) {
      const item = getOrCreateItem(field);
      const label = escapeTextContent(getFieldLabel(field));
      const method = field.detectionMethod ?? "html-fallback";
      const methodIcon = METHOD_ICON[method] ?? "🔍";
      item.className = "fa-progress-item filling";
      item.innerHTML = `
        <span class="fa-progress-icon"><span class="fa-spinner ai"></span></span>
        <span class="fa-progress-label">${methodIcon} ${label}</span>
        <span class="fa-progress-badge">${escapeTextContent(t("progressFilling"))}</span>
      `;
    },

    updateFilled(field: FormField, result: GenerationResult) {
      const item = getOrCreateItem(field);
      const label = escapeTextContent(getFieldLabel(field));
      const sourceIcon = SOURCE_ICON[result.source] ?? "✅";
      const valuePrev = escapeTextContent(
        result.value.length > 20
          ? result.value.slice(0, 20) + "…"
          : result.value,
      );
      item.className = "fa-progress-item filled";
      item.innerHTML = `
        <span class="fa-progress-icon">${sourceIcon}</span>
        <span class="fa-progress-label">${label}</span>
        <span class="fa-progress-badge">✓ ${valuePrev}</span>
      `;
    },

    updateError(field: FormField, error?: string) {
      const item = getOrCreateItem(field);
      const label = escapeTextContent(getFieldLabel(field));
      const errorMsg = error
        ? escapeTextContent(error.slice(0, 30))
        : t("progressFailed");
      item.className = "fa-progress-item error";
      item.innerHTML = `
        <span class="fa-progress-icon">❌</span>
        <span class="fa-progress-label">${label}</span>
        <span class="fa-progress-badge">${errorMsg}</span>
      `;
    },

    done(totalFilled: number, totalFields: number) {
      header.textContent = t("progressHeaderDone");

      const summary = document.createElement("div");
      summary.className = "fa-progress-summary";
      summary.textContent = t("progressSummary", [
        String(totalFilled),
        String(totalFields),
      ]);
      container.appendChild(summary);

      hideTimer = setTimeout(() => {
        container.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        container.style.opacity = "0";
        container.style.transform = "translateY(12px)";
        setTimeout(() => container.remove(), 500);
      }, AUTO_HIDE_MS);
    },

    destroy() {
      if (hideTimer) clearTimeout(hideTimer);
      container.remove();
    },
  };
}
