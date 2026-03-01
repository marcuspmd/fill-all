/**
 * Chrome AI Field Classifier
 *
 * Uses the Chrome Built-in Language API (Gemini Nano, Chrome 131+) to classify
 * form fields via a structured JSON prompt that includes the element's raw HTML.
 *
 * Pipeline position: after TensorFlow, before html-fallback.
 *
 * Sync `detect()` always returns null — this classifier is async-only.
 * Async `detectAsync()` delegates classification to the background service worker
 * via `chrome.runtime.sendMessage` (the LanguageModel API is not available in
 * content scripts). On success, persists the classification to the learning store
 * so TF.js can retrain.
 *
 * On any error (AI unavailable, timeout, parse failure) it returns null so
 * the pipeline continues to the html-fallback classifier.
 */

import type { FormField } from "@/types";
import type { FieldClassifier, ClassifierResult } from "../pipeline";
import { storeLearnedEntry } from "@/lib/ai/learning-store";
import { invalidateClassifier } from "./tensorflow-classifier";
import { addDatasetEntry } from "@/lib/dataset/runtime-dataset";
import { classifyFieldViaProxy } from "@/lib/ai/chrome-ai-proxy";
import { createLogger } from "@/lib/logger";
import type { FieldClassifierInput } from "@/lib/ai/prompts";

const log = createLogger("ChromeAIClassifier");

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
   * Async path — sends field HTML context to the background service worker
   * which prompts Gemini Nano and parses the JSON reply.
   * On success, persists the classification to the learning store so TF.js
   * prototype vectors are updated for future page loads.
   * Returns null on unavailability, timeout, or parse failure.
   */
  async detectAsync(field: FormField): Promise<ClassifierResult | null> {
    const fieldLabel =
      field.label ??
      field.contextSignals ??
      field.name ??
      field.id ??
      field.selector;
    log.debug(`[detectAsync] Iniciando classificação para "${fieldLabel}"`);

    try {
      const input = buildClassifierInput(field);
      const result = await classifyFieldViaProxy(input);

      if (!result) {
        log.debug(
          `[detectAsync] Classificação retornou null para "${fieldLabel}"`,
        );
        return null;
      }

      log.debug(
        `"${fieldLabel}" → ${result.fieldType} (generator: ${result.generatorType}, ${(result.confidence * 100).toFixed(0)}%)`,
      );

      // ── Persist to dataset + learning store ───────────────────────────
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

      return { type: result.fieldType, confidence: result.confidence };
    } catch (err) {
      log.warn("Erro na classificação via proxy:", (err as Error).message);
      return null;
    }
  },
};
