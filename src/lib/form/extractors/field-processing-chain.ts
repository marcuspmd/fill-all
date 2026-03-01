/**
 * Field Classification Chain
 *
 * Assigns a FieldType to an already-extracted list of FormField stubs.
 * Collection, filtering and extraction (Steps 1–3) are handled upstream
 * by the caller — see classifiers.ts / collectNativeFields().
 *
 * Classifiers are injected explicitly — each one is a named, visible step.
 * The first classifier that returns a confident result wins.
 *
 *   const chain = new FieldProcessingChain().classify(
 *     htmlTypeClassifier,     // deterministic from HTML
 *     keywordClassifier,      // Portuguese keyword rules
 *     tensorflowClassifier,   // ML soft-match
 *     chromeAiClassifier,     // Gemini Nano (async only)
 *     htmlFallbackClassifier, // last resort
 *   );
 *
 * Two execution modes:
 *
 *   chain.runAsync(fields)  → Promise<FormField[]>      — awaits all classifiers
 *   chain.stream(fields)    → AsyncGenerator<FormField> — yields each as it finishes
 */

import type { FormField } from "@/types";
import {
  DetectionPipeline,
  type FieldClassifier,
  type PipelineResult,
} from "../detectors/pipeline";

export class FieldProcessingChain {
  private _classifiers: FieldClassifier[] = [];

  // ── Classify ─────────────────────────────────────────────────────────────────

  /**
   * Classifiers to run in order — each one is a named, injectable step.
   * The first classifier that returns a confident result wins.
   * Chrome AI (detectAsync) is called only in runAsync / stream.
   *
   * Each call to classify() REPLACES the previous list (no appending).
   */
  classify(...classifiers: FieldClassifier[]): this {
    this._classifiers = classifiers;
    return this;
  }

  // ── Helper ───────────────────────────────────────────────────────────────────

  private applyResult(field: FormField, result: PipelineResult): void {
    field.fieldType = result.type;
    field.detectionMethod = result.method;
    field.detectionConfidence = result.confidence;
    field.detectionDurationMs = result.durationMs;
    field.timings = result.timings;
    field.predictions = result.predictions;
    field.decisionTrace = result.decisionTrace;
  }

  // ── Execution modes ──────────────────────────────────────────────────────────

  /**
   * Async run — awaits every classifier (including Chrome AI) per field,
   * then returns all fields at once.
   */
  async runAsync(fields: FormField[]): Promise<FormField[]> {
    const pipeline = new DetectionPipeline(this._classifiers);
    for (const field of fields) {
      this.applyResult(field, await pipeline.runAsync(field));
    }
    return fields;
  }

  /**
   * Streaming run — yields each FormField immediately after it is classified.
   * Enables real-time UI updates while classification is still in progress.
   */
  async *stream(fields: FormField[]): AsyncGenerator<FormField> {
    const pipeline = new DetectionPipeline(this._classifiers);
    for (const field of fields) {
      this.applyResult(field, await pipeline.runAsync(field));
      yield field;
    }
  }
}
