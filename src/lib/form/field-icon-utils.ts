/**
 * Field Icon — shared utility functions
 *
 * Extraction logic (getUniqueSelector, findLabel, buildSignals) is now
 * centralised in `@/lib/form/extractors`. This file re-exports the
 * functions that field-icon modules still need, plus UI helpers.
 */

import { FIELD_TYPES, type FormField, type FieldType } from "@/types";
import { DEFAULT_PIPELINE } from "./detectors/classifiers";
import { getUniqueSelector, findLabel, buildSignals } from "./extractors";

// Re-export so existing consumers keep working
export { getUniqueSelector, findLabel };

/** Selectors whose descendants are custom-select components */
const CUSTOM_SELECT_ANCESTOR =
  ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete'], [class*='select2']";

export const ALL_FIELD_TYPES: FieldType[] = [...FIELD_TYPES];

export function isFillableField(el: HTMLElement): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    const skip = ["hidden", "submit", "button", "image", "reset", "file"];
    return !skip.includes(el.type) && !el.disabled;
  }
  return false;
}

export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds a FormField from a DOM element, classifying it via the detection pipeline.
 */
export async function buildFormField(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): Promise<FormField> {
  const field: FormField = {
    element: el,
    selector: getUniqueSelector(el),
    category: "unknown",
    fieldType: "unknown",
    label: findLabel(el),
    name: el.name || undefined,
    id: el.id || undefined,
    placeholder:
      ("placeholder" in el ? el.placeholder : undefined) || undefined,
    autocomplete: el.autocomplete || undefined,
    required: el.required,
    detectionMethod: "html-type",
    detectionConfidence: 0.5,
  };

  field.contextSignals = buildSignals(field);

  // Custom-select ancestry overrides all keyword matching
  const isInsideCustomSelect = !!el.closest(CUSTOM_SELECT_ANCESTOR);
  const isCombobox = el.getAttribute("role") === "combobox";
  if (isInsideCustomSelect || isCombobox) {
    field.fieldType = "select";
    field.detectionMethod = "custom-select";
    field.detectionConfidence = 1.0;
    return field;
  }

  const pipelineResult = await DEFAULT_PIPELINE.runAsync(field);
  field.fieldType = pipelineResult.type;
  field.detectionMethod = pipelineResult.method;
  field.detectionConfidence = pipelineResult.confidence;

  return field;
}
