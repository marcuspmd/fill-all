/**
 * Smart Selector Extractor
 *
 * Extracts multiple selector candidates for an element, ordered by
 * resilience (most stable first):
 *   1. [data-testid] / [data-test-id] / [data-cy]
 *   2. aria-label / aria-labelledby
 *   3. role + accessible name
 *   4. [name] attribute
 *   5. #id
 *   6. [placeholder]
 *   7. Fallback CSS (tag + nth-of-type chain)
 *
 * Runs in content-script context (DOM access required).
 */

import type { SmartSelector, SelectorStrategy } from "./e2e-export.types";

function escapeCSS(value: string): string {
  return CSS.escape(value);
}

function tryDataTestId(el: Element): SmartSelector | null {
  const attrs = ["data-testid", "data-test-id", "data-cy", "data-test"];
  for (const attr of attrs) {
    const val = el.getAttribute(attr);
    if (val) {
      return {
        value: `[${attr}="${escapeCSS(val)}"]`,
        strategy: "data-testid",
        description: `${attr}="${val}"`,
      };
    }
  }
  return null;
}

function tryAriaLabel(el: Element): SmartSelector | null {
  const label = el.getAttribute("aria-label");
  if (label) {
    return {
      value: `[aria-label="${escapeCSS(label)}"]`,
      strategy: "aria-label",
      description: `aria-label="${label}"`,
    };
  }

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = el.ownerDocument.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) {
      return {
        value: `[aria-labelledby="${escapeCSS(labelledBy)}"]`,
        strategy: "aria-label",
        description: `aria-labelledby → "${labelEl.textContent.trim()}"`,
      };
    }
  }
  return null;
}

function tryRole(el: Element): SmartSelector | null {
  const role = el.getAttribute("role");
  if (!role) return null;

  const name = el.getAttribute("aria-label") ?? el.getAttribute("name") ?? "";
  if (name) {
    return {
      value: `[role="${escapeCSS(role)}"][aria-label="${escapeCSS(name)}"]`,
      strategy: "role",
      description: `role="${role}" name="${name}"`,
    };
  }

  return {
    value: `[role="${escapeCSS(role)}"]`,
    strategy: "role",
    description: `role="${role}"`,
  };
}

function tryName(el: Element): SmartSelector | null {
  const name = el.getAttribute("name");
  if (!name) return null;

  const tag = el.tagName.toLowerCase();
  return {
    value: `${tag}[name="${escapeCSS(name)}"]`,
    strategy: "name",
    description: `name="${name}"`,
  };
}

function tryId(el: Element): SmartSelector | null {
  if (!el.id) return null;

  // Skip auto-generated IDs (common patterns: :r0:, react-xxx, ember123, etc.)
  if (/^:r\d|^(react|ember|ng-|js-)[\w-]*\d/i.test(el.id)) return null;

  return {
    value: `#${escapeCSS(el.id)}`,
    strategy: "id",
    description: `id="${el.id}"`,
  };
}

function tryPlaceholder(el: Element): SmartSelector | null {
  const placeholder = el.getAttribute("placeholder");
  if (!placeholder) return null;

  const tag = el.tagName.toLowerCase();
  return {
    value: `${tag}[placeholder="${escapeCSS(placeholder)}"]`,
    strategy: "placeholder",
    description: `placeholder="${placeholder}"`,
  };
}

function buildFallbackCSS(el: Element): SmartSelector {
  if (el.id) return { value: `#${escapeCSS(el.id)}`, strategy: "css" };

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${escapeCSS(current.id)}`);
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

  return {
    value: parts.join(" > "),
    strategy: "css",
    description: "CSS fallback",
  };
}

/**
 * Extracts smart selectors for an element, ordered by priority.
 * Returns at least one selector (CSS fallback is always present).
 */
export function extractSmartSelectors(el: Element): SmartSelector[] {
  const strategies: Array<(el: Element) => SmartSelector | null> = [
    tryDataTestId,
    tryAriaLabel,
    tryRole,
    tryName,
    tryId,
    tryPlaceholder,
  ];

  const selectors: SmartSelector[] = [];
  const seen = new Set<string>();

  for (const strategy of strategies) {
    const result = strategy(el);
    if (result && !seen.has(result.value)) {
      seen.add(result.value);
      selectors.push(result);
    }
  }

  const fallback = buildFallbackCSS(el);
  if (!seen.has(fallback.value)) {
    selectors.push(fallback);
  }

  return selectors;
}

/**
 * Picks the best selector from a SmartSelector array.
 * Returns the first one (highest priority) or the raw CSS fallback.
 */
export function pickBestSelector(
  selectors: SmartSelector[] | undefined,
  fallbackCSS: string,
): string {
  if (!selectors || selectors.length === 0) return fallbackCSS;
  return selectors[0].value;
}
