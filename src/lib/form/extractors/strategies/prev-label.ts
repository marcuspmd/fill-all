/**
 * Label Strategy — prev-label
 *
 * Checks if the immediately preceding sibling is a <label>.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const prevLabelStrategy: LabelStrategy = {
  name: "prev-label",
  find(element: HTMLElement): LabelResult | null {
    const prev = element.previousElementSibling;
    if (prev?.tagName !== "LABEL") return null;
    const text = prev.textContent?.trim();
    return text ? { text, strategy: "prev-label" } : null;
  },
};
