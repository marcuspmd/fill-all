/**
 * Runtime Model Trainer
 *
 * Trains a TF.js MLP classifier from user-curated dataset entries entirely
 * inside the browser (options page). The trained model is serialised and
 * stored in chrome.storage.local so it can be loaded by the content script
 * on any page.
 *
 * Architecture mirrors the offline train-model.ts script so the bundled
 * model and the runtime-trained model are interchangeable.
 *
 *   signals → Dense(256, relu) → Dropout(0.3)
 *           → Dense(128, relu) → Dropout(0.2)
 *           → Dense(NUM_CLASSES, softmax)
 *
 * Storage layout (chrome.storage.local):
 *   fill_all_runtime_model   — { topology, weightSpecs, weightDataB64 }
 *   fill_all_runtime_vocab   — { [ngram]: index }
 *   fill_all_runtime_labels  — string[]   (ordered FieldType array)
 *   fill_all_runtime_meta    — { trainedAt, epochs, loss, accuracy, vocabSize, numClasses }
 */

import type { FieldType } from "@/types";
import type { DatasetEntry } from "@/lib/dataset/runtime-dataset";
import type { LayersModel, Tensor } from "@tensorflow/tfjs";

// ── Keys ────────────────────────────────────────────────────────────────────

export const RUNTIME_MODEL_KEY = "fill_all_runtime_model";
export const RUNTIME_VOCAB_KEY = "fill_all_runtime_vocab";
export const RUNTIME_LABELS_KEY = "fill_all_runtime_labels";
export const RUNTIME_META_KEY = "fill_all_runtime_meta";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TrainingProgress {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
}

export interface TrainingMeta {
  trainedAt: number;
  epochs: number;
  finalLoss: number;
  finalAccuracy: number;
  vocabSize: number;
  numClasses: number;
  entriesUsed: number;
  durationMs: number;
}

export interface TrainingResult extends TrainingMeta {
  success: boolean;
  error?: string;
}

export interface StoredModelArtifacts {
  topology: unknown;
  weightSpecs: unknown[];
  weightDataB64: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NGRAM_SIZE = 3;
const EPOCHS = 80;
const BATCH_SIZE = 32;
const PATIENCE = 20;

// All trainable FieldType labels (must match train-model.ts)
const LABELS: FieldType[] = [
  "cpf",
  "cnpj",
  "cpf-cnpj",
  "rg",
  "email",
  "phone",
  "name",
  "first-name",
  "last-name",
  "full-name",
  "address",
  "street",
  "city",
  "state",
  "cep",
  "zip-code",
  "date",
  "birth-date",
  "password",
  "username",
  "company",
  "website",
  "product",
  "supplier",
  "employee-count",
  "job-title",
  "money",
  "number",
  "text",
];

const LABEL_SET = new Set<string>(LABELS);

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function buildVocab(texts: string[]): Map<string, number> {
  const vocab = new Map<string, number>();
  for (const text of texts) {
    for (const ng of charNgrams(text)) {
      if (!vocab.has(ng)) vocab.set(ng, vocab.size);
    }
  }
  return vocab;
}

function vectorize(text: string, vocab: Map<string, number>): Float32Array {
  const v = new Float32Array(vocab.size);
  for (const ng of charNgrams(text)) {
    const idx = vocab.get(ng);
    if (idx !== undefined) v[idx] += 1;
  }
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// ── Model persistence ─────────────────────────────────────────────────────────

async function saveModelToStorage(
  model: LayersModel,
  vocab: Map<string, number>,
  labels: FieldType[],
  meta: TrainingMeta,
): Promise<void> {
  // Custom IO handler: saves model artifacts to chrome.storage.local
  const tf = await import("@tensorflow/tfjs");
  const storageHandler: import("@tensorflow/tfjs").io.IOHandler = {
    save: async (artifacts) => {
      const weightData = artifacts.weightData as ArrayBuffer;
      const stored: StoredModelArtifacts = {
        topology: artifacts.modelTopology,
        weightSpecs: (artifacts.weightSpecs ?? []) as unknown[],
        weightDataB64: arrayBufferToBase64(weightData),
      };
      const vocabObj = Object.fromEntries(vocab);
      await chrome.storage.local.set({
        [RUNTIME_MODEL_KEY]: stored,
        [RUNTIME_VOCAB_KEY]: vocabObj,
        [RUNTIME_LABELS_KEY]: labels,
        [RUNTIME_META_KEY]: meta,
      });
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON" as const,
          weightDataBytes: weightData.byteLength,
        },
      };
    },
  };

