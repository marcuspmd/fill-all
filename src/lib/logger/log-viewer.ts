/**
 * Reusable Log Viewer Component
 *
 * Renders log entries with level filter (debug/info/warn/error) and text search.
 * Works in any extension context (content script, devtools, options page).
 *
 * Usage:
 *   const viewer = createLogViewer({ container, variant });
 *   viewer.refresh();   // load entries from log store
 *   viewer.dispose();   // unsubscribe from updates
 */

import type { LogLevel, LogEntry } from "./index";
import { loadLogEntries, clearLogEntries, onLogUpdate } from "./log-store";
import { escapeHtml } from "@/lib/ui/html-utils";

export type LogViewerVariant = "panel" | "devtools" | "options";

export interface LogViewerOptions {
  /** Container element to render into */
  container: HTMLElement;
  /** Visual variant (affects class prefix and CSS expectations) */
  variant: LogViewerVariant;
}

export interface LogViewer {
  /** Re-render with current entries from the store */
  refresh(): Promise<void>;
  /** Unsubscribe from real-time updates */
  dispose(): void;
}

// Map LogLevel to display CSS class
const LEVEL_CSS: Record<LogLevel, string> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

// Display labels for filter buttons
const LEVEL_LABELS: Record<string, string> = {
  all: "All",
  debug: "Debug",
  info: "Info",
  warn: "Warn",
  error: "Error",
};

export function createLogViewer(options: LogViewerOptions): LogViewer {
  const { container, variant } = options;
  let activeFilter: LogLevel | "all" = "all";
  let searchQuery = "";
  let allEntries: LogEntry[] = [];
  let unsubscribe: (() => void) | null = null;

  function filterEntries(): LogEntry[] {
    let filtered = allEntries;

    if (activeFilter !== "all") {
      filtered = filtered.filter((e) => e.level === activeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.msg.toLowerCase().includes(q) || e.ns.toLowerCase().includes(q),
      );
    }

    return filtered;
  }

  function formatTime(ts: string): string {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("pt-BR");
    } catch {
      return ts;
    }
  }

  function renderEntries(entries: LogEntry[]): string {
    if (entries.length === 0) {
      return `<div class="lv-empty">Nenhum log encontrado.</div>`;
    }

    return entries
      .map(
        (entry) => `
      <div class="lv-entry lv-${LEVEL_CSS[entry.level] ?? "info"}">
        <span class="lv-time">${formatTime(entry.ts)}</span>
        <span class="lv-level">${entry.level.toUpperCase()}</span>
        <span class="lv-ns">${escapeHtml(entry.ns)}</span>
        <span class="lv-msg">${escapeHtml(entry.msg)}</span>
      </div>`,
      )
      .join("");
  }

  function render(): void {
    const filtered = filterEntries();
    const filterBtns = (["all", "debug", "info", "warn", "error"] as const)
      .map(
        (level) =>
          `<button class="lv-filter-btn${activeFilter === level ? " active" : ""}" data-level="${level}">${LEVEL_LABELS[level]}</button>`,
      )
      .join("");

    container.innerHTML = `
      <div class="lv-toolbar">
        <div class="lv-filters">${filterBtns}</div>
        <input class="lv-search" type="text" placeholder="Buscar logs..." value="${escapeHtml(searchQuery)}" />
        <button class="lv-clear-btn" title="Limpar todos os logs">🗑️</button>
        <span class="lv-count">${filtered.length}/${allEntries.length}</span>
      </div>
      <div class="lv-entries">${renderEntries(filtered)}</div>
    `;

    // Bind filter buttons
    container
      .querySelectorAll<HTMLButtonElement>(".lv-filter-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          activeFilter = btn.dataset.level as LogLevel | "all";
          render();
        });
      });

    // Bind search input
    const searchInput = container.querySelector<HTMLInputElement>(".lv-search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value;
        render();
      });
      // Re-focus + restore caret position after re-render
      const len = searchInput.value.length;
      searchInput.setSelectionRange(len, len);
    }

    // Bind clear button
    container
      .querySelector(".lv-clear-btn")
      ?.addEventListener("click", async () => {
        await clearLogEntries();
        allEntries = [];
        render();
      });

    // Auto-scroll to bottom
    const entriesEl = container.querySelector(".lv-entries");
    if (entriesEl) {
      entriesEl.scrollTop = entriesEl.scrollHeight;
    }
  }

  async function refresh(): Promise<void> {
    allEntries = await loadLogEntries();
    render();
  }

  function dispose(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  // Subscribe to real-time updates
  unsubscribe = onLogUpdate((entries) => {
    allEntries = entries;
    render();
  });

  return { refresh, dispose };
}

