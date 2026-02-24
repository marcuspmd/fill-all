/**
 * Form Detector
 *
 * Finds all fillable form fields on the page using a multi-strategy pipeline:
 *   1. Native inputs (input/select/textarea)   — nativeInputDetector
 *   2. Custom select components (Ant Design, MUI, React Select, etc.) — customSelectPageDetector
 *   3. Interactive widgets (date pickers, sliders, toggles, etc.) — interactivePageDetector
 *
 * All scanners are composed into DEFAULT_COLLECTION_PIPELINE.
 * Field-level classification goes through DEFAULT_PIPELINE (inside nativeInputDetector).
 *
 * Two exported variants:
 *   detectAllFields()       — SYNC, no AI (used by dom-watcher)
 *   detectAllFieldsAsync()  — ASYNC, full AI + learning pipeline
 */

import type { FormField, DetectionMethod } from "@/types";
import {
  DEFAULT_PIPELINE,
  DEFAULT_COLLECTION_PIPELINE,
  nativeInputDetector,
  detectNativeFieldsAsync,
  streamNativeFieldsAsync,
  classifyCustomFieldsSync,
} from "./detectors/classifiers";
export { DEFAULT_PIPELINE, DEFAULT_COLLECTION_PIPELINE };
import { detectCustomComponents } from "./adapters/adapter-registry";
import { createLogger } from "@/lib/logger";

const log = createLogger("FormDetector");
export type {
  FieldClassifier,
  ClassifierResult,
  PipelineResult,
  DetectionPipeline,
  PageDetector,
  FieldCollectionPipeline,
} from "./detectors/pipeline";

export function detectFormFields(): FormField[] {
  return detectAllFields().fields;
}

export interface DetectionResult {
  fields: FormField[];
}

/**
 * Removes native fields whose underlying element is already contained within
 * a custom component wrapper. Adapter-detected fields take precedence because
 * they carry richer context (label, options, etc.).
 */
function deduplicateFields(
  nativeFields: FormField[],
  customFields: FormField[],
): FormField[] {
  if (customFields.length === 0) return nativeFields;

  // Collect all custom wrapper elements
  const customWrappers = new Set(customFields.map((f) => f.element));

  const filtered = nativeFields.filter((nf) => {
    // If the native element is a descendant of any custom wrapper, skip it
    for (const wrapper of customWrappers) {
      if (wrapper.contains(nf.element)) return false;
    }
    return true;
  });

  return [...filtered, ...customFields];
}

/**
 * Synchronous detection — used by dom-watcher and any context that cannot await.
 * Delegates to the PageDetectors in DEFAULT_COLLECTION_PIPELINE.
 */
export function detectAllFields(): DetectionResult {
  const nativeFields = nativeInputDetector.detect();
  const customFields = classifyCustomFieldsSync(detectCustomComponents());
  const fields = deduplicateFields(nativeFields, customFields);
  log.debug("fields detectados :", fields);
  return { fields };
}

/**
 * Async detection — runs the full DEFAULT_COLLECTION_PIPELINE and adds
 * per-detector summary logging.
 */
export async function detectAllFieldsAsync(): Promise<DetectionResult> {
  const url = window.location.href;
  const t0 = performance.now();

  log.groupCollapsed(`🚀 Detecção iniciada — ${new URL(url).hostname}`);
  log.debug(`📄 URL: ${url}`);

  // Use the async pipeline so the Chrome AI classifier (detectAsync) is active
  // for native inputs. Custom selects and interactive fields remain synchronous.
  const nativeFields = await detectNativeFieldsAsync();
  const customFields = classifyCustomFieldsSync(detectCustomComponents());
  const fields = deduplicateFields(nativeFields, customFields);

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

  fields.forEach((field, idx) => {
    log.debug(`🔍 Campo #${idx + 1} detectado:`, field);
    const method = field.detectionMethod ?? "html-fallback";
    byMethod[method as DetectionMethod]++;

    const tag = field.element.tagName.toLowerCase();
    const htmlType =
      field.element instanceof HTMLInputElement ? field.element.type : "—";

    log.groupCollapsed(
      `#${idx + 1} <${tag} type="${htmlType}"> │ id="${field.id ?? ""}" name="${field.name ?? ""}"`,
    );
    log.debug(field);
    log.debug(`📌 Label: "${field.label ?? "(nenhum)"}"`);
    log.debug(`📡 Sinais: "${field.contextSignals || "(nenhum)"}"`);
    const fieldMs = field.detectionDurationMs ?? 0;
    const fieldMsStr =
      fieldMs >= 1
        ? `${fieldMs.toFixed(1)}ms`
        : `${(fieldMs * 1000).toFixed(0)}µs`;
    log.debug(
      `✅ Tipo final: "${field.fieldType}" [${method} | ${((field.detectionConfidence ?? 0) * 100).toFixed(0)}%] ⚡ ${fieldMsStr}`,
    );
    log.groupEnd();
  });

  const summary = (Object.entries(byMethod) as [DetectionMethod, number][])
    .filter(([, n]) => n > 0)
    .map(([m, n]) => `${m}: ${n}`)
    .join(" · ");

  log.info(`✅ ${fields.length} campo(s)  ·  ${summary}`);

  // ── Performance summary ────────────────────────────────────────────────────
  const totalMs = performance.now() - t0;
  const perfSorted = [...fields]
    .filter((f) => (f.detectionDurationMs ?? 0) > 0)
    .sort(
      (a, b) => (b.detectionDurationMs ?? 0) - (a.detectionDurationMs ?? 0),
    );
  const slowTop = perfSorted.slice(0, 3).map((f) => {
    const fIdx = fields.indexOf(f) + 1;
    const ms = (f.detectionDurationMs ?? 0).toFixed(1);
    const label = f.label ?? f.id ?? f.name ?? "?";
    return `#${fIdx} "${label}" ${ms}ms [${f.detectionMethod}]`;
  });
  log.debug(
    `⏱ ${totalMs.toFixed(0)}ms total${slowTop.length ? ` · 🐢 ${slowTop.join(" · ")}` : ""}`,
  );
  log.groupEnd();

  return { fields };
}

/**
 * Streaming detection — yields each FormField immediately after it is classified.
 * Native inputs run the full async pipeline (incl. Chrome AI); custom selects and
 * interactive fields are yielded synchronously at the end.
 *
 * Ideal for real-time UI updates: consumers can show each field's type as it
 * arrives rather than waiting for the entire scan to complete.
 */
export async function* streamAllFields(): AsyncGenerator<FormField> {
  for await (const field of streamNativeFieldsAsync()) {
    yield field;
  }
  // Yield custom component fields (antd, select2, …) with keyword classification
  const customFields = classifyCustomFieldsSync(detectCustomComponents());
  for (const field of customFields) {
    yield field;
  }
}
