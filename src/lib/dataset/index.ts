/**
 * Dataset — Central barrel export
 *
 * Import everything from `@/lib/dataset` for a single entry point.
 */

// ── Field Dictionary ───────────────────────────────────────────────────────
export {
  FIELD_DICTIONARY,
  SELECT_CONTEXT_PATTERNS,
  getDictionaryEntry,
  getEntriesByCategory,
  getEntriesByTag,
  matchSelectContext,
  getSelectableTypes,
  type FieldDictionaryEntry,
  type SelectOption,
  type GeneratorStrategy,
  type GeneratorDescriptor,
  type ElementKind,
  type InputCharacteristics,
  type LocaleFormat,
  type ContextDependency,
  type SelectContextPattern,
} from "./field-dictionary";

// ── Training Data ──────────────────────────────────────────────────────────
export {
  TRAINING_SAMPLES,
  getTrainingSamplesByDifficulty,
  getTrainingSamplesByType,
  getTrainingDistribution,
  type TrainingSample,
} from "./training-data";

export {
  flattenStructuredSignals,
  normalizeStructuredSignals,
  createTrainingSampleV2FromLegacy,
  type StructuredSignals,
  type TrainingSampleV2,
} from "./training-data-v2";

// ── Validation Data ────────────────────────────────────────────────────────
export {
  VALIDATION_SAMPLES,
  evaluateClassifier,
  type ValidationSample,
} from "./validation-data";

// ── Test Data (Control) ────────────────────────────────────────────────────
export { TEST_SAMPLES, runTestEvaluation, type TestSample } from "./test-data";

// ── Configuration & Metadata ───────────────────────────────────────────────
export {
  DATASET_VERSION,
  DATASET_META,
  DEFAULT_THRESHOLDS,
  DEFAULT_CURRICULUM,
  DEFAULT_CONTINUOUS_LEARNING,
  normalizeSignals,
  augmentShuffle,
  augmentDrop,
  augmentTypo,
  checkDatasetHealth,
  type AccuracyThresholds,
  type CurriculumConfig,
  type ContinuousLearningConfig,
  type DatasetHealthReport,
} from "./dataset-config";

// ── Integration (Dataset ↔ Classifier) ────────────────────────────────────
export {
  buildKeywordsFromDictionary,
  augmentTrainingSamples,
  validateClassifier,
  testClassifier,
  getBalancingNeeds,
  getUncoveredDictionaryTypes,
  type AugmentationConfig,
  type ClassifierReport,
} from "./integration";
