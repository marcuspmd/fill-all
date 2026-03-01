/**
 * Field Value Generator Prompt
 *
 * Structured prompt for generating realistic test values for form fields
 * via Chrome AI (Gemini Nano). Produces a single plain-text value appropriate
 * for the detected field type and locale (Brazilian Portuguese).
 *
 * This prompt is consumed by `chrome-ai.ts` → `generateFieldValue()` and can
 * be reused in any context that needs AI-driven form value generation.
 */

import type { FieldType } from "@/types";
import type { StructuredPrompt } from "./prompt.interface";
import { renderPromptBase } from "./prompt-renderer";

// ── Input / Output types ──────────────────────────────────────────────────────

/** Metadata about a form field needed to generate an appropriate value. */
export interface FieldValueInput {
  readonly label?: string;
  readonly name?: string;
  readonly id?: string;
  readonly placeholder?: string;
  readonly autocomplete?: string;
  readonly inputType: string;
  readonly fieldType: FieldType;
}

// ── Prompt definition ─────────────────────────────────────────────────────────

export const fieldValueGeneratorPrompt: StructuredPrompt<
  FieldValueInput,
  string
> = {
  id: "field-value-generator",
  version: "2.0.0",

  role: "system",
  persona: "You are a form field value generator for Brazilian web forms.",

  task: "Generate a single realistic test value for the given form field. Return ONLY the value.",

  rules: [
    "Return ONLY the raw value — no explanations, no quotes, no markdown, no labels.",
    "Use Brazilian Portuguese for names, addresses, and other locale-specific data.",
    "Generate valid CPFs and CNPJs with correct check digits when applicable.",
    "Use DD/MM/YYYY for dates unless the placeholder suggests otherwise.",
    "For emails, use realistic-looking addresses with common Brazilian providers.",
    "Keep values concise and appropriate for the field type and any length constraints.",
  ],

  outputSchema: undefined,

  examples: [
    {
      input: "Label: E-mail\nType: email\nDetected as: email",
      output: "maria.santos@gmail.com",
    },
    {
      input: "Label: CPF\nType: text\nDetected as: cpf",
      output: "529.982.247-25",
    },
    {
      input: "Label: Nome completo\nType: text\nDetected as: full-name",
      output: "Ana Carolina de Souza",
    },
    {
      input: "Label: Telefone\nType: tel\nDetected as: phone",
      output: "(11) 98765-4321",
    },
  ],

  buildPrompt(input: FieldValueInput): string {
    const base = renderPromptBase(this);

    const context = [
      input.label && `Label: ${input.label}`,
      input.name && `Name: ${input.name}`,
      input.id && `ID: ${input.id}`,
      input.placeholder && `Placeholder: ${input.placeholder}`,
      input.autocomplete && `Autocomplete: ${input.autocomplete}`,
      `Type: ${input.inputType}`,
      `Detected as: ${input.fieldType}`,
    ]
      .filter(Boolean)
      .join("\n");

    return `${base}\n\nGenerate a value for this field:\n${context}`;
  },

  parseResponse(raw: string): string | null {
    const value = raw.trim();
    return value.length > 0 ? value : null;
  },
};
