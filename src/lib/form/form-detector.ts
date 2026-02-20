/**
 * Form detector — finds all fillable form fields on the page
 */

import type { FormField, FieldType } from "@/types";
import { classifyField } from "@/lib/ai/tensorflow-generator";
import {
  detectCustomSelects,
  customSelectToFormField,
  type CustomSelectField,
} from "./custom-select-handler";

const INPUT_SELECTOR = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="file"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");

function getUniqueSelector(element: Element): string {
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

function findLabel(element: HTMLElement): string | undefined {
  // 1. Check for associated label via 'for' attribute
  if (element.id) {
    const label = document.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    );
    if (label?.textContent) return label.textContent.trim();
  }

  // 2. Check parent label
  const parentLabel = element.closest("label");
  if (parentLabel?.textContent) return parentLabel.textContent.trim();

  // 3. Check aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // 4. Check aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ref = document.getElementById(ariaLabelledBy);
    if (ref?.textContent) return ref.textContent.trim();
  }

  // 5. Check preceding sibling text
  const prev = element.previousElementSibling;
  if (prev?.tagName === "LABEL" && prev.textContent) {
    return prev.textContent.trim();
  }

  return undefined;
}

function detectFieldTypeFromElement(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): FieldType {
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLTextAreaElement) return "text";

  const type = element.type?.toLowerCase();
  if (type === "checkbox") return "checkbox";
  if (type === "radio") return "radio";
  if (type === "email") return "email";
  if (type === "tel") return "phone";
  if (type === "password") return "password";
  if (type === "number") return "number";
  if (type === "date") return "date";

  return "unknown";
}

export interface DetectionResult {
  fields: FormField[];
  customSelects: CustomSelectField[];
}

export function detectFormFields(): FormField[] {
  return detectAllFields().fields;
}

export function detectAllFields(): DetectionResult {
  const elements = document.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(INPUT_SELECTOR);

  const fields: FormField[] = [];

  for (const element of elements) {
    // Skip invisible elements
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    // Skip inputs inside custom selects (handled separately)
    if (
      element.closest(
        ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete']",
      )
    )
      continue;

    const basicType = detectFieldTypeFromElement(element);
    const label = findLabel(element);

    const field: FormField = {
      element,
      selector: getUniqueSelector(element),
      fieldType: basicType,
      label,
      name: element.name || undefined,
      id: element.id || undefined,
      placeholder:
        ("placeholder" in element ? element.placeholder : undefined) ||
        undefined,
      autocomplete: element.autocomplete || undefined,
      required: element.required,
    };

    // If basic detection returned 'unknown', use TF classifier
    if (field.fieldType === "unknown") {
      field.fieldType = classifyField(field);
    }

    fields.push(field);
  }

  // Detect custom selects (Ant Design, MUI, React Select, etc.)
  const customSelects = detectCustomSelects();

  // Also add custom selects as FormFields for compatibility
  for (const cs of customSelects) {
    fields.push(customSelectToFormField(cs));
  }

  return { fields, customSelects };
}

export function detectForms(): HTMLFormElement[] {
  return Array.from(document.querySelectorAll("form"));
}
