/**
 * Label Strategy — fieldset-legend
 *
 * Finds the nearest <fieldset> ancestor and reads its <legend>.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const fieldsetLegendStrategy: LabelStrategy = {
  name: "fieldset-legend",
  find(element: HTMLElement): LabelResult | null {
    const fieldset = element.closest("fieldset");
    if (!fieldset) return null;
    const legend = fieldset.querySelector("legend");
    const text = legend?.textContent?.trim();
    return text ? { text, strategy: "fieldset-legend" } : null;
  },
};
