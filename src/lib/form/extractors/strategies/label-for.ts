/**
 * Label Strategy — label[for=id]
 *
 * Finds a <label> element whose `for` attribute matches the element's id.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const labelForStrategy: LabelStrategy = {
  name: "label[for]",
  find(element: HTMLElement): LabelResult | null {
    if (!element.id) return null;
    const lbl = document.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    );
    const text = lbl?.textContent?.trim();
    return text ? { text, strategy: "label[for]" } : null;
  },
};
