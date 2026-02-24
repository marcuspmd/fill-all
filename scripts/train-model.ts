/// <reference types="node" />
/**
 * Training script — trains a TF.js MLP classifier from the dataset and saves
 * the model artefacts to public/model/ so the Chrome extension can load them.
 *
 * Usage:
 *   npm run train:model
 *
 * Output (public/model/):
 *   model.json              — TF.js model architecture + weight manifest
 *   group1-shard1of1.bin    — serialised weights
 *   vocab.json              — character tri-gram → index mapping
 *   labels.json             — ordered array of FieldType labels
 *
 * The files are included in the extension build via the public/ directory.
 * In the extension, load with:
 *   tf.loadLayersModel(chrome.runtime.getURL('model/model.json'))
 */

import * as tf from "@tensorflow/tfjs";
import * as fs from "fs";
import * as path from "path";

// Dataset imports — tsx resolves "@/*" aliases via tsconfig.json paths
import { TRAINING_SAMPLES } from "../src/lib/dataset/training-data";
import { VALIDATION_SAMPLES } from "../src/lib/dataset/validation-data";
import { TRAINABLE_FIELD_TYPES } from "../src/types";
import {
  buildFeatureText,
  fromFlatSignals,
  inferCategoryFromType,
  inferLanguageFromSignals,
} from "../src/lib/shared/structured-signals";

// ── Constants ────────────────────────────────────────────────────────────────

const NGRAM_SIZE = 3;
const OUTPUT_DIR = path.resolve(process.cwd(), "public/model");

/**
 * Labels available for classification.
 * Includes all field types defined in TRAINABLE_FIELD_TYPES — including
 * structural types (select/checkbox/radio/file/unknown) which also carry
 * relevant text signals (e.g. "upload", "choose", "agree to terms").
 */
const LABELS = [...TRAINABLE_FIELD_TYPES] as const;

type Label = (typeof LABELS)[number];

const LABEL_TO_IDX = Object.fromEntries(LABELS.map((l, i) => [l, i])) as Record<
  Label,
  number
>;

const NUM_CLASSES = LABELS.length;
const LABEL_SET = new Set<string>(LABELS);

// ── Character n-gram helpers ─────────────────────────────────────────────────

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
  // L2 normalise so magnitude differences don't dominate similarity
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

// ── File-system IO handler ───────────────────────────────────────────────────
// @tensorflow/tfjs-node provides tf.io.fileSystem() but causes version
// conflicts. We implement a minimal custom handler to write model artefacts.

