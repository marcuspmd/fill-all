/**
 * Form Context Generator Prompt
 *
 * Structured prompt for generating coherent values for ALL form fields at once
 * via Chrome AI (Gemini Nano). Unlike the field-by-field approach, this sends
 * the full form as a compact descriptor and receives a single JSON map of
 * index → value. The result is a cohesive fictional identity: same person,
 * same company, same address across all fields.
 *
 * Designed to be token-efficient: fields are represented as compact one-liners,
 * and the model is instructed to respond in minified JSON only.
 */

import type { FieldType } from "@/types";
import type { StructuredPrompt } from "./prompt.interface";

// ── Input / Output types ──────────────────────────────────────────────────────

/** Compact metadata for a single field passed to the form context generator. */
export interface FormContextFieldInput {
  /** 0-based position index — used as the JSON key in the response */
  readonly index: number;
  readonly label?: string;
  readonly fieldType: FieldType;
  readonly inputType?: string;
  /** Up to 6 option values for <select> fields */
  readonly options?: readonly string[];
}

/** Array of compact field descriptors for a single form (≤ MAX_FIELDS). */
export type FormContextInput = readonly FormContextFieldInput[];

/** Map from field index (as string) to generated value. */
export type FormContextOutput = Record<string, string>;

// ── Limits ────────────────────────────────────────────────────────────────────

/** Maximum number of fields sent in a single context generation call. */
export const FORM_CONTEXT_MAX_FIELDS = 30;

/** Maximum number of select options included per field to save tokens. */
const MAX_OPTIONS_PER_FIELD = 6;

// ── Prompt definition ─────────────────────────────────────────────────────────

/**
 * Builds the optional user-context block to inject into the prompt.
 * Returns an empty string when no context is present.
 */
function buildUserContextBlock(userContext?: string): string {
  if (!userContext || userContext.trim().length === 0) return "";
  return (
    `\nADDITIONAL CONTEXT PROVIDED BY THE USER (use this to guide the generated values):\n` +
    `"""\n${userContext.trim()}\n"""\n`
  );
}

export const formContextGeneratorPrompt: StructuredPrompt<
  FormContextInput,
  FormContextOutput
> = {
  id: "form-context-generator",
  version: "1.0.0",

  role: "system",
  persona: "You are a cohesive test-data generator for Brazilian web forms.",

  task:
    "Generate realistic, mutually consistent test values for ALL listed fields. " +
    "All values must belong to the SAME fictional person or company. " +
    'Respond ONLY with minified JSON: {"0":"value","1":"value",...}',

  rules: [
    "Return ONLY valid minified JSON — no markdown, no explanation, no code fences.",
    "Use the field INDEX (number) as the JSON key.",
    "Include an entry for EVERY listed field index.",
    "All values must be consistent with each other (same person/company).",
    "Use Brazilian Portuguese for names, addresses, and locale-specific data.",
    "Generate valid CPFs (format nnn.nnn.nnn-nn) with correct check digits.",
    "Generate valid CNPJs (format nn.nnn.nnn/nnnn-nn) with correct check digits.",
    "Use DD/MM/YYYY for dates unless the label explicitly specifies another format.",
    "For select fields, choose exactly one value from the provided options.",
    "For password fields, generate a strong 10-char password with letters, digits and symbols.",
    "For file or captcha fields, output an empty string.",
  ],

  outputSchema: [
    {
      name: "0",
      type: "string",
      description: "Value for field at index 0",
      required: true,
    },
  ],

  examples: [
    {
      input:
        "[0] Nome Completo (full-name)\n[1] E-mail (email)\n[2] CPF (cpf)\n[3] Estado (state): SP|RJ|MG|BA",
      output:
        '{"0":"Ana Carolina de Souza","1":"ana.souza@gmail.com","2":"529.982.247-25","3":"SP"}',
    },
  ],

  buildPrompt(input: FormContextInput, userContext?: string): string {
    const fieldLines = input
      .slice(0, FORM_CONTEXT_MAX_FIELDS)
      .map((f) => {
        const label = f.label?.trim()
          ? f.label.trim()
          : (f.inputType ?? "field");
        let line = `[${f.index}] ${label} (${f.fieldType})`;

        if (f.options && f.options.length > 0) {
          const opts = f.options
            .filter((o) => o.trim().length > 0)
            .slice(0, MAX_OPTIONS_PER_FIELD)
            .join("|");
          if (opts) line += `: ${opts}`;
        }

        return line;
      })
      .join("\n");

    const contextBlock = buildUserContextBlock(userContext);

    return (
      `You are a cohesive test-data generator for Brazilian web forms.\n` +
      `Generate realistic values for ALL fields below.\n` +
      `RULES:\n` +
      `- All values must belong to the SAME fictional person/company.\n` +
      `- Use Brazilian Portuguese for names, addresses, and locale-specific data.\n` +
      `- Valid CPF format: nnn.nnn.nnn-nn (with real check digits).\n` +
      `- Valid CNPJ format: nn.nnn.nnn/nnnn-nn (with real check digits).\n` +
      `- Use DD/MM/YYYY for dates unless the label says otherwise.\n` +
      `- For SELECT fields, pick exactly one value from the provided options.\n` +
      `- Respond ONLY with minified JSON: {"0":"value","1":"value",...}\n` +
      `- Include ALL field indices listed below.\n` +
      contextBlock +
      `\nFields:\n${fieldLines}\n\n` +
      `JSON:`
    );
  },

  parseResponse(raw: string): FormContextOutput | null {
    if (!raw || raw.trim().length === 0) return null;

    // Extract first JSON object from the response (model may add extra text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return null;
      }

      // Validate all values are strings
      const result: FormContextOutput = {};
      for (const [key, val] of Object.entries(parsed)) {
        result[key] = typeof val === "string" ? val : String(val ?? "");
      }

      return Object.keys(result).length > 0 ? result : null;
    } catch {
      return null;
    }
  },
};
