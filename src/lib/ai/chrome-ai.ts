/**
 * Chrome Built-in AI (Gemini Nano) integration
 * Uses the new Prompt API (`LanguageModel` global, Chrome 131+).
 * See: https://developer.chrome.com/docs/ai/get-started
 */

import type { FormField } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("ChromeAI");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const newApi = (globalThis as any).LanguageModel as
  | LanguageModelStatic
  | undefined;

let session: LanguageModelSession | null = null;

/**
 * Checks whether the Chrome Built-in AI (Gemini Nano) Prompt API
 * is available in the current browser.
 * @returns `true` when the API exists and readiness is "available" or "downloadable"
 */
export async function isAvailable(): Promise<boolean> {
  try {
    if (!newApi) {
      log.warn(
        "LanguageModel API não encontrada no globalThis. Chrome AI indisponível.",
      );
      return false;
    }
    const result = await newApi.availability({ outputLanguage: "en" });
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

  const systemPrompt = `You are a form field value generator. When given information about a form field (its label, name, type, placeholder), you generate a single realistic test value for it. Rules:
- Return ONLY the value, no explanations
- Use Brazilian Portuguese when generating names, addresses, etc.
- Generate valid CPFs, CNPJs when asked
- For dates, use ISO format (YYYY-MM-DD) unless the placeholder suggests otherwise
- For emails, use realistic-looking addresses
- Keep values concise and appropriate for the field`;

  if (!newApi) {
    log.warn("Chrome AI API não encontrada — sessão não criada.");
    return null;
  }

  const avail = await newApi.availability({ outputLanguage: "en" });
  if (avail === "unavailable") {
    log.warn(
      "Chrome AI indisponível (status: unavailable) — sessão não criada.",
    );
    return null;
  }
  session = await newApi.create({ systemPrompt, outputLanguage: "en" });
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

  const context = [
    field.label && `Label: ${field.label}`,
    field.name && `Name: ${field.name}`,
    field.id && `ID: ${field.id}`,
    field.placeholder && `Placeholder: ${field.placeholder}`,
    field.autocomplete && `Autocomplete: ${field.autocomplete}`,
    `Type: ${(field.element as HTMLInputElement).type || "text"}`,
    `Detected as: ${field.fieldType}`,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Generate a realistic test value for this form field:\n${context}`;

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
