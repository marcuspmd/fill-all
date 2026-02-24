/**
 * Rules message handler — GET_RULES, SAVE_RULE, DELETE_RULE
 * Syncs learning store when rules are created.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import { getRules, saveRule, deleteRule } from "@/lib/storage/rules-storage";
import {
  buildSignalsFromRule,
  storeLearnedEntry,
} from "@/lib/ai/learning-store";
import { addDatasetEntry } from "@/lib/dataset/runtime-dataset";
import {
  parseRulePayload,
  parseStringPayload,
} from "@/lib/messaging/validators";
import { broadcastToAllTabs } from "@/background/broadcast";

const SUPPORTED: ReadonlyArray<MessageType> = [
  "GET_RULES",
  "SAVE_RULE",
  "DELETE_RULE",
];

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_RULES":
      return getRules();

    case "SAVE_RULE": {
      const rule = parseRulePayload(message.payload);
      if (!rule) return { error: "Invalid payload for SAVE_RULE" };
      await saveRule(rule);
      const signals = buildSignalsFromRule(rule);
      if (signals) {
        await storeLearnedEntry(signals, rule.fieldType, undefined, "rule");
        await addDatasetEntry({
          signals,
          type: rule.fieldType,
          source: "manual",
          difficulty: "easy",
        });
      }
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return { success: true };
    }

    case "DELETE_RULE": {
      const ruleId = parseStringPayload(message.payload);
      if (!ruleId) return { error: "Invalid payload for DELETE_RULE" };
      await deleteRule(ruleId);
      return { success: true };
    }

    default:
      return { error: `Unhandled type in rulesHandler: ${message.type}` };
  }
}

export const rulesHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
