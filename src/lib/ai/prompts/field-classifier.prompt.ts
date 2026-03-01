/**
 * Field Classifier Prompt
 *
 * Structured prompt for classifying form fields via Chrome AI (Gemini Nano).
 * Determines the semantic type of an HTML form field and which data generator
 * should be used to fill it.
 *
 * This prompt is consumed by the `chromeAiClassifier` strategy and can be
 * reused in any context that needs field classification via an LLM.
 */

import { FIELD_TYPES, type FieldType } from "@/types";
import type { StructuredPrompt } from "./prompt.interface";
import { renderPromptBase } from "./prompt-renderer";

// ── Input / Output types ──────────────────────────────────────────────────────

/** Input context extracted from a form field for classification. */
export interface FieldClassifierInput {
  /** Raw `outerHTML` of the form element (truncated to limit). */
  readonly elementHtml: string;
  /** Surrounding container HTML (label, fieldset, wrapper). */
  readonly contextHtml?: string;
  /** Normalised text signals (name + id + label + placeholder). */
  readonly signals?: string;
}

/** Parsed classification result from the AI response. */
export interface FieldClassifierOutput {
  readonly fieldType: FieldType;
  readonly confidence: number;
  readonly generatorType: FieldType;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const CLASSIFIER_MIN_CONFIDENCE = 0.6;

const MAX_ELEMENT_HTML_CHARS = 1000;
const MAX_CONTEXT_HTML_CHARS = 1000;

const VALID_FIELD_TYPES = new Set<string>(FIELD_TYPES);
const VALID_FIELD_TYPES_TEXT = FIELD_TYPES.join(", ");

// ── Prompt definition ─────────────────────────────────────────────────────────

export const fieldClassifierPrompt: StructuredPrompt<
  FieldClassifierInput,
  FieldClassifierOutput
> = {
  id: "field-classifier",
  version: "2.0.0",

  role: "system",
  persona: "You are a form field type classifier for Brazilian web forms.",

  task: "Given the raw HTML of an input element and its surrounding container, determine the semantic type of the field and which data generator should fill it.",

  rules: [
    "Return ONLY the JSON object, nothing else. No introductory text, no markdown.",
    `confidence is a float between 0.0 and 1.0. Only return >= ${CLASSIFIER_MIN_CONFIDENCE} when reasonably sure.`,
    'Use "unknown" when the field purpose is unclear.',
    "generatorType should be the most specific generator for the field (e.g. birth-date instead of date).",
    "Analyse HTML attributes (name, id, placeholder, class, aria-label, autocomplete) and visible label text.",
    `Valid types: ${VALID_FIELD_TYPES_TEXT}`,
  ],

  outputSchema: [
    {
      name: "fieldType",
      type: "string",
      description: "semantic field type",
      required: true,
      enum: FIELD_TYPES,
    },
    {
      name: "confidence",
      type: "number",
      description: "0.0–1.0",
      required: true,
      range: { min: 0, max: 1 },
    },
    {
      name: "generatorType",
      type: "string",
      description: "most specific generator type",
      required: true,
      enum: FIELD_TYPES,
    },
  ],

  examples: [
    {
      input:
        '<input type="email" name="user_email" placeholder="seu@email.com">',
      output:
        '{"fieldType": "email", "confidence": 0.98, "generatorType": "email"}',
    },
    {
      input:
        '<input type="text" name="cpf" id="cpf" maxlength="14" placeholder="000.000.000-00">',
      output:
        '{"fieldType": "cpf", "confidence": 0.95, "generatorType": "cpf"}',
    },
    {
      input:
        '<input type="text" name="dt_nascimento" placeholder="DD/MM/AAAA">',
      output:
        '{"fieldType": "birth-date", "confidence": 0.90, "generatorType": "birth-date"}',
    },
  ],

  buildPrompt(input: FieldClassifierInput): string {
    const base = renderPromptBase(this);
    const sections: string[] = [];

    // Element HTML (truncated for token economy)
    const html =
      input.elementHtml.length > MAX_ELEMENT_HTML_CHARS
        ? input.elementHtml.slice(0, MAX_ELEMENT_HTML_CHARS) + "…"
        : input.elementHtml;
    sections.push(`=== Element HTML ===\n${html}`);

    // Surrounding container HTML
    if (input.contextHtml) {
      const ctx =
        input.contextHtml.length > MAX_CONTEXT_HTML_CHARS
          ? input.contextHtml.slice(0, MAX_CONTEXT_HTML_CHARS) + "…"
          : input.contextHtml;
      sections.push(`=== Surrounding HTML ===\n${ctx}`);
    }

    // Pre-computed text signals
    if (input.signals?.trim()) {
      sections.push(`=== Field Signals ===\n${input.signals}`);
    }

    return `${base}\n\nClassify this form field:\n\n${sections.join("\n\n")}`;
  },

  parseResponse(raw: string): FieldClassifierOutput | null {
    try {
      const match = raw.match(/\{[^{}]+\}/);
      if (!match) return null;

      const parsed = JSON.parse(match[0]) as Record<string, unknown>;

      if (
        typeof parsed.fieldType !== "string" ||
        !VALID_FIELD_TYPES.has(parsed.fieldType) ||
        typeof parsed.confidence !== "number"
      ) {
        return null;
      }

      const fieldType = parsed.fieldType as FieldType;
      const confidence = Math.max(0, Math.min(1, parsed.confidence));

      // Discard low-confidence and "unknown" results
      if (fieldType === "unknown" || confidence < CLASSIFIER_MIN_CONFIDENCE) {
        return null;
      }

      // generatorType — must be a valid FieldType; falls back to fieldType
      const generatorType =
        typeof parsed.generatorType === "string" &&
        VALID_FIELD_TYPES.has(parsed.generatorType)
          ? (parsed.generatorType as FieldType)
          : fieldType;

      return { fieldType, confidence, generatorType };
    } catch {
      return null;
    }
  },
};
