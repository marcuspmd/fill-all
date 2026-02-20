/**
 * Form filler — fills detected fields with generated or saved values
 */

import type { FormField, GenerationResult, Settings } from "@/types";
import { detectFormFields } from "./form-detector";
import { resolveFieldValue } from "@/lib/rules/rule-engine";
import {
  generateFieldValue as chromeAiGenerate,
  isAvailable as isChromeAiAvailable,
} from "@/lib/ai/chrome-ai";
import { generateWithTensorFlow } from "@/lib/ai/tensorflow-generator";
import { getSettings } from "@/lib/storage/storage";

function setNativeValue(element: HTMLElement, value: string): void {
  // Trigger React/Vue/Angular change detection
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;

  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  if (element instanceof HTMLInputElement && nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else if (
    element instanceof HTMLTextAreaElement &&
    nativeTextAreaValueSetter
  ) {
    nativeTextAreaValueSetter.call(element, value);
  } else if (element instanceof HTMLSelectElement) {
    element.value = value;
  }

  // Dispatch events to notify frameworks
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

function handleSelectElement(element: HTMLSelectElement, value: string): void {
  const options = Array.from(element.options);

  // Try to match by value first
  const byValue = options.find((opt) => opt.value === value);
  if (byValue) {
    element.value = byValue.value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // Try to match by text
  const byText = options.find((opt) =>
    opt.text.toLowerCase().includes(value.toLowerCase()),
  );
  if (byText) {
    element.value = byText.value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // Pick a random non-empty option
  const validOptions = options.filter((opt) => opt.value);
  if (validOptions.length > 0) {
    const random =
      validOptions[Math.floor(Math.random() * validOptions.length)];
    element.value = random.value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function handleCheckboxOrRadio(element: HTMLInputElement): void {
  element.checked = true;
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function highlightField(element: HTMLElement): void {
  const original = element.style.outline;
  element.style.outline = "2px solid #4F46E5";
  element.style.outlineOffset = "1px";
  setTimeout(() => {
    element.style.outline = original;
    element.style.outlineOffset = "";
  }, 2000);
}

export async function fillAllFields(): Promise<GenerationResult[]> {
  const fields = detectFormFields();
  const url = window.location.href;
  const settings = await getSettings();
  const results: GenerationResult[] = [];

  // Determine AI function based on settings
  const aiGenerateFn = await getAiFunction(settings);

  for (const field of fields) {
    try {
      const result = await resolveFieldValue(field, url, aiGenerateFn);

      applyValueToField(field, result.value);

      if (settings.highlightFilled) {
        highlightField(field.element);
      }

      results.push(result);
    } catch (error) {
      console.warn(`[Fill All] Failed to fill field ${field.selector}:`, error);
    }
  }

  return results;
}

export async function fillSingleField(
  field: FormField,
): Promise<GenerationResult | null> {
  const url = window.location.href;
  const settings = await getSettings();
  const aiGenerateFn = await getAiFunction(settings);

  try {
    const result = await resolveFieldValue(field, url, aiGenerateFn);
    applyValueToField(field, result.value);

    if (settings.highlightFilled) {
      highlightField(field.element);
    }

    return result;
  } catch (error) {
    console.warn(`[Fill All] Failed to fill field:`, error);
    return null;
  }
}

function applyValueToField(field: FormField, value: string): void {
  const el = field.element;

  if (el instanceof HTMLSelectElement) {
    handleSelectElement(el, value);
    return;
  }

  if (
    el instanceof HTMLInputElement &&
    (el.type === "checkbox" || el.type === "radio")
  ) {
    handleCheckboxOrRadio(el);
    return;
  }

  setNativeValue(el, value);
}

async function getAiFunction(
  settings: Settings,
): Promise<((field: FormField) => Promise<string>) | undefined> {
  if (settings.useChromeAI && (await isChromeAiAvailable())) {
    return chromeAiGenerate;
  }

  // Fallback to TF.js-based generation
  if (settings.defaultStrategy === "tensorflow") {
    return async (field: FormField) => generateWithTensorFlow(field);
  }

  return undefined;
}

/**
 * Captures current form values and returns them as a map
 */
export function captureFormValues(): Record<string, string> {
  const fields = detectFormFields();
  const values: Record<string, string> = {};

  for (const field of fields) {
    const el = field.element;
    const key = field.id || field.name || field.selector;

    if (el instanceof HTMLSelectElement) {
      values[key] = el.value;
    } else if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox" || el.type === "radio") {
        values[key] = el.checked ? "true" : "false";
      } else {
        values[key] = el.value;
      }
    } else {
      values[key] = el.value;
    }
  }

  return values;
}
