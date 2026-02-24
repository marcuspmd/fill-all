/**
 * Dataset Configuration & Metadata
 *
 * Controls training behaviour, accuracy thresholds, augmentation strategies,
 * and provides utility functions for dataset health-checks.
 */

import { FIELD_TYPES, type FieldType } from "@/types";
import {
  TRAINING_SAMPLES,
  getTrainingDistribution,
  toTrainingSignalText,
} from "./training-data";
import { VALIDATION_SAMPLES } from "./validation-data";
import { TEST_SAMPLES } from "./test-data";

// ── Version & metadata ──────────────────────────────────────────────────────

export const DATASET_VERSION = "1.1.0";

export const DATASET_META = {
  version: DATASET_VERSION,
  locale: "pt-BR + en-US",
  createdAt: "2025-01-01",
  description:
    "Dataset completo para classificacao de campos de formulario (pt-BR + en-US). " +
    "Inclui treino, validacao e teste com cobertura de ~30 tipos de campo.",
  splits: {
    training: TRAINING_SAMPLES.length,
    validation: VALIDATION_SAMPLES.length,
    test: TEST_SAMPLES.length,
    total:
      TRAINING_SAMPLES.length + VALIDATION_SAMPLES.length + TEST_SAMPLES.length,
  },
} as const;

// ── Thresholds ──────────────────────────────────────────────────────────────

export interface AccuracyThresholds {
  /** Minimum global accuracy for validation pass */
  globalMin: number;
  /** Minimum per-type accuracy for validation pass */
  perTypeMin: number;
  /** Maximum acceptable "unknown" classification rate */
  maxUnknownRate: number;
}

export const DEFAULT_THRESHOLDS: AccuracyThresholds = {
  globalMin: 0.85,
  perTypeMin: 0.7,
  maxUnknownRate: 0.15,
};

// ── Signal normalisation ────────────────────────────────────────────────────

/**
 * Normalise raw field context into a classifier-ready signal string.
 * Matches the normalisation applied in form-detector.ts.
 */
export function normalizeSignals(
  label?: string,
  name?: string,
  id?: string,
  placeholder?: string,
  autocomplete?: string,
  ariaLabel?: string,
): string {
  return [label, name, id, placeholder, autocomplete, ariaLabel]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim())
    .join(" ");
}

// ── Augmentation helpers ────────────────────────────────────────────────────

/** Simple augmentation: shuffle word order in a signal string */
export function augmentShuffle(signals: string): string {
  const words = signals.split(/\s+/);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.join(" ");
}

/** Simple augmentation: drop random word(s) */
export function augmentDrop(signals: string, dropRate = 0.2): string {
  const words = signals.split(/\s+/);
  return words.filter(() => Math.random() > dropRate).join(" ") || words[0]; // Keep at least one word
}

/** Simple augmentation: add noise (typo simulation) */
export function augmentTypo(signals: string): string {
  const words = signals.split(/\s+/);
  const idx = Math.floor(Math.random() * words.length);
  const word = words[idx];
  if (word.length > 2) {
    const charIdx = Math.floor(Math.random() * (word.length - 1));
    words[idx] =
      word.slice(0, charIdx) +
      word[charIdx + 1] +
      word[charIdx] +
      word.slice(charIdx + 2);
  }
  return words.join(" ");
}

// ── Dataset health checks ───────────────────────────────────────────────────

export interface DatasetHealthReport {
  totalSamples: number;
  typeCounts: Record<string, number>;
  /** Types with fewer than `minSamplesPerType` samples */
  underrepresentedTypes: string[];
  /** Types with zero samples (from known FieldType enum) */
  missingTypes: FieldType[];
  /** Whether train/val/test sets have overlapping signals */
  hasLeakage: boolean;
  leakedSignals: string[];
}

const KNOWN_TYPES: FieldType[] = [...FIELD_TYPES];

/**
 * Run health checks on the combined dataset.
 * Call this during development to find gaps or data leakage.
 */
export function checkDatasetHealth(minSamplesPerType = 3): DatasetHealthReport {
  const dist = getTrainingDistribution();

  const underrepresentedTypes = Object.entries(dist)
    .filter(([, count]) => count < minSamplesPerType)
    .map(([type]) => type);

  const coveredTypes = new Set(Object.keys(dist));
  const missingTypes = KNOWN_TYPES.filter((t) => !coveredTypes.has(t));

  // Check for data leakage (exact signal match between splits)
  const trainSignals = new Set(
    TRAINING_SAMPLES.map((s) => toTrainingSignalText(s)),
  );
  const leakedSignals: string[] = [];

  for (const vs of VALIDATION_SAMPLES) {
    if (trainSignals.has(vs.signals)) leakedSignals.push(vs.signals);
  }
  for (const ts of TEST_SAMPLES) {
    if (trainSignals.has(ts.signals)) leakedSignals.push(ts.signals);
  }

  return {
    totalSamples:
      TRAINING_SAMPLES.length + VALIDATION_SAMPLES.length + TEST_SAMPLES.length,
    typeCounts: dist,
    underrepresentedTypes,
    missingTypes,
    hasLeakage: leakedSignals.length > 0,
    leakedSignals,
  };
}

// ── Curriculum learning support ─────────────────────────────────────────────

export interface CurriculumConfig {
  /** Start with easy samples, progressively add harder ones */
  enabled: boolean;
  /** Number of epochs at each difficulty level before advancing */
  epochsPerLevel: number;
  /** Difficulty progression order */
  levels: Array<"easy" | "medium" | "hard">;
}

export const DEFAULT_CURRICULUM: CurriculumConfig = {
  enabled: true,
  epochsPerLevel: 3,
  levels: ["easy", "medium", "hard"],
};

// ── Continuous learning config ──────────────────────────────────────────────

export interface ContinuousLearningConfig {
  /** Whether to store learned signal→type pairs from Chrome AI */
  captureFromAI: boolean;
  /** Whether to store user corrections */
  captureUserCorrections: boolean;
  /** Minimum confidence threshold to accept learned sample */
  minConfidence: number;
  /** Max learned samples to keep before rotation */
  maxStoredSamples: number;
  /** Whether to periodically re-validate with learned samples */
  revalidateOnUpdate: boolean;
}

export const DEFAULT_CONTINUOUS_LEARNING: ContinuousLearningConfig = {
  captureFromAI: true,
  captureUserCorrections: true,
  minConfidence: 0.75,
  maxStoredSamples: 500,
  revalidateOnUpdate: true,
};