function fileSystemSaveHandler(outputDir: string): tf.io.IOHandler {
  return {
    save: async (artifacts: tf.io.ModelArtifacts) => {
      fs.mkdirSync(outputDir, { recursive: true });

      const weightsManifest: tf.io.WeightsManifestConfig = [
        {
          paths: ["group1-shard1of1.bin"],
          weights: artifacts.weightSpecs ?? [],
        },
      ];

      const modelJson = {
        format: "layers-model",
        generatedBy: "fill-all train-model",
        convertedBy: null,
        modelTopology: artifacts.modelTopology,
        weightsManifest,
      };

      fs.writeFileSync(
        path.join(outputDir, "model.json"),
        JSON.stringify(modelJson),
      );

      const weightData = artifacts.weightData as ArrayBuffer;
      fs.writeFileSync(
        path.join(outputDir, "group1-shard1of1.bin"),
        Buffer.from(weightData),
      );

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON" as const,
          weightDataBytes: weightData.byteLength,
        },
      };
    },
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // tfjs-node requires util.isNullOrUndefined which was removed in Node ≥ 22.
  // Fall back to pure JS CPU backend until tfjs-node publishes a fix.
  await tf.setBackend("cpu");
  await tf.ready();
  console.log(`[TF.js] Backend: ${tf.getBackend()}\n`);
  // Filter to trainable types only
  const trainSamples = TRAINING_SAMPLES.filter((s) =>
    LABEL_SET.has(s.type),
  ) as Array<(typeof TRAINING_SAMPLES)[number] & { type: Label }>;

  const valSamples = VALIDATION_SAMPLES.filter((s) =>
    LABEL_SET.has(s.expectedType),
  ) as Array<(typeof VALIDATION_SAMPLES)[number] & { expectedType: Label }>;

  console.log(`\n📊 Dataset`);
  console.log(`   Training samples : ${trainSamples.length}`);
  console.log(`   Validation samples: ${valSamples.length}`);
  console.log(`   Classes          : ${NUM_CLASSES}`);

  // Distribution overview
  const dist: Record<string, number> = {};
  for (const s of trainSamples) dist[s.type] = (dist[s.type] ?? 0) + 1;
  const minCount = Math.min(...Object.values(dist));
  const maxCount = Math.max(...Object.values(dist));
  console.log(
    `   Samples/class    : min=${minCount}, max=${maxCount} (good balance ≥ 5)`,
  );

  // Build vocabulary from structured feature text only (prevents test leakage)
  const trainFeatureText = trainSamples.map((sample) =>
    buildFeatureText(sample.signals, {
      category: sample.category,
      language: sample.language,
      domFeatures: sample.domFeatures,
    }),
  );
  const vocab = buildVocab(trainFeatureText);
  const vocabSize = vocab.size;
  console.log(`\n🔤 Vocabulary size: ${vocabSize} tri-grams`);

  // Vectorise
  const trainX = trainFeatureText.map((featureText) =>
    Array.from(vectorize(featureText, vocab)),
  );
  const trainY = trainSamples.map((s) => {
    const oneHot = new Array<number>(NUM_CLASSES).fill(0);
    oneHot[LABEL_TO_IDX[s.type as Label]] = 1;
    return oneHot;
  });

  const valFeatureText = valSamples.map((sample) =>
    buildFeatureText(fromFlatSignals(sample.signals), {
      category: inferCategoryFromType(sample.expectedType),
      language: inferLanguageFromSignals(sample.signals),
    }),
  );

  const valX = valFeatureText.map((featureText) =>
    Array.from(vectorize(featureText, vocab)),
  );
  const valY = valSamples.map((s) => {
    const oneHot = new Array<number>(NUM_CLASSES).fill(0);
    oneHot[LABEL_TO_IDX[s.expectedType as Label]] = 1;
    return oneHot;
  });

  const xTrain = tf.tensor2d(trainX, [trainX.length, vocabSize]);
  const yTrain = tf.tensor2d(trainY, [trainY.length, NUM_CLASSES]);
  const xVal = tf.tensor2d(valX, [valX.length, vocabSize]);
  const yVal = tf.tensor2d(valY, [valY.length, NUM_CLASSES]);

  // Build model — small MLP suitable for Chrome extension inference
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
      tf.layers.dense({ units: NUM_CLASSES, activation: "softmax" }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  model.summary();

  console.log("\n🏋️  Training...\n");

  // Manual best-weights checkpoint (restoreBestWeights not implemented in TF.js)
  let bestValAcc = -1;
  const bestWeights: tf.Tensor[] = [];
  let patienceCounter = 0;
  const PATIENCE = 20;

  const checkpointCallback: tf.CustomCallbackArgs = {
    onEpochEnd: async (_epoch, logs) => {
      const valAcc = logs?.["val_acc"] ?? logs?.["val_accuracy"] ?? 0;
      if (valAcc > bestValAcc) {
        bestValAcc = valAcc;
        patienceCounter = 0;
        // Discard previous checkpoint and clone current weights
        while (bestWeights.length) bestWeights.pop()!.dispose();
        model.getWeights().forEach((w) => bestWeights.push(w.clone()));
      } else {
        patienceCounter++;
        if (patienceCounter >= PATIENCE) {
          model.stopTraining = true;
        }
      }
    },
  };

  await model.fit(xTrain, yTrain, {
    epochs: 150,
    batchSize: 32,
    shuffle: true,
    validationData: [xVal, yVal],
    callbacks: [new tf.CustomCallback(checkpointCallback)],
    verbose: 1,
  });

  // Restore best weights
  if (bestWeights.length > 0) {
    model.setWeights(bestWeights);
    while (bestWeights.length) bestWeights.pop()!.dispose();
    console.log(
      `\n♻️  Restored best weights (val_acc: ${(bestValAcc * 100).toFixed(2)}%)`,
    );
  }

  // Final evaluation
  const evalResult = model.evaluate(xVal, yVal, { verbose: 0 });
  const evalArr = Array.isArray(evalResult) ? evalResult : [evalResult];
  const valLoss = (evalArr[0] as tf.Scalar).dataSync()[0];
  const valAcc = (evalArr[1] as tf.Scalar).dataSync()[0];
  console.log(
    `\n✅ Final validation — loss: ${valLoss.toFixed(4)}, accuracy: ${(valAcc * 100).toFixed(2)}%`,
  );

  // Per-class accuracy on validation set
  console.log("\n📋 Per-class accuracy:");
  const predictions = (model.predict(xVal) as tf.Tensor).dataSync();
  const actuals = yVal.dataSync();
  const classCorrect = new Array<number>(NUM_CLASSES).fill(0);
  const classTotal = new Array<number>(NUM_CLASSES).fill(0);
  for (let i = 0; i < valSamples.length; i++) {
    const trueIdx = valSamples[i]
      ? LABEL_TO_IDX[valSamples[i].expectedType as Label]
      : -1;
    if (trueIdx === -1) continue;
    classTotal[trueIdx]++;
    // Find predicted class
    let maxProb = -1;
    let predIdx = 0;
    for (let c = 0; c < NUM_CLASSES; c++) {
      if (predictions[i * NUM_CLASSES + c] > maxProb) {
        maxProb = predictions[i * NUM_CLASSES + c];
        predIdx = c;
      }
    }
    if (predIdx === trueIdx) classCorrect[trueIdx]++;
  }
  for (let c = 0; c < NUM_CLASSES; c++) {
    if (classTotal[c] === 0) continue;
    const acc = ((classCorrect[c] / classTotal[c]) * 100).toFixed(0);
    const bar = "█".repeat(Math.round((classCorrect[c] / classTotal[c]) * 10));
    console.log(
      `   ${LABELS[c].padEnd(12)} ${acc.padStart(3)}%  ${bar}  (${classCorrect[c]}/${classTotal[c]})`,
    );
  }

  // Confusion matrix — shows what each class gets misclassified as
  console.log("\n🔀 Misclassifications (true → predicted):");
  const confusion = Array.from({ length: NUM_CLASSES }, () =>
    new Array<number>(NUM_CLASSES).fill(0),
  );
  for (let i = 0; i < valSamples.length; i++) {
    const trueIdx = valSamples[i]
      ? LABEL_TO_IDX[valSamples[i].expectedType as Label]
      : -1;
    if (trueIdx === -1) continue;
    let maxProb = -1;
    let predIdx = 0;
    for (let c = 0; c < NUM_CLASSES; c++) {
      if (predictions[i * NUM_CLASSES + c] > maxProb) {
        maxProb = predictions[i * NUM_CLASSES + c];
        predIdx = c;
      }
    }
    confusion[trueIdx][predIdx]++;
  }
  for (let c = 0; c < NUM_CLASSES; c++) {
    if (classTotal[c] === 0) continue;
    const misses: string[] = [];
    for (let p = 0; p < NUM_CLASSES; p++) {
      if (p !== c && confusion[c][p] > 0) {
        misses.push(`${LABELS[p]}(${confusion[c][p]})`);
      }
    }
    if (misses.length > 0) {
      console.log(`   ${LABELS[c].padEnd(12)} → ${misses.join(", ")}`);
    }
  }

  // Save model artefacts via custom file system handler
  await model.save(fileSystemSaveHandler(OUTPUT_DIR));

  // Save vocabulary as {ngram: index}
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "vocab.json"),
    JSON.stringify(Object.fromEntries(vocab)),
  );

  // Save ordered label array
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "labels.json"),
    JSON.stringify([...LABELS]),
  );

  console.log(`\n💾 Model saved to ${OUTPUT_DIR}/`);
  console.log("   model.json");
  console.log("   group1-shard1of1.bin");
  console.log("   vocab.json");
  console.log("   labels.json");
  console.log(
    "\n🚀 Run `npm run build` to include the model in the extension build.\n",
  );

  // Cleanup tensors
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
}

main().catch((err) => {
  console.error("Training failed:", err);
  process.exit(1);
});
