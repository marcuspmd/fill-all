import type {
  DomFeatureHints,
  FieldCategory,
  FieldType,
  TrainingDifficulty,
  TrainingLanguage,
  TrainingSampleSource,
} from "@/types";
import {
  buildFeatureText,
  fromLegacySignalText,
  inferCategoryFromType,
  inferLanguageFromSignals,
  normalizeStructuredSignals as normalizeSignalsShared,
  type StructuredSignals,
} from "@/lib/shared/structured-signals";
import {
  TRAINING_SAMPLES as LEGACY_TRAINING_SAMPLES,
  type TrainingSample as LegacyTrainingSample,
} from "./training-data";

export type { StructuredSignals } from "@/lib/shared/structured-signals";

export interface TrainingSampleV2 {
  signals: StructuredSignals;
  category: FieldCategory;
  type: FieldType;
  source: TrainingSampleSource;
  /** Optional: original URL domain (real-world samples) */
  domain?: string;
  /** Curriculum difficulty */
  difficulty: TrainingDifficulty;
  /** Optional language tag (helps multilingual training) */
  language?: TrainingLanguage;
  /** Optional DOM hints for advanced training */
  domFeatures?: DomFeatureHints;
}

export type TrainingSample = TrainingSampleV2;

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

export function createTrainingSampleV2FromLegacy(
  sample: LegacyTrainingSample,
  category: FieldCategory = inferCategoryFromType(sample.type),
): TrainingSampleV2 {
  const language = inferLanguageFromSignals(sample.signals);

  return {
    signals: normalizeStructuredSignals(fromLegacySignalText(sample.signals)),
    category,
    type: sample.type,
    source: sample.source,
    domain: sample.domain,
    difficulty: sample.difficulty,
    language,
    domFeatures: undefined,
  };
}

export const TRAINING_SAMPLES_V2: TrainingSampleV2[] =
  LEGACY_TRAINING_SAMPLES.map((sample) =>
    createTrainingSampleV2FromLegacy(sample),
  );

export function getTrainingV2ByDifficulty(
  difficulty: TrainingDifficulty,
): TrainingSampleV2[] {
  return TRAINING_SAMPLES_V2.filter(
    (sample) => sample.difficulty === difficulty,
  );
}

export function getTrainingV2ByType(type: FieldType): TrainingSampleV2[] {
  return TRAINING_SAMPLES_V2.filter((sample) => sample.type === type);
}

export function getTrainingV2Distribution(): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const sample of TRAINING_SAMPLES_V2) {
    distribution[sample.type] = (distribution[sample.type] || 0) + 1;
  }
  return distribution;
}
