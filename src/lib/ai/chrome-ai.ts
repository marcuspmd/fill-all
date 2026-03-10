/**
 * Chrome Built-in AI (Gemini Nano) integration
 * Uses the new Prompt API (`LanguageModel` global, Chrome 131+).
 * See: https://developer.chrome.com/docs/ai/get-started
 */

import type { FormField } from "@/types";
import { createLogger } from "@/lib/logger";
import {
  fieldValueGeneratorPrompt,
  formContextGeneratorPrompt,
  renderSystemPrompt,
} from "@/lib/ai/prompts";
import type {
  FieldValueInput,
  FormContextFieldInput,
  FormContextOutput,
} from "@/lib/ai/prompts";
import { FORM_CONTEXT_MAX_FIELDS } from "@/lib/ai/prompts";

const log = createLogger("ChromeAI");

/**
 * Lazily resolves the LanguageModel API from globalThis.
 * Evaluated on every call so it works even when the API is injected after module load.
 */
function getLanguageModelApi(): LanguageModelStatic | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).LanguageModel as LanguageModelStatic | undefined;
}

let session: LanguageModelSession | null = null;

/**
 * Checks whether the Chrome Built-in AI (Gemini Nano) Prompt API
 * is available in the current browser.
 * @returns `true` when the API exists and readiness is "available" or "downloadable"
 */
export async function isAvailable(): Promise<boolean> {
  try {
    const api = getLanguageModelApi();
    if (!api) {
      const context =
        typeof globalThis !== "undefined"
          ? Object.getOwnPropertyNames(globalThis).filter((k) =>
              /ai|language|model|prompt/i.test(k),
            )
          : [];
      log.warn(
        `LanguageModel API não encontrada no globalThis. ` +
          `Contexto: ${typeof self !== "undefined" ? "service-worker" : "unknown"}, ` +
          `AI-related keys: [${context.length > 0 ? context.join(", ") : "nenhuma"}]. ` +
          `Chrome AI indisponível.`,
      );
      return false;
    }
    const result = await api.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
    log.debug(`availability() retornou: "${result}"`);
    const available = result === "available" || result === "downloadable";
    if (!available) {
      log.warn(`AI não disponível (status: "${result}").`);
    }
    return available;
  } catch (err) {
    log.error("Erro ao verificar disponibilidade:", err);
    return false;
  }
}

/**
 * Returns an existing or freshly created `LanguageModel` session.
 * The session carries a system prompt tailored for form-value generation.
 *
 * Recycles automatically when the context window is ≥85% full to prevent
 * the model from consuming gigabytes of memory across many form fills.
 * @returns A reusable AI session, or `null` when AI is unavailable
 */
export async function getSession(): Promise<LanguageModelSession | null> {
  if (session) {
    // Recycle when context window is almost exhausted
    const remaining = session.tokensRemaining;
    const max = session.maxTokens;
    if (remaining !== undefined && max !== undefined && max > 0) {
      const usedRatio = (max - remaining) / max;
      if (usedRatio >= 0.85) {
        log.debug(
          `Contexto da sessão quase cheio (${remaining}/${max} tokens restantes). Reciclando sessão...`,
        );
        session.destroy();
        session = null;
      }
    }
  }

  if (session) {
    log.debug("Reutilizando sessão existente.");
    return session;
  }

  log.debug("Criando nova sessão...");

  const systemPrompt = renderSystemPrompt(fieldValueGeneratorPrompt);

  const api = getLanguageModelApi();
  if (!api) {
    log.warn("Chrome AI API não encontrada — sessão não criada.");
    return null;
  }

  const avail = await api.availability({
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  });
  if (avail === "unavailable") {
    log.warn(
      "Chrome AI indisponível (status: unavailable) — sessão não criada.",
    );
    return null;
  }
  session = await api.create({
    systemPrompt,
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  });
  log.debug("Sessão criada com sucesso.");
  return session!;
}

/**
 * Generates a realistic test value for a form field via Chrome AI.
 * Constructs a contextual prompt from the field's metadata (label, name, type, …).
 * @param field - The detected form field to generate a value for
 * @param customPrompt - Optional custom prompt to use instead of auto-generating one
 * @returns A trimmed AI-generated value, or `""` when the session is unavailable
 */