  await model.save(storageHandler);
}

/**
 * Loads the runtime-trained model from chrome.storage.local.
 * Returns null if no runtime model has been trained yet.
 */
export async function loadRuntimeModel(): Promise<{
  model: LayersModel;
  vocab: Map<string, number>;
  labels: FieldType[];
} | null> {
  const result = await chrome.storage.local.get([
    RUNTIME_MODEL_KEY,
    RUNTIME_VOCAB_KEY,
    RUNTIME_LABELS_KEY,
  ]);

  const stored = result[RUNTIME_MODEL_KEY] as StoredModelArtifacts | undefined;
  const vocabObj = result[RUNTIME_VOCAB_KEY] as
    | Record<string, number>
    | undefined;
  const labelsArr = result[RUNTIME_LABELS_KEY] as string[] | undefined;

  if (!stored || !vocabObj || !labelsArr) return null;

  try {
    const tf = await import("@tensorflow/tfjs");
    const loadHandler: import("@tensorflow/tfjs").io.IOHandler = {
      load: async () => ({
        modelTopology: stored.topology as {},
        weightSpecs:
          stored.weightSpecs as import("@tensorflow/tfjs").io.WeightsManifestEntry[],
        weightData: base64ToArrayBuffer(stored.weightDataB64),
        format: "layers-model",
      }),
    };
    const model = await tf.loadLayersModel(loadHandler);
    const vocab = new Map(Object.entries(vocabObj));
    return { model, vocab, labels: labelsArr as FieldType[] };
  } catch (err) {
    console.warn("[RuntimeTrainer] Falha ao carregar modelo do storage:", err);
    return null;
  }
}

/** Returns true if a runtime-trained model exists in storage. */
export async function hasRuntimeModel(): Promise<boolean> {
  const result = await chrome.storage.local.get(RUNTIME_MODEL_KEY);
  return !!result[RUNTIME_MODEL_KEY];
}

/** Returns the training metadata for the stored model, or null. */
export async function getRuntimeModelMeta(): Promise<TrainingMeta | null> {
  const result = await chrome.storage.local.get(RUNTIME_META_KEY);
  return (result[RUNTIME_META_KEY] as TrainingMeta) ?? null;
}

/** Deletes the runtime-trained model from storage. */
export async function deleteRuntimeModel(): Promise<void> {
  await chrome.storage.local.remove([
    RUNTIME_MODEL_KEY,
    RUNTIME_VOCAB_KEY,
    RUNTIME_LABELS_KEY,
    RUNTIME_META_KEY,
  ]);
}

// ── Trainer ──────────────────────────────────────────────────────────────────

/**
 * Trains a MLP classifier from the provided dataset entries, stores the
 * resulting model in chrome.storage.local and returns training metrics.
 *
 * Must be called from an extension page (options/popup) — NOT from a content
 * script, because TF.js WebGL backend requires a live DOM context.
 *
 * @param entries  Dataset entries to train on.
 * @param onProgress  Optional callback invoked after every epoch.
 */
