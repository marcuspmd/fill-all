/**
 * Chrome AI Field Classifier
 *
 * Uses the Chrome Built-in Language API (Gemini Nano, Chrome 131+) to classify
 * form fields via a structured JSON prompt.
 *
 * Pipeline position: after TensorFlow, before html-fallback.
 *
 * Sync `detect()` always returns null — this classifier is async-only.
 * Async `detectAsync()` sends field context to the AI and parses the JSON
 * response back into a { fieldType, confidence } result.
 *
 * On any error (AI unavailable, timeout, parse failure) it returns null so
 * the pipeline continues to the html-fallback classifier.
 */

import type { FormField, FieldType } from "@/types";
import type { FieldClassifier, ClassifierResult } from "./pipeline";

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASSIFY_TIMEOUT_MS = 3000;
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
 * System prompt instructs the model to act as a field-type classifier and to
 * respond exclusively with a JSON object — no prose, no markdown, no extras.
 */
const SYSTEM_PROMPT = `You are a form field type classifier for Brazilian web forms.
Given context about an HTML form field (label, name, id, placeholder, autocomplete, HTML type),
determine the semantic type of the field.

Respond ONLY with a JSON object in this exact format (no other text):
{"fieldType": "<type>", "confidence": <number>}

Valid types:
cpf, cnpj, email, phone, name, first-name, last-name, full-name,
address, street, city, state, zip-code, cep, date, birth-date,
number, password, username, company, rg, text, money,
select, checkbox, radio, unknown

Rules:
- Return ONLY the JSON, nothing else.
- confidence is a float between 0 and 1.
- Use "unknown" when the field purpose is unclear.
- Only return confidence >= ${MIN_CONFIDENCE} when you are reasonably sure.`;

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
      systemPrompt: SYSTEM_PROMPT,
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

function buildPrompt(field: FormField): string {
  const lines: string[] = [];

  if (field.contextSignals) lines.push(`Signals: ${field.contextSignals}`);

  const inputType = (field.element as HTMLInputElement).type;
  if (inputType && inputType !== "text") lines.push(`HTML type: ${inputType}`);

  if (field.autocomplete) lines.push(`Autocomplete: ${field.autocomplete}`);

  return `Classify this form field:\n${lines.join("\n")}`;
}

// ── Response parser ───────────────────────────────────────────────────────────

function parseResponse(raw: string): ClassifierResult | null {
  try {
    // Extract the first JSON-like object from the response, even if the model
    // adds surrounding text despite instructions.
    const match = raw.match(/\{[^{}]+\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as {
      fieldType?: unknown;
      confidence?: unknown;
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

    return { type, confidence };
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
   * Async path — sends field context to Gemini Nano and parses the JSON reply.
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
        raw = await session.prompt(prompt, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      const result = parseResponse(raw);

      if (result) {
        console.log(
          `[Fill All / Chrome AI Classifier] "${field.contextSignals ?? field.name ?? field.id}" → ${result.type} (${(result.confidence * 100).toFixed(0)}%)`,
        );
      }

      return result;
    } catch (err) {
      // AbortError = timeout; silently skip. Other errors get a warning.
      if (err instanceof Error && err.name !== "AbortError") {
        // Session may be broken — reset so next call creates a fresh one.
        classifierSession = null;
        console.warn("[Fill All / Chrome AI Classifier] Erro:", err.message);
      }
      return null;
    }
  },
};
