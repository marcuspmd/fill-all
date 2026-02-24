/**
 * Label Strategies — barrel export
 *
 * Re-exports all individual label strategies and the default ordered list.
 */

export { labelForStrategy } from "./label-for";
export { parentLabelStrategy } from "./parent-label";
export { ariaLabelStrategy } from "./aria-label";
export { ariaLabelledByStrategy } from "./aria-labelledby";
export { prevLabelStrategy } from "./prev-label";
export { titleStrategy } from "./title";
export { fieldsetLegendStrategy } from "./fieldset-legend";
export { formGroupLabelStrategy } from "./form-group-label";
export { prevSiblingTextStrategy } from "./prev-sibling-text";
export { placeholderStrategy } from "./placeholder";

import type { LabelStrategy } from "../label-strategy.interface";
import { labelForStrategy } from "./label-for";
import { parentLabelStrategy } from "./parent-label";
import { ariaLabelStrategy } from "./aria-label";
import { ariaLabelledByStrategy } from "./aria-labelledby";
import { prevLabelStrategy } from "./prev-label";
import { titleStrategy } from "./title";
import { fieldsetLegendStrategy } from "./fieldset-legend";
import { formGroupLabelStrategy } from "./form-group-label";
import { prevSiblingTextStrategy } from "./prev-sibling-text";
import { placeholderStrategy } from "./placeholder";

/**
 * Default ordered list of label strategies, from most to least specific.
 * Used by the `labelExtractor` — can be overridden for custom ordering.
 */
export const DEFAULT_LABEL_STRATEGIES: ReadonlyArray<LabelStrategy> = [
  labelForStrategy,
  parentLabelStrategy,
  ariaLabelStrategy,
  ariaLabelledByStrategy,
  prevLabelStrategy,
  titleStrategy,
  fieldsetLegendStrategy,
  formGroupLabelStrategy,
  prevSiblingTextStrategy,
  placeholderStrategy,
];
