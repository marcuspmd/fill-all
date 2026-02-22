/**
 * TensorFlow.js-based field classifier
 *
 * Classification strategy (in order of priority):
 *  1. TF.js soft match    — character n-gram cosine similarity via pre-trained model
 *                           loaded from public/model/ at extension startup
 *  2. HTML input[type]    — last-resort fallback from the DOM attribute
 *
 * DEBUG: Set `window.__FILL_ALL_DEBUG__ = true` in the browser DevTools console
 * of the page being filled, then trigger a fill. You will see a collapsed log
 * group for every field with signals, keyword matches, TF.js score, and final type.
 */

import type { FormField, FieldType } from "@/types";
import { generate } from "@/lib/generators";
import { getLearnedEntries } from "@/lib/ai/learning-store";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";

// ── Debug flag ───────────────────────────────────────────────────────────────
// Activate in the browser DevTools console of the page being filled:
//   window.__FILL_ALL_DEBUG__ = true
// Then trigger a fill to see detailed classifier logs for every field.
function isDebugEnabled(): boolean {
  return true; // deixar sempre ligado por enquanto.
  return !!(globalThis as Record<string, unknown>)["__FILL_ALL_DEBUG__"];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Dot product of two L2-normalised Float32Arrays → cosine similarity.
 */
function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
}

// ── Character n-gram helpers ─────────────────────────────────────────────────

const NGRAM_SIZE = 3;

// Minimum cosine similarity for TF.js prediction to be accepted.
// 0.65 keeps good precision while reducing fallback frequency on noisy labels.
const TF_THRESHOLD = 0.4;

// Minimum cosine similarity for a learned entry to be used.
// Higher than TF_THRESHOLD because learned data is trusted (Chrome AI + user corrections).
const LEARNED_THRESHOLD = 0.6;

function charNgrams(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-/.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const padded = `_${normalized}_`;
  const result: string[] = [];
  for (let i = 0; i <= padded.length - NGRAM_SIZE; i++) {
    result.push(padded.slice(i, i + NGRAM_SIZE));
  }
  return result;
}

function vectorize(text: string, vocab: Map<string, number>): Float32Array {
  const v = new Float32Array(vocab.size);
  for (const ng of charNgrams(text)) {
    const i = vocab.get(ng);
    if (i !== undefined) v[i] += 1;
  }
  // L2 normalize so dot product == cosine similarity
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

// ── Pre-trained model (loaded from public/model/) ───────────────────────────
// When available, this is preferred over the runtime prototype-vector approach.
// Trained offline with `npm run train:model` using the labelled dataset.

interface PretrainedState {
  model: LayersModel;
  vocab: Map<string, number>;
  labels: FieldType[];
}

interface LearnedVector {
  vector: Float32Array;
  type: FieldType;
}

let _pretrained: PretrainedState | null = null;
let _pretrainedLoadPromise: Promise<void> | null = null;
let _learnedVectors: LearnedVector[] = [];
let _tfModule: typeof import("@tensorflow/tfjs") | null = null;
let _tfLoadPromise: Promise<typeof import("@tensorflow/tfjs")> | null = null;

async function loadTfModule(): Promise<typeof import("@tensorflow/tfjs")> {
  if (_tfModule) return _tfModule;
  if (_tfLoadPromise) return _tfLoadPromise;
  _tfLoadPromise = import("@tensorflow/tfjs").then((mod) => {
    _tfModule = mod;
    return mod;
  });
  return _tfLoadPromise;
}

/**
 * Loads the offline-trained TF.js model from the extension's model/ directory.
 * Must be called once during content-script initialisation (non-blocking).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function loadPretrainedModel(): Promise<void> {
  if (_pretrained) return;
  if (_pretrainedLoadPromise) return _pretrainedLoadPromise;

  _pretrainedLoadPromise = (async () => {
    try {
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
      // Load learned vectors so user corrections are immediately active
      await loadLearnedVectors();

      if (isDebugEnabled()) {
        console.log(
          `[Fill All] Pre-trained model loaded — ${labelsRaw.length} classes, vocab ${_pretrained.vocab.size} n-grams, ${_learnedVectors.length} learned vectors`,
        );
      }
    } catch (err) {
      console.error(
        "[Fill All] ❌ Falha ao carregar modelo pré-treinado:",
        err,
      );
      console.warn(
        "[Fill All] ⚠️  Classificação usará apenas HTML input[type] como fallback.",
      );
    }
  })();

  return _pretrainedLoadPromise;
}

/**
 * Reload the learned vectors from storage so the latest user corrections and
 * Chrome AI classifications are reflected in the next field classification.
 * Call this after storing a new learned entry.
 */
export function invalidateClassifier(): void {
  const prev = _learnedVectors.length;
  _learnedVectors = [];
  console.log(
    `[TFClassifier] invalidateClassifier: ${prev} vetores descarregados. Recarregando do storage...`,
  );
  if (_pretrained) {
    // Reload in background — next classification will pick up the fresh vectors.
    loadLearnedVectors().catch((err) => {
      console.error("[TFClassifier] Erro ao recarregar vetores:", err);
    });
  } else {
    console.warn(
      "[TFClassifier] Modelo pré-treinado ainda não carregado. Os vetores serão carregados na próxima classificação.",
    );
  }
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
    console.log(
      `[TFClassifier] loadLearnedVectors: ${entries.length} entradas no storage, ` +
        `${_learnedVectors.length} vetores carregados (vetores nulos descartados).`,
    );
  } catch (err) {
    console.warn(
      "[Fill All] Não foi possível carregar vetores aprendidos:",
      err,
    );
    _learnedVectors = [];
  }
}

