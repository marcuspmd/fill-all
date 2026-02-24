/**
 * Label Strategy — parent-label
 *
 * The element is wrapped inside a <label> tag.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const parentLabelStrategy: LabelStrategy = {
  name: "parent-label",
  find(element: HTMLElement): LabelResult | null {
    const parentLabel = element.closest("label");
    const text = parentLabel?.textContent?.trim();
    return text ? { text, strategy: "parent-label" } : null;
  },
};
