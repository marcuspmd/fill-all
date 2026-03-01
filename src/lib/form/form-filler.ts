/**
 * Form filler — fills detected fields with generated or saved values
 */

import type {
  FieldType,
  FormField,
  GenerationResult,
  SavedForm,
  Settings,
} from "@/types";
import { detectAllFieldsAsync, streamAllFields } from "./form-detector";
import { resolveFieldValue } from "@/lib/rules/rule-engine";
import {
  generateFieldValueViaProxy as chromeAiGenerate,
  isAvailableViaProxy as isChromeAiAvailable,
} from "@/lib/ai/chrome-ai-proxy";
import { generateWithTensorFlow } from "@/lib/ai/tensorflow-generator";
import { getSettings, getIgnoredFieldsForUrl } from "@/lib/storage/storage";
import { setFillingInProgress } from "./dom-watcher";
import { fillCustomComponent } from "./adapters/adapter-registry";
import { generate } from "@/lib/generators";
import { deriveFieldValueFromTemplate } from "@/lib/form/field-type-aliases";
import { createLogger, logAuditFill } from "@/lib/logger";
import { createProgressNotification } from "./progress-notification";

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

function showFillToast(filled: number, total: number, aiCount: number): void {
  const toast = document.createElement("div");
  toast.setAttribute("data-fill-all-toast", "1");

  const aiNote =
    aiCount > 0
      ? `<span style="opacity:0.85;font-size:11px"> (${aiCount} via ✨ IA)</span>`
      : "";
  toast.innerHTML = `
    <span style="font-size:15px;margin-right:6px">✅</span>
    <span><strong>${filled}</strong> de <strong>${total}</strong> campos preenchidos${aiNote}</span>
    <button data-fill-all-toast-close style="
      background:none;border:none;color:inherit;cursor:pointer;
      font-size:14px;margin-left:12px;opacity:0.7;padding:0;line-height:1;
    " title="Fechar">×</button>
  `;

  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 4px;
    background: #1e1e2e;
    color: #e2e8f0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 10px;
    box-shadow: 0 4px 18px rgba(0,0,0,0.38);
    border: 1px solid rgba(255,255,255,0.08);
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;
    transform: translateY(12px);
    max-width: 320px;
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  });

  const dismiss = (): void => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    setTimeout(() => toast.remove(), 350);
  };

  const closeBtn = toast.querySelector<HTMLButtonElement>(
    "[data-fill-all-toast-close]",
  );
  closeBtn?.addEventListener("click", dismiss);

  const timer = setTimeout(dismiss, 4000);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
  toast.addEventListener("mouseleave", () => setTimeout(dismiss, 1500));
}

