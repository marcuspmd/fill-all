/**
 * TensorFlow.js Field Classifier — Detection Strategy
 *
 * Implements the FieldClassifier interface for use in the DetectionPipeline.
 * All classification logic lives here:
 *   - Pre-trained model loading (runtime-trained → bundled fallback)
 *   - Learned-vector lookup (Chrome AI + user corrections via learning-store)
 *   - TF.js softmax inference with cosine-similarity n-gram vectorisation
 *
 * Shared text utilities (charNgrams, vectorize, dotProduct) are imported from
 * src/lib/shared/ngram.ts so they can be independently unit-tested.
 *
 * Configuration, thresholds and log messages live in
 * tensorflow-classifier.config.ts — edit there to tune the classifier.
 *
 * DEBUG: Set `window.__FILL_ALL_DEBUG__ = true` in DevTools and trigger a fill
 * to see per-field classification details.
 */

import type { FieldType, FormField } from "@/types";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";
import { getLearnedEntries } from "@/lib/ai/learning-store";
import { loadRuntimeModel } from "@/lib/ai/runtime-trainer";
import { dotProduct, vectorize } from "@/lib/shared/ngram";
import {
  buildFeatureText,
  fromFlatSignals,
  inferCategoryFromType,
  inferLanguageFromSignals,
  structuredSignalsFromField,
  type StructuredSignalContext,
  type StructuredSignals,
} from "@/lib/shared/structured-signals";
import type { FieldClassifier, ClassifierResult } from "../pipeline";
import { createLogger } from "@/lib/logger";
import { TF_CONFIG, TF_MESSAGES } from "./tensorflow-classifier.config";

export { TF_THRESHOLD } from "./tensorflow-classifier.config";

const log = createLogger("TFClassifier");

const { thresholds } = TF_CONFIG;

// ── Internal types ────────────────────────────────────────────────────────────

interface PretrainedState {
  model: LayersModel;
  vocab: Map<string, number>;
  labels: FieldType[];
}

interface LearnedVector {
  vector: Float32Array;
  type: FieldType;
}

// ── Module state ──────────────────────────────────────────────────────────────

let _pretrained: PretrainedState | null = null;
let _pretrainedLoadPromise: Promise<void> | null = null;
let _learnedVectors: LearnedVector[] = [];
let _tfModule: typeof import("@tensorflow/tfjs") | null = null;
let _tfLoadPromise: Promise<typeof import("@tensorflow/tfjs")> | null = null;

// ── TF.js lazy loader ─────────────────────────────────────────────────────────

async function loadTfModule(): Promise<typeof import("@tensorflow/tfjs")> {
  if (_tfModule) return _tfModule;
  if (_tfLoadPromise) return _tfLoadPromise;
  _tfLoadPromise = import("@tensorflow/tfjs").then((mod) => {
    _tfModule = mod;
    return mod;
  });
  return _tfLoadPromise;
}

// ── Model loading ─────────────────────────────────────────────────────────────

