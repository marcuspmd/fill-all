/**
 * Shared utilities for the Options page.
 */

import { FIELD_TYPES, type FieldType } from "@/types";
import {
  getFieldTypeLabel,
  getFieldTypeOptions,
  getFieldTypeGroupedOptions,
} from "@/lib/shared/field-type-catalog";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export function initTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(".tab"));
  const contents = Array.from(
    document.querySelectorAll<HTMLElement>(".tab-content"),
  );

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const t of tabs) t.classList.remove("active");
      for (const c of contents) c.classList.remove("active");

      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      if (!tabId) return;
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add("active");
    });
  }
}

function buildOptionEntries(types: readonly FieldType[]): Array<{
  value: FieldType;
  label: string;
}> {
  return getFieldTypeOptions(types);
}

function buildOptionsHtml(
  types: readonly FieldType[],
  selected?: string,
): string {
  return getFieldTypeGroupedOptions(types)
    .map(
      (group) =>
        `<optgroup label="${group.label}">${group.options
          .map(
            (entry) =>
              `<option value="${entry.value}"${entry.value === selected ? " selected" : ""}>${entry.label}</option>`,
          )
          .join("")}</optgroup>`,
    )
    .join("");
}

export function syncFieldTypeOptionsInOptionsPage(): void {
  const ruleTypeSelect = document.getElementById(
    "rule-type",
  ) as HTMLSelectElement | null;
  const ruleGeneratorSelect = document.getElementById(
    "rule-generator",
  ) as HTMLSelectElement | null;
  const datasetTypeSelect = document.getElementById(
    "dataset-type",
  ) as HTMLSelectElement | null;

  if (ruleTypeSelect) {
    const selected = ruleTypeSelect.value;
    ruleTypeSelect.innerHTML = buildOptionsHtml(FIELD_TYPES, selected);
  }

  if (ruleGeneratorSelect) {
    const selected = ruleGeneratorSelect.value || "auto";
    const groupedFieldTypeOptions = getFieldTypeGroupedOptions(FIELD_TYPES)
      .map(
        (group) =>
          `<optgroup label="${group.label}">${group.options
            .map(
              (entry) =>
                `<option value="${entry.value}"${entry.value === selected ? " selected" : ""}>${entry.label}</option>`,
            )
            .join("")}</optgroup>`,
      )
      .join("");

    ruleGeneratorSelect.innerHTML = [
      `<option value="auto"${selected === "auto" ? " selected" : ""}>Automático</option>`,
      `<option value="ai"${selected === "ai" ? " selected" : ""}>Chrome AI</option>`,
      `<option value="tensorflow"${selected === "tensorflow" ? " selected" : ""}>TensorFlow.js</option>`,
      groupedFieldTypeOptions,
    ].join("");
    if (["auto", "ai", "tensorflow"].includes(selected)) {
      ruleGeneratorSelect.value = selected;
    }
  }

  if (datasetTypeSelect) {
    const selected = datasetTypeSelect.value;
    datasetTypeSelect.innerHTML = buildOptionsHtml(FIELD_TYPES, selected);
  }
}
