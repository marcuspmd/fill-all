/**
 * AI message handler — AI_CHECK_AVAILABLE, AI_GENERATE, AI_CLASSIFY_FIELD
 *
 * Runs in the background service worker where `LanguageModel` is available.
 * Content scripts proxy their Chrome AI calls through these message types.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import {
  isAvailable,
  generateFieldValueFromInput,
  generateFormContextValues,
} from "@/lib/ai/chrome-ai";
import { optimizeScript } from "@/lib/ai/script-optimizer";
import type { ScriptOptimizerInput } from "@/lib/ai/prompts/script-optimizer.prompt";
import {
  fieldClassifierPrompt,
  type FieldClassifierInput,
  type FieldClassifierOutput,
  type FieldValueInput,
  type FormContextFieldInput,
} from "@/lib/ai/prompts";
import { createLogger } from "@/lib/logger";

const log = createLogger("AIHandler");

const SUPPORTED: ReadonlyArray<MessageType> = [
  "AI_CHECK_AVAILABLE",
  "AI_CLASSIFY_FIELD",
  "AI_GENERATE",
  "AI_OPTIMIZE_SCRIPT",
  "AI_GENERATE_FORM_CONTEXT",
];

// ── Classifier session management ─────────────────────────────────────────────

const CLASSIFY_TIMEOUT_MS = 60_000;
const SESSION_FAILURE_TTL_MS = 60_000;

let classifierSession: LanguageModelSession | null = null;
let sessionFailedAt: number | null = null;

function getLanguageModelApi(): LanguageModelStatic | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).LanguageModel as LanguageModelStatic | undefined;
}

async function getOrCreateClassifierSession(): Promise<LanguageModelSession | null> {
  if (classifierSession) {
    // Recycle when context window is almost exhausted
    const remaining = classifierSession.tokensRemaining;
    const max = classifierSession.maxTokens;
    if (remaining !== undefined && max !== undefined && max > 0) {
      const usedRatio = (max - remaining) / max;
      if (usedRatio >= 0.85) {
        log.debug(
          `Contexto do classifier quase cheio (${remaining}/${max} tokens). Reciclando...`,
        );
        classifierSession.destroy();
        classifierSession = null;
      }
    }
  }

  if (classifierSession) return classifierSession;

  // Skip retry if session creation failed recently
  if (
    sessionFailedAt &&
    Date.now() - sessionFailedAt < SESSION_FAILURE_TTL_MS
  ) {
    return null;
  }

  try {
    const api = getLanguageModelApi();
    if (!api) {
      log.warn(
        "LanguageModel API não encontrada no background service worker.",
      );
      sessionFailedAt = Date.now();
      return null;
    }

    const avail = await api.availability({ outputLanguage: "en" });
    if (avail === "unavailable") {
      log.warn(
        `Chrome AI indisponível para classificação (status: "${avail}").`,
      );
      sessionFailedAt = Date.now();
      return null;
    }

    log.debug(`Criando sessão de classificação (availability: "${avail}")...`);
    classifierSession = await api.create({ outputLanguage: "en" });
    log.info("Sessão Chrome AI Classifier (background) criada com sucesso.");
    sessionFailedAt = null;
    return classifierSession;
  } catch (err) {
    log.warn("Falha ao criar sessão de classificação:", err);
    sessionFailedAt = Date.now();
    return null;
  }
}

// ── Classification logic ──────────────────────────────────────────────────────

async function classifyField(
  input: FieldClassifierInput,
): Promise<FieldClassifierOutput | null> {
  const session = await getOrCreateClassifierSession();
  if (!session) return null;

  const prompt = fieldClassifierPrompt.buildPrompt(input);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLASSIFY_TIMEOUT_MS);

  let raw: string;
  try {
    raw = await session.prompt(prompt, {
      signal: controller.signal,
      outputLanguage: "en",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      log.warn(`Timeout (${CLASSIFY_TIMEOUT_MS}ms) na classificação.`);
    } else {
      classifierSession?.destroy();
      classifierSession = null;
      log.warn("Erro na classificação:", (err as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }

  return fieldClassifierPrompt.parseResponse(raw);
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "AI_CHECK_AVAILABLE": {
      // Also resets the classifier session failure cache so a new detection
      // batch can retry session creation.
      sessionFailedAt = null;
      return isAvailable();
    }

    case "AI_CLASSIFY_FIELD": {
      const payload = message.payload as FieldClassifierInput | undefined;
      if (!payload?.elementHtml) {
        log.warn("AI_CLASSIFY_FIELD recebido sem elementHtml.");
        return null;
      }
      return classifyField(payload);
    }

    case "AI_GENERATE": {
      const payload = message.payload as Record<string, unknown> | undefined;
      if (!payload || typeof payload.fieldType !== "string") {
        log.warn("AI_GENERATE recebido sem payload válido.");
        return "";
      }
      return generateFieldValueFromInput(payload as unknown as FieldValueInput);
    }

    case "AI_OPTIMIZE_SCRIPT": {
      const payload = message.payload as ScriptOptimizerInput | undefined;
      if (!payload?.script || !payload?.framework) {
        log.warn("AI_OPTIMIZE_SCRIPT recebido sem script ou framework.");
        return null;
      }
      return optimizeScript(payload);
    }

    case "AI_GENERATE_FORM_CONTEXT": {
      const raw = message.payload as
        | {
            fields?: FormContextFieldInput[];
            userContext?: string;
            imageDataUrl?: string;
            pdfPageDataUrls?: string[];
          }
        | FormContextFieldInput[]
        | undefined;

      // Support both legacy array payload and new structured payload
      const fields = Array.isArray(raw) ? raw : raw?.fields;
      const userContext = Array.isArray(raw) ? undefined : raw?.userContext;
      const imageDataUrl = Array.isArray(raw) ? undefined : raw?.imageDataUrl;
      const pdfPageDataUrls = Array.isArray(raw)
        ? undefined
        : raw?.pdfPageDataUrls;

      if (!Array.isArray(fields) || fields.length === 0) {
        log.warn("AI_GENERATE_FORM_CONTEXT recebido sem campos.");
        return null;
      }

      // Convert all data URLs to Blobs for multimodal input (works in service workers)
      const imageBlobs: Blob[] = [];

      if (imageDataUrl) {
        try {
          const blob = await fetch(imageDataUrl).then((r) => r.blob());
          imageBlobs.push(blob);
          log.debug(
            `Imagem convertida para Blob: ${blob.type} (${blob.size} bytes)`,
          );
        } catch (err) {
          log.warn("Falha ao converter imageDataUrl para Blob:", err);
        }
      }

      if (pdfPageDataUrls && pdfPageDataUrls.length > 0) {
        for (const url of pdfPageDataUrls) {
          try {
            const blob = await fetch(url).then((r) => r.blob());
            imageBlobs.push(blob);
            log.debug(
              `Página PDF convertida para Blob: ${blob.type} (${blob.size} bytes)`,
            );
          } catch (err) {
            log.warn("Falha ao converter página PDF para Blob:", err);
          }
        }
      }

      return generateFormContextValues(
        fields,
        userContext,
        imageBlobs.length > 0 ? imageBlobs : undefined,
      );
    }

    default:
      return { error: `Unhandled type in aiHandler: ${message.type}` };
  }
}

export const aiHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};

/** Destroys the background classifier session and releases Chrome AI resources. */
export function destroyClassifierSession(): void {
  if (classifierSession) {
    classifierSession.destroy();
    classifierSession = null;
  }
}
