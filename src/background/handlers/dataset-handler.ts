/**
 * Dataset message handler — Dataset CRUD + Runtime Model management.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import {
  getDatasetEntries,
  addDatasetEntry,
  removeDatasetEntry,
  clearDataset,
  importDatasetEntries,
  exportDatasetEntries,
} from "@/lib/dataset/runtime-dataset";
import {
  storeLearnedEntry,
  clearLearnedEntries,
  removeLearnedEntryBySignals,
} from "@/lib/ai/learning-store";
import {
  hasRuntimeModel,
  getRuntimeModelMeta,
  deleteRuntimeModel,
} from "@/lib/ai/runtime-trainer";
import { parseStringPayload } from "@/lib/messaging/validators";
import { broadcastToAllTabs } from "@/background/broadcast";

const SUPPORTED: ReadonlyArray<MessageType> = [
  "GET_DATASET",
  "ADD_DATASET_ENTRY",
  "REMOVE_DATASET_ENTRY",
  "CLEAR_DATASET",
  "IMPORT_DATASET",
  "SEED_DATASET",
  "EXPORT_DATASET",
  "GET_RUNTIME_MODEL_META",
  "DELETE_RUNTIME_MODEL",
];

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_DATASET":
      return getDatasetEntries();

    case "ADD_DATASET_ENTRY": {
      const entry = message.payload as
        | Parameters<typeof addDatasetEntry>[0]
        | undefined;
      if (!entry?.signals || !entry?.type) {
        return { error: "Invalid payload for ADD_DATASET_ENTRY" };
      }
      const added = await addDatasetEntry(entry);
      if (!added) return { error: "Failed to add dataset entry" };
      await storeLearnedEntry(added.signals, added.type, undefined, "auto");
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return added;
    }

    case "REMOVE_DATASET_ENTRY": {
      const id = parseStringPayload(message.payload);
      if (!id) return { error: "Invalid payload for REMOVE_DATASET_ENTRY" };
      const allEntries = await getDatasetEntries();
      const entry = allEntries.find((e) => e.id === id);
      await removeDatasetEntry(id);
      if (entry) {
        await removeLearnedEntryBySignals(entry.signals);
        void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      }
      return { success: true };
    }

    case "CLEAR_DATASET":
      await clearDataset();
      await clearLearnedEntries();
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return { success: true };

    case "IMPORT_DATASET": {
      const entries = message.payload as
        | Parameters<typeof importDatasetEntries>[0]
        | undefined;
      if (!Array.isArray(entries))
        return { error: "Invalid payload for IMPORT_DATASET" };
      const addedCount = await importDatasetEntries(entries);
      if (addedCount > 0) {
        for (const e of entries) {
          if (e.signals && e.type) {
            await storeLearnedEntry(e.signals, e.type, undefined, "auto");
          }
        }
        void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      }
      return { success: true, added: addedCount };
    }

    case "SEED_DATASET": {
      const { TRAINING_SAMPLES_V2 } =
        await import("@/lib/dataset/training-data-v2");
      const { buildFeatureText } =
        await import("@/lib/shared/structured-signals");
      const seeds = TRAINING_SAMPLES_V2.map((sample) => ({
        signals: buildFeatureText(sample.signals, {
          category: sample.category,
          language: sample.language,
          domFeatures: sample.domFeatures,
        }),
        type: sample.type,
        source: "builtin" as const,
        difficulty: sample.difficulty,
      }));
      const addedCount = await importDatasetEntries(seeds);
      return { success: true, added: addedCount };
    }

    case "EXPORT_DATASET":
      return exportDatasetEntries();

    case "GET_RUNTIME_MODEL_META": {
      const meta = await getRuntimeModelMeta();
      const exists = await hasRuntimeModel();
      return { exists, meta };
    }

    case "DELETE_RUNTIME_MODEL":
      await deleteRuntimeModel();
      void broadcastToAllTabs({ type: "RELOAD_CLASSIFIER" });
      return { success: true };

    default:
      return { error: `Unhandled type in datasetHandler: ${message.type}` };
  }
}

export const datasetHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
