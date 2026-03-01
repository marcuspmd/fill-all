/**
 * Prompt Renderer
 *
 * Utility functions that render a StructuredPrompt's static sections
 * (role, task, schema, rules, examples) into token-efficient text blocks.
 *
 * These helpers are consumed by each prompt's `buildPrompt()` implementation
 * and by session setup code that needs a system-level prompt.
 */

import type {
  PromptOutputField,
  PromptExample,
  StructuredPrompt,
} from "./prompt.interface";

// ── Schema rendering ──────────────────────────────────────────────────────────

/**
 * Renders output schema fields as a compact JSON format spec.
 *
 * @example
 * renderOutputSchema([
 *   { name: "fieldType", type: "string", description: "semantic type" },
 *   { name: "confidence", type: "number", description: "0.0–1.0", range: { min: 0, max: 1 } },
 * ])
 * // → '{"fieldType": <string>, "confidence": <number: 0.0–1.0>}'
 */
export function renderOutputSchema(
  fields: readonly PromptOutputField[],
): string {
  const entries = fields.map((f) => {
    if (f.type === "number" && f.range) {
      return `"${f.name}": <${f.type}: ${f.range.min}–${f.range.max}>`;
    }
    return `"${f.name}": <${f.type}>`;
  });

  return `{${entries.join(", ")}}`;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderRules(rules: readonly string[]): string {
  return rules.map((r, i) => `${i + 1}. ${r}`).join("\n");
}

function renderExamples(examples: readonly PromptExample[]): string {
  return examples
    .map((ex) => `Input: ${ex.input}\nOutput: ${ex.output}`)
    .join("\n\n");
}

// ── Main renderers ────────────────────────────────────────────────────────────

/**
 * Renders the static (non-input) sections of a structured prompt into a
 * single text block optimised for token economy.
 *
 * Sections rendered (in order): role → task → output format → rules → examples.
 *
 * Use this inside `buildPrompt()` implementations and then append the
 * per-invocation input context.
 */
export function renderPromptBase<TInput, TOutput>(
  prompt: StructuredPrompt<TInput, TOutput>,
): string {
  const sections: string[] = [];

  sections.push(prompt.persona);
  sections.push(prompt.task);

  if (prompt.outputSchema?.length) {
    const schema = renderOutputSchema(prompt.outputSchema);
    sections.push(
      `Respond ONLY with a JSON object in this exact format — no other text, no markdown, no explanation:\n${schema}`,
    );
  }

  if (prompt.rules.length) {
    sections.push(`Rules:\n${renderRules(prompt.rules)}`);
  }

  if (prompt.examples?.length) {
    sections.push(`Examples:\n${renderExamples(prompt.examples)}`);
  }

  return sections.join("\n\n");
}

/**
 * Renders a system-level prompt from a StructuredPrompt.
 *
 * Useful for APIs that support a separate `systemPrompt` channel
 * (e.g. `LanguageModel.create({ systemPrompt })`).
 *
 * Delegates to `renderPromptBase` — same content, different usage context.
 */
export function renderSystemPrompt<TInput, TOutput>(
  prompt: StructuredPrompt<TInput, TOutput>,
): string {
  return renderPromptBase(prompt);
}
