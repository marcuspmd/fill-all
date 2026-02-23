/**
 * Label Strategy — prev-sibling-text
 *
 * Walks backwards through preceding siblings looking for a short text node
 * (span, div, p, strong, em) with fewer than 80 characters.
 */

import type { LabelResult, LabelStrategy } from "../label-strategy.interface";

const LABEL_LIKE_TAGS = new Set(["span", "div", "p", "strong", "em"]);

export const prevSiblingTextStrategy: LabelStrategy = {
  name: "prev-sibling-text",
  find(element: HTMLElement): LabelResult | null {
    let sibling: Element | null = element.previousElementSibling;

    while (sibling) {
      const tag = sibling.tagName.toLowerCase();
      if (LABEL_LIKE_TAGS.has(tag) && sibling.textContent) {
        const text = sibling.textContent.trim();
        if (text.length > 0 && text.length < 80) {
          return { text, strategy: "prev-sibling-text" };
        }
      }
      sibling = sibling.previousElementSibling;
    }

    return null;
  },
};
