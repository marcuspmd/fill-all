/**
 * Structured Prompt Interface
 *
 * Defines a JSON-based, self-documenting contract for all AI prompts.
 * Every prompt must declare its role, task, rules, output schema, examples,
 * and provide `buildPrompt()` + `parseResponse()` methods.
 *
 * This ensures consistency, token economy, and structured I/O across all
 * AI interactions (classification, value generation, etc.).
 */

// ── Output Schema ─────────────────────────────────────────────────────────────

/** Describes a single field in the expected JSON response from the AI. */
export interface PromptOutputField {
  readonly name: string;
  readonly type: "string" | "number" | "boolean";
  readonly description: string;
  readonly required?: boolean;
  readonly enum?: readonly string[];
  readonly range?: { readonly min: number; readonly max: number };
}

// ── Few-Shot Example ──────────────────────────────────────────────────────────

/** A single input → output example for few-shot prompting. */
export interface PromptExample {
  readonly input: string;
  readonly output: string;
}

// ── Prompt Role ───────────────────────────────────────────────────────────────

/** Standard LLM conversation roles. */
export type PromptRole = "system" | "user" | "assistant";

// ── Structured Prompt ─────────────────────────────────────────────────────────

/**
 * Structured prompt definition — JSON-based, reusable, and self-documenting.
 *
 * All AI prompts in the project implement this interface to guarantee:
 * - Consistent structure (role, task, rules, schema, examples)
 * - Type-safe input/output via generics
 * - Self-contained parsing and validation
 * - Easy maintenance and versioning
 *
 * @typeParam TInput  - Shape of the context passed to `buildPrompt()`
 * @typeParam TOutput - Parsed response type returned by `parseResponse()`
 */
export interface StructuredPrompt<TInput, TOutput> {
  /** Unique identifier for this prompt (e.g. "field-classifier"). */
  readonly id: string;

  /** Semver-like version for auditing and cache-busting. */
  readonly version: string;

  /** Standard LLM role for this prompt (system, user, assistant). */
  readonly role: PromptRole;

  /** Persona/identity description the AI should adopt. */
  readonly persona: string;

  /** Concise task description — what the AI must accomplish. */
  readonly task: string;

  /** Ordered constraints the AI must follow (rendered as numbered rules). */
  readonly rules: readonly string[];

  /**
   * JSON output schema definition (field name, type, constraints).
   * Omit for prompts that expect plain-text responses (e.g. value generation).
   */
  readonly outputSchema?: readonly PromptOutputField[];

  /** Few-shot examples — (input context → expected output). */
  readonly examples?: readonly PromptExample[];

  /** Assembles the final prompt string from the given input context. */
  buildPrompt(input: TInput): string;

  /** Parses raw AI text into TOutput, returning null on failure. */
  parseResponse(raw: string): TOutput | null;
}
