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
import type { FieldClassifier, ClassifierResult } from "./pipeline";
import { storeLearnedEntry } from "@/lib/ai/learning-store";
import { invalidateClassifier } from "./tensorflow-classifier";
import { addDatasetEntry } from "@/lib/dataset/runtime-dataset";
import { createLogger } from "@/lib/logger";

const log = createLogger("ChromeAIClassifier");

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASSIFY_TIMEOUT_MS = 60000;
const MIN_CONFIDENCE = 0.6;

const VALID_FIELD_TYPES = new Set<string>([
  "cpf",
  "cnpj",
  "email",
  "phone",
  "name",
  "first-name",
  "last-name",
  "full-name",
  "address",
  "street",
  "city",
  "state",
  "zip-code",
  "cep",
  "date",
  "birth-date",
  "number",
  "password",
  "username",
  "company",
  "rg",
  "text",
  "money",
  "select",
  "checkbox",
  "radio",
  "unknown",
]);

/**
 * Inline instructions embedded in every prompt so the model always has context,
 * regardless of whether the Chrome AI session supports systemPrompt.
 * This is the only reliable way to enforce JSON-only output with Gemini Nano.
 */
const INLINE_INSTRUCTIONS = `You are a form field type classifier for Brazilian web forms.
You will receive the raw HTML of an input element and its surrounding container.
Determine the semantic type of the field and which data generator should fill it.

You MUST respond ONLY with a JSON object in this exact format — no other text, no markdown, no explanation:
{"fieldType": "<type>", "confidence": <number>, "generatorType": "<generator>"}

Valid fieldType values:
cpf, cnpj, email, phone, name, first-name, last-name, full-name,
address, street, city, state, zip-code, cep, date, birth-date,
number, password, username, company, rg, text, money,
select, checkbox, radio, unknown

Valid generatorType values (same list — pick the most specific generator):
cpf, cnpj, email, phone, name, first-name, last-name, full-name,
address, street, city, state, zip-code, cep, date, birth-date,
number, password, username, company, rg, text, money,
select, checkbox, radio, unknown

Rules:
- Return ONLY the JSON object, nothing else. No introductory text.
- confidence is a float between 0.0 and 1.0.
- Use "unknown" when the field purpose is unclear.
- Only return confidence >= ${MIN_CONFIDENCE} when you are reasonably sure.
- generatorType should match the most specific generator for the field
  (e.g. for a birth date field use "birth-date", not just "date").
- Analyse HTML attributes (name, id, placeholder, class, aria-label, autocomplete)
  as well as visible label text to determine the field purpose.

Example output: {"fieldType": "email", "confidence": 0.98, "generatorType": "email"}`;

// ── Session management ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LanguageModelAPI = (globalThis as any).LanguageModel as
  | LanguageModelStatic
  | undefined;

let classifierSession: LanguageModelSession | null = null;

async function getOrCreateSession(): Promise<LanguageModelSession | null> {
  if (classifierSession) return classifierSession;

  try {
    if (!LanguageModelAPI) return null;

    const avail = await LanguageModelAPI.availability({ outputLanguage: "en" });
    if (avail === "unavailable") return null;

    classifierSession = await LanguageModelAPI.create({
      outputLanguage: "en",
    });

    return classifierSession;
  } catch {
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

// ── Prompt builder ────────────────────────────────────────────────────────────

/** Maximum characters to include from outerHTML to keep prompts concise. */
const MAX_ELEMENT_HTML_CHARS = 600;
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

function buildPrompt(field: FormField): string {
  const sections: string[] = [];

  // ── Section 1: raw element HTML ───────────────────────────────────────────
  const elementHtml = field.element.outerHTML;
  sections.push(
    `=== Element HTML ===\n${elementHtml.length > MAX_ELEMENT_HTML_CHARS ? elementHtml.slice(0, MAX_ELEMENT_HTML_CHARS) + "…" : elementHtml}`,
  );

  // ── Section 2: surrounding container HTML (label + field wrapper) ─────────
  const contextHtml = getContextHtml(field.element as HTMLElement);
  if (contextHtml) {
    sections.push(`=== Surrounding HTML (container) ===\n${contextHtml}`);
  }

  // ── Section 3: pre-computed text signals (normalised label / name / id …) ──
  if (field.contextSignals?.trim()) {
    sections.push(`=== Field Signals ===\n${field.contextSignals}`);
  }

  // Inline instructions are always embedded to ensure JSON-only output,
  // since Gemini Nano may ignore session-level systemPrompt in some Chrome builds.
  return `${INLINE_INSTRUCTIONS}\n\nClassify this form field:\n\n${sections.join("\n\n")}`;
}

// ── Response parser ───────────────────────────────────────────────────────────

interface AiClassifierResult extends ClassifierResult {
  /** Generator the AI recommended for this field. */
  generatorType: FieldType;
}

function parseResponse(raw: string): AiClassifierResult | null {
  try {
    // Extract the first JSON-like object from the response, even if the model
    // adds surrounding text despite instructions.
    const match = raw.match(/\{[^{}]+\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as {
      fieldType?: unknown;
      confidence?: unknown;
      generatorType?: unknown;
    };

    if (
      typeof parsed.fieldType !== "string" ||
      !VALID_FIELD_TYPES.has(parsed.fieldType) ||
      typeof parsed.confidence !== "number"
    ) {
      return null;
    }

    const type = parsed.fieldType as FieldType;
    const confidence = Math.max(0, Math.min(1, parsed.confidence));

    // Discard low-confidence and "unknown" results — let the fallback handle them.
    if (type === "unknown" || confidence < MIN_CONFIDENCE) return null;

    // generatorType — must be a valid FieldType; falls back to fieldType.
    const rawGenerator =
      typeof parsed.generatorType === "string" &&
      VALID_FIELD_TYPES.has(parsed.generatorType)
        ? (parsed.generatorType as FieldType)
        : type;

    return { type, confidence, generatorType: rawGenerator };
  } catch {
    return null;
  }
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

      const prompt = buildPrompt(field);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        CLASSIFY_TIMEOUT_MS,
      );

      let raw: string;
      try {
        log.debug(
          `Prompt for "${field.contextSignals ?? field.name ?? field.id}":\n${prompt}`,
        );
        raw = await session.prompt(prompt, { signal: controller.signal });
        log.debug(
          `Raw response for "${field.contextSignals ?? field.name ?? field.id}":\n${raw}`,
        );
      } finally {
        log.debug(
          `Response for "${field.contextSignals ?? field.name ?? field.id}":\n${prompt ?? "(no response)"}`,
        );
        clearTimeout(timeoutId);
      }

      const result = parseResponse(raw);

      if (result) {
        log.debug(
          `"${field.contextSignals ?? field.name ?? field.id}" → ${result.type} (generator: ${result.generatorType}, ${(result.confidence * 100).toFixed(0)}%)`,
        );

        // ── Persist to dataset + learning store ───────────────────────────
        // The dataset is the source of truth for the learning store.
        // Both are updated so TF.js can retrain and the cosine classifier
        // benefits immediately on the next field classification.
        const signals = field.contextSignals ?? "";
        if (signals) {
          addDatasetEntry({
            signals,
            type: result.type,
            source: "auto",
            difficulty: "easy",
          }).catch(() => {
            /* non-critical */
          });
          storeLearnedEntry(signals, result.type, result.generatorType)
            .then(() => invalidateClassifier())
            .catch(() => {
              /* non-critical — ignore storage errors */
            });
        }
      }

      // Return only the base ClassifierResult to keep the pipeline interface clean.
      return result
        ? { type: result.type, confidence: result.confidence }
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
