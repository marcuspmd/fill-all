/**
 * Detection Pipeline
 *
 * A configurable, ordered chain of FieldClassifier strategies.
 * Each classifier inspects a FormField and returns the first confident result.
 *
 * Usage:
 *
 *   // use the default pipeline (html-type → keyword → tensorflow → html-fallback)
 *   const result = await DEFAULT_PIPELINE.runAsync(field);
 *
 *   // custom order — skip chrome-ai, put tensorflow before keyword
 *   const myPipeline = DEFAULT_PIPELINE.withOrder([
 *     "html-type", "tensorflow", "keyword", "html-fallback"
 *   ]);
 *
 *   // remove a strategy entirely
 *   const noChromeAi = DEFAULT_PIPELINE.without("chrome-ai");
 *
 *   // add a custom classifier at the end
 *   const extended = DEFAULT_PIPELINE.with(myClassifier);
 */

import type { FormField, FieldType, DetectionMethod } from "@/types";
import type { Detector } from "./detector.interface";

// ── Classifier contract ───────────────────────────────────────────────────────

export interface ClassifierResult {
  type: FieldType;
  /** Confidence score 0–1. 1.0 = deterministic (html-type / keyword). */
  confidence: number;
}

/**
 * FieldClassifier extends the base Detector contract.
 * `detect(field)` attempts to classify the field and returns null (or a result
 * with type "unknown") to pass control to the next classifier in the pipeline.
 *
 * Optionally, a classifier may implement `detectAsync` for strategies that
 * require async I/O (e.g. Chrome Language AI). `runAsync` in DetectionPipeline
 * will prefer `detectAsync` when present.
 */
export interface FieldClassifier extends Detector<
  FormField,
  ClassifierResult | null
> {
  readonly name: DetectionMethod;
  /** Optional async variant — used by DetectionPipeline.runAsync(). */
  detectAsync?(field: FormField): Promise<ClassifierResult | null>;
}

// ── Pipeline result ───────────────────────────────────────────────────────────

export interface PipelineResult {
  type: FieldType;
  method: DetectionMethod;
  confidence: number;
  /** Wall-clock time the pipeline spent classifying this field (ms) */
  durationMs: number;
  /** Per-classifier wall-clock times (only classifiers that actually ran) */
  timings: Array<{ strategy: string; durationMs: number }>;
  /** All non-null predictions collected across classifiers (including non-winners) */
  predictions: Array<{ type: FieldType; confidence: number }>;
  /** Human-readable trace of each classifier decision */
  decisionTrace: string[];
}

// ── Pipeline class ────────────────────────────────────────────────────────────

/**
 * Minimum TensorFlow confidence required to override a provisional html-type result.
 * html-type is structurally authoritative (input[type]), but TensorFlow adds semantic
 * context (labels, names, signals). At 0.3 confidence TF needs to be reasonably sure
 * before overriding the structural hint.
 */
const HTML_TYPE_CROSS_VALIDATE_THRESHOLD = 0.3;

export class DetectionPipeline {
  constructor(readonly classifiers: ReadonlyArray<FieldClassifier>) {}

  /**
   * Async variant — prefers `detectAsync` when available on a classifier
   * (e.g. Chrome AI), falling back to the synchronous `detect` for all others.
   *
   * Cross-validation behaviour:
   * When `html-type` produces a result, the pipeline does NOT stop immediately.
   * Instead, the result is held as provisional and the TensorFlow classifier is
   * still executed. If TensorFlow returns a *different* type with confidence ≥
   * HTML_TYPE_CROSS_VALIDATE_THRESHOLD, TensorFlow wins (semantic context beats
   * the structural HTML hint). Otherwise the original html-type result stands.
   *
   * Example: `<input type="date" name="birthDate">` with label "Nascimento" →
   * html-type says "date" (100%), but TensorFlow may say "birthDate" (>50%)
   * based on signals → TensorFlow result is used.
   */
  async runAsync(field: FormField): Promise<PipelineResult> {
    const t0 = performance.now();
    const timings: PipelineResult["timings"] = [];
    const predictions: PipelineResult["predictions"] = [];
    const decisionTrace: string[] = [];

    // Holds the provisional html-type result while we wait for TF cross-validation
    let htmlTypeProvisional: ClassifierResult | null = null;

    for (const classifier of this.classifiers) {
      const ct = performance.now();
      const result = classifier.detectAsync
        ? await classifier.detectAsync(field)
        : classifier.detect(field);
      const classifierMs = performance.now() - ct;
      timings.push({ strategy: classifier.name, durationMs: classifierMs });

      if (result === null) {
        decisionTrace.push(`${classifier.name}: null — skipped`);
      } else if (result.type === "unknown") {
        decisionTrace.push(
          `${classifier.name}: unknown (${(result.confidence * 100).toFixed(0)}%) — skipped`,
        );
        predictions.push({ type: result.type, confidence: result.confidence });
      } else {
        predictions.push({ type: result.type, confidence: result.confidence });

        // html-type: store provisionally and continue to tensorflow for cross-validation
        if (classifier.name === "html-type") {
          htmlTypeProvisional = result;
          decisionTrace.push(
            `${classifier.name}: ${result.type} (${(result.confidence * 100).toFixed(0)}%) — provisional, awaiting tensorflow cross-validation`,
          );
          continue;
        }

        // tensorflow: check whether it should override the provisional html-type result
        if (classifier.name === "tensorflow" && htmlTypeProvisional !== null) {
          if (
            result.type !== htmlTypeProvisional.type &&
            result.confidence >= HTML_TYPE_CROSS_VALIDATE_THRESHOLD
          ) {
            // TensorFlow has a different, confident semantic classification → override
            decisionTrace.push(
              `${classifier.name}: ${result.type} (${(result.confidence * 100).toFixed(0)}%) — overrides html-type (semantic context)`,
            );
            // Fall through to the normal return below
          } else {
            // TensorFlow confirms html-type or is not confident enough → html-type stands
            decisionTrace.push(
              `${classifier.name}: ${result.type} (${(result.confidence * 100).toFixed(0)}%) — html-type confirmed`,
            );
            return {
              ...htmlTypeProvisional,
              method: "html-type",
              durationMs: performance.now() - t0,
              timings,
              predictions,
              decisionTrace,
            };
          }
        }

        decisionTrace.push(
          `${classifier.name}: ${result.type} (${(result.confidence * 100).toFixed(0)}%) — selected`,
        );
        return {
          ...result,
          method: classifier.name,
          durationMs: performance.now() - t0,
          timings,
          predictions,
          decisionTrace,
        };
      }

      // After tensorflow processed (null or unknown): provisional html-type stands
      if (htmlTypeProvisional !== null && classifier.name === "tensorflow") {
        decisionTrace.push(
          `html-type: ${htmlTypeProvisional.type} (100%) — confirmed (tensorflow skipped/unknown)`,
        );
        return {
          ...htmlTypeProvisional,
          method: "html-type",
          durationMs: performance.now() - t0,
          timings,
          predictions,
          decisionTrace,
        };
      }
    }

    // End of pipeline — if html-type was provisional and tensorflow wasn't in the pipeline
    if (htmlTypeProvisional !== null) {
      decisionTrace.push(
        `html-type: ${htmlTypeProvisional.type} (100%) — confirmed (no tensorflow in pipeline)`,
      );
      return {
        ...htmlTypeProvisional,
        method: "html-type",
        durationMs: performance.now() - t0,
        timings,
        predictions,
        decisionTrace,
      };
    }

    decisionTrace.push("html-fallback: unknown — no classifier matched");
    return {
      type: "unknown",
      method: "html-fallback",
      confidence: 0.1,
      durationMs: performance.now() - t0,
      timings,
      predictions,
      decisionTrace,
    };
  }

