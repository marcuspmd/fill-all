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

export function normalizeStructuredSignals(
  signals: StructuredSignals,
): StructuredSignals {
  return normalizeSignalsShared(signals);
}

export function flattenStructuredSignals(
  signals: StructuredSignals,
  options: FlattenSignalsOptions = DEFAULT_FLATTEN_OPTIONS,
): string {
  return buildFeatureText(signals, undefined, options);
}

export const TRAINING_SAMPLES_V2: TrainingSample[] = BUILTIN_TRAINING_SAMPLES;

export const TRAINING_SAMPLES: TrainingSample[] = TRAINING_SAMPLES_V2;

export function toTrainingSignalText(sample: TrainingSample): string {
  return buildFeatureText(sample.signals, {
    category: sample.category,
    language: sample.language,
    domFeatures: sample.domFeatures,
  });
}

export function getTrainingSamplesByDifficulty(
  difficulty: TrainingDifficulty,
): TrainingSample[] {
  return TRAINING_SAMPLES.filter((sample) => sample.difficulty === difficulty);
}

export function getTrainingSamplesByType(type: FieldType): TrainingSample[] {
  return TRAINING_SAMPLES.filter((sample) => sample.type === type);
}

export function getTrainingDistribution(): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const sample of TRAINING_SAMPLES) {
    distribution[sample.type] = (distribution[sample.type] || 0) + 1;
  }
  return distribution;
}

export function getTrainingV2ByDifficulty(
  difficulty: TrainingDifficulty,
): TrainingSample[] {
  return TRAINING_SAMPLES_V2.filter(
    (sample) => sample.difficulty === difficulty,
  );
}

export function getTrainingV2ByType(type: FieldType): TrainingSample[] {
  return TRAINING_SAMPLES_V2.filter((sample) => sample.type === type);
}

export function getTrainingV2Distribution(): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const sample of TRAINING_SAMPLES_V2) {
    distribution[sample.type] = (distribution[sample.type] || 0) + 1;
  }
  return distribution;
}
