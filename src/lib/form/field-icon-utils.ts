/**
 * Field Icon — shared utility functions
 */

import type { FormField, FieldType } from "@/types";
import { DEFAULT_PIPELINE } from "./detectors/classifiers";

/** Selectors whose descendants are custom-select components */
const CUSTOM_SELECT_ANCESTOR =
  ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete'], [class*='select2']";

export const ALL_FIELD_TYPES: FieldType[] = [
  "cpf",
  "cnpj",
  "rg",
  "email",
  "phone",
  "full-name",
  "first-name",
  "last-name",
  "name",
  "address",
  "street",
  "city",
  "state",
  "cep",
  "zip-code",
  "date",
  "birth-date",
  "password",
  "username",
  "company",
  "money",
  "number",
  "text",
  "select",
  "checkbox",
  "radio",
  "unknown",
];

export function isFillableField(el: HTMLElement): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    const skip = ["hidden", "submit", "button", "image", "reset", "file"];
    return !skip.includes(el.type) && !el.disabled;
  }
  return false;
}

export function getUniqueSelector(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}

export function findLabel(element: HTMLElement): string | undefined {
  if (element.id) {
    const label = document.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    );
    if (label?.textContent) return label.textContent.trim();
  }

  const parentLabel = element.closest("label");
  if (parentLabel?.textContent) return parentLabel.textContent.trim();

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  return undefined;
}

export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds a FormField from a DOM element, classifying it via the detection pipeline (sync).
 */
export function buildFormField(
  el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): FormField {
  const field: FormField = {
    element: el,
    selector: getUniqueSelector(el),
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

  field.contextSignals = [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  // Custom-select ancestry overrides all keyword matching
  const isInsideCustomSelect = !!el.closest(CUSTOM_SELECT_ANCESTOR);
  const isCombobox = el.getAttribute("role") === "combobox";
  if (isInsideCustomSelect || isCombobox) {
    field.fieldType = "select";
    field.detectionMethod = "custom-select";
    field.detectionConfidence = 1.0;
    return field;
  }

  // Classify using the same pipeline as the popup (sync)
  const pipelineResult = DEFAULT_PIPELINE.run(field);
  field.fieldType = pipelineResult.type;
  field.detectionMethod = pipelineResult.method;
  field.detectionConfidence = pipelineResult.confidence;

  return field;
}
