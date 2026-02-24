/**
 * Extractors — barrel export
 *
 * Re-exports all extractors and their types from a single entry point.
 */

// ── Interfaces ────────────────────────────────────────────────────────────────
export type { Extractor } from "./extractor.interface";
export type {
  LabelResult,
  LabelStrategyName,
  LabelStrategy,
} from "./label-strategy.interface";

// ── Selector ──────────────────────────────────────────────────────────────────
export { getUniqueSelector, selectorExtractor } from "./selector-extractor";

// ── Signals ───────────────────────────────────────────────────────────────────
export { buildSignals, signalsExtractor } from "./signals-extractor";

// ── Label ─────────────────────────────────────────────────────────────────────
export {
  findLabel,
  findLabelWithStrategy,
  labelExtractor,
} from "./label-extractor";

// ── Label strategies ──────────────────────────────────────────────────────────
export { DEFAULT_LABEL_STRATEGIES } from "./strategies";
export {
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
} from "./strategies";
