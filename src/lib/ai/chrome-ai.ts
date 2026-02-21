/**
 * Chrome Built-in AI (Gemini Nano) integration
 * Uses the new Prompt API (`LanguageModel` global, Chrome 131+).
 * See: https://developer.chrome.com/docs/ai/get-started
 */

import type { FormField } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const newApi = (globalThis as any).LanguageModel as
  | LanguageModelStatic
  | undefined;

let session: LanguageModelSession | null = null;

export async function isAvailable(): Promise<boolean> {
  try {
    if (!newApi) {
      console.warn(
        "[Fill All / Chrome AI] LanguageModel API não encontrada no globalThis. Chrome AI indisponível.",
      );
      return false;
    }
    const result = await newApi.availability({ outputLanguage: "en" });
    console.log(`[Fill All / Chrome AI] availability() retornou: "${result}"`);
    const available = result === "available" || result === "downloadable";
    if (!available) {
      console.warn(
        `[Fill All / Chrome AI] AI não disponível (status: "${result}").`,
      );
    }
    return available;
  } catch (err) {
    console.error(
      "[Fill All / Chrome AI] Erro ao verificar disponibilidade:",
      err,
    );
    return false;
  }
}

export async function getSession(): Promise<LanguageModelSession> {
  if (session) {
    console.log("[Fill All / Chrome AI] Reutilizando sessão existente.");
    return session;
  }

  console.log("[Fill All / Chrome AI] Criando nova sessão...");

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
  console.log("[Fill All / Chrome AI] Sessão criada com sucesso.");
  return session!;
}

export async function generateFieldValue(field: FormField): Promise<string> {
  console.log(
    `[Fill All / Chrome AI] Gerando valor para campo: selector="${field.selector}" label="${field.label ?? ""}" name="${field.name ?? ""}" type="${field.fieldType}"`,
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

  console.groupCollapsed(
    `[Fill All / Chrome AI] Prompt → campo: "${field.label ?? field.name ?? field.selector}"`,
  );
  console.log("▶ Prompt completo:\n" + prompt);
  console.groupEnd();

  const result = await aiSession.prompt(prompt);

  console.groupCollapsed(
    `[Fill All / Chrome AI] Resposta ← campo: "${field.label ?? field.name ?? field.selector}"`,
  );
  console.log("◀ Resposta raw:\n" + result);
  console.log('◀ Valor final (trimmed): "' + result.trim() + '"');
  console.groupEnd();

  return result.trim();
}

export function destroySession(): void {
  if (session) {
    session.destroy();
    session = null;
  }
}
