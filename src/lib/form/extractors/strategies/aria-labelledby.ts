/**
 * Label Strategy — aria-labelledby
 *
 * Reads the text from the element referenced by `aria-labelledby`.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const ariaLabelledByStrategy: LabelStrategy = {
  name: "aria-labelledby",
  find(element: HTMLElement): LabelResult | null {
    const ariaLabelledBy = element.getAttribute("aria-labelledby");
    if (!ariaLabelledBy) return null;

    const ref = document.getElementById(ariaLabelledBy);
    const text = ref?.textContent?.trim();
    return text ? { text, strategy: "aria-labelledby" } : null;
  },
};
