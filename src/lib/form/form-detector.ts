/**
 * Form Detector
 *
 * Finds all fillable form fields on the page using a multi-strategy pipeline:
 *   1. Native inputs (input/select/textarea)
 *   2. Custom select components (Ant Design, MUI, React Select, etc.)
 *   3. Interactive widgets (date pickers, sliders, toggles, etc.)
 *
 * Classification order (per field):
 *   html-type    → directly maps from input[type] attribute (high confidence)
 *   keyword      → hard substring match via TF.js keyword model (high confidence)
 *   tensorflow   → TF.js cosine-similarity soft match (medium confidence)
 *   chrome-ai    → Chrome Built-in AI fallback + continuous learning (medium)
 *   html-fallback→ last resort from input[type]
 *
 * Two exported variants:
 *   detectAllFields()       — SYNC, no AI (used by dom-watcher)
 *   detectAllFieldsAsync()  — ASYNC, full AI + learning pipeline
 */

import type { FormField, FieldType, DetectionMethod } from "@/types";
import {
  classifyField,
  classifyFieldAsync,
} from "@/lib/ai/tensorflow-generator";
import { storeLearnedEntry } from "@/lib/ai/learning-store";
import {
  detectCustomSelects,
  customSelectToFormField,
  type CustomSelectField,
} from "./custom-select-handler";
import {
  detectInteractiveFields,
  interactiveFieldToFormField,
} from "./interactive-field-detector";

const INPUT_SELECTOR = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="file"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");

const CUSTOM_SELECT_ANCESTOR =
  ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete']";

// ── Unique CSS selector builder ───────────────────────────────────────────────

export function getUniqueSelector(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c: Element) => c.tagName === current!.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}

// ── Label discovery — 10 strategies ─────────────────────────────────────────

type LabelStrategy =
  | "label[for]"
  | "parent-label"
  | "aria-label"
  | "aria-labelledby"
  | "prev-label"
  | "title"
  | "fieldset-legend"
  | "form-group-label"
  | "prev-sibling-text"
  | "placeholder";

interface LabelResult {
  text: string;
  strategy: LabelStrategy;
}

function findLabelWithStrategy(element: HTMLElement): LabelResult | undefined {
  // 1. label[for=id]
  if (element.id) {
    const lbl = document.querySelector(
      `label[for="${CSS.escape(element.id)}"]`,
    );
    if (lbl?.textContent?.trim())
      return { text: lbl.textContent.trim(), strategy: "label[for]" };
  }

  // 2. parent <label>
  const parentLabel = element.closest("label");
  if (parentLabel?.textContent?.trim())
    return { text: parentLabel.textContent.trim(), strategy: "parent-label" };

  // 3. aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel?.trim())
    return { text: ariaLabel.trim(), strategy: "aria-label" };

  // 4. aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const ref = document.getElementById(ariaLabelledBy);
    if (ref?.textContent?.trim())
      return { text: ref.textContent.trim(), strategy: "aria-labelledby" };
  }

  // 5. preceding sibling <label>
  const prev = element.previousElementSibling;
  if (prev?.tagName === "LABEL" && prev.textContent?.trim())
    return { text: prev.textContent.trim(), strategy: "prev-label" };

  // 6. title attribute
  const title = element.getAttribute("title");
  if (title?.trim()) return { text: title.trim(), strategy: "title" };

  // 7. fieldset > legend
  const fieldset = element.closest("fieldset");
  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend?.textContent?.trim())
      return { text: legend.textContent.trim(), strategy: "fieldset-legend" };
  }

  // 8. nearest .form-group / .form-item label/span
  const formGroup = element.closest(
    ".form-group, .form-item, .form-field, .field-wrapper, .input-wrapper, [class*='form-control'], .ant-form-item, .MuiFormControl-root",
  );
  if (formGroup) {
    const lbl = formGroup.querySelector<HTMLElement>(
      "label, .form-label, .control-label, .ant-form-item-label > label, .MuiInputLabel-root, .MuiFormLabel-root",
    );
    if (lbl?.textContent?.trim())
      return {
        text: lbl.textContent.trim(),
        strategy: "form-group-label",
      };
  }

  // 9. nearest preceding sibling span/div with short text (< 80 chars)
  let sibling: Element | null = element.previousElementSibling;
  while (sibling) {
    const tag = sibling.tagName.toLowerCase();
    if (
      ["span", "div", "p", "strong", "em"].includes(tag) &&
      sibling.textContent
    ) {
      const text = sibling.textContent.trim();
      if (text.length > 0 && text.length < 80)
        return { text, strategy: "prev-sibling-text" };
    }
    sibling = sibling.previousElementSibling;
  }

  // 10. placeholder as last resort
  const placeholder =
    "placeholder" in element
      ? (element as HTMLInputElement).placeholder
      : undefined;
  if (placeholder?.trim())
    return { text: placeholder.trim(), strategy: "placeholder" };

  return undefined;
}

