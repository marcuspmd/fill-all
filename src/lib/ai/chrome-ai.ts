/**
 * Chrome Built-in AI (Gemini Nano) integration
 * See: https://developer.chrome.com/docs/ai/get-started
 */

import type { FormField } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAi = (globalThis as any).ai as
  | { languageModel: ai.LanguageModel }
  | undefined;

let session: ai.LanguageModelSession | null = null;

export async function isAvailable(): Promise<boolean> {
  try {
    if (!globalAi) return false;
    const capabilities = await globalAi.languageModel.capabilities();
    return capabilities.available !== "no";
  } catch {
    return false;
  }
}

export async function getSession(): Promise<ai.LanguageModelSession> {
  if (session) return session;

  if (!globalAi) {
    throw new Error("Chrome AI is not available");
  }

  const capabilities = await globalAi.languageModel.capabilities();

  if (capabilities.available === "no") {
    throw new Error("Chrome AI is not available on this device");
  }

  session = await globalAi.languageModel.create({
    systemPrompt: `You are a form field value generator. When given information about a form field (its label, name, type, placeholder), you generate a single realistic test value for it. Rules:
- Return ONLY the value, no explanations
- Use Brazilian Portuguese when generating names, addresses, etc.
- Generate valid CPFs, CNPJs when asked
- For dates, use ISO format (YYYY-MM-DD) unless the placeholder suggests otherwise
- For emails, use realistic-looking addresses
- Keep values concise and appropriate for the field`,
  });

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
