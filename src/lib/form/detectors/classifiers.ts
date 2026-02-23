/**
 * Built-in Field Classifiers
 *
 * Each classifier wraps one detection strategy and implements FieldClassifier.
 * Classifiers are injected into FieldProcessingChain.classify(...) explicitly —
 * every active step is visible at the call site.
 *
 * Exported classifiers (in default priority order inside ALL_CLASSIFIERS):
 *
 *   htmlTypeClassifier    — deterministic mapping from input[type] / tagName
 *   keywordClassifier     — Portuguese keyword / label matching rules
 *   tensorflowClassifier  — TF.js cosine-similarity soft match (pre-trained model)
 *   chromeAiClassifier    — Gemini Nano via Chrome Built-in AI (async only)
 *   htmlFallbackClassifier— last-resort input[type] → FieldType mapping
 *
 * Runtime injection:
 *
 *   ALL_CLASSIFIERS            — default ordered list of all classifiers
 *   getActiveClassifiers()     — returns current active list (may be customised)
 *   setActiveClassifiers()     — overrides active list (called by content-script)
 *   buildClassifiersFromSettings() — builds list from user settings
 *
 * Exported pipelines:
 *
 *   DEFAULT_PIPELINE           — static DetectionPipeline over ALL_CLASSIFIERS
 *   DEFAULT_COLLECTION_PIPELINE— page-level: native-inputs → custom-selects → interactive-fields
 */

import type { FormField, FieldType } from "@/types";
import { detectBasicType } from "./html-type-detector";
import {
  detectCustomSelects,
  customSelectToFormField,
} from "./custom-select-handler";
import {
  detectInteractiveFields,
  interactiveFieldToFormField,
} from "./interactive-field-detector";
import { FieldProcessingChain } from "../extractors/field-processing-chain";
import {
  INPUT_SELECTOR,
  isVisible,
  isNotCustomSelect,
  buildNativeField,
} from "./native-input-config";
import { chromeAiClassifier } from "./chrome-ai-classifier";
import { keywordClassifier } from "./keyword-classifier";
import { tensorflowClassifier } from "./tensorflow-classifier";
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

// ── All classifiers (canonical ordered list) ─────────────────────────────────

/**
 * All available field classifiers in default priority order:
 *   html-type → keyword → tensorflow → chrome-ai (async only) → html-fallback
 *
 * This is the source of truth for the default classification sequence.
 * Inject a subset or reordered list via setActiveClassifiers().
 */
export const ALL_CLASSIFIERS: ReadonlyArray<FieldClassifier> = [
  htmlTypeClassifier,
  keywordClassifier,
  tensorflowClassifier,
  chromeAiClassifier,
  htmlFallbackClassifier,
];

// ── Default pipeline (static, for field-icon and other direct consumers) ──────

/**
 * Static DetectionPipeline wrapping ALL_CLASSIFIERS.
 * Used by field-icon.ts and field-icon-utils.ts for single-field re-classification.
 * For page-level scanning, prefer FieldProcessingChain + getActiveClassifiers().
 */
export const DEFAULT_PIPELINE = new DetectionPipeline([...ALL_CLASSIFIERS]);

// ── Configurable active classifiers ──────────────────────────────────────────

/** Runtime-mutable list — overridden by content-script based on user settings. */
let _activeClassifiers: FieldClassifier[] = [...ALL_CLASSIFIERS];

/** All named classifiers available for dynamic composition. */
const NAMED_CLASSIFIERS: Record<string, FieldClassifier> = {
  "html-type": htmlTypeClassifier,
  keyword: keywordClassifier,
  tensorflow: tensorflowClassifier,
  "chrome-ai": chromeAiClassifier,
  "html-fallback": htmlFallbackClassifier,
};

/**
 * Returns the currently active classifier list.
 * Defaults to ALL_CLASSIFIERS unless overridden via setActiveClassifiers().
 */
export function getActiveClassifiers(): ReadonlyArray<FieldClassifier> {
  return _activeClassifiers;
}

/**
 * Overrides the active classifier list used by the native-input chain.
 * Called by the content script on startup based on user settings.
 */
export function setActiveClassifiers(classifiers: FieldClassifier[]): void {
  _activeClassifiers = classifiers;
}

/**
 * Builds a classifier list from a user-defined ordered config.
 * Strategies not listed or disabled are excluded.
 * html-fallback is always appended last when not already present.
 */
export function buildClassifiersFromSettings(
  config: Array<{ name: string; enabled: boolean }>,
): FieldClassifier[] {
  const ordered = config
    .filter((s) => s.enabled && NAMED_CLASSIFIERS[s.name])
    .map((s) => NAMED_CLASSIFIERS[s.name]);

  // Ensure there's always a fallback terminator
  if (!ordered.find((c) => c.name === "html-fallback")) {
    ordered.push(htmlFallbackClassifier);
  }

  return ordered;
}

// ── Chain factory ─────────────────────────────────────────────────────────────

/**
 * Builds the native-input processing chain with all 4 steps wired:
 *
 *   Step 1 — collect  : INPUT_SELECTOR (input / select / textarea)
 *   Step 2 — filter   : isVisible + isNotCustomSelect
 *   Step 3 — extract  : buildNativeField (selector, label, signals)
 *   Step 4 — classify : active classifiers (explicit, injectable)
 *
 * getActiveClassifiers() is called at chain-build time so each scan starts
 * fresh with the current classifier list.
 */
function buildNativeChain(): FieldProcessingChain {
  return new FieldProcessingChain()
    .collect(INPUT_SELECTOR)
    .filter(isVisible, isNotCustomSelect)
    .extract(buildNativeField)
    .classify(...getActiveClassifiers());
}

// ── Native-input scanners (all backed by the same chain) ─────────────────────

/**
 * Async run — classifies every native input (including Chrome AI) and returns
 * all fields at once. Use streamNativeFieldsAsync() for real-time feedback.
 */
export async function detectNativeFieldsAsync(): Promise<FormField[]> {
  return buildNativeChain().runAsync();
}

/**
 * Streaming run — yields each FormField immediately after it is classified.
 * Enables real-time UI updates while the rest of the page is still being scanned.
 */
export async function* streamNativeFieldsAsync(): AsyncGenerator<FormField> {
  yield* buildNativeChain().stream();
}

// ── Page-level detectors ──────────────────────────────────────────────────────

/**
 * Scans native input/select/textarea elements synchronously using the active
 * pipeline. Chrome AI is skipped in sync mode. Used by dom-watcher.
 */
export const nativeInputDetector: PageDetector = {
  name: "native-inputs",
  detect(): FormField[] {
    return buildNativeChain().runSync();
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