function showAiFieldBadge(element: HTMLElement): void {
  // Remove any existing AI badge on this element
  const existingBadge = element.parentElement?.querySelector(
    "[data-fill-all-ai-badge]",
  );
  existingBadge?.remove();

  const badge = document.createElement("span");
  badge.setAttribute("data-fill-all-ai-badge", "1");
  badge.title = "Preenchido por IA (Fill All) — clique para remover";
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 3px;
    position: absolute;
    font-size: 10px;
    font-family: system-ui, -apple-system, sans-serif;
    font-weight: 700;
    padding: 2px 6px 2px 5px;
    border-radius: 4px;
    z-index: 2147483646;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 1px 4px rgba(99,102,241,0.45);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    pointer-events: auto;
    line-height: 1.4;
    letter-spacing: 0.1px;
  `;
  badge.innerHTML = `<span style="font-size:11px">✨</span>AI<span style="opacity:0.7;font-size:9px;margin-left:2px">×</span>`;

  function positionBadge(): void {
    const rect = element.getBoundingClientRect();
    badge.style.top = `${rect.top + window.scrollY - 20}px`;
    badge.style.left = `${rect.right + window.scrollX - 42}px`;
  }

  positionBadge();
  badge.style.position = "absolute";
  document.body.appendChild(badge);

  badge.addEventListener("click", () => badge.remove());
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

/**
 * Fills every detected form field on the current page.
 * Resolves values through the priority chain (rules → saved forms → AI → generator).
 * @param options.fillEmptyOnly When set, overrides the stored setting for this call only
 * @returns Array of generation results for each filled field
 */
export async function fillAllFields(options?: {
  fillEmptyOnly?: boolean;
}): Promise<GenerationResult[]> {
  setFillingInProgress(true);
  try {
    return await doFillAllFields(options);
  } finally {
    setFillingInProgress(false);
  }
}

function fieldHasValue(field: FormField): boolean {
  const el = field.element;
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked;
    return el.value.trim() !== "";
  }
  if (el instanceof HTMLTextAreaElement) return el.value.trim() !== "";
  if (el instanceof HTMLSelectElement) return el.value !== "";
  return false;
}

async function doFillAllFields(options?: {
  fillEmptyOnly?: boolean;
}): Promise<GenerationResult[]> {
  const url = window.location.href;
  const settings = await getSettings();
  const fillEmptyOnly = options?.fillEmptyOnly ?? settings.fillEmptyOnly;
  const results: GenerationResult[] = [];

  // Determine AI function based on settings
  const aiGenerateFn = await getAiFunction(settings);

  // Load ignored fields for current URL
  const ignoredFields = await getIgnoredFieldsForUrl(url);
  const ignoredSelectors = new Set(ignoredFields.map((f) => f.selector));

  // Create progress notification
  const progress = createProgressNotification();
  progress.show();

  let totalFields = 0;

  // Stream detection + fill progressively (field by field)
  for await (const field of streamAllFields()) {
    totalFields++;

    // Show detecting state
    progress.addDetecting(field);

    // Detection already done by the stream — update badge
    progress.updateDetected(field);

    // Skip ignored fields
    if (ignoredSelectors.has(field.selector)) continue;

    // Skip fields that already have a value when fillEmptyOnly is enabled
    if (fillEmptyOnly && fieldHasValue(field)) continue;

    const fieldLabel =
      field.label ??
      field.name ??
      field.id ??
      field.fieldType ??
      field.selector;
    log.info(`⏳ Preenchendo [${field.fieldType}] "${fieldLabel}"...`);
    const start = Date.now();

    // Show filling state
    progress.addFilling(field);

    try {
      const result = await resolveFieldValue(
        field,
        url,
        aiGenerateFn,
        settings.forceAIFirst,
        settings.aiTimeoutMs,
      );

      await applyValueToField(field, result.value);

      logAuditFill({
        selector: field.selector,
        fieldType: field.fieldType,
        source: result.source,
        value: String(result.value),
      });

      log.info(
        `✅ Preenchido em ${Date.now() - start}ms via ${result.source}: "${String(result.value).slice(0, 40)}"`,
      );

      if (settings.highlightFilled) {
        highlightField(
          field.element,
          field.label ?? field.fieldType ?? undefined,
        );
      }

      if (settings.showAiBadge && result.source === "ai") {
        showAiFieldBadge(field.element);
      }

      // Update progress — filled
      progress.updateFilled(field, result);

      results.push(result);
    } catch (error) {
      log.warn(
        `❌ Falhou em ${Date.now() - start}ms — campo ${field.selector}:`,
        error,
      );
      progress.updateError(
        field,
        error instanceof Error ? error.message : "falhou",
      );
    }
  }

  // Show summary
  progress.done(results.length, totalFields);

  const aiFilledCount = results.filter((r) => r.source === "ai").length;
  if (settings.showFillToast !== false) {
    showFillToast(results.length, totalFields, aiFilledCount);
  }

  return results;
}

/**
 * Fills a single form field using the same priority chain as {@link fillAllFields}.
 * @param field - The detected form field to fill
 * @returns The generation result, or `null` on failure
 */
export async function fillSingleField(
  field: FormField,
): Promise<GenerationResult | null> {
  const url = window.location.href;
  const settings = await getSettings();
  const aiGenerateFn = await getAiFunction(settings);
  const fieldLabel =
    field.label ?? field.name ?? field.id ?? field.fieldType ?? field.selector;
  log.info(`⏳ Preenchendo [${field.fieldType}] "${fieldLabel}"...`);
  const start = Date.now();

  try {
    const result = await resolveFieldValue(
      field,
      url,
      aiGenerateFn,
      settings.forceAIFirst,
      settings.aiTimeoutMs,
    );
    await applyValueToField(field, result.value);
    logAuditFill({
      selector: field.selector,
      fieldType: field.fieldType,
      source: result.source,
      value: String(result.value),
    });
    log.info(
      `✅ Preenchido em ${Date.now() - start}ms via ${result.source}: "${String(result.value).slice(0, 40)}"`,
    );

    if (settings.highlightFilled) {
      highlightField(
        field.element,
        field.label ?? field.fieldType ?? undefined,
      );
    }

    return result;
  } catch (error) {
    log.warn(
      `❌ Falhou em ${Date.now() - start}ms — campo ${field.selector}:`,
      error,
    );
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

async function applyValueToField(
  field: FormField,
  value: string,
): Promise<void> {
  // Delegate to custom adapter if the field was detected by one
  if (field.adapterName) {
    const handled = await fillCustomComponent(field, value);
    if (handled) return;
  }

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

  // Fallback to TF.js when strategy is "ai" or "tensorflow"
  if (
    settings.defaultStrategy === "tensorflow" ||
    settings.defaultStrategy === "ai"
  ) {
    log.debug("Usando TensorFlow.js como fallback de AI.");
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
export async function captureFormValues(): Promise<Record<string, string>> {
  const { fields } = await detectAllFieldsAsync();
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
      values[key] = (el as HTMLTextAreaElement).value;
    }
  }

  return values;
}

/**
 * Applies a saved form template to the current page.
 * Uses templateFields (new format) if available, otherwise falls back to legacy fields.
 * For generator-mode fields, calls the appropriate generator to produce a fresh value.
 */
export async function applyTemplate(
  form: SavedForm,
): Promise<{ filled: number }> {
  const { fields: detectedFields } = await detectAllFieldsAsync();
  const settings = await getSettings();
  let filled = 0;

  if (form.templateFields && form.templateFields.length > 0) {
    // Pre-generate ONE consistent value per field type (fixed or generator).
    // Generator fields are produced once so that derivations remain coherent —
    // e.g. first-name and last-name derived from the same generated full-name.
    const templateValueMap = new Map<FieldType, string>();
    for (const tField of form.templateFields) {
      if (!tField.matchByFieldType) continue;
      if (tField.mode === "generator" && tField.generatorType) {
        templateValueMap.set(
          tField.matchByFieldType,
          generate(tField.generatorType),
        );
      } else if (tField.mode === "fixed" && tField.fixedValue) {
        templateValueMap.set(tField.matchByFieldType, tField.fixedValue);
      }
    }

    // For type-based templates (matchByFieldType), track which fields were already handled
    const handledSelectors = new Set<string>();

    for (const tField of form.templateFields) {
      // Type-based matching: find ALL fields of the given type
      if (tField.matchByFieldType) {
        const matchedFields = detectedFields.filter(
          (f) =>
            f.fieldType === tField.matchByFieldType &&
            !handledSelectors.has(f.selector),
        );
        for (const matchedField of matchedFields) {
          // Use the pre-generated value to keep derived fields coherent
          const value = templateValueMap.get(tField.matchByFieldType) ?? "";
          if (!value) continue;
          await applyValueToField(matchedField, value);
          if (settings.highlightFilled) {
            highlightField(
              matchedField.element,
              matchedField.label ?? matchedField.fieldType ?? undefined,
            );
          }
          handledSelectors.add(matchedField.selector);
          filled++;
        }
        continue;
      }

      // Selector-based matching (legacy / saved-from-page templates)
      const matchedField = detectedFields.find(
        (f) =>
          f.selector === tField.key ||
          f.id === tField.key ||
          f.name === tField.key,
      );
      if (!matchedField) continue;

      let value: string;
      if (tField.mode === "generator" && tField.generatorType) {
        value = generate(tField.generatorType);
      } else {
        value = tField.fixedValue ?? "";
      }

      if (!value && tField.mode === "fixed") continue;

      await applyValueToField(matchedField, value);
      if (settings.highlightFilled) {
        highlightField(
          matchedField.element,
          matchedField.label ?? matchedField.fieldType ?? undefined,
        );
      }
      handledSelectors.add(matchedField.selector);
      filled++;
    }

    // Fallback: fill detected fields not covered by the template.
    // Priority: (1) direct match in map (same type, missed the loop somehow)
    //           (2) smart derivation from a related type (e.g. first-name ← full-name)
    for (const field of detectedFields) {
      if (handledSelectors.has(field.selector) || !field.fieldType) continue;

      const value =
        templateValueMap.get(field.fieldType) ??
        deriveFieldValueFromTemplate(field.fieldType, templateValueMap);

      if (!value) continue;
      await applyValueToField(field, value);
      if (settings.highlightFilled) {
        highlightField(
          field.element,
          field.label ?? field.fieldType ?? undefined,
        );
      }
      filled++;
    }
  } else {
    // Legacy format: fields Record<string, string>
    for (const detectedField of detectedFields) {
      const key =
        detectedField.id || detectedField.name || detectedField.selector;
      const value =
        form.fields[detectedField.selector] ??
        form.fields[key] ??
        (detectedField.name ? form.fields[detectedField.name] : undefined) ??
        (detectedField.id ? form.fields[detectedField.id] : undefined);

      if (value === undefined) continue;

      await applyValueToField(detectedField, value);
      if (settings.highlightFilled) {
        highlightField(
          detectedField.element,
          detectedField.label ?? detectedField.fieldType ?? undefined,
        );
      }
      filled++;
    }
  }

  log.info(`Template "${form.name}" aplicado: ${filled} campos`);
  return { filled };
}
