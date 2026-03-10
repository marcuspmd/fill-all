/**
 * Classifier Model Handler — background-resident TensorFlow model management
 *
 * Persistence optimization: keeps the pre-trained TensorFlow model in the
 * service worker's memory (not content script) to avoid reload on page navigation.
 *
 * Content scripts request the model via GET_PRETRAINED_MODEL and load it into
 * their local TensorFlow state, but the background retains the source artifacts
 * for quick re-distribution.
 *
 * Flow:
 *   1. Background loads model once (on first GET_PRETRAINED_MODEL)
 *   2. Stringify model artifacts (JSON-serializable parts)
 *   3. Send to content script
 *   4. Content script reconstructs in local TF.js state
 *   5. Future reloads: skip fetch, use cached background state
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import { createLogger } from "@/lib/logger";
import type { FieldType } from "@/types";

const log = createLogger("ClassifierModelHandler");

const SUPPORTED: ReadonlyArray<MessageType> = ["GET_PRETRAINED_MODEL"];

// ── Background-resident model state (persists across content script reloads) ──

interface CachedModelArtifacts {
  labels: FieldType[];
  vocab: Record<string, number>;
  // Note: model weights (_pretrained.model) are NOT serializable — only kept in TF.js
  // Content script must load via tf.loadLayersModel() separately
}

let _cachedArtifacts: CachedModelArtifacts | null = null;
let _artifactsLoadPromise: Promise<CachedModelArtifacts | null> | null = null;

// ── Load model artifacts (non-blocking, deduped) ──────────────────────────────

/**
 * Loads model metadata (labels, vocab) from bundled files.
 * Only called once — subsequent calls return cached state.
 */
async function loadModelArtifacts(): Promise<CachedModelArtifacts | null> {
  if (_cachedArtifacts) return _cachedArtifacts;
  if (_artifactsLoadPromise) return _artifactsLoadPromise;

  _artifactsLoadPromise = (async () => {
    try {
      const base = chrome.runtime.getURL("");
      const [vocabRaw, labelsRaw] = await Promise.all([
        fetch(`${base}model/vocab.json`).then(
          (r) => r.json() as Promise<Record<string, number>>,
        ),
        fetch(`${base}model/labels.json`).then(
          (r) => r.json() as Promise<string[]>,
        ),
      ]);

      if (vocabRaw && labelsRaw && labelsRaw.length > 0) {
        _cachedArtifacts = {
          labels: labelsRaw as FieldType[],
          vocab: vocabRaw,
        };
        log.info(
          `Model artifacts loaded (background): ${labelsRaw.length} labels, ${Object.keys(vocabRaw).length} vocab entries`,
        );
      } else {
        log.warn("Model artifacts incomplete or invalid");
      }
    } catch (err) {
      log.error("Failed to load model artifacts in background", err);
    }
    return _cachedArtifacts;
  })();

  return _artifactsLoadPromise;
}

// ── Message handler ────────────────────────────────────────────────────────────

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_PRETRAINED_MODEL": {
      const artifacts = await loadModelArtifacts();
      if (!artifacts) {
        log.warn("Model artifacts not available");
        return null;
      }
      // ✅ Return serializable artifacts; content script loads model.json separately
      return {
        labels: artifacts.labels,
        vocab: artifacts.vocab,
        modelUrl: `${chrome.runtime.getURL("")}model/model.json`,
      };
    }

    default:
      return {
        error: `Unhandled type in classifierModelHandler: ${message.type}`,
      };
  }
}

export const classifierModelHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
