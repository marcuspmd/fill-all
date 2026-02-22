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
  detectCustomSelects,
  type CustomSelectField,
} from "./detectors/custom-select-handler";
import { detectInteractiveFields } from "./detectors/interactive-field-detector";
import {
  DEFAULT_PIPELINE,
  DEFAULT_COLLECTION_PIPELINE,
  nativeInputDetector,
  customSelectPageDetector,
  interactivePageDetector,
  detectNativeFieldsAsync,
} from "./detectors/classifiers";
export { DEFAULT_PIPELINE, DEFAULT_COLLECTION_PIPELINE };
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

export interface DetectionResult {
  fields: FormField[];
  /** Raw custom-select objects needed by form-filler to call selectCustomOption() */
  customSelects: CustomSelectField[];
}

export function detectFormFields(): FormField[] {
  return detectAllFields().fields;
}

/**
 * Synchronous detection — used by dom-watcher and any context that cannot await.
 * Delegates to the PageDetectors in DEFAULT_COLLECTION_PIPELINE.
 * Raw customSelects are exposed for form-filler backward compatibility.
 */
export function detectAllFields(): DetectionResult {
  const nativeFields = nativeInputDetector.detect();
  const customSelects = detectCustomSelects();
  const csFields = customSelectPageDetector.detect();
  return { fields: [...nativeFields, ...csFields], customSelects };
}

// ── Async detection — full pipeline with logging ──────────────────────────────

export interface AsyncDetectionResult extends DetectionResult {
  interactiveFields: ReturnType<typeof detectInteractiveFields>;
}

/**
 * Async detection — runs the full DEFAULT_COLLECTION_PIPELINE and adds
 * per-detector summary logging.
 */
export async function detectAllFieldsAsync(): Promise<AsyncDetectionResult> {
  const url = window.location.href;
  const t0 = performance.now();

  log.groupCollapsed(`🚀 Detecção iniciada — ${new URL(url).hostname}`);
  log.debug(`📄 URL: ${url}`);

  // Use the async pipeline so the Chrome AI classifier (detectAsync) is active
  // for native inputs. Custom selects and interactive fields remain synchronous.
  const nativeFields = await detectNativeFieldsAsync();
  const csFields = customSelectPageDetector.detect();
  const interactiveFormFields = interactivePageDetector.detect();
  const fields = [...nativeFields, ...csFields, ...interactiveFormFields];

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

  fields.forEach((field, idx) => {
    const method = field.detectionMethod ?? "html-fallback";
    byMethod[method]++;

    const tag = field.element.tagName.toLowerCase();
    const htmlType =
      field.element instanceof HTMLInputElement ? field.element.type : "—";

    log.groupCollapsed(
      `#${idx + 1} <${tag} type="${htmlType}"> │ id="${field.id ?? ""}" name="${field.name ?? ""}"`,
    );
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

  const customSelects = detectCustomSelects();
  const interactiveFields = detectInteractiveFields();

  return { fields, customSelects, interactiveFields };
}

export function detectForms(): HTMLFormElement[] {
  return Array.from(document.querySelectorAll("form"));
}
