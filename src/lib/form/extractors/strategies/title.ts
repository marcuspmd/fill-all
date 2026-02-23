/**
 * Label Strategy — title
 *
 * Reads the HTML `title` attribute.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

export const titleStrategy: LabelStrategy = {
  name: "title",
  find(element: HTMLElement): LabelResult | null {
    const title = element.getAttribute("title");
    const text = title?.trim();
    return text ? { text, strategy: "title" } : null;
  },
};