export function findLabel(element: HTMLElement): string | undefined {
  return findLabelWithStrategy(element)?.text;
}

// ── HTML-type → FieldType mapping ─────────────────────────────────────────────

function detectBasicType(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): { type: FieldType; method: DetectionMethod } {
  if (element instanceof HTMLSelectElement)
    return { type: "select", method: "html-type" };
  if (element instanceof HTMLTextAreaElement)
    return { type: "unknown", method: "html-type" };

  const type = element.type?.toLowerCase();
  if (type === "checkbox") return { type: "checkbox", method: "html-type" };
  if (type === "radio") return { type: "radio", method: "html-type" };
  if (type === "email") return { type: "email", method: "html-type" };
  if (type === "tel") return { type: "phone", method: "html-type" };
  if (type === "password") return { type: "password", method: "html-type" };
  if (type === "number") return { type: "number", method: "html-type" };
  if (type === "date") return { type: "date", method: "html-type" };
  if (["time", "datetime-local", "month", "week"].includes(type))
    return { type: "date", method: "html-type" };
  if (["url", "search"].includes(type))
    return { type: "text", method: "html-type" };
  if (type === "range") return { type: "number", method: "html-type" };

  return { type: "unknown", method: "html-type" };
}

// ── Context signals string ────────────────────────────────────────────────────

function buildSignals(field: Partial<FormField>): string {
  return [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");
}

export interface DetectionResult {
  fields: FormField[];
  customSelects: CustomSelectField[];
}

export function detectFormFields(): FormField[] {
  return detectAllFields().fields;
}

export function detectAllFields(): DetectionResult {
  const elements = document.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(INPUT_SELECTOR);

  const fields: FormField[] = [];

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (element.closest(CUSTOM_SELECT_ANCESTOR)) continue;

    const { type: basicType } = detectBasicType(element);
    const labelResult = findLabelWithStrategy(element);

    const field: FormField = {
      element,
      selector: getUniqueSelector(element),
      fieldType: basicType,
      label: labelResult?.text,
      name: element.name || undefined,
      id: element.id || undefined,
      placeholder:
        ("placeholder" in element ? element.placeholder : undefined) ||
        undefined,
      autocomplete: element.autocomplete || undefined,
      required: element.required,
    };

    field.contextSignals = buildSignals(field);

    if (field.fieldType === "unknown") {
      field.fieldType = classifyField(field);
    }

    fields.push(field);
  }

  const customSelects = detectCustomSelects();
  for (const cs of customSelects) {
    fields.push(customSelectToFormField(cs));
  }

  return { fields, customSelects };
}

// ── Async detection — full AI + learning pipeline ────────────────────────────

export interface AsyncDetectionResult extends DetectionResult {
  interactiveFields: ReturnType<typeof detectInteractiveFields>;
}

