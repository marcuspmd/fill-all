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

import * as tf from "@tensorflow/tfjs";
import type { FormField, FieldType } from "@/types";
import { generate } from "@/lib/generators";

// ── Debug flag ───────────────────────────────────────────────────────────────
// Activate in the browser DevTools console of the page being filled:
//   window.__FILL_ALL_DEBUG__ = true
// Then trigger a fill to see detailed classifier logs for every field.
function isDebugEnabled(): boolean {
  return true; // deixar sempre ligado por enquanto.
  return !!(globalThis as Record<string, unknown>)["__FILL_ALL_DEBUG__"];
}

// ── Character n-gram helpers ─────────────────────────────────────────────────

const NGRAM_SIZE = 3;

// Minimum cosine similarity for TF.js prediction to be accepted.
// 0.65 keeps good precision while reducing fallback frequency on noisy labels.
const TF_THRESHOLD = 0.4;

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
  model: tf.LayersModel;
  vocab: Map<string, number>;
  labels: FieldType[];
}

let _pretrained: PretrainedState | null = null;
let _pretrainedLoadPromise: Promise<void> | null = null;

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
      if (isDebugEnabled()) {
        console.log(
          `[Fill All] Pre-trained model loaded — ${labelsRaw.length} classes, vocab ${_pretrained.vocab.size} n-grams`,
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
 * Discard any cached pre-trained state so the model is reloaded on the next call.
 * Called after user overrides (field-icon.ts) — kept as a no-op here because
 * user-saved rules are resolved by the rule-engine, not by the TF model.
 */
export function invalidateClassifier(): void {
  // no-op: user corrections are stored as rules, not baked into the TF model.
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
  if (!_pretrained) {
    console.warn(
      "[Fill All] ⚠️  Modelo não carregado ainda — usando html-fallback. Sinais:",
      signals,
    );
    return null;
  }

  const inputVec = vectorize(signals, _pretrained.vocab);
  if (!inputVec.some((v) => v > 0)) return null;

  const { bestIdx, bestScore } = tf.tidy(() => {
    const input = tf.tensor2d([Array.from(inputVec)]);
    const probs = (_pretrained!.model.predict(input) as tf.Tensor).dataSync();
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
