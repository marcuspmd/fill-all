/**
 * Detection Strategies — barrel export
 *
 * Re-exports all detection strategy implementations from a single entry point:
 *   - FieldClassifier strategies (classify individual fields)
 *   - PageDetector strategies (collect fields from the page)
 *
 * Add new strategies here to make them available to classifiers.ts.
 */

// ── FieldClassifier: Deterministic (HTML-based) ───────────────────────────────
export { htmlTypeClassifier } from "./html-type-classifier";
export { htmlFallbackClassifier } from "./html-fallback-classifier";

// ── FieldClassifier: Rule-based ───────────────────────────────────────────────
export { keywordClassifier } from "./keyword-classifier";

// ── FieldClassifier: ML / AI ──────────────────────────────────────────────────
export {
  tensorflowClassifier,
  loadPretrainedModel,
  invalidateClassifier,
  reloadClassifier,
  classifyField,
  classifyByTfSoft,
  TF_THRESHOLD,
} from "./tensorflow-classifier";

export {
  chromeAiClassifier,
  destroyClassifierSession,
} from "./chrome-ai-classifier";
