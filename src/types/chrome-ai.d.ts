/**
 * Chrome Built-in AI — Prompt API type definitions
 * New API (Chrome 131+): global `LanguageModel`
 * Based on: https://developer.chrome.com/docs/ai/get-started
 */

// ── New Prompt API (LanguageModel global) ─────────────────────────────────────

type LanguageModelAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

interface LanguageModelExpectedInput {
  type: "text" | "image" | "audio";
  languages?: string[];
}

interface LanguageModelAvailabilityOptions {
  model?: string;
  expectedInputs?: LanguageModelExpectedInput[];
  expectedOutputs?: LanguageModelExpectedInput[];
}

interface LanguageModelCreateOptions {
  model?: string;
  systemPrompt?: string;
  initialPrompts?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  topK?: number;
  temperature?: number;
  signal?: AbortSignal;
  monitor?: (monitor: EventTarget) => void;
  /** Declare input modalities and languages the session should support. */
  expectedInputs?: LanguageModelExpectedInput[];
  /** Declare output modalities and languages the session should produce. */
  expectedOutputs?: LanguageModelExpectedInput[];
}

interface LanguageModelPromptOptions {
  signal?: AbortSignal;
  responseConstraint?: object;
  omitResponseConstraintInput?: boolean;
}

// ── Multimodal content parts (Chrome AI Prompt API) ───────────────────────────

interface LanguageModelTextPart {
  type: "text";
  /** Text content of the part (Chrome AI Prompt API spec: `value`). */
  value: string;
}

interface LanguageModelImagePart {
  type: "image";
  /** Accepts Blob, ImageBitmap, ImageData, HTMLImageElement, etc. */
  value: ImageBitmapSource | ImageData;
}

type LanguageModelContentPart = LanguageModelTextPart | LanguageModelImagePart;

/** A full message with role, required when passing multimodal content (Chrome AI Prompt API). */
interface LanguageModelMessage {
  role: "user" | "assistant" | "system";
  content: LanguageModelContentPart[];
}

type LanguageModelPromptInput =
  | string
  | LanguageModelContentPart[]
  | LanguageModelMessage[];

interface LanguageModelSession {
  prompt(
    input: LanguageModelPromptInput,
    options?: LanguageModelPromptOptions,
  ): Promise<string>;
  promptStreaming(
    input: LanguageModelPromptInput,
    options?: LanguageModelPromptOptions,
  ): ReadableStream<string>;
  clone(): Promise<LanguageModelSession>;
  destroy(): void;
  tokensUsed?: number;
  maxTokens?: number;
  tokensRemaining?: number;
}

interface LanguageModelStatic {
  availability(
    options?: LanguageModelAvailabilityOptions,
  ): Promise<LanguageModelAvailability>;
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
}

declare const LanguageModel: LanguageModelStatic;
