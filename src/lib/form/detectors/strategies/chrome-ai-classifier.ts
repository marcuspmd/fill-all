/**
 * Chrome AI Field Classifier
 *
 * Uses the Chrome Built-in Language API (Gemini Nano, Chrome 131+) to classify
 * form fields via a structured JSON prompt that includes the element's raw HTML.
 *
 * Pipeline position: after TensorFlow, before html-fallback.
 *
 * Sync `detect()` always returns null — this classifier is async-only.
 * Async `detectAsync()` sends field HTML context to the AI, parses the JSON
 * response back into a { fieldType, confidence, generatorType } result, and
 * persists the classification to the learning store so TF.js can retrain.
 *
 * On any error (AI unavailable, timeout, parse failure) it returns null so
 * the pipeline continues to the html-fallback classifier.
 */

import type { FormField, FieldType } from "@/types";
import type { FieldClassifier, ClassifierResult } from "../pipeline";
import { storeLearnedEntry } from "@/lib/ai/learning-store";
import { invalidateClassifier } from "./tensorflow-classifier";
import { addDatasetEntry } from "@/lib/dataset/runtime-dataset";
import { createLogger } from "@/lib/logger";
import {
  fieldClassifierPrompt,
  type FieldClassifierInput,
  type FieldClassifierOutput,
} from "@/lib/ai/prompts";

const log = createLogger("ChromeAIClassifier");

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASSIFY_TIMEOUT_MS = 60000;

// ── Session management ────────────────────────────────────────────────────────

/**
 * Lazily resolves the LanguageModel API from globalThis.
 * Evaluated on every call so it works even when the API is injected after module load.
 */
function getLanguageModelApi(): LanguageModelStatic | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).LanguageModel as LanguageModelStatic | undefined;
}

let classifierSession: LanguageModelSession | null = null;

async function getOrCreateSession(): Promise<LanguageModelSession | null> {
  if (classifierSession) return classifierSession;

  try {
    const api = getLanguageModelApi();
    if (!api) return null;

    const avail = await api.availability({ outputLanguage: "en" });
    if (avail === "unavailable") return null;

    classifierSession = await api.create({
      outputLanguage: "en",
    });

    return classifierSession;
  } catch (err) {
    log.warn("Falha ao criar sessão Chrome AI:", err);
    return null;
  }
}

/** Invalidates the cached session (call on extension unload or session error). */
export function destroyClassifierSession(): void {
  if (classifierSession) {
    classifierSession.destroy();
    classifierSession = null;
  }
}

// ── Input builder ─────────────────────────────────────────────────────────────

const MAX_CONTEXT_HTML_CHARS = 500;

/**
 * Extracts the relevant surrounding container HTML for a field element.
 * Walks up the DOM looking for a wrapping label, fieldset or common
 * form-group patterns. Returns null when none is found.
 */
function getContextHtml(el: HTMLElement): string | null {
  const container =
    el.closest<HTMLElement>(
      'label, fieldset, [class*="field"], [class*="group"], [class*="form-"], [class*="input-wrap"]',
    ) ?? el.parentElement;

  if (!container || container === el) return null;

  // Avoid returning the entire <form> or <body>
  if (
    container.tagName === "FORM" ||
    container.tagName === "BODY" ||
    container.tagName === "MAIN"
  ) {
    return null;
  }

  const raw = container.outerHTML;
  if (raw.length <= MAX_CONTEXT_HTML_CHARS) return raw;
  return raw.slice(0, MAX_CONTEXT_HTML_CHARS) + "…";
}

/** Extracts `FieldClassifierInput` from a live DOM `FormField`. */
function buildClassifierInput(field: FormField): FieldClassifierInput {
  return {
    elementHtml: field.element.outerHTML,
    contextHtml: getContextHtml(field.element as HTMLElement) ?? undefined,
    signals: field.contextSignals,
  };
}

// ── Classifier ────────────────────────────────────────────────────────────────

export const chromeAiClassifier: FieldClassifier = {
  name: "chrome-ai",

  /**
   * Synchronous path — always returns null.
   * Chrome AI requires async I/O; use detectAsync() via runAsync().
   */
  detect(_field: FormField): ClassifierResult | null {
    return null;
  },

  /**
   * Async path — sends field HTML context to Gemini Nano and parses the JSON
   * reply. On success, persists the classification to the learning store so
   * TF.js prototype vectors are updated for future page loads.
   * Returns null on unavailability, timeout, or parse failure.
   */
  async detectAsync(field: FormField): Promise<ClassifierResult | null> {
    try {
      const session = await getOrCreateSession();
      if (!session) return null;

      const input = buildClassifierInput(field);
      const prompt = fieldClassifierPrompt.buildPrompt(input);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CLASSIFY_TIMEOUT_MS,
      );

      const fieldLabel = field.contextSignals ?? field.name ?? field.id;

      let raw: string;
      try {
        log.debug(`Prompt for "${fieldLabel}":\n${prompt}`);
        raw = await session.prompt(prompt, { signal: controller.signal });
        log.debug(`Raw response for "${fieldLabel}":\n${raw}`);
      } finally {
        clearTimeout(timeoutId);
      }

      const result: FieldClassifierOutput | null =
        fieldClassifierPrompt.parseResponse(raw);

      if (result) {
        log.debug(
          `"${fieldLabel}" → ${result.fieldType} (generator: ${result.generatorType}, ${(result.confidence * 100).toFixed(0)}%)`,
        );

        // ── Persist to dataset + learning store ───────────────────────────
        // The dataset is the source of truth for the learning store.
        // Both are updated so TF.js can retrain and the cosine classifier
        // benefits immediately on the next field classification.
        const signals = field.contextSignals ?? "";
        if (signals) {
          addDatasetEntry({
            signals,
            type: result.fieldType,
            source: "auto",
            difficulty: "easy",
          }).catch(() => {
            /* non-critical */
          });
          storeLearnedEntry(signals, result.fieldType, result.generatorType)
            .then(() => invalidateClassifier())
            .catch(() => {
              /* non-critical — ignore storage errors */
            });
        }
      }

      // Return only the base ClassifierResult to keep the pipeline interface clean.
      return result
        ? { type: result.fieldType, confidence: result.confidence }
        : null;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Timeout — log so the user can see what happened in DevTools.
        log.warn(
          `⏱ Timeout (${CLASSIFY_TIMEOUT_MS}ms) para "${field.contextSignals ?? field.name ?? field.id}" — passando para html-fallback`,
        );
      } else {
        // Session may be broken — reset so next call creates a fresh one.
        classifierSession = null;
        log.warn("Erro:", (err as Error).message);
      }
      return null;
    }
  },
};