export async function generateFieldValue(
  field: FormField,
  customPrompt?: string,
): Promise<string> {
  log.debug(
    `Gerando valor para campo: selector="${field.selector}" label="${field.label ?? ""}" name="${field.name ?? ""}" type="${field.fieldType}"${customPrompt ? ` [custom prompt: "${customPrompt}"]` : ""}`,
  );

  const aiSession = await getSession();
  if (!aiSession) {
    log.warn("Sessão Chrome AI indisponível — não é possível gerar valor.");
    return "";
  }

  const input: FieldValueInput = {
    label: field.label,
    name: field.name,
    id: field.id,
    placeholder: field.placeholder,
    autocomplete: field.autocomplete,
    inputType: (field.element as HTMLInputElement).type || "text",
    fieldType: field.fieldType,
    customPrompt,
  };

  const prompt = fieldValueGeneratorPrompt.buildPrompt(input);

  log.groupCollapsed(
    `Prompt → campo: "${field.label ?? field.name ?? field.selector}"`,
  );
  log.debug("▶ Prompt completo:\n" + prompt);
  log.groupEnd();

  let result: string;
  try {
    result = await aiSession.prompt(prompt);
  } catch (err) {
    log.warn("Erro ao gerar valor com Chrome AI — destruindo sessão:", err);
    session?.destroy();
    session = null;
    return "";
  }

  log.groupCollapsed(
    `Resposta ← campo: "${field.label ?? field.name ?? field.selector}"`,
  );
  log.debug("◄ Resposta raw:\n" + result);
  log.debug('\u25c4 Valor final (trimmed): "' + result.trim() + '"');
  log.groupEnd();

  return result.trim();
}

/**
 * Generates a value from serializable field metadata — no DOM element needed.
 * Used by the background handler when proxying AI_GENERATE from content scripts.
 * @param input - Field metadata including optional custom prompt
 * @returns A trimmed AI-generated value, or `""` when the session is unavailable
 */
export async function generateFieldValueFromInput(
  input: FieldValueInput,
): Promise<string> {
  log.debug(
    `Gerando valor via input: label="${input.label ?? ""}" name="${input.name ?? ""}" type="${input.fieldType}"${input.customPrompt ? ` [custom prompt: "${input.customPrompt}"]` : ""}`,
  );

  const aiSession = await getSession();
  if (!aiSession) {
    log.warn("Sessão Chrome AI indisponível — não é possível gerar valor.");
    return "";
  }

  const prompt = fieldValueGeneratorPrompt.buildPrompt(input);

  log.groupCollapsed(`Prompt → campo: "${input.label ?? input.name ?? "?"}"`);
  log.debug("▶ Prompt completo:\n" + prompt);
  log.groupEnd();

  let result: string;
  try {
    result = await aiSession.prompt(prompt);
  } catch (err) {
    log.warn(
      "Erro ao gerar valor via input (Chrome AI) — destruindo sessão:",
      err,
    );
    session?.destroy();
    session = null;
    return "";
  }

  log.groupCollapsed(`Resposta ← campo: "${input.label ?? input.name ?? "?"}"`);
  log.debug("◄ Resposta raw:\n" + result);
  log.debug('\u25c4 Valor final (trimmed): "' + result.trim() + '"');
  log.groupEnd();
  return result.trim();
}

/** Destroys the current AI session and releases resources. */
export function destroySession(): void {
  if (session) {
    session.destroy();
    session = null;
  }
}

/**
 * Generates coherent values for ALL form fields at once using a single
 * Chrome AI call. All values belong to the same fictional person/entity.
 *
 * @param fields     - Array of compact field descriptors (index, label, type, options)
 * @param userContext - Optional freeform context string to guide generation
 * @param imageBlobs  - Optional image blobs (uploaded image + rendered PDF pages)
 * @returns A map of `"index" → "value"` or `null` when AI is unavailable/fails
 */
