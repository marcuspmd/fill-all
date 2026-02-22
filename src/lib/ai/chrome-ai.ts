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

export async function getSession(): Promise<LanguageModelSession> {
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

  if (!newApi) throw new Error("Chrome AI is not available");

  const avail = await newApi.availability({ outputLanguage: "en" });
  if (avail === "unavailable") throw new Error("Chrome AI is not available");
  session = await newApi.create({ systemPrompt, outputLanguage: "en" });
  log.debug("Sessão criada com sucesso.");
  return session!;
}

export async function generateFieldValue(field: FormField): Promise<string> {
  log.debug(
    `Gerando valor para campo: selector="${field.selector}" label="${field.label ?? ""}" name="${field.name ?? ""}" type="${field.fieldType}"`,
  );

  const aiSession = await getSession();

  const context = [
    field.label && `Label: ${field.label}`,
    field.name && `Name: ${field.name}`,
    field.id && `ID: ${field.id}`,
    field.placeholder && `Placeholder: ${field.placeholder}`,
    field.autocomplete && `Autocomplete: ${field.autocomplete}`,
    `Type: ${field.element.type || "text"}`,
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

export function destroySession(): void {
  if (session) {
    session.destroy();
    session = null;
  }
}
