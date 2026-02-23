import type {
  DomFeatureHints,
  FieldCategory,
  FieldType,
  TrainingDifficulty,
  TrainingLanguage,
  TrainingSampleSource,
} from "@/types";
import type { TrainingSample as LegacyTrainingSample } from "./training-data";

export interface StructuredSignals {
  primary: string[];
  secondary: string[];
  structural: string[];
}

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
}

const DEFAULT_FLATTEN_OPTIONS: Required<FlattenSignalsOptions> = {
  includeSecondary: true,
  includeStructural: true,
};

function normalizeSignalToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeAndNormalize(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const token = normalizeSignalToken(value);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    normalized.push(token);
  }

  return normalized;
}

export function normalizeStructuredSignals(
  signals: StructuredSignals,
): StructuredSignals {
  return {
    primary: dedupeAndNormalize(signals.primary),
    secondary: dedupeAndNormalize(signals.secondary),
    structural: dedupeAndNormalize(signals.structural),
  };
}

export function flattenStructuredSignals(
  signals: StructuredSignals,
  options: FlattenSignalsOptions = DEFAULT_FLATTEN_OPTIONS,
): string {
  const normalized = normalizeStructuredSignals(signals);
  const chunks = [normalized.primary];

  if (options.includeSecondary) chunks.push(normalized.secondary);
  if (options.includeStructural) chunks.push(normalized.structural);

  return chunks.flat().join(" ").trim();
}

export function createTrainingSampleV2FromLegacy(
  sample: LegacyTrainingSample,
  category: FieldCategory = "unknown",
): TrainingSampleV2 {
  return {
    signals: {
      primary: [sample.signals],
      secondary: [],
      structural: [],
    },
    category,
    type: sample.type,
    source: sample.source,
    domain: sample.domain,
    difficulty: sample.difficulty,
  };
}
