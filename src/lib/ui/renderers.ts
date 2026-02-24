/**
 * Shared HTML renderers used across popup, devtools panel, and floating panel.
 *
 * All functions return HTML strings. Each accepts an optional `prefix` parameter
 * for CSS class scoping (e.g. "fa-" for the floating panel injected into page DOM).
 */

import type { DetectedFieldSummary, SavedForm } from "@/types";
import { escapeHtml, escapeAttr } from "./html-utils";
import { TYPE_COLORS, METHOD_COLORS, getConfidenceColor } from "./constants";

// ── Badges ───────────────────────────────────────────────────────────────────

/** Renders a colored badge for a field type. */
export function renderTypeBadge(type: string, prefix = ""): string {
  const color = TYPE_COLORS[type] ?? "#64748b";
  return `<span class="${prefix}type-badge" style="background:${color}">${escapeHtml(type)}</span>`;
}

/** Renders a colored badge for a detection method. */
export function renderMethodBadge(method: string, prefix = ""): string {
  const color = METHOD_COLORS[method] ?? "#334155";
  return `<span class="${prefix}method-badge" style="background:${color};color:#fff">${escapeHtml(method)}</span>`;
}

/** Renders a confidence progress bar with percentage label. */
export function renderConfidenceBadge(
  confidence: number | undefined,
  prefix = "",
): string {
  const conf = confidence ?? 0;
  const percent = Math.round(conf * 100);
  const color = getConfidenceColor(conf);

  return `
    <span class="${prefix}confidence-bar">
      <span class="${prefix}confidence-fill" style="width:${percent}%;background:${color}"></span>
    </span>
    <span style="font-size:10px;color:${color}">${percent}%</span>
  `;
}

// ── Fields Table ─────────────────────────────────────────────────────────────

export interface FieldsTableOptions {
  /** CSS class prefix for scoping (e.g. "fa-") */
  prefix?: string;
  /** Set of ignored selectors */
  ignoredSelectors?: Set<string>;
  /** Show actions column */
  showActions?: boolean;
}

/** Renders the `<thead>` row for the detected-fields table. */
export function renderFieldsTableHeader(
  options: FieldsTableOptions = {},
): string {
  const p = options.prefix ?? "";
  return `
    <thead>
      <tr>
        <th>#</th>
        <th>Tipo</th>
        <th>Método</th>
        <th>Confiança</th>
        <th>ID / Name</th>
        <th>Label</th>
        ${options.showActions !== false ? "<th>Ações</th>" : ""}
      </tr>
    </thead>
  `;
}

/** Renders a single `<tr>` for a detected field. */
export function renderFieldRow(
  field: DetectedFieldSummary,
  index: number,
  options: FieldsTableOptions = {},
): string {
  const p = options.prefix ?? "";
  const isIgnored = options.ignoredSelectors?.has(field.selector) ?? false;
  const displayType = field.contextualType || field.fieldType;
  const method = field.detectionMethod || "-";

  return `
    <tr class="${isIgnored ? `${p}row-ignored` : ""}">
      <td class="${p}cell-num">${index}</td>
      <td>${renderTypeBadge(displayType, p)}</td>
      <td>${renderMethodBadge(method, p)}</td>
      <td>${renderConfidenceBadge(field.detectionConfidence, p)}</td>
      <td class="${p}cell-mono">${escapeHtml(field.id || field.name || "-")}</td>
      <td>${escapeHtml(field.label || "-")}</td>
      ${
        options.showActions !== false
          ? `<td class="${p}cell-actions" data-selector="${escapeAttr(field.selector)}" data-label="${escapeAttr(field.label || field.name || field.id || field.selector)}"></td>`
          : ""
      }
    </tr>
  `;
}

// ── Forms Cards ──────────────────────────────────────────────────────────────

/** Renders a card summarizing a saved form. */
export function renderFormCard(form: SavedForm, prefix = ""): string {
  const fieldCount = Object.keys(form.fields).length;
  const date = new Date(form.updatedAt).toLocaleDateString("pt-BR");

  return `
    <div class="${prefix}form-card" data-form-id="${escapeAttr(form.id)}">
      <div class="${prefix}form-info">
        <span class="${prefix}form-name">${escapeHtml(form.name)}</span>
        <span class="${prefix}form-meta">${fieldCount} campos · ${date}</span>
        <span class="${prefix}form-url">${escapeHtml(form.urlPattern)}</span>
      </div>
      <div class="${prefix}form-actions"></div>
    </div>
  `;
}

// ── Log Entries ──────────────────────────────────────────────────────────────

/** A structured log entry for display. */
export interface LogEntry {
  time: string;
  text: string;
  type: string;
}

/** Renders a single log entry row. */
export function renderLogEntry(entry: LogEntry, prefix = ""): string {
  return `
    <div class="${prefix}log-entry ${prefix}log-${entry.type}">
      <span class="${prefix}log-time">${entry.time}</span>
      <span class="${prefix}log-text">${escapeHtml(entry.text)}</span>
    </div>
  `;
}

// ── Action Cards ─────────────────────────────────────────────────────────────

/** Configuration for an action-card button. */
export interface ActionCardConfig {
  id: string;
  icon: string;
  label: string;
  desc: string;
  variant: "primary" | "secondary" | "outline";
  active?: boolean;
}

/** Renders an action-card button (primary / secondary / outline). */
export function renderActionCard(card: ActionCardConfig, prefix = ""): string {
  const variantClass =
    card.variant === "primary"
      ? `${prefix}card-primary`
      : card.variant === "secondary"
        ? `${prefix}card-secondary`
        : `${prefix}card-outline`;

  const activeClass = card.active ? " active" : "";

  return `
    <button class="${prefix}action-card ${variantClass}${activeClass}" id="${card.id}">
      <span class="${prefix}card-icon">${card.icon}</span>
      <span class="${prefix}card-label">${card.label}</span>
      <span class="${prefix}card-desc">${card.desc}</span>
    </button>
  `;
}

// ── Tab Bar ──────────────────────────────────────────────────────────────────

/** Configuration for a tab in the tab bar. */
export interface TabConfig {
  id: string;
  label: string;
  active?: boolean;
}

/** Renders a horizontal tab bar from tab configs. */
export function renderTabBar(tabs: TabConfig[], prefix = ""): string {
  return tabs
    .map(
      (tab) =>
        `<button class="${prefix}tab ${tab.active ? "active" : ""}" data-tab="${tab.id}">${tab.label}</button>`,
    )
    .join("");
}
