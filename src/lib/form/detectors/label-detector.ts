/**
 * Label Detector
 *
 * Discovers the human-readable label for a form field using 10 strategies,
 * from most to least specific:
 *
 *  1. label[for=id]          — explicit for/id association
 *  2. parent-label           — field is wrapped inside <label>
 *  3. aria-label             — WAI-ARIA attribute
 *  4. aria-labelledby        — WAI-ARIA reference
 *  5. prev-label             — preceding sibling is <label>
 *  6. title                  — HTML title attribute
 *  7. fieldset-legend        — nearest <fieldset> / <legend>
 *  8. form-group-label       — nearest .form-group / framework label
 *  9. prev-sibling-text      — nearby short text node
 * 10. placeholder            — last resort, input placeholder
 */

export type LabelStrategy =
  | "label[for]"
  | "parent-label"
  | "aria-label"
  | "aria-labelledby"
  | "prev-label"
  | "title"
  | "fieldset-legend"
  | "form-group-label"
  | "prev-sibling-text"
  | "placeholder";

export interface LabelResult {
  text: string;
  strategy: LabelStrategy;
}

import type { Detector } from "./detector.interface";

export function findLabelWithStrategy(
  element: HTMLElement,
): LabelResult | undefined {
  // 1. label[for=id]
  if (element.id) {
    const lbl = document.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    );
    if (lbl?.textContent?.trim())
      return { text: lbl.textContent.trim(), strategy: "label[for]" };
  }

  // 2. parent <label>
  const parentLabel = element.closest("label");
  if (parentLabel?.textContent?.trim())
    return { text: parentLabel.textContent.trim(), strategy: "parent-label" };

  // 3. aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel?.trim())
    return { text: ariaLabel.trim(), strategy: "aria-label" };

  // 4. aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ref = document.getElementById(ariaLabelledBy);
    if (ref?.textContent?.trim())
      return { text: ref.textContent.trim(), strategy: "aria-labelledby" };
  }

  // 5. preceding sibling <label>
  const prev = element.previousElementSibling;
  if (prev?.tagName === "LABEL" && prev.textContent?.trim())
    return { text: prev.textContent.trim(), strategy: "prev-label" };

  // 6. title attribute
  const title = element.getAttribute("title");
  if (title?.trim()) return { text: title.trim(), strategy: "title" };

  // 7. fieldset > legend
  const fieldset = element.closest("fieldset");
  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend?.textContent?.trim())
      return { text: legend.textContent.trim(), strategy: "fieldset-legend" };
  }

  // 8. nearest .form-group / .form-item label/span
  const formGroup = element.closest(
    ".form-group, .form-item, .form-field, .field-wrapper, .input-wrapper, [class*='form-control'], .ant-form-item, .MuiFormControl-root",
  );
  if (formGroup) {
    const lbl = formGroup.querySelector<HTMLElement>(
      "label, .form-label, .control-label, .ant-form-item-label > label, .MuiInputLabel-root, .MuiFormLabel-root",
    );
    if (lbl?.textContent?.trim())
      return { text: lbl.textContent.trim(), strategy: "form-group-label" };
  }

  // 9. nearest preceding sibling span/div with short text (< 80 chars)
  let sibling: Element | null = element.previousElementSibling;
  while (sibling) {
    const tag = sibling.tagName.toLowerCase();
    if (
      ["span", "div", "p", "strong", "em"].includes(tag) &&
      sibling.textContent
    ) {
      const text = sibling.textContent.trim();
      if (text.length > 0 && text.length < 80)
        return { text, strategy: "prev-sibling-text" };
    }
    sibling = sibling.previousElementSibling;
  }

  // 10. placeholder as last resort
  const placeholder =
    "placeholder" in element
      ? (element as HTMLInputElement).placeholder
      : undefined;
  if (placeholder?.trim())
    return { text: placeholder.trim(), strategy: "placeholder" };

  return undefined;
}

export function findLabel(element: HTMLElement): string | undefined {
  return findLabelWithStrategy(element)?.text;
}

/** Detector object — wraps {@link findLabelWithStrategy} under the common Detector contract. */
export const labelDetector: Detector<HTMLElement, LabelResult | undefined> = {
  name: "label",
  detect: findLabelWithStrategy,
};
