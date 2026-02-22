/**
 * Detection Pipeline
 *
 * A configurable, ordered chain of FieldClassifier strategies.
 * Each classifier inspects a FormField and returns the first confident result.
 *
 * Usage:
 *
 *   // use the default pipeline (html-type → keyword → tensorflow → html-fallback)
 *   const result = DEFAULT_PIPELINE.run(field);
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
}

// ── Pipeline class ────────────────────────────────────────────────────────────

export class DetectionPipeline {
  constructor(readonly classifiers: ReadonlyArray<FieldClassifier>) {}

  /**
   * Run classifiers in order, returning the first confident result.
   * Falls back to { type: "unknown", method: "html-fallback", confidence: 0.1 }
   * if no classifier produces a match.
   */
  run(field: FormField): PipelineResult {
    const t0 = performance.now();
    for (const classifier of this.classifiers) {
      const result = classifier.detect(field);
      if (result !== null && result.type !== "unknown") {
        return {
          ...result,
          method: classifier.name,
          durationMs: performance.now() - t0,
        };
      }
    }
    return {
      type: "unknown",
      method: "html-fallback",
      confidence: 0.1,
      durationMs: performance.now() - t0,
    };
  }

  /**
   * Async variant of `run`. Prefers `detectAsync` when available on a classifier
   * (e.g. Chrome AI), falling back to the synchronous `detect` for all others.
   * This allows async strategies to participate in the pipeline without breaking
   * the synchronous API used by dom-watcher and other sync callers.
   */
  async runAsync(field: FormField): Promise<PipelineResult> {
    const t0 = performance.now();
    for (const classifier of this.classifiers) {
      console.log(`⏳ Executando ${classifier.name}...`);
      const result = classifier.detectAsync
        ? await classifier.detectAsync(field)
        : classifier.detect(field);

      console.log("result", result);

      if (result !== null && result.type !== "unknown") {
        return {
          ...result,
          method: classifier.name,
          durationMs: performance.now() - t0,
        };
      }
    }
    return {
      type: "unknown",
      method: "html-fallback",
      confidence: 0.1,
      durationMs: performance.now() - t0,
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
