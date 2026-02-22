/**
 * Form filler — fills detected fields with generated or saved values
 */

import type { FormField, GenerationResult, Settings } from "@/types";
import { detectAllFields } from "./form-detector";
import { resolveFieldValue } from "@/lib/rules/rule-engine";
import {
  generateFieldValue as chromeAiGenerate,
  isAvailable as isChromeAiAvailable,
} from "@/lib/ai/chrome-ai";
import { generateWithTensorFlow } from "@/lib/ai/tensorflow-generator";
import {
  getSettings,
  getSavedFormsForUrl,
  getIgnoredFieldsForUrl,
} from "@/lib/storage/storage";
import {
  selectCustomOption,
  getCustomSelectValue,
  type CustomSelectField,
} from "./detectors/custom-select-handler";
import { setFillingInProgress } from "./dom-watcher";
import { createLogger } from "@/lib/logger";

const log = createLogger("FormFiller");

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

function highlightField(element: HTMLElement, detectedLabel?: string): void {
  const original = element.style.outline;
  element.style.outline = "2px solid #4F46E5";
  element.style.outlineOffset = "1px";

  let badge: HTMLElement | null = null;
  if (detectedLabel) {
    badge = createFieldLabelBadge(element, detectedLabel);
  }

  setTimeout(() => {
    element.style.outline = original;
    element.style.outlineOffset = "";
    badge?.remove();
  }, 2000);
}

function createFieldLabelBadge(
  target: HTMLElement,
  label: string,
): HTMLElement {
  const rect = target.getBoundingClientRect();
  const badge = document.createElement("div");
  badge.textContent = label;

  const top = rect.top - 20;
  const left = rect.left;

  badge.style.cssText = `
    position: fixed;
    top: ${Math.max(2, top)}px;
    left: ${left}px;
    background: rgba(79, 70, 229, 0.9);
    color: #fff;
    font-size: 10px;
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 3px;
    z-index: 2147483645;
    pointer-events: none;
    white-space: nowrap;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.5;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    letter-spacing: 0.2px;
  `;
  document.body.appendChild(badge);
  return badge;
}

export async function fillAllFields(): Promise<GenerationResult[]> {
  setFillingInProgress(true);
  try {
    return await doFillAllFields();
  } finally {
    setFillingInProgress(false);
  }
}

async function doFillAllFields(): Promise<GenerationResult[]> {
  const { fields, customSelects } = detectAllFields();
  const url = window.location.href;
  const settings = await getSettings();
  const results: GenerationResult[] = [];

  // Determine AI function based on settings
  const aiGenerateFn = await getAiFunction(settings);

  // Get saved forms for resolving custom select values
  const savedForms = await getSavedFormsForUrl(url);

  // Load ignored fields for current URL
  const ignoredFields = await getIgnoredFieldsForUrl(url);
  const ignoredSelectors = new Set(ignoredFields.map((f) => f.selector));

  // Fill regular fields first
  for (const field of fields) {
    // Skip pseudo-fields created from custom selects (handled below)
    if (customSelects.some((cs) => cs.selector === field.selector)) continue;

    // Skip ignored fields
    if (ignoredSelectors.has(field.selector)) continue;

    try {
      const result = await resolveFieldValue(
        field,
        url,
        aiGenerateFn,
        settings.forceAIFirst,
      );

      applyValueToField(field, result.value);

      if (settings.highlightFilled) {
        highlightField(
          field.element,
          field.label ?? field.fieldType ?? undefined,
        );
      }

      results.push(result);
    } catch (error) {
      log.warn(`Failed to fill field ${field.selector}:`, error);
    }
  }

  // Fill custom selects (one at a time, waiting for DOM to settle)
  for (const cs of customSelects) {
    // Skip ignored custom selects
    if (ignoredSelectors.has(cs.selector)) continue;

    try {
      // Check if there's a saved value for this custom select
      let targetValue: string | undefined;

      for (const form of savedForms) {
        const key = cs.id || cs.name || cs.selector;
        if (form.fields[key]) {
          targetValue = form.fields[key];
          break;
        }
        if (cs.name && form.fields[cs.name]) {
          targetValue = form.fields[cs.name];
          break;
        }
        if (cs.id && form.fields[cs.id]) {
          targetValue = form.fields[cs.id];
          break;
        }
      }

      const selectedText = await selectCustomOption(cs, targetValue);

      if (settings.highlightFilled) {
        highlightField(cs.container);
      }

      results.push({
        fieldSelector: cs.selector,
        value: selectedText,
        source: targetValue ? "fixed" : "generator",
      });

      // Wait for DOM to settle after selecting (forms may change dynamically)
      await waitForDomSettle(500);
    } catch (error) {
      log.warn(`Failed to fill custom select ${cs.selector}:`, error);
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
    const result = await resolveFieldValue(
      field,
      url,
      aiGenerateFn,
      settings.forceAIFirst,
    );
    applyValueToField(field, result.value);

    if (settings.highlightFilled) {
      highlightField(
        field.element,
        field.label ?? field.fieldType ?? undefined,
      );
    }

    return result;
  } catch (error) {
    log.warn(`Failed to fill field:`, error);
    return null;
  }
}

function waitForDomSettle(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Fallback: resolve after max wait
    timer = setTimeout(() => {
      observer.disconnect();
      resolve();
    }, ms);
  });
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
  log.debug(
    `useChromeAI=${settings.useChromeAI} | defaultStrategy=${settings.defaultStrategy} | forceAIFirst=${settings.forceAIFirst}`,
  );

  if (settings.useChromeAI) {
    const available = await isChromeAiAvailable();
    log.debug(`Chrome AI disponível: ${available}`);
    if (available) {
      log.debug("Usando Chrome AI (Gemini Nano).");
      return chromeAiGenerate;
    }
  }

  // Fallback to TF.js-based generation
  if (settings.defaultStrategy === "tensorflow") {
    log.debug("Chrome AI indisponível — usando TensorFlow.js.");
    return async (field: FormField) => await generateWithTensorFlow(field);
  }

  log.warn(
    "Nenhuma função de AI configurada. Será usado apenas o gerador padrão.",
  );
  return undefined;
}

/**
 * Captures current form values and returns them as a map
 */
export function captureFormValues(): Record<string, string> {
  const { fields, customSelects } = detectAllFields();
  const values: Record<string, string> = {};

  for (const field of fields) {
    // Skip pseudo-fields from custom selects
    if (customSelects.some((cs) => cs.selector === field.selector)) continue;

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

  // Capture custom select values
  for (const cs of customSelects) {
    const key = cs.id || cs.name || cs.selector;
    values[key] = getCustomSelectValue(cs);
  }

  return values;
}
