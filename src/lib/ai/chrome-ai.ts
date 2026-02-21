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
    if (newApi) {
      const result = await newApi.availability({ outputLanguage: "en" });
      return result === "available" || result === "downloadable";
    }
    return false;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<LanguageModelSession> {
  if (session) return session;

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
  return session!;
}

export async function generateFieldValue(field: FormField): Promise<string> {
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

  const result = await aiSession.prompt(prompt);
  return result.trim();
}

export function destroySession(): void {
  if (session) {
    session.destroy();
    session = null;
  }
}
