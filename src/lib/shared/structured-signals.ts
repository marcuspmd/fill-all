import type {
  DomFeatureHints,
  FieldCategory,
  FieldType,
  FormField,
  TrainingLanguage,
} from "@/types";
import { FIELD_TYPES_BY_CATEGORY } from "@/types";

/**
 * Structured signal layers extracted from a form field.
 * Used as input for feature text building and classifier training.
 */
export interface StructuredSignals {
  /** High-relevance tokens: label, name, id, placeholder */
  primary: string[];
  /** Medium-relevance tokens: autocomplete attribute */
  secondary: string[];
  /** Low-relevance tokens: input type, required, pattern, maxlength */
  structural: string[];
}

/** Optional context about the field’s category, language, and DOM features. */
export interface StructuredSignalContext {
  category?: FieldCategory;
  language?: TrainingLanguage;
  domFeatures?: DomFeatureHints;
}

/** Options for controlling how feature text is built from structured signals. */
export interface BuildFeatureTextOptions {
  includeSecondary?: boolean;
  includeStructural?: boolean;
  includeMetadata?: boolean;
  primaryWeight?: number;
  secondaryWeight?: number;
  structuralWeight?: number;
}

const DEFAULT_BUILD_OPTIONS: Required<BuildFeatureTextOptions> = {
  includeSecondary: true,
  includeStructural: true,
  includeMetadata: true,
  primaryWeight: 3,
  secondaryWeight: 2,
  structuralWeight: 1,
};

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAndDedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const token = normalizeToken(value);
    if (!token || seen.has(token)) continue;
    seen.add(token);
    output.push(token);
  }

  return output;
}

function repeatTokens(values: string[], weight: number): string[] {
  if (weight <= 0 || values.length === 0) return [];
  const output: string[] = [];
  for (let i = 0; i < weight; i++) output.push(...values);
  return output;
}

function normalizeDomFeatures(domFeatures?: DomFeatureHints): DomFeatureHints {
  if (!domFeatures) return {};
  return {
    inputType: domFeatures.inputType
      ? normalizeToken(domFeatures.inputType)
      : undefined,
    maxLength:
      typeof domFeatures.maxLength === "number" && domFeatures.maxLength > 0
        ? domFeatures.maxLength
        : undefined,
    pattern: domFeatures.pattern
      ? normalizeToken(domFeatures.pattern)
      : undefined,
  };
}

function buildMetadataTokens(context?: StructuredSignalContext): string[] {
  if (!context) return [];
  const tokens: string[] = [];

  if (context.category && context.category !== "unknown") {
    tokens.push(`__cat_${context.category}`);
  }

  if (context.language) {
    tokens.push(`__lang_${context.language}`);
  }

  const dom = normalizeDomFeatures(context.domFeatures);
  if (dom.inputType) tokens.push(`__input_${dom.inputType}`);
  if (dom.pattern) tokens.push("__has_pattern");
  if (dom.maxLength !== undefined) {
    const bucket =
      dom.maxLength <= 4 ? "tiny" : dom.maxLength <= 14 ? "short" : "long";
    tokens.push(`__maxlen_${bucket}`);
  }

  return tokens;
}

/** Normalizes all signal tokens (lowercase, strip accents, deduplicate). */
export function normalizeStructuredSignals(
  signals: StructuredSignals,
): StructuredSignals {
  return {
    primary: normalizeAndDedupe(signals.primary),
    secondary: normalizeAndDedupe(signals.secondary),
    structural: normalizeAndDedupe(signals.structural),
  };
}

/** Wraps a flat signal string into a {@link StructuredSignals} with only primary tokens. */
export function fromFlatSignals(signals: string): StructuredSignals {
  return {
    primary: signals ? [signals] : [],
    secondary: [],
    structural: [],
  };
}

/** Heuristically infers the language (`pt`, `en`, `es`) from signal text. */
export function inferLanguageFromSignals(signals: string): TrainingLanguage {
  const normalized = normalizeToken(signals);
  if (/\b(el|la|correo|telefono|direccion|apellido)\b/.test(normalized)) {
    return "es";
  }
  if (/\b(the|your|email|phone|address|name|zip|state)\b/.test(normalized)) {
    return "en";
  }
  return "pt";
}

/** Maps a {@link FieldType} to its canonical {@link FieldCategory}. */
export function inferCategoryFromType(type: FieldType): FieldCategory {
  for (const [category, types] of Object.entries(
    FIELD_TYPES_BY_CATEGORY,
  ) as Array<[FieldCategory, FieldType[]]>) {
    if (types.includes(type)) return category;
  }

  return "unknown";
}

/**
 * Builds a weighted, normalized feature text from structured signals.
 * Tokens are repeated proportionally to their layer’s weight.
 */
export function buildFeatureText(
  signals: StructuredSignals,
  context?: StructuredSignalContext,
  options: BuildFeatureTextOptions = DEFAULT_BUILD_OPTIONS,
): string {
  const cfg = { ...DEFAULT_BUILD_OPTIONS, ...options };
  const normalized = normalizeStructuredSignals(signals);

  const tokens: string[] = [];
  tokens.push(...repeatTokens(normalized.primary, cfg.primaryWeight));

  if (cfg.includeSecondary) {
    tokens.push(...repeatTokens(normalized.secondary, cfg.secondaryWeight));
  }
  if (cfg.includeStructural) {
    tokens.push(...repeatTokens(normalized.structural, cfg.structuralWeight));
  }

  if (cfg.includeMetadata) {
    tokens.push(...buildMetadataTokens(context));
  }

  return normalizeToken(tokens.join(" "));
}

/**
 * Extracts {@link StructuredSignals} and {@link StructuredSignalContext}
 * from a partial `FormField` object.
 */
export function structuredSignalsFromField(field: Partial<FormField>): {
  signals: StructuredSignals;
  context: StructuredSignalContext;
} {
  const signals: StructuredSignals = {
    primary: [
      field.label ?? "",
      field.name ?? "",
      field.id ?? "",
      field.placeholder ?? "",
      field.contextSignals ?? "",
    ],
    secondary: [field.autocomplete ?? ""],
    structural: [
      field.inputType ?? "",
      field.required ? "required" : "",
      field.pattern ?? "",
      typeof field.maxLength === "number" ? `maxlength_${field.maxLength}` : "",
    ],
  };

  const normalizedPrimary = normalizeAndDedupe(signals.primary);
  if (normalizedPrimary.length === 0 && field.contextSignals) {
    normalizedPrimary.push(normalizeToken(field.contextSignals));
  }

  const normalizedSignals: StructuredSignals = {
    primary: normalizedPrimary,
    secondary: normalizeAndDedupe(signals.secondary),
    structural: normalizeAndDedupe(signals.structural),
  };

  return {
    signals: normalizedSignals,
    context: {
      category: field.category,
      language:
        field.languageDetected && field.languageDetected !== "unknown"
          ? field.languageDetected
          : undefined,
      domFeatures: {
        inputType: field.inputType,
        maxLength: field.maxLength,
        pattern: field.pattern,
      },
    },
  };
}
