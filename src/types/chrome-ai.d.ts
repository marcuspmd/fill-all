/**
 * Chrome Built-in AI API type definitions
 * Based on: https://developer.chrome.com/docs/ai/get-started
 */

declare namespace ai {
  interface LanguageModelCapabilities {
    available: "no" | "after-download" | "readily";
    defaultTopK?: number;
    maxTopK?: number;
    defaultTemperature?: number;
  }

  interface LanguageModelCreateOptions {
    systemPrompt?: string;
    initialPrompts?: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
    topK?: number;
    temperature?: number;
    signal?: AbortSignal;
  }

  interface LanguageModelSession {
    prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
    promptStreaming(
      input: string,
      options?: { signal?: AbortSignal },
    ): ReadableStream<string>;
    clone(): Promise<LanguageModelSession>;
    destroy(): void;
    tokensSoFar: number;
    maxTokens: number;
    tokensLeft: number;
  }

  interface LanguageModel {
    capabilities(): Promise<LanguageModelCapabilities>;
    create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
  }
}

interface WindowOrWorkerGlobalScope {
  readonly ai: {
    languageModel: ai.LanguageModel;
  };
}

interface Window {
  readonly ai: {
    languageModel: ai.LanguageModel;
  };
}

declare const ai: {
  languageModel: ai.LanguageModel;
};
