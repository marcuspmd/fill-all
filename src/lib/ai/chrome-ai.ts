/**
 * Chrome Built-in AI (Gemini Nano) integration
 * Uses the new Prompt API (`LanguageModel` global, Chrome 131+).
 * See: https://developer.chrome.com/docs/ai/get-started
 */

import type { FormField } from "@/types";
import { createLogger } from "@/lib/logger";
import {
  fieldValueGeneratorPrompt,
  renderSystemPrompt,
} from "@/lib/ai/prompts";
import type { FieldValueInput } from "@/lib/ai/prompts";

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
    const result = await api.availability({ outputLanguage: "en" });
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
 * @returns A reusable AI session, or `null` when AI is unavailable
 */
export async function getSession(): Promise<LanguageModelSession | null> {
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

  const avail = await api.availability({ outputLanguage: "en" });
  if (avail === "unavailable") {
    log.warn(
      "Chrome AI indisponível (status: unavailable) — sessão não criada.",
    );
    return null;
  }
  session = await api.create({ systemPrompt, outputLanguage: "en" });
  log.debug("Sessão criada com sucesso.");
  return session!;
}

/**
 * Generates a realistic test value for a form field via Chrome AI.
 * Constructs a contextual prompt from the field's metadata (label, name, type, …).
 * @param field - The detected form field to generate a value for
 * @returns A trimmed AI-generated value, or `""` when the session is unavailable
 */
export async function generateFieldValue(field: FormField): Promise<string> {
  log.debug(
    `Gerando valor para campo: selector="${field.selector}" label="${field.label ?? ""}" name="${field.name ?? ""}" type="${field.fieldType}"`,
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
  };

  const prompt = fieldValueGeneratorPrompt.buildPrompt(input);

  log.groupCollapsed(
    `Prompt → campo: "${field.label ?? field.name ?? field.selector}"`,
  );
  log.debug("▶ Prompt completo:\n" + prompt);
  log.groupEnd();

  const result = await aiSession.prompt(prompt);

  log.groupCollapsed(
    `Resposta ← campo: "${field.label ?? field.name ?? field.selector}"`,
  );
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