export async function trainModelFromDataset(
  entries: DatasetEntry[],
  onProgress?: (p: TrainingProgress) => void,
): Promise<TrainingResult> {
  const t0 = Date.now();

  // Filter to supported labels only
  const samples = entries.filter((e) => LABEL_SET.has(e.type));
  if (samples.length < 10) {
    return {
      success: false,
      error: `Dataset muito pequeno (${samples.length} amostras válidas). Mínimo: 10.`,
      trainedAt: Date.now(),
      epochs: 0,
      finalLoss: 0,
      finalAccuracy: 0,
      vocabSize: 0,
      numClasses: 0,
      entriesUsed: 0,
      durationMs: 0,
    };
  }

  // Determine labels actually present in this dataset
  const presentLabels = LABELS.filter((l) => samples.some((s) => s.type === l));
  const labelToIdx = Object.fromEntries(presentLabels.map((l, i) => [l, i]));
  const numClasses = presentLabels.length;

  if (numClasses < 2) {
    return {
      success: false,
      error: `O dataset precisa ter pelo menos 2 tipos de campo diferentes para treinar. Encontrado: ${numClasses} tipo (${presentLabels[0] ?? "nenhum"}). Adicione amostras de outros tipos ou importe o dataset padrão.`,
      trainedAt: Date.now(),
      epochs: 0,
      finalLoss: 0,
      finalAccuracy: 0,
      vocabSize: 0,
      numClasses,
      entriesUsed: samples.length,
      durationMs: 0,
    };
  }

  // Build vocab from all signals
  const allSignals = samples.map((s) => s.signals);
  const vocab = buildVocab(allSignals);
  const vocabSize = vocab.size;

  // Vectorise
  const X = samples.map((s) => Array.from(vectorize(s.signals, vocab)));
  const Y = samples.map((s) => {
    const oneHot = new Array<number>(numClasses).fill(0);
    oneHot[labelToIdx[s.type]] = 1;
    return oneHot;
  });

  const tf = await import("@tensorflow/tfjs");
  await tf.ready();

  const xTensor = tf.tensor2d(X, [X.length, vocabSize]);
  const yTensor = tf.tensor2d(Y, [Y.length, numClasses]);

  // Model architecture (mirrors train-model.ts)
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [vocabSize],
        units: 256,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 }),
      }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({
        units: 128,
        activation: "relu",
        kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 }),
      }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: numClasses, activation: "softmax" }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  // Early stopping with best-weights checkpoint
  let bestAcc = -1;
  let patience = 0;
  const bestWeights: Tensor[] = [];

  let finalLoss = 0;
  let finalAccuracy = 0;
  let lastEpoch = 0;

  const onEpochEnd = async (epoch: number, logs?: Record<string, number>) => {
    const acc = logs?.["acc"] ?? logs?.["accuracy"] ?? 0;
    const loss = logs?.["loss"] ?? 0;

    lastEpoch = epoch + 1;
    finalLoss = loss;
    finalAccuracy = acc;

    if (acc > bestAcc) {
      bestAcc = acc;
      patience = 0;
      while (bestWeights.length) bestWeights.pop()!.dispose();
      model.getWeights().forEach((w) => bestWeights.push(w.clone()));
    } else {
      patience++;
      if (patience >= PATIENCE) model.stopTraining = true;
    }

    onProgress?.({
      epoch: epoch + 1,
      totalEpochs: EPOCHS,
      loss,
      accuracy: acc,
    });
  };

  try {
    await model.fit(xTensor, yTensor, {
      epochs: EPOCHS,
      batchSize: BATCH_SIZE,
      shuffle: true,
      callbacks: [new tf.CustomCallback({ onEpochEnd })],
    });

    // Restore best weights
    if (bestWeights.length > 0) {
      model.setWeights(bestWeights);
      while (bestWeights.length) bestWeights.pop()!.dispose();
    }

    xTensor.dispose();
    yTensor.dispose();

    const meta: TrainingMeta = {
      trainedAt: Date.now(),
      epochs: lastEpoch,
      finalLoss,
      finalAccuracy: bestAcc >= 0 ? bestAcc : finalAccuracy,
      vocabSize,
      numClasses,
      entriesUsed: samples.length,
      durationMs: Date.now() - t0,
    };

    await saveModelToStorage(model, vocab, presentLabels, meta);
    model.dispose();

    return { success: true, ...meta };
  } catch (err) {
    xTensor.dispose();
    yTensor.dispose();
    model.dispose();
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      trainedAt: Date.now(),
      epochs: lastEpoch,
      finalLoss,
      finalAccuracy,
      vocabSize,
      numClasses,
      entriesUsed: samples.length,
      durationMs: Date.now() - t0,
    };
  }
}
