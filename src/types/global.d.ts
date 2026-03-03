/// <reference types="vite/client" />

/**
 * Augment globalThis with Chrome AI types (new Prompt API)
 */

declare global {
  // New Prompt API — LanguageModel global (Chrome 131+)
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelStatic | undefined;
}

export {};
