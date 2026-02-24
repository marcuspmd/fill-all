import type {
  FieldCategory,
  FieldType,
  TrainingDifficulty,
  TrainingSample,
} from "@/types";
import { FIELD_TYPES_BY_CATEGORY } from "@/types";
import {
  buildFeatureText,
  normalizeStructuredSignals as normalizeSignalsShared,
  type StructuredSignals,
} from "@/lib/shared/structured-signals";
import { ALL_TRAINING_SAMPLES } from "./data";

export type { StructuredSignals } from "@/lib/shared/structured-signals";

/** Options for controlling how structured signals are flattened to text. */
export interface FlattenSignalsOptions {
  includeSecondary?: boolean;
  includeStructural?: boolean;
  includeMetadata?: boolean;
  primaryWeight?: number;
  secondaryWeight?: number;
  structuralWeight?: number;
}

const DEFAULT_FLATTEN_OPTIONS: Required<FlattenSignalsOptions> = {
  includeSecondary: true,
  includeStructural: true,
  includeMetadata: false,
  primaryWeight: 1,
  secondaryWeight: 1,
  structuralWeight: 1,
};

const CATEGORY_BY_TYPE: Partial<Record<FieldType, FieldCategory>> =
  Object.entries(FIELD_TYPES_BY_CATEGORY).reduce(
    (acc, [category, types]) => {
      for (const type of types) {
        acc[type] = category as FieldCategory;
      }
      return acc;
    },
    {} as Partial<Record<FieldType, FieldCategory>>,
  );

function normalizeTrainingSample(sample: TrainingSample): TrainingSample {
  return {
    ...sample,
    signals: normalizeStructuredSignals(sample.signals),
    category: sample.category ?? CATEGORY_BY_TYPE[sample.type] ?? "unknown",
  };
}

const BUILTIN_TRAINING_SAMPLES: TrainingSample[] = ALL_TRAINING_SAMPLES.map(
  normalizeTrainingSample,
);

/** Normalizes structured signal tokens (delegates to shared implementation). */
export function normalizeStructuredSignals(
  signals: StructuredSignals,
): StructuredSignals {
  return normalizeSignalsShared(signals);
}

/** Flattens structured signals into a single feature-text string. */
export function flattenStructuredSignals(
  signals: StructuredSignals,
  options: FlattenSignalsOptions = DEFAULT_FLATTEN_OPTIONS,
): string {
  return buildFeatureText(signals, undefined, options);
}

/** All built-in training samples with structured signals (V2 format). */
export const TRAINING_SAMPLES_V2: TrainingSample[] = BUILTIN_TRAINING_SAMPLES;

/** Alias for {@link TRAINING_SAMPLES_V2} — used by classifiers and dataset tools. */
export const TRAINING_SAMPLES: TrainingSample[] = TRAINING_SAMPLES_V2;

/** Converts a training sample into a flat feature-text string for the classifier. */
export function toTrainingSignalText(sample: TrainingSample): string {
  return buildFeatureText(sample.signals, {
    category: sample.category,
    language: sample.language,
    domFeatures: sample.domFeatures,
  });
}

/** Filters training samples by difficulty level. */
export function getTrainingSamplesByDifficulty(
  difficulty: TrainingDifficulty,
): TrainingSample[] {
  return TRAINING_SAMPLES.filter((sample) => sample.difficulty === difficulty);
}

/** Filters training samples by field type. */
export function getTrainingSamplesByType(type: FieldType): TrainingSample[] {
  return TRAINING_SAMPLES.filter((sample) => sample.type === type);
}

/** Returns a count of training samples grouped by field type. */
export function getTrainingDistribution(): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const sample of TRAINING_SAMPLES) {
    distribution[sample.type] = (distribution[sample.type] || 0) + 1;
  }
  return distribution;
}

/** Filters V2 training samples by difficulty. */
export function getTrainingV2ByDifficulty(
  difficulty: TrainingDifficulty,
): TrainingSample[] {
  return TRAINING_SAMPLES_V2.filter(
    (sample) => sample.difficulty === difficulty,
  );
}

/** Filters V2 training samples by field type. */
export function getTrainingV2ByType(type: FieldType): TrainingSample[] {
  return TRAINING_SAMPLES_V2.filter((sample) => sample.type === type);
}

/** Returns a count of V2 training samples grouped by field type. */
export function getTrainingV2Distribution(): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const sample of TRAINING_SAMPLES_V2) {
    distribution[sample.type] = (distribution[sample.type] || 0) + 1;
  }
  return distribution;
}
