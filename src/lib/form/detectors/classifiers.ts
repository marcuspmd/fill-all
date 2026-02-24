/**
 * Classifier Registry & Page-Level Detectors
 *
 * Central module that wires field classifiers into pipelines and
 * exposes the scanners used by form-detector.ts and content-script.ts.
 *
 * Classifier implementations live in ./strategies/ — add / edit there.
 *
 * Exported classifiers (in default priority order inside ALL_CLASSIFIERS):
 *
 *   htmlTypeClassifier     — deterministic mapping from input[type] / tagName
 *   keywordClassifier      — Portuguese keyword / label matching rules
 *   tensorflowClassifier   — TF.js cosine-similarity soft match (pre-trained model)
 *   chromeAiClassifier     — Gemini Nano via Chrome Built-in AI (async only)
 *   htmlFallbackClassifier — last-resort input[type] → FieldType mapping
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

import type { FormField } from "@/types";
import {
  htmlTypeClassifier,
  htmlFallbackClassifier,
  keywordClassifier,
  tensorflowClassifier,
  chromeAiClassifier,
} from "./strategies";
import { FieldProcessingChain } from "../extractors/field-processing-chain";
import {
  INPUT_SELECTOR,
  isVisible,
  isNotCustomSelect,
  buildNativeField,
  type NativeElement,
} from "./native-input-config";
import {
  DetectionPipeline,
  FieldCollectionPipeline,
  type FieldClassifier,
  type PageDetector,
} from "./pipeline";

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

// ── Re-export classifiers for external consumers ──────────────────────────────
export {
  htmlTypeClassifier,
  htmlFallbackClassifier,
  keywordClassifier,
  tensorflowClassifier,
  chromeAiClassifier,
} from "./strategies";

// ── Default pipeline (static, for field-icon and other direct consumers) ──────

/**
 * Static DetectionPipeline wrapping ALL_CLASSIFIERS.
 * Used by field-icon.ts and field-icon-utils.ts for single-field re-classification.
 * For page-level scanning, use the native-input scanners below.
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

// ── Native field collection (Steps 1–3) ─────────────────────────────────────

/**
 * Queries the DOM for native form controls, applies visibility/exclusion
 * filters, and returns bare FormField stubs (selector, label, signals —
 * no fieldType yet). Classification is handled separately.
 */
function collectNativeFields(): FormField[] {
  return Array.from(document.querySelectorAll<NativeElement>(INPUT_SELECTOR))
    .filter((el) => isVisible(el) && isNotCustomSelect(el))
    .map(buildNativeField);
}

// ── Classification chain factory (Step 4) ────────────────────────────────────

/**
 * Builds a classification chain with the current active classifiers.
 * getActiveClassifiers() is called at build time so each scan starts
 * fresh with the current classifier list.
 */
function buildClassificationChain(): FieldProcessingChain {
  return new FieldProcessingChain().classify(...getActiveClassifiers());
}

// ── Native-input scanners ─────────────────────────────────────────────────────

/**
 * Async run — classifies every native input (including Chrome AI) and returns
 * all fields at once. Use streamNativeFieldsAsync() for real-time feedback.
 */
export async function detectNativeFieldsAsync(): Promise<FormField[]> {
  return buildClassificationChain().runAsync(collectNativeFields());
}

/**
 * Streaming run — yields each FormField immediately after it is classified.
 * Enables real-time UI updates while classification is still in progress.
 */
export async function* streamNativeFieldsAsync(): AsyncGenerator<FormField> {
  yield* buildClassificationChain().stream(collectNativeFields());
}

// ── Page-level detectors ──────────────────────────────────────────────────────

/**
 * Scans native input/select/textarea elements synchronously using the active
 * pipeline. Chrome AI is skipped in sync mode. Used by dom-watcher.
 */
export const nativeInputDetector: PageDetector = {
  name: "native-inputs",
  detect(): FormField[] {
    return buildClassificationChain().runSync(collectNativeFields());
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
]);

/**
 * Applies keyword classification to custom component fields in-place.
 *
 * Custom component adapters know the semantic widget type (select, checkbox,
 * datepicker, etc.) but cannot infer domain-level context (e.g. "CPF", "email")
 * from the DOM structure alone.  Running keywordClassifier here allows
 * label-based patterns ("cpf", "e-mail", "data de nascimento" …) to upgrade the
 * fieldType even for Ant Design / Select2 components.
 *
 * If no keyword pattern matches the adapter-set fieldType is preserved and
 * detectionMethod is stamped as "custom-select".
 */
export function classifyCustomFieldsSync(fields: FormField[]): FormField[] {
  for (const field of fields) {
    const result = keywordClassifier.detect(field);
    if (result) {
      field.fieldType = result.type;
      field.detectionMethod = "keyword";
      field.detectionConfidence = result.confidence;
    } else if (!field.detectionMethod) {
      field.detectionMethod = "custom-select";
      field.detectionConfidence = 0.9;
    }
  }
  return fields;
}
