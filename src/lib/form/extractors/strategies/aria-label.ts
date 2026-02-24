/**
 * Label Strategy — aria-label
 *
 * Reads the WAI-ARIA `aria-label` attribute.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const ariaLabelStrategy: LabelStrategy = {
  name: "aria-label",
  find(element: HTMLElement): LabelResult | null {
    const ariaLabel = element.getAttribute("aria-label");
    const text = ariaLabel?.trim();
    return text ? { text, strategy: "aria-label" } : null;
  },
};
