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

interface LanguageModelAvailabilityOptions {
  model?: string;
  outputLanguage?: string;
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
  outputLanguage?: string;
  monitor?: (monitor: EventTarget) => void;
}

interface LanguageModelSession {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
  promptStreaming(
    input: string,
    options?: { signal?: AbortSignal },
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
