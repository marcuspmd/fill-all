/**
 * Native Input Configuration
 *
 * Shared selectors, filters and the field builder used by collectNativeFields()
 * in classifiers.ts (Steps 1–3: collect → filter → extract).
 *
 * Keeping these separate from classifiers.ts avoids polluting the classifier
 * registry with DOM-querying concerns.
 */

import type { FormField } from "@/types";
import {
  getUniqueSelector,
  findLabelWithStrategy,
  buildSignals,
} from "../extractors";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NativeElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

// ── Step 1: Selectors ─────────────────────────────────────────────────────────

/** CSS selector that targets all native form controls (excluding hidden/submit/etc). */
export const INPUT_SELECTOR = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="file"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");

/** Ancestor selector for custom-select components (Ant, MUI, React Select, etc.). */
export const CUSTOM_SELECT_ANCESTOR =
  ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete']";

// ── Step 2: Filters ───────────────────────────────────────────────────────────

/** Skips zero-size elements (hidden / collapsed). */
export function isVisible(el: NativeElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

/** Skips elements that are children of custom-select components. */
export function isNotCustomSelect(el: NativeElement): boolean {
  return !el.closest(CUSTOM_SELECT_ANCESTOR);
}

// ── Step 3: Builder ───────────────────────────────────────────────────────────

/**
 * Builds a bare FormField from a native DOM element.
 * Extracts selector, label, DOM metadata and context signals — no classification yet.
 */
export function buildNativeField(element: NativeElement): FormField {
  const labelResult = findLabelWithStrategy(element);

  // ── DOM metadata ────────────────────────────────────────────────────────────
  const inputType =
    element instanceof HTMLInputElement ? element.type : undefined;
  const pattern =
    element instanceof HTMLInputElement && element.pattern
      ? element.pattern
      : undefined;
  const maxLength =
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement) &&
    element.maxLength > 0
      ? element.maxLength
      : undefined;
  const minLength =
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement) &&
    element.minLength > 0
      ? element.minLength
      : undefined;

  // ── Select options ──────────────────────────────────────────────────────────
  const options =
    element instanceof HTMLSelectElement
      ? Array.from(element.options)
          .filter((o) => o.value !== "")
          .map((o) => ({ value: o.value, text: o.text.trim() }))
      : undefined;

  // ── Checkbox / Radio ────────────────────────────────────────────────────────
  const isCheckable =
    element instanceof HTMLInputElement &&
    (element.type === "checkbox" || element.type === "radio");
  const checkboxValue = isCheckable
    ? (element as HTMLInputElement).value || undefined
    : undefined;
  const checkboxChecked = isCheckable
    ? (element as HTMLInputElement).checked
    : undefined;

  const field: FormField = {
    element,
    selector: getUniqueSelector(element),
    category: "unknown",
    fieldType: "unknown",
    label: labelResult?.text,
    name: element.name || undefined,
    id: element.id || undefined,
    placeholder:
      ("placeholder" in element ? element.placeholder : undefined) || undefined,
    autocomplete: element.autocomplete || undefined,
    inputType,
    required: element.required,
    pattern,
    maxLength,
    minLength,
    options,
    checkboxValue,
    checkboxChecked,
  };
  field.contextSignals = buildSignals(field);
  return field;
}