  /**
   * Returns a new pipeline with classifiers reordered by the given method names.
   * Classifiers not listed are dropped.
   */
  withOrder(names: DetectionMethod[]): DetectionPipeline {
    const ordered = names
      .map((n) => this.classifiers.find((c) => c.name === n))
      .filter((c): c is FieldClassifier => c !== undefined);
    return new DetectionPipeline(ordered);
  }

  /**
   * Returns a new pipeline excluding the specified strategies.
   */
  without(...names: DetectionMethod[]): DetectionPipeline {
    return new DetectionPipeline(
      this.classifiers.filter((c) => !names.includes(c.name)),
    );
  }

  /**
   * Returns a new pipeline with the given classifier appended at the end.
   */
  with(classifier: FieldClassifier): DetectionPipeline {
    return new DetectionPipeline([...this.classifiers, classifier]);
  }

  /**
   * Returns a new pipeline with a classifier inserted before the one with
   * the given name. Useful for injecting a strategy at a specific priority.
   */
  insertBefore(
    beforeName: DetectionMethod,
    classifier: FieldClassifier,
  ): DetectionPipeline {
    const idx = this.classifiers.findIndex((c) => c.name === beforeName);
    if (idx === -1) return this.with(classifier);
    const next = [...this.classifiers];
    next.splice(idx, 0, classifier);
    return new DetectionPipeline(next);
  }
}

// ── Page-level detector contract ──────────────────────────────────────────────

/**
 * A detector that scans the page and produces a flat list of FormFields.
 * Contrast with FieldClassifier, which classifies a single, already-found field.
 *
 * Implementations should be stateless and operate on `document` directly.
 * `input` is `void` — the page is the implicit context.
 */
export interface PageDetector extends Detector<void, FormField[]> {
  readonly name: string;
}

// ── Field Collection Pipeline ─────────────────────────────────────────────────

/**
 * Orchestrates an ordered list of PageDetectors, running each one and
 * aggregating their results into a single FormField array.
 *
 * Usage:
 *
 *   const allFields = DEFAULT_COLLECTION_PIPELINE.run();
 *
 *   // add a new scanner
 *   const extended = DEFAULT_COLLECTION_PIPELINE.with(myPageDetector);
 *
 *   // remove a scanner by name
 *   const noInteractive = DEFAULT_COLLECTION_PIPELINE.without("interactive-fields");
 */
export class FieldCollectionPipeline {
  constructor(readonly detectors: ReadonlyArray<PageDetector>) {}

  /** Run all detectors in order and return the concatenated list of fields. */
  run(): FormField[] {
    return this.detectors.flatMap((d) => d.detect());
  }

  /** Returns a new pipeline with the given detector appended. */
  with(detector: PageDetector): FieldCollectionPipeline {
    return new FieldCollectionPipeline([...this.detectors, detector]);
  }

  /** Returns a new pipeline excluding detectors with any of the given names. */
  without(...names: string[]): FieldCollectionPipeline {
    return new FieldCollectionPipeline(
      this.detectors.filter((d) => !names.includes(d.name)),
    );
  }

  /** Returns a new pipeline with detectors reordered by name. */
  withOrder(names: string[]): FieldCollectionPipeline {
    const ordered = names
      .map((n) => this.detectors.find((d) => d.name === n))
      .filter((d): d is PageDetector => d !== undefined);
    return new FieldCollectionPipeline(ordered);
  }
}
