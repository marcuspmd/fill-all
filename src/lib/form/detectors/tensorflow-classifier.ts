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
 * DEBUG: Set `window.__FILL_ALL_DEBUG__ = true` in DevTools and trigger a fill
 * to see per-field classification details.
 */

import type { FieldType, FormField } from "@/types";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";
import { getLearnedEntries } from "@/lib/ai/learning-store";
import { loadRuntimeModel } from "@/lib/ai/runtime-trainer";
import { dotProduct, vectorize } from "@/lib/shared/ngram";
import type { FieldClassifier, ClassifierResult } from "./pipeline";
import { createLogger } from "@/lib/logger";

const log = createLogger("TFClassifier");

// ── Thresholds ────────────────────────────────────────────────────────────────

/** Minimum TF.js softmax score to accept a prediction. */
export const TF_THRESHOLD = 0.4;

/** Minimum cosine similarity for a learned entry (more trusted data). */
const LEARNED_THRESHOLD = 0.5;

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
          `✅ Runtime-trained model loaded from storage — ${runtimeModel.labels.length} classes, vocab ${runtimeModel.vocab.size} n-grams, ${_learnedVectors.length} learned vectors`,
        );
        return;
      }

      // Step 2: Fall back to bundled model files
      const tf = await loadTfModule();
      const base = chrome.runtime.getURL("model/");
      const [model, vocabRaw, labelsRaw] = await Promise.all([
        tf.loadLayersModel(`${base}model.json`),
        fetch(`${base}vocab.json`).then(
          (r) => r.json() as Promise<Record<string, number>>,
        ),
        fetch(`${base}labels.json`).then((r) => r.json() as Promise<string[]>),
      ]);
      _pretrained = {
        model,
        vocab: new Map(Object.entries(vocabRaw)),
        labels: labelsRaw as FieldType[],
      };
      await loadLearnedVectors();

      log.info(
        `Pre-trained model loaded (bundled) — ${labelsRaw.length} classes, vocab ${_pretrained.vocab.size} n-grams, ${_learnedVectors.length} learned vectors`,
      );
    } catch (err) {
      log.error("❌ Falha ao carregar modelo pré-treinado:", err);
      log.warn(
        "⚠️  Classificação usará apenas HTML input[type] como fallback.",
      );
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
      .map((e) => ({
        vector: vectorize(e.signals, _pretrained!.vocab),
        type: e.type,
      }))
      .filter((e) => e.vector.some((v) => v > 0));
    log.debug(
      `loadLearnedVectors: ${entries.length} entradas no storage, ` +
        `${_learnedVectors.length} vetores carregados (vetores nulos descartados).`,
    );
  } catch (err) {
    log.warn("Não foi possível carregar vetores aprendidos:", err);
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
  log.debug(
    `invalidateClassifier: ${prev} vetores descarregados. Recarregando do storage...`,
  );
  if (_pretrained) {
    loadLearnedVectors().catch((err) => {
      log.error("Erro ao recarregar vetores:", err);
    });
  } else {
    log.warn(
      "Modelo pré-treinado ainda não carregado. Os vetores serão carregados na próxima classificação.",
    );
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
  log.info("reloadClassifier: classificador recarregado com novo modelo.");
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
  signals: string,
): { type: FieldType; score: number } | null {
  if (!signals.trim()) return null;
  if (!_pretrained || !_tfModule) {
    log.warn(
      "⚠️  Modelo não carregado ainda — usando html-fallback. Sinais:",
      signals,
    );
    return null;
  }

  const inputVec = vectorize(signals, _pretrained.vocab);
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
    if (bestLearnedScore >= LEARNED_THRESHOLD && bestLearnedType) {
      log.debug(
        `🎓 Learned match: "${bestLearnedType}" (cosine=${bestLearnedScore.toFixed(3)}, threshold=${LEARNED_THRESHOLD}) para "${signals}"`,
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

  if (bestScore < TF_THRESHOLD) {
    log.warn(
      `⚠️  TF.js score baixo (${bestScore.toFixed(3)} < threshold ${TF_THRESHOLD}) para sinais: "${signals}" — melhor palpite: "${_pretrained.labels[bestIdx]}"`,
    );
    return null;
  }
  return { type: _pretrained.labels[bestIdx], score: bestScore };
}

// ── classifyField (higher-level helper used by dataset/integration & generator) ──

const HTML_TYPE_FALLBACK: Record<string, FieldType> = {
  email: "email",
  tel: "phone",
  password: "password",
  number: "number",
  date: "date",
  url: "text",
};

/**
 * Classifies a FormField by building its signals string and running
 * classifyByTfSoft. Falls back to HTML input[type] when the model is
 * not confident enough.
 */
export function classifyField(field: FormField): FieldType {
  const signals = [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  const tfResult = classifyByTfSoft(signals);
  if (tfResult) {
    log.groupCollapsed(
      `classify → ${tfResult.type}  (tf.js cosine=${tfResult.score.toFixed(3)})  ${field.selector}`,
    );
    log.debug("📡 signals:", signals || "(none)");
    log.debug(
      `🤖 TF.js best match: "${tfResult.type}" (similarity ${tfResult.score.toFixed(3)}, threshold ${TF_THRESHOLD})`,
    );
    log.debug("🔖 field:", {
      label: field.label,
      name: field.name,
      id: field.id,
      placeholder: field.placeholder,
    });
    log.groupEnd();
    return tfResult.type;
  }

  const inputType = field.element.type?.toLowerCase();
  const htmlType: FieldType =
    (HTML_TYPE_FALLBACK[inputType] as FieldType) ?? "unknown";

  log.groupCollapsed(
    `classify → ${htmlType}  (html-type / fallback)  ${field.selector}`,
  );
  log.debug("📡 signals:", signals || "(none)");
  log.debug(`⚠️  no keyword or TF.js match — using input[type="${inputType}"]`);
  log.debug("🔖 field:", {
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
    const signals = field.contextSignals ?? "";
    const result = classifyByTfSoft(signals);
    if (result === null) return null;
    return { type: result.type, confidence: result.score };
  },
};
