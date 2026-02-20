/**
 * Augment globalThis with Chrome AI types
 */

declare global {
  // eslint-disable-next-line no-var
  var ai:
    | {
        languageModel: ai.LanguageModel;
      }
    | undefined;
}

export {};
