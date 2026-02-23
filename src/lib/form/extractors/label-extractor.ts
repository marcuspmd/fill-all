/**
 * Label Extractor
 *
 * Discovers the human-readable label for a form field by running through
 * an ordered list of strategies (from most to least specific).
 *
 * Strategies are pluggable — new ones can be added for specific frameworks.
 * The default order mirrors the original 10-strategy label-detector:
 *
 *  1. label[for=id]          — explicit for/id association
 *  2. parent-label           — field is wrapped inside <label>
 *  3. aria-label             — WAI-ARIA attribute
 *  4. aria-labelledby        — WAI-ARIA reference
 *  5. prev-label             — preceding sibling is <label>
 *  6. title                  — HTML title attribute
 *  7. fieldset-legend        — nearest <fieldset> / <legend>
 *  8. form-group-label       — nearest .form-group / framework label
 *  9. prev-sibling-text      — nearby short text node
 * 10. placeholder            — last resort, input placeholder
 */

import type { Extractor } from "./extractor.interface";
import type {
  LabelResult,
  LabelStrategy,
  LabelStrategyName,
} from "./label-strategy.interface";
import { DEFAULT_LABEL_STRATEGIES } from "./strategies";

export type { LabelResult, LabelStrategyName, LabelStrategy };

/**
 * Runs all strategies in order and returns the first match.
 * Uses the provided strategies or falls back to DEFAULT_LABEL_STRATEGIES.
 */
export function findLabelWithStrategy(
  element: HTMLElement,
  strategies: ReadonlyArray<LabelStrategy> = DEFAULT_LABEL_STRATEGIES,
): LabelResult | undefined {
  for (const strategy of strategies) {
    const result = strategy.find(element);
    if (result) return result;
  }
  return undefined;
}

/** Convenience shorthand — returns just the text, or `undefined`. */
export function findLabel(element: HTMLElement): string | undefined {
  return findLabelWithStrategy(element)?.text;
}

/** Extractor object — wraps {@link findLabelWithStrategy} under the common Extractor contract. */
export const labelExtractor: Extractor<HTMLElement, LabelResult | undefined> = {
  name: "label",
  extract: findLabelWithStrategy,
};
