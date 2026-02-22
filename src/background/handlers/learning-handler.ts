/**
 * Learning message handler — GET_LEARNED_ENTRIES, CLEAR_LEARNED_ENTRIES, RETRAIN_LEARNING_DATABASE
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import {
  getLearnedEntries,
  clearLearnedEntries,
  retrainLearnedFromRules,
} from "@/lib/ai/learning-store";
import { getRules } from "@/lib/storage/rules-storage";
import { broadcastToAllTabs } from "@/background/broadcast";
import { createLogger } from "@/lib/logger";

const log = createLogger("LearningHandler");

const SUPPORTED: ReadonlyArray<MessageType> = [
  "GET_LEARNED_ENTRIES",
  "CLEAR_LEARNED_ENTRIES",
  "RETRAIN_LEARNING_DATABASE",
];

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_LEARNED_ENTRIES":
      return getLearnedEntries();

    case "CLEAR_LEARNED_ENTRIES":
      await clearLearnedEntries();
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return { success: true };

    case "RETRAIN_LEARNING_DATABASE": {
      const rules = await getRules();
      const result = await retrainLearnedFromRules(rules);
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      log.info(
        `RETRAIN_LEARNING_DATABASE concluído: ` +
          `imported=${result.imported}, skipped=${result.skipped}, ` +
          `totalRules=${result.totalRules}, durationMs=${result.durationMs}`,
      );
      return { success: true, ...result };
    }

    default:
      return { error: `Unhandled type in learningHandler: ${message.type}` };
  }
}

export const learningHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