export async function detectAllFieldsAsync(): Promise<AsyncDetectionResult> {
  const url = window.location.href;

  console.groupCollapsed(
    `%c[Fill All] 🚀 Detecção iniciada — ${new URL(url).hostname}`,
    "color: #6366f1; font-weight: bold",
  );
  console.log(`📄 URL: ${url}`);

  const elements = document.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(INPUT_SELECTOR);

  const fields: FormField[] = [];

  const byMethod: Record<DetectionMethod, number> = {
    "html-type": 0,
    keyword: 0,
    tensorflow: 0,
    "chrome-ai": 0,
    "html-fallback": 0,
    "custom-select": 0,
    interactive: 0,
    "user-override": 0,
  };

  let idx = 0;

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (element.closest(CUSTOM_SELECT_ANCESTOR)) continue;

    idx++;

    const { type: basicType, method: basicMethod } = detectBasicType(element);
    const labelResult = findLabelWithStrategy(element);

    const field: FormField = {
      element,
      selector: getUniqueSelector(element),
      fieldType: basicType,
      label: labelResult?.text,
      name: element.name || undefined,
      id: element.id || undefined,
      placeholder:
        ("placeholder" in element ? element.placeholder : undefined) ||
        undefined,
      autocomplete: element.autocomplete || undefined,
      required: element.required,
      detectionMethod: basicMethod,
      detectionConfidence: basicType !== "unknown" ? 1.0 : undefined,
    };

    field.contextSignals = buildSignals(field);

    const tag = element.tagName.toLowerCase();
    const htmlType = element instanceof HTMLInputElement ? element.type : "—";

    console.groupCollapsed(
      `[Fill All] #${idx} <${tag} type="${htmlType}"> │ id="${field.id ?? ""}" name="${field.name ?? ""}"`,
    );
    console.log(
      `📌 Label: "${field.label ?? "(nenhum)"}" (via ${labelResult?.strategy ?? "—"})`,
    );
    console.log(`📡 Sinais: "${field.contextSignals || "(nenhum)"}"`);
    console.log(`🏷️  Tipo HTML: "${basicType}"`);

    const needsClassification =
      field.fieldType === "unknown" || element instanceof HTMLTextAreaElement;

    if (needsClassification) {
      // ── Full async pipeline: keyword → TF.js → (if confidence < 70%) Chrome AI ──
      // classifyFieldAsync already handles the 70% threshold internally and
      // stores learned entries when Chrome AI is consulted.
      const tfSync = classifyField(field); // fast sync for method attribution
      const detectedType = await classifyFieldAsync(field);

      if (detectedType !== "unknown") {
        field.fieldType = detectedType;

        // Attribute method: if AI changed the TF.js result it's "chrome-ai"
        if (detectedType !== tfSync) {
          field.detectionMethod = "chrome-ai";
          field.detectionConfidence = 0.85;
          console.log(
            `%c🤖 Chrome AI: "${detectedType}" (TF.js era "${tfSync}")`,
            "color: #a855f7; font-weight: bold",
          );
        } else {
          field.detectionMethod = "tensorflow";
          field.detectionConfidence = 0.88;
          console.log(
            `%c🧠 TF.js: "${detectedType}"`,
            "color: #6366f1; font-weight: bold",
          );
        }
      } else {
        field.detectionMethod = "html-fallback";
        field.detectionConfidence = 0.1;
      }
    } else {
      field.detectionMethod = "html-type";
      field.detectionConfidence = 1.0;
    }

    byMethod[field.detectionMethod!]++;

    const methodColor: Record<DetectionMethod, string> = {
      "html-type": "#f59e0b",
      keyword: "#22c55e",
      tensorflow: "#6366f1",
      "chrome-ai": "#a855f7",
      "html-fallback": "#ef4444",
      "custom-select": "#06b6d4",
      interactive: "#06b6d4",
      "user-override": "#f97316",
    };

    console.log(
      `%c✅ Tipo final: "${field.fieldType}" [${field.detectionMethod} | ${((field.detectionConfidence ?? 0) * 100).toFixed(0)}%]`,
      `color: ${methodColor[field.detectionMethod!]}; font-weight: bold`,
    );
    console.groupEnd();

    fields.push(field);
  }

  // ── Custom selects ───────────────────────────────────────────────────────
  const customSelects = detectCustomSelects();
  for (const cs of customSelects) {
    const f = customSelectToFormField(cs);
    f.detectionMethod = "custom-select";
    f.detectionConfidence = 1.0;
    byMethod["custom-select"]++;
    fields.push(f);
  }

  // ── Interactive widgets ──────────────────────────────────────────────────
  const interactiveFields = detectInteractiveFields();
  for (const iField of interactiveFields) {
    const f = interactiveFieldToFormField(iField);
    byMethod["interactive"]++;
    fields.push(f);
  }

  const summary = (Object.entries(byMethod) as [DetectionMethod, number][])
    .filter(([, n]) => n > 0)
    .map(([m, n]) => `${m}: ${n}`)
    .join(" · ");

  console.log(
    `%c[Fill All] ✅ ${fields.length} campo(s)  ·  ${summary}`,
    "color: #22c55e; font-weight: bold",
  );
  console.groupEnd();

  return { fields, customSelects, interactiveFields };
}

export function detectForms(): HTMLFormElement[] {
  return Array.from(document.querySelectorAll("form"));
}
