/**
 * Label Strategy Interface
 *
 * Each strategy knows how to find a label for a given element
 * using one specific technique (e.g. label[for], aria-label, framework-specific).
 */

export type LabelStrategyName =
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
  strategy: LabelStrategyName;
}

export interface LabelStrategy {
  readonly name: LabelStrategyName;
  find(element: HTMLElement): LabelResult | null;
}
