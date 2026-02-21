/**
 * Selector Builder
 *
 * Builds a unique CSS selector for a given DOM element.
 * Used to identify fields reliably across page re-renders.
 */

import type { Detector } from "./detector.interface";

export function getUniqueSelector(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}

/** Detector object — wraps {@link getUniqueSelector} under the common Detector contract. */
export const selectorBuilder: Detector<Element, string> = {
  name: "selector",
  detect: getUniqueSelector,
};
