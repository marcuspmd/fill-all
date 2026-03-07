/**
 * Panel Utils — Pure helpers and shared utilities for the DevTools panel.
 */

import { createLogger } from "@/lib/logger";
import { t } from "@/lib/i18n";
import { getFieldTypeGroupedOptions } from "@/lib/shared/field-type-catalog";
import { FIELD_TYPES } from "@/types";
import { panelState } from "./panel-state";

// ── Logger ────────────────────────────────────────────────────────────────────

const log = createLogger("DevToolsPanel");

const LOG_TYPE_MAP: Record<string, "info" | "warn" | "error" | "debug"> = {
  info: "info",
  success: "info",
  error: "error",
  warn: "warn",
};

export function addLog(
  text: string,
  type: "info" | "success" | "error" | "warn" = "info",
): void {
  const level = LOG_TYPE_MAP[type] ?? "info";
  log[level](text);
}

// ── DOM Helpers ───────────────────────────────────────────────────────────────

export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Status Bar ────────────────────────────────────────────────────────────────

export function updateStatusBar(): void {
  const bar = document.getElementById("status-bar");
  if (!bar) return;
  bar.textContent =
    panelState.detectedFields.length > 0
      ? `${panelState.detectedFields.length} ${t("fieldsDetected")}`
      : t("noFieldsDetected");
}

// ── Field Type Select Options ─────────────────────────────────────────────────

export function buildGroupedFieldTypeOptions(selected?: string): string {
  return getFieldTypeGroupedOptions(FIELD_TYPES)
    .map(
      (group) =>
        `<optgroup label="${group.label}">${group.options
          .map(
            (entry) =>
              `<option value="${entry.value}"${
                entry.value === selected ? " selected" : ""
              }>${entry.label} (${entry.value})</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
}

// ── Record Step Icons ─────────────────────────────────────────────────────────

export const STEP_ICONS: Record<string, string> = {
  fill: "edit_note",
  click: "ads_click",
  select: "list",
  check: "check_box",
  uncheck: "check_box_outline_blank",
  submit: "send",
  assert: "verified",
  wait: "schedule",
  navigate: "link",
  scroll: "swap_vert",
};
