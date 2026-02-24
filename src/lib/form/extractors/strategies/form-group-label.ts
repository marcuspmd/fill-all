/**
 * Label Strategy — form-group-label
 *
 * Finds labels in framework-specific form group containers
 * (Ant Design, MUI, Bootstrap, generic .form-group, etc.).
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

/** CSS selectors for common form group containers */
const FORM_GROUP_SELECTORS = [
  ".form-group",
  ".form-item",
  ".form-field",
  ".field-wrapper",
  ".input-wrapper",
  "[class*='form-control']",
  ".ant-form-item",
  ".MuiFormControl-root",
].join(", ");

/** CSS selectors for label elements within a form group */
const GROUP_LABEL_SELECTORS = [
  "label",
  ".form-label",
  ".control-label",
  ".ant-form-item-label > label",
  ".MuiInputLabel-root",
  ".MuiFormLabel-root",
].join(", ");

export const formGroupLabelStrategy: LabelStrategy = {
  name: "form-group-label",
  find(element: HTMLElement): LabelResult | null {
    const formGroup = element.closest(FORM_GROUP_SELECTORS);
    if (!formGroup) return null;

    const lbl = formGroup.querySelector<HTMLElement>(GROUP_LABEL_SELECTORS);
    const text = lbl?.textContent?.trim();
    return text ? { text, strategy: "form-group-label" } : null;
  },
};
