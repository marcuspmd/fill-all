/**
 * AI Prompts — Barrel Export
 *
 * Re-exports all structured prompts, their input/output types,
 * the shared interface, and rendering utilities.
 */

// ── Interface & Types ─────────────────────────────────────────────────────────

export type {
  StructuredPrompt,
  PromptOutputField,
  PromptExample,
  PromptRole,
} from "./prompt.interface";

// ── Renderer ──────────────────────────────────────────────────────────────────

export {
  renderPromptBase,
  renderSystemPrompt,
  renderOutputSchema,
} from "./prompt-renderer";

// ── Field Classifier Prompt ───────────────────────────────────────────────────

export {
  fieldClassifierPrompt,
  CLASSIFIER_MIN_CONFIDENCE,
} from "./field-classifier.prompt";

export type {
  FieldClassifierInput,
  FieldClassifierOutput,
} from "./field-classifier.prompt";

// ── Field Value Generator Prompt ──────────────────────────────────────────────

export { fieldValueGeneratorPrompt } from "./field-value-generator.prompt";

export type { FieldValueInput } from "./field-value-generator.prompt";
