/**
 * Built-in Field Classifiers
 *
 * Each classifier wraps one detection strategy and implements FieldClassifier.
 * They are designed to be composed into a DetectionPipeline.
 *
 * Exported classifiers (in default priority order):
 *
 *   htmlTypeClassifier    — deterministic mapping from input[type] / tagName
 *   tensorflowClassifier  — TF.js cosine-similarity soft match (pre-trained model)
 *   htmlFallbackClassifier— last-resort input[type] → FieldType mapping
 *
 * Exported pipelines:
 *
 *   DEFAULT_PIPELINE           — field-level: html-type → tensorflow → html-fallback
 *   DEFAULT_COLLECTION_PIPELINE— page-level:  native-inputs → custom-selects → interactive-fields
 */

import type { FormField, FieldType } from "@/types";
import { classifyByTfSoft } from "@/lib/ai/tensorflow-generator";
import { detectBasicType } from "./html-type-detector";
import {
  detectCustomSelects,
  customSelectToFormField,
} from "./custom-select-handler";
import {
  detectInteractiveFields,
  interactiveFieldToFormField,
} from "./interactive-field-detector";
import { getUniqueSelector } from "./selector-builder";
import { findLabelWithStrategy } from "./label-detector";
import { buildSignals } from "./signals-builder";
import { chromeAiClassifier } from "./chrome-ai-classifier";
import { keywordClassifier } from "./keyword-classifier";
import {
  DetectionPipeline,
  FieldCollectionPipeline,
  type FieldClassifier,
  type ClassifierResult,
  type PageDetector,
} from "./pipeline";

// ── htmlTypeClassifier ────────────────────────────────────────────────────────
// Maps input[type], <select> and <textarea> to a FieldType with 100% confidence.
// Returns null for plain text inputs and textareas (let subsequent classifiers handle them).

export const htmlTypeClassifier: FieldClassifier = {
  name: "html-type",
  detect(field): ClassifierResult | null {
    const { type } = detectBasicType(field.element);
    if (type === "unknown") return null;
    return { type, confidence: 1.0 };
  },
};

// ── tensorflowClassifier ──────────────────────────────────────────────────────
// TF.js character n-gram cosine-similarity soft match.
// Uses the pre-trained model when available, otherwise the runtime prototype-vector classifier.

export const tensorflowClassifier: FieldClassifier = {
  name: "tensorflow",
  detect(field): ClassifierResult | null {
    const signals = field.contextSignals ?? "";
    const result = classifyByTfSoft(signals);
    if (result === null) return null;
    return { type: result.type, confidence: result.score };
  },
};

// ── htmlFallbackClassifier ────────────────────────────────────────────────────
// Last resort: maps a limited set of input[type] values to FieldType.
// Always returns a result (even if "unknown") so the pipeline always terminates.

const HTML_FALLBACK_MAP: Record<string, FieldType> = {
  email: "email",
  tel: "phone",
  password: "password",
  number: "number",
  date: "date",
  url: "text",
};

export const htmlFallbackClassifier: FieldClassifier = {
  name: "html-fallback",
  detect(field): ClassifierResult {
    const inputType =
      "type" in field.element
        ? (field.element as HTMLInputElement).type?.toLowerCase()
        : "";
    const type: FieldType = HTML_FALLBACK_MAP[inputType] ?? "unknown";
    return { type, confidence: 0.1 };
  },
};

// ── Default pipelines ─────────────────────────────────────────────────────────

/**
 * Default field-level classification pipeline.
 * Classifies a single FormField:
 *   html-type → tensorflow → chrome-ai (async) → html-fallback
 *
 * chrome-ai participates only when the pipeline is run via runAsync().
 * The synchronous run() skips it transparently (detect() returns null).
 */
export const DEFAULT_PIPELINE = new DetectionPipeline([
  htmlTypeClassifier,
  keywordClassifier,
  tensorflowClassifier,
  chromeAiClassifier,
  htmlFallbackClassifier,
]);

// ── Async native-input scanner ───────────────────────────────────────────────

/**
 * Async variant of nativeInputDetector.
 * Scans the same elements but classifies each one with DEFAULT_PIPELINE.runAsync(),
 * which activates the Chrome AI classifier (chromeAiClassifier.detectAsync).
 *
 * Used by detectAllFieldsAsync() in form-detector.ts.
 */
export async function detectNativeFieldsAsync(): Promise<FormField[]> {
  const elements = document.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(INPUT_SELECTOR);

  const fields: FormField[] = [];

  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (element.closest(CUSTOM_SELECT_ANCESTOR)) continue;

    const labelResult = findLabelWithStrategy(element);

    const field: FormField = {
      element,
      selector: getUniqueSelector(element),
      fieldType: "unknown",
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

    const result = await DEFAULT_PIPELINE.runAsync(field);
    field.fieldType = result.type;
    field.detectionMethod = result.method;
    field.detectionConfidence = result.confidence;
    field.detectionDurationMs = result.durationMs;

    fields.push(field);
  }

  return fields;
}

// ── Page-level detectors ──────────────────────────────────────────────────────

const INPUT_SELECTOR = [
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]):not([type="file"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");

const CUSTOM_SELECT_ANCESTOR =
  ".ant-select, [class*='react-select'], .MuiSelect-root, [class*='MuiAutocomplete']";

/**
 * Scans native input/select/textarea elements and classifies each one
 * using DEFAULT_PIPELINE.
 */
export const nativeInputDetector: PageDetector = {
  name: "native-inputs",
  detect(): FormField[] {
    const elements = document.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(INPUT_SELECTOR);

    const fields: FormField[] = [];

    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (element.closest(CUSTOM_SELECT_ANCESTOR)) continue;

      const labelResult = findLabelWithStrategy(element);

      const field: FormField = {
        element,
        selector: getUniqueSelector(element),
        fieldType: "unknown",
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

      const result = DEFAULT_PIPELINE.run(field);
      field.fieldType = result.type;
      field.detectionMethod = result.method;
      field.detectionConfidence = result.confidence;
      field.detectionDurationMs = result.durationMs;

      fields.push(field);
    }

    return fields;
  },
};

/**
 * Scans the page for custom select components (Ant Design, MUI, React Select, etc.)
 * and converts each to a FormField.
 */
export const customSelectPageDetector: PageDetector = {
  name: "custom-selects",
  detect(): FormField[] {
    return detectCustomSelects().map((cs) => {
      const f = customSelectToFormField(cs);
      f.detectionMethod = "custom-select";
      f.detectionConfidence = 1.0;
      return f;
    });
  },
};

/**
 * Scans the page for non-native interactive widgets (date pickers, sliders, etc.)
 * and converts each to a FormField.
 */
export const interactivePageDetector: PageDetector = {
  name: "interactive-fields",
  detect(): FormField[] {
    return detectInteractiveFields().map((iField) =>
      interactiveFieldToFormField(iField),
    );
  },
};

// ── Default collection pipeline ───────────────────────────────────────────────

/**
 * Default page-level collection pipeline.
 * Runs all three scanners in order: native-inputs → custom-selects → interactive-fields.
 *
 * Create variants with:
 *   DEFAULT_COLLECTION_PIPELINE.without("interactive-fields")
 *   DEFAULT_COLLECTION_PIPELINE.with(myPageDetector)
 */
export const DEFAULT_COLLECTION_PIPELINE = new FieldCollectionPipeline([
  nativeInputDetector,
  customSelectPageDetector,
  interactivePageDetector,
]);
