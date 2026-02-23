/**
 * Field Processing Chain
 *
 * Makes the step-by-step detection workflow explicit and reusable.
 *
 * Every native-field scan goes through exactly these 4 steps:
 *
 *   Step 1 — collect   : query the DOM for candidate elements
 *   Step 2 — filter    : skip invisible / excluded elements
 *   Step 3 — extract   : build a FormField stub (selector, label, signals)
 *   Step 4 — classify  : run injected classifiers in order to determine FieldType
 *
 * Classifiers are injected explicitly — each one is a named, visible step.
 * Swap any classifier without touching the chain itself:
 *
 *   chain.classify(
 *     htmlTypeClassifier,   // step 4a — deterministic from HTML
 *     keywordClassifier,    // step 4b — Portuguese keyword rules
 *     tensorflowClassifier, // step 4c — ML soft-match
 *     chromeAiClassifier,   // step 4d — Gemini Nano (async only)
 *     htmlFallbackClassifier, // step 4e — last resort
 *   );
 *
 * Three execution modes share the same chain config:
 *
 *   chain.runSync()   → FormField[]               — used by dom-watcher (sync)
 *   chain.runAsync()  → Promise<FormField[]>      — used by detectAllFieldsAsync
 *   chain.stream()    → AsyncGenerator<FormField> — used by devtools / floating panel
 */

import type { FormField } from "@/types";
import {
  DetectionPipeline,
  type FieldClassifier,
  type PipelineResult,
} from "../detectors/pipeline";

type NativeElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type FilterFn = (el: NativeElement) => boolean;
type BuilderFn = (el: NativeElement) => FormField;

export class FieldProcessingChain {
  private _selector = "";
  private _filters: FilterFn[] = [];
  private _builder: BuilderFn | null = null;
  private _classifiers: FieldClassifier[] = [];

  // ── Step 1: Collect ─────────────────────────────────────────────────────────

  /** CSS selector used to query candidate DOM elements. */
  collect(selector: string): this {
    this._selector = selector;
    return this;
  }

  // ── Step 2: Filter ──────────────────────────────────────────────────────────

  /** Predicate(s) — element must pass ALL filters to proceed. */
  filter(...fns: FilterFn[]): this {
    this._filters.push(...fns);
    return this;
  }

  // ── Step 3: Extract ─────────────────────────────────────────────────────────

  /**
   * Builder that converts a raw DOM element into a bare FormField
   * (selector, label, signals — no fieldType yet).
   */
  extract(builder: BuilderFn): this {
    this._builder = builder;
    return this;
  }

  // ── Step 4: Classify ────────────────────────────────────────────────────────

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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private collectElements(): NativeElement[] {
    return Array.from(
      document.querySelectorAll<NativeElement>(this._selector),
    ).filter((el) => this._filters.every((fn) => fn(el)));
  }

  private applyResult(field: FormField, result: PipelineResult): void {
    field.fieldType = result.type;
    field.detectionMethod = result.method;
    field.detectionConfidence = result.confidence;
    field.detectionDurationMs = result.durationMs;
  }

  // ── Execution modes ──────────────────────────────────────────────────────────

  /**
   * Synchronous run — classifies every element before returning.
   * Chrome AI classifier is skipped (it returns null synchronously).
   */
  runSync(): FormField[] {
    const pipeline = new DetectionPipeline(this._classifiers);
    const builder = this._builder!;

    return this.collectElements().map((el) => {
      const field = builder(el);
      this.applyResult(field, pipeline.run(field));
      return field;
    });
  }

  /**
   * Async run — awaits every classifier (including Chrome AI) per field,
   * then returns all fields at once.
   */
  async runAsync(): Promise<FormField[]> {
    const pipeline = new DetectionPipeline(this._classifiers);
    const builder = this._builder!;
    const fields: FormField[] = [];

    for (const el of this.collectElements()) {
      const field = builder(el);
      this.applyResult(field, await pipeline.runAsync(field));
      fields.push(field);
    }

    return fields;
  }

  /**
   * Streaming run — yields each FormField immediately after it is classified.
   * Enables real-time UI updates while the rest of the page is still being scanned.
   */
  async *stream(): AsyncGenerator<FormField> {
    const pipeline = new DetectionPipeline(this._classifiers);
    const builder = this._builder!;

    for (const el of this.collectElements()) {
      const field = builder(el);
      this.applyResult(field, await pipeline.runAsync(field));
      yield field;
    }
  }
}
