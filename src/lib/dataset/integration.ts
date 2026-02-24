/**
 * Dataset ↔ Classifier Integration
 *
 * Bridges the dataset (training/validation/test) with the TF.js classifier
 * in `tensorflow-generator.ts`. Provides:
 *
 *   • `buildKeywordsFromDictionary`  — generates FIELD_TYPE_KEYWORDS from the
 *     field dictionary, keeping a single source of truth
 *   • `validateClassifier`           — runs the validation set and returns an
 *     accuracy report
 *   • `testClassifier`               — runs the test/control set (final eval)
 *   • `augmentTrainingSamples`       — produces additional samples through
 *     shuffle / drop / typo augmentation
 *   • `syncLearnedToDataset`         — imports learned entries from
 *     learning-store into the training pipeline
 */

import type { FieldType } from "@/types";
import {
  FIELD_DICTIONARY,
  type FieldDictionaryEntry,
} from "./field-dictionary";
import {
  TRAINING_SAMPLES,
  flattenStructuredSignals,
  type TrainingSample,
  getTrainingDistribution,
} from "./training-data-v2";
import { evaluateClassifier } from "./validation-data";
import { runTestEvaluation } from "./test-data";
import {
  DEFAULT_THRESHOLDS,
  augmentShuffle,
  augmentDrop,
  augmentTypo,
  checkDatasetHealth,
  type AccuracyThresholds,
  type DatasetHealthReport,
} from "./dataset-config";
import { classifyField } from "@/lib/form/detectors/strategies";
import type { FormField } from "@/types";
import { fromLegacySignalText } from "@/lib/shared/structured-signals";

// ── Build keywords from dictionary ──────────────────────────────────────────

/**
 * Generates a `Record<FieldType, string[]>` keyword map directly from the
 * field dictionary. This can replace / supplement the static
 * FIELD_TYPE_KEYWORDS in tensorflow-generator.ts.
 */
export function buildKeywordsFromDictionary(): Record<FieldType, string[]> {
  const result = {} as Record<FieldType, string[]>;

  for (const entry of FIELD_DICTIONARY) {
    const keywords: string[] = [];

    // Derive keywords from tags (tags are the classification hints)
    if (entry.tags.length > 0) {
      keywords.push(...entry.tags);
    }

    // Derive keywords from entry type itself (e.g. "cpf" → ["cpf"])
    if (!keywords.includes(entry.type)) {
      keywords.push(entry.type);
    }

    result[entry.type] = [...new Set(keywords)]; // dedupe
  }

  return result;
}

// ── Augmentation ────────────────────────────────────────────────────────────

export interface AugmentationConfig {
  /** How many augmented samples to create per original sample */
  multiplier: number;
  /** Which augmentation strategies to apply */
  strategies: Array<"shuffle" | "drop" | "typo">;
  /** Drop rate for the "drop" strategy (default 0.2) */
  dropRate?: number;
}

const DEFAULT_AUGMENTATION: AugmentationConfig = {
  multiplier: 2,
  strategies: ["shuffle", "drop", "typo"],
  dropRate: 0.2,
};

/**
 * Generate augmented training samples by applying random transformations.
 * Returns only the new augmented samples (not the originals).
 */
export function augmentTrainingSamples(
  config: AugmentationConfig = DEFAULT_AUGMENTATION,
): TrainingSample[] {
  const augmented: TrainingSample[] = [];
  const strategyFns: Record<string, (s: string) => string> = {
    shuffle: augmentShuffle,
    drop: (s: string) => augmentDrop(s, config.dropRate ?? 0.2),
    typo: augmentTypo,
  };

  for (const sample of TRAINING_SAMPLES) {
    for (let i = 0; i < config.multiplier; i++) {
      // Pick a random strategy
      const strategy =
        config.strategies[Math.floor(Math.random() * config.strategies.length)];
      const fn = strategyFns[strategy];
      if (fn) {
        const signalText = flattenStructuredSignals(sample.signals);
        augmented.push({
          signals: fromLegacySignalText(fn(signalText)),
          category: sample.category,
          type: sample.type,
          source: "augmented",
          domain: sample.domain,
          difficulty: sample.difficulty,
          language: sample.language,
          domFeatures: sample.domFeatures,
        });
      }
    }
  }

  return augmented;
}

// ── Validation & test runners ───────────────────────────────────────────────

/** Wraps classification for the validation/test evaluators */
function classifySignals(signals: string): FieldType {
  const mockField: FormField = {
    element: document.createElement("input"),
    selector: "",
    category: "unknown",
    fieldType: "unknown",
    label: signals,
    name: "",
    id: "",
    placeholder: "",
    required: false,
  };
  return classifyField(mockField);
}

export interface ClassifierReport {
  globalAccuracy: number;
  passesGlobalThreshold: boolean;
  failingTypes: string[];
  health: DatasetHealthReport;
}

/**
 * Run the validation set against the current classifier.
 * Returns an actionable report.
 */
export function validateClassifier(
  thresholds: AccuracyThresholds = DEFAULT_THRESHOLDS,
): ClassifierReport {
  const result = evaluateClassifier(classifySignals);
  const health = checkDatasetHealth();

  const failingTypes = Object.entries(result.perType)
    .filter(([, v]) => v.accuracy < thresholds.perTypeMin)
    .map(([type]) => type);

  return {
    globalAccuracy: result.globalAccuracy,
    passesGlobalThreshold: result.globalAccuracy >= thresholds.globalMin,
    failingTypes,
    health,
  };
}

/**
 * Run the final test/control set — should only be called once after all tuning.
 */
export function testClassifier(
  thresholds: AccuracyThresholds = DEFAULT_THRESHOLDS,
): ClassifierReport {
  const result = runTestEvaluation(classifySignals);
  const health = checkDatasetHealth();

  const failingTypes = Object.entries(result.perType)
    .filter(([, v]) => v.accuracy < thresholds.perTypeMin)
    .map(([type]) => type);

  return {
    globalAccuracy: result.globalAccuracy,
    passesGlobalThreshold: result.globalAccuracy >= thresholds.globalMin,
    failingTypes,
    health,
  };
}

// ── Dataset balance helpers ─────────────────────────────────────────────────

/**
 * Returns the minimum number of extra samples needed per type to achieve
 * a balanced dataset (all types have `targetCount` samples).
 */
export function getBalancingNeeds(
  targetCount = 10,
): Record<string, { current: number; needed: number }> {
  const dist = getTrainingDistribution();
  const result: Record<string, { current: number; needed: number }> = {};

  for (const entry of FIELD_DICTIONARY) {
    const current = dist[entry.type] || 0;
    result[entry.type] = {
      current,
      needed: Math.max(0, targetCount - current),
    };
  }

  return result;
}

/**
 * Get a summary of dictionary entries that don't yet have matching
 * training samples. Useful for identifying gaps in dataset coverage.
 */
export function getUncoveredDictionaryTypes(): FieldDictionaryEntry[] {
  const dist = getTrainingDistribution();
  return FIELD_DICTIONARY.filter((e) => !(e.type in dist));
}