/**
 * Loads the pre-trained TF.js model.
 *
 * Priority:
 *   1. Runtime-trained model stored in chrome.storage.local (via options page)
 *   2. Bundled model files from public/model/ (ship-time default)
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function loadPretrainedModel(): Promise<void> {
  if (_pretrained) return;
  if (_pretrainedLoadPromise) return _pretrainedLoadPromise;

  _pretrainedLoadPromise = (async () => {
    try {
      await loadTfModule();

      // Step 1: Try runtime-trained model (user dataset, options page)
      const runtimeModel = await loadRuntimeModel();
      if (runtimeModel) {
        _pretrained = runtimeModel;
        await loadLearnedVectors();
        log.info(
          TF_MESSAGES.modelLoaded.runtime(
            runtimeModel.labels.length,
            runtimeModel.vocab.size,
            _learnedVectors.length,
          ),
        );
        return;
      }

      // Step 2: Fall back to bundled model files
      const tf = await loadTfModule();
      const base = chrome.runtime.getURL("");
      const [model, vocabRaw, labelsRaw] = await Promise.all([
        tf.loadLayersModel(`${base}${TF_CONFIG.model.json}`),
        fetch(`${base}${TF_CONFIG.model.vocab}`).then(
          (r) => r.json() as Promise<Record<string, number>>,
        ),
        fetch(`${base}${TF_CONFIG.model.labels}`).then(
          (r) => r.json() as Promise<string[]>,
        ),
      ]);
      _pretrained = {
        model,
        vocab: new Map(Object.entries(vocabRaw)),
        labels: labelsRaw as FieldType[],
      };
      await loadLearnedVectors();

      log.info(
        TF_MESSAGES.modelLoaded.bundled(
          labelsRaw.length,
          _pretrained.vocab.size,
          _learnedVectors.length,
        ),
      );
    } catch (err) {
      log.error(TF_MESSAGES.modelLoadFailed.error, err);
      log.warn(TF_MESSAGES.modelLoadFailed.fallback);
    }
  })();

  return _pretrainedLoadPromise;
}

/**
 * Vectorises and caches all entries from the learning-store.
 * Requires the pre-trained vocab to be loaded first.
 */
async function loadLearnedVectors(): Promise<void> {
  if (!_pretrained) return;
  try {
    const entries = await getLearnedEntries();
    _learnedVectors = entries
      .map((entry) => {
        const featureText = buildFeatureText(fromFlatSignals(entry.signals), {
          category: inferCategoryFromType(entry.type),
          language: inferLanguageFromSignals(entry.signals),
        });

        return {
          vector: vectorize(featureText, _pretrained!.vocab),
          type: entry.type,
        };
      })
      .filter((e) => e.vector.some((v) => v > 0));
    log.debug(
      TF_MESSAGES.learnedVectors.summary(
        entries.length,
        _learnedVectors.length,
      ),
    );
  } catch (err) {
    log.warn(TF_MESSAGES.learnedVectors.failed, err);
    _learnedVectors = [];
  }
}

/**
 * Drops the in-memory learned vectors cache so the next classification
 * reloads fresh data from storage.
 */
export function invalidateClassifier(): void {
  const prev = _learnedVectors.length;
  _learnedVectors = [];
  log.debug(TF_MESSAGES.invalidate.dropped(prev));
  if (_pretrained) {
    loadLearnedVectors().catch((err) => {
      log.error(TF_MESSAGES.invalidate.reloadError, err);
    });
  } else {
    log.warn(TF_MESSAGES.invalidate.notLoaded);
  }
}

/**
 * Reloads the entire classifier (model + vocab + learned vectors) from storage.
 * Call this after a new model has been trained via the options page.
 */
export async function reloadClassifier(): Promise<void> {
  _pretrained = null;
  _pretrainedLoadPromise = null;
  _learnedVectors = [];
  await loadPretrainedModel();
  log.info(TF_MESSAGES.reload);
}

// ── Core classification ───────────────────────────────────────────────────────

/**
 * Classify via:
 *   1. Learned vectors (Chrome AI + user corrections) — higher threshold
 *   2. TF.js pre-trained model softmax — TF_THRESHOLD
 *
 * Returns null if signals are empty, the model is not loaded, or the best
 * score is below the threshold.
 */