export async function generateFormContextValues(
  fields: readonly FormContextFieldInput[],
  userContext?: string,
  imageBlobs?: Blob[],
): Promise<FormContextOutput | null> {
  if (fields.length === 0) return null;

  const batch = fields.slice(0, FORM_CONTEXT_MAX_FIELDS);
  log.debug(
    `Gerando contexto para ${batch.length} campos com Chrome AI... (imagens: ${imageBlobs?.length ?? 0})`,
  );

  const aiSession = await getSession();
  if (!aiSession) {
    log.warn("Sessão Chrome AI indisponível — contexto não gerado.");
    return null;
  }

  const hasImages = imageBlobs !== undefined && imageBlobs.length > 0;

  // When images are present, prepend a strict extraction instruction so the
  // model reads values from the document instead of hallucinating them.
  const imageInstruction = hasImages
    ? "IMPORTANT: One or more document images are attached. Extract field values DIRECTLY from the images. " +
      "Do NOT invent or guess values that are not visible in the images. " +
      "Only use the generator rules for fields whose values are NOT present in the images.\n"
    : undefined;

  const textPrompt = formContextGeneratorPrompt.buildPrompt(
    batch,
    imageInstruction
      ? [imageInstruction, userContext].filter(Boolean).join("\n")
      : userContext,
  );

  // When images are present, a separate session must be created with
  // expectedInputs: [{ type: "image" }] — the shared global session does not
  // support images.
  let promptSession: LanguageModelSession | null = aiSession;
  let tempSession: LanguageModelSession | null = null;
  if (hasImages) {
    const api = getLanguageModelApi();
    if (api) {
      try {
        log.debug("Criando sessão com suporte a imagens...");
        tempSession = await api.create({
          systemPrompt: renderSystemPrompt(fieldValueGeneratorPrompt),
          expectedInputs: [
            { type: "text", languages: ["en"] },
            { type: "image" },
          ],
          expectedOutputs: [{ type: "text", languages: ["en"] }],
          // Low temperature + topK=1: model must extract from the image,
          // not hallucinate. When visual context is present, creativity
          // is a bug, not a feature.
          temperature: 0.2,
          topK: 1,
        });
        promptSession = tempSession;
        log.debug("Sessão com imagens criada.");
      } catch (err) {
        log.warn(
          "Sessão com suporte a imagens indisponível — usando apenas texto:",
          err,
        );
        // Fall back to text-only
      }
    }
  }

  // Build multimodal input.
  // Chrome AI requires role-based messages when content includes images.
  const promptInput: LanguageModelPromptInput =
    hasImages && tempSession
      ? [
          {
            role: "user" as const,
            content: [
              { type: "text" as const, value: textPrompt },
              ...imageBlobs!.map(
                (blob): LanguageModelImagePart => ({
                  type: "image",
                  value: blob,
                }),
              ),
            ],
          },
        ]
      : textPrompt;

  log.groupCollapsed("Prompt → form-context-generator");
  log.debug("▶ Prompt:\n" + textPrompt);
  if (hasImages)
    log.debug(
      `▶ Imagens (${imageBlobs!.length}): ` +
        imageBlobs!.map((b) => `${b.type} (${b.size}b)`).join(", "),
    );
  log.groupEnd();

  let raw: string;
  try {
    raw = await promptSession!.prompt(promptInput);
  } catch (err) {
    log.warn("Erro ao gerar contexto de formulário — destruindo sessão:", err);
    if (tempSession) {
      tempSession.destroy();
    } else {
      session?.destroy();
      session = null;
    }
    return null;
  } finally {
    // Always destroy the temporary image session after use
    if (tempSession) {
      tempSession.destroy();
    }
  }

  log.groupCollapsed("Resposta ← form-context-generator");
  log.debug("◄ Resposta raw:\n" + raw);
  log.groupEnd();

  const result = formContextGeneratorPrompt.parseResponse(raw);
  if (!result) {
    log.warn("Falha ao parsear JSON da resposta contextual. Raw:\n" + raw);
    return null;
  }

  log.info(
    `Contexto gerado com sucesso: ${Object.keys(result).length} campos.`,
  );
  return result;
}
