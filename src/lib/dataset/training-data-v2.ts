import type {
  FieldCategory,
  FieldType,
  TrainingDifficulty,
  TrainingSample,
} from "@/types";
import {
  buildFeatureText,
  normalizeStructuredSignals as normalizeSignalsShared,
  type StructuredSignals,
} from "@/lib/shared/structured-signals";
import { TRAINING_SAMPLES_CPF } from "./data/personal/cpfData";
import { TRAINING_SAMPLES_CNPJ } from "./data/personal/cnpjData";

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

const CATEGORY_BY_TYPE: Partial<Record<FieldType, FieldCategory>> = {
  cpf: "document",
  cnpj: "document",
  "cpf-cnpj": "document",
  rg: "document",
  email: "contact",
  phone: "contact",
  name: "personal",
  "first-name": "personal",
  "last-name": "personal",
  "full-name": "personal",
  address: "address",
  street: "address",
  city: "address",
  state: "address",
  cep: "address",
  "zip-code": "address",
  date: "generic",
  "birth-date": "personal",
  password: "authentication",
  username: "authentication",
  company: "ecommerce",
  supplier: "ecommerce",
  product: "ecommerce",
  "employee-count": "professional",
  "job-title": "professional",
  website: "contact",
  money: "financial",
  number: "financial",
  text: "generic",
  unknown: "unknown",
};

function normalizeTrainingSample(sample: TrainingSample): TrainingSample {
  return {
    ...sample,
    signals: normalizeStructuredSignals(sample.signals),
    category: sample.category ?? CATEGORY_BY_TYPE[sample.type] ?? "unknown",
  };
}

const BUILTIN_TRAINING_SAMPLES: TrainingSample[] = [
  ...TRAINING_SAMPLES_CPF,
  ...TRAINING_SAMPLES_CNPJ,
].map(normalizeTrainingSample);

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