export function classifyByTfSoft(
  input: string | StructuredSignals,
  context?: StructuredSignalContext,
): { type: FieldType; score: number } | null {
  const featureText =
    typeof input === "string"
      ? buildFeatureText(fromFlatSignals(input), context)
      : buildFeatureText(input, context);

  if (!featureText.trim()) return null;
  if (!_pretrained || !_tfModule) {
    log.warn(TF_MESSAGES.classify.notLoaded(featureText));
    return null;
  }

  const inputVec = vectorize(featureText, _pretrained.vocab);
  if (!inputVec.some((v) => v > 0)) return null;

  // Step 1: Learned vectors (user corrections + Chrome AI)
  if (_learnedVectors.length > 0) {
    let bestLearnedScore = -1;
    let bestLearnedType: FieldType | null = null;
    for (const entry of _learnedVectors) {
      const sim = dotProduct(inputVec, entry.vector);
      if (sim > bestLearnedScore) {
        bestLearnedScore = sim;
        bestLearnedType = entry.type;
      }
    }
    if (bestLearnedScore >= thresholds.learned && bestLearnedType) {
      log.debug(
        TF_MESSAGES.classify.learnedMatch(
          bestLearnedType,
          bestLearnedScore.toFixed(3),
          thresholds.learned,
          featureText,
        ),
      );
      return { type: bestLearnedType, score: bestLearnedScore };
    }
  }

  // Step 2: TF.js pre-trained model
  const { bestIdx, bestScore } = _tfModule.tidy(() => {
    const input = _tfModule!.tensor2d([Array.from(inputVec)]);
    const probs = (_pretrained!.model.predict(input) as Tensor).dataSync();
    let idx = 0;
    let score = -1;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > score) {
        score = probs[i];
        idx = i;
      }
    }
    return { bestIdx: idx, bestScore: score };
  });

  if (bestScore < thresholds.model) {
    log.warn(
      TF_MESSAGES.classify.lowScore(
        bestScore.toFixed(3),
        thresholds.model,
        featureText,
        _pretrained.labels[bestIdx],
      ),
    );
    return null;
  }
  return { type: _pretrained.labels[bestIdx], score: bestScore };
}

// ── classifyField (higher-level helper used by dataset/integration & generator) ──

/**
 * Classifies a FormField by building its signals string and running
 * classifyByTfSoft. Falls back to HTML input[type] when the model is
 * not confident enough.
 */
export function classifyField(field: FormField): FieldType {
  const structured = structuredSignalsFromField(field);
  const tfResult = classifyByTfSoft(structured.signals, structured.context);
  const featureText = buildFeatureText(structured.signals, structured.context);

  if (tfResult) {
    log.groupCollapsed(
      TF_MESSAGES.classify.groupLabel(
        tfResult.type,
        tfResult.score.toFixed(3),
        field.selector,
      ),
    );
    log.debug(TF_MESSAGES.classify.featureText, featureText || "(none)");
    log.debug(
      TF_MESSAGES.classify.tfMatch(
        tfResult.type,
        tfResult.score.toFixed(3),
        thresholds.model,
      ),
    );
    log.debug(TF_MESSAGES.classify.field, {
      label: field.label,
      name: field.name,
      id: field.id,
      placeholder: field.placeholder,
    });
    log.groupEnd();
    return tfResult.type;
  }

  const inputType = (field.element as HTMLInputElement).type?.toLowerCase();
  const htmlType: FieldType =
    (TF_CONFIG.htmlTypeFallback[
      inputType as keyof typeof TF_CONFIG.htmlTypeFallback
    ] as FieldType) ?? "unknown";

  log.groupCollapsed(
    TF_MESSAGES.classify.groupLabelFallback(htmlType, field.selector),
  );
  log.debug(TF_MESSAGES.classify.featureText, featureText || "(none)");
  log.debug(TF_MESSAGES.classify.noMatch(inputType));
  log.debug(TF_MESSAGES.classify.field, {
    label: field.label,
    name: field.name,
    id: field.id,
    placeholder: field.placeholder,
  });
  log.groupEnd();

  return htmlType;
}

// ── FieldClassifier implementation ────────────────────────────────────────────

/**
 * TF.js field classifier strategy for the DetectionPipeline.
 * Wraps classifyByTfSoft using the pre-built contextSignals string.
 */
export const tensorflowClassifier: FieldClassifier = {
  name: "tensorflow",
  detect(field: FormField): ClassifierResult | null {
    const structured = structuredSignalsFromField(field);
    const result = classifyByTfSoft(structured.signals, structured.context);
    if (result === null) return null;
    return { type: result.type, confidence: result.score };
  },
};
