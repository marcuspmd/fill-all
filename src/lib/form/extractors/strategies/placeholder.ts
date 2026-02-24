/**
 * Label Strategy — placeholder
 *
 * Last resort: reads the `placeholder` attribute from inputs/textareas.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const placeholderStrategy: LabelStrategy = {
  name: "placeholder",
  find(element: HTMLElement): LabelResult | null {
    const placeholder =
      "placeholder" in element
        ? (element as HTMLInputElement).placeholder
        : undefined;
    const text = placeholder?.trim();
    return text ? { text, strategy: "placeholder" } : null;
  },
};
