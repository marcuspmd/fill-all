/**
 * Chrome AI Proxy — Content Script → Background messaging bridge
 *
 * The LanguageModel API is only available in extension contexts (background,
 * popup, options), NOT in content scripts. This module provides the same
 * public API surface as `chrome-ai.ts` but delegates every call to the
 * background service worker via `chrome.runtime.sendMessage`.
 *
 * Import this module in content scripts instead of `chrome-ai.ts`.
 */

import type { FormField } from "@/types";
import type {
  FieldClassifierInput,
  FieldClassifierOutput,
  FieldValueInput,
  FormContextFieldInput,
  FormContextOutput,
} from "@/lib/ai/prompts";
import type { ScriptOptimizerInput } from "@/lib/ai/prompts/script-optimizer.prompt";
import { createLogger } from "@/lib/logger";

const log = createLogger("ChromeAIProxy");

/**
 * Checks whether Chrome AI is available by asking the background service worker.
 * Also resets the classifier session failure cache in the background so a new
 * detection batch can retry session creation.
 */
export async function isAvailableViaProxy(): Promise<boolean> {
  try {
    const result = await chrome.runtime.sendMessage({
      type: "AI_CHECK_AVAILABLE",
    });
    log.debug(`AI_CHECK_AVAILABLE → ${result}`);
    return result === true;
  } catch (err) {
    log.warn("Erro ao verificar disponibilidade via proxy:", err);
    return false;
  }
}

/**
 * Generates a realistic test value for a form field by proxying the request
 * to the background service worker where `LanguageModel` is available.
 * @param field - The form field to generate a value for
 * @param customPrompt - Optional custom prompt to use for AI generation
 */
export async function generateFieldValueViaProxy(
  field: FormField,
  customPrompt?: string,
): Promise<string> {
  try {
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

    const result = await chrome.runtime.sendMessage({
      type: "AI_GENERATE",
      payload: input,
    });

    log.debug(
      `AI_GENERATE → "${typeof result === "string" ? result : ""}" (campo: "${field.label ?? field.name ?? field.selector}")${customPrompt ? " [custom prompt]" : ""}`,
    );
    return typeof result === "string" ? result : "";
  } catch (err) {
    log.warn("Erro ao gerar valor via proxy:", err);
    return "";
  }
}

/**
 * Classifies a form field by sending its extracted HTML context to the
 * background service worker for Chrome AI classification.
 */
export async function classifyFieldViaProxy(
  input: FieldClassifierInput,
): Promise<FieldClassifierOutput | null> {
  try {
    const result = await chrome.runtime.sendMessage({
      type: "AI_CLASSIFY_FIELD",
      payload: input,
    });

    if (result && typeof result === "object" && "fieldType" in result) {
      log.debug(
        `AI_CLASSIFY_FIELD → ${result.fieldType} (${((result.confidence ?? 0) * 100).toFixed(0)}%)`,
      );
      return result as FieldClassifierOutput;
    }

    return null;
  } catch (err) {
    log.warn("Erro ao classificar campo via proxy:", err);
    return null;
  }
}

/**
 * Optimizes an E2E test script by proxying the request to the background
 * service worker where Chrome AI (Gemini Nano) runs.
 *
 * @returns Optimized script string, or `null` when AI is unavailable or fails.
 */
export async function optimizeScriptViaProxy(
  input: ScriptOptimizerInput,
): Promise<string | null> {
  try {
    const result = await chrome.runtime.sendMessage({
      type: "AI_OPTIMIZE_SCRIPT",
      payload: input,
    });

    if (typeof result === "string" && result.length > 0) {
      log.debug(
        `AI_OPTIMIZE_SCRIPT → ${result.length} chars (framework: ${input.framework})`,
      );
      return result;
    }

    log.debug("AI_OPTIMIZE_SCRIPT → null (sem resultado)");
    return null;
  } catch (err) {
    log.warn("Erro ao otimizar script via proxy:", err);
    return null;
  }
}

/**
 * Generates coherent values for all form fields at once by proxying to the
 * background service worker. Returns a `"index" → "value"` map or `null`.
 */
export async function generateFormContextValuesViaProxy(
  fields: readonly FormContextFieldInput[],
  userContext?: string,
  imageDataUrl?: string,
  pdfPageDataUrls?: string[],
): Promise<FormContextOutput | null> {
  try {
    const result = await chrome.runtime.sendMessage({
      type: "AI_GENERATE_FORM_CONTEXT",
      payload: { fields, userContext, imageDataUrl, pdfPageDataUrls },
    });

    if (result && typeof result === "object" && !Array.isArray(result)) {
      const output = result as FormContextOutput;
      log.debug(
        `AI_GENERATE_FORM_CONTEXT → ${Object.keys(output).length} valores gerados`,
      );
      return output;
    }

    log.debug("AI_GENERATE_FORM_CONTEXT → null (sem resultado)");
    return null;
  } catch (err) {
    log.warn("Erro ao gerar contexto de formulário via proxy:", err);
    return null;
  }
}