/**
 * Returns CSS for the log viewer. Call once and inject into the page/shadow DOM.
 * @param variant - affects scoping/colors
 */
export function getLogViewerStyles(variant: LogViewerVariant): string {
  const isDark = variant === "panel" || variant === "devtools";

  const bg = isDark ? "#0f172a" : "#ffffff";
  const text = isDark ? "#cbd5e1" : "#1e293b";
  const muted = isDark ? "#475569" : "#64748b";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const filterBg = isDark ? "#1e293b" : "#f1f5f9";
  const filterActive = isDark ? "#4f46e5" : "#4f46e5";
  const inputBg = isDark ? "#1e293b" : "#ffffff";
  const inputBorder = isDark ? "#334155" : "#e2e8f0";

  return `
    .lv-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
    .lv-filters {
      display: flex;
      gap: 4px;
    }
    .lv-filter-btn {
      padding: 3px 10px;
      border: 1px solid ${inputBorder};
      border-radius: 4px;
      background: ${filterBg};
      color: ${text};
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .lv-filter-btn:hover {
      border-color: ${filterActive};
      color: ${filterActive};
    }
    .lv-filter-btn.active {
      background: ${filterActive};
      color: #fff;
      border-color: ${filterActive};
    }
    .lv-search {
      flex: 1;
      min-width: 120px;
      padding: 4px 8px;
      border: 1px solid ${inputBorder};
      border-radius: 4px;
      background: ${inputBg};
      color: ${text};
      font-size: 12px;
      outline: none;
    }
    .lv-search:focus {
      border-color: ${filterActive};
    }
    .lv-clear-btn {
      padding: 3px 8px;
      border: 1px solid ${inputBorder};
      border-radius: 4px;
      background: ${filterBg};
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    .lv-clear-btn:hover {
      border-color: #dc2626;
    }
    .lv-count {
      font-size: 11px;
      color: ${muted};
      white-space: nowrap;
    }
    .lv-entries {
      flex: 1;
      overflow-y: auto;
      font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      font-size: 11px;
      background: ${bg};
      border: 1px solid ${border};
      border-radius: 4px;
      max-height: 500px;
    }
    .lv-entry {
      display: flex;
      gap: 8px;
      padding: 3px 8px;
      border-bottom: 1px solid ${border};
      align-items: baseline;
    }
    .lv-entry:last-child {
      border-bottom: none;
    }
    .lv-entry:hover {
      background: ${hoverBg};
    }
    .lv-time {
      color: ${muted};
      flex-shrink: 0;
      min-width: 65px;
    }
    .lv-level {
      flex-shrink: 0;
      min-width: 40px;
      font-weight: 600;
      font-size: 10px;
    }
    .lv-ns {
      color: ${muted};
      flex-shrink: 0;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lv-msg {
      color: ${text};
      word-break: break-word;
    }
    .lv-empty {
      text-align: center;
      padding: 32px;
      color: ${muted};
      font-size: 13px;
    }
    /* Level colors */
    .lv-debug .lv-level { color: ${muted}; }
    .lv-info .lv-level { color: ${isDark ? "#a5b4fc" : "#4f46e5"}; }
    .lv-info .lv-msg { color: ${isDark ? "#a5b4fc" : "#4f46e5"}; }
    .lv-warn .lv-level { color: ${isDark ? "#fbbf24" : "#d97706"}; }
    .lv-warn .lv-msg { color: ${isDark ? "#fbbf24" : "#d97706"}; }
    .lv-error .lv-level { color: ${isDark ? "#f87171" : "#dc2626"}; }
    .lv-error .lv-msg { color: ${isDark ? "#f87171" : "#dc2626"}; }
  `;
}