/**
 * Classify field signals using the pre-trained TF.js model.
 *
 * Returns null if:
 *   - signals are empty
 *   - the model has not been loaded yet (falls through to keyword/html-fallback)
 *   - the best prediction score is below TF_THRESHOLD
 */
function tfSoftClassify(
  signals: string,
): { type: FieldType; score: number } | null {
  if (!signals.trim()) return null;
  if (!_pretrained || !_tfModule) {
    console.warn(
      "[Fill All] ⚠️  Modelo não carregado ainda — usando html-fallback. Sinais:",
      signals,
    );
    return null;
  }

  const inputVec = vectorize(signals, _pretrained.vocab);
  if (!inputVec.some((v) => v > 0)) return null;

  // ── Step 1: Check learned vectors (Chrome AI + user corrections) ──────────
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
      if (isDebugEnabled()) {
        console.log(
          `[Fill All] 🎓 Learned match: "${bestLearnedType}" (cosine=${bestLearnedScore.toFixed(3)}, threshold=${LEARNED_THRESHOLD}) para "${signals}"`,
        );
      }
      return { type: bestLearnedType, score: bestLearnedScore };
    }
  }

  // ── Step 2: TF.js pre-trained model ──────────────────────────────────────
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
    console.warn(
      `[Fill All] ⚠️  TF.js score baixo (${bestScore.toFixed(3)} < threshold ${TF_THRESHOLD}) para sinais: "${signals}" — melhor palpite: "${_pretrained.labels[bestIdx]}"`,
    );
    return null;
  }
  return { type: _pretrained.labels[bestIdx], score: bestScore };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * TF.js cosine-similarity soft match over a normalised signals string.
 * Returns the best matching FieldType + confidence score, or null if below threshold.
 */
export function classifyByTfSoft(
  signals: string,
): { type: FieldType; score: number } | null {
  return tfSoftClassify(signals);
}

/**
 * Classifies a form field into a FieldType using the pre-trained TF.js model.
 *
 * To re-train the model with new data:
 *   → update the dataset and run `npm run train:model`.
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

  // ── Step 1: TF.js soft / fuzzy match (pre-trained model) ─────────────────
  const tfResult = classifyByTfSoft(signals);
  if (tfResult) {
    if (isDebugEnabled()) {
      console.groupCollapsed(
        `[Fill All] classify → %c${tfResult.type}%c  (tf.js cosine=${tfResult.score.toFixed(3)})  ${field.selector}`,
        "color: #6366f1; font-weight: bold",
        "color: inherit",
      );
      console.log("📡 signals:", signals || "(none)");
      console.log(
        `🤖 TF.js best match: "${tfResult.type}" (similarity ${tfResult.score.toFixed(3)}, threshold ${TF_THRESHOLD})`,
      );
      console.log("🔖 field:", {
        label: field.label,
        name: field.name,
        id: field.id,
        placeholder: field.placeholder,
      });
      console.groupEnd();
    }
    return tfResult.type;
  }

  // ── Step 2: HTML input[type] fallback ─────────────────────────────────────
  const inputType = field.element.type?.toLowerCase();
  const htmlTypeMap: Record<string, FieldType> = {
    email: "email",
    tel: "phone",
    password: "password",
    number: "number",
    date: "date",
    url: "text",
  };
  const htmlType: FieldType =
    (htmlTypeMap[inputType] as FieldType) ?? "unknown";

  if (isDebugEnabled()) {
    console.groupCollapsed(
      `[Fill All] classify → %c${htmlType}%c  (html-type / fallback)  ${field.selector}`,
      "color: #f59e0b; font-weight: bold",
      "color: inherit",
    );
    console.log("📡 signals:", signals || "(none)");
    console.log(
      `⚠️  no keyword or TF.js match — using input[type="${inputType}"]`,
    );
    console.log("🔖 field:", {
      label: field.label,
      name: field.name,
      id: field.id,
      placeholder: field.placeholder,
    });
    console.groupEnd();
  }

  return htmlType;
}

/**
 * Generate a value using TF.js classification + built-in generators.
 */
export async function generateWithTensorFlow(
  field: FormField,
): Promise<string> {
  const detectedType = classifyField(field);
  return generate(detectedType);
}
