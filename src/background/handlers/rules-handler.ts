/**
 * Rules message handler — GET_RULES, SAVE_RULE, DELETE_RULE,
 * SAVE_FIELD_OVERRIDE, DELETE_FIELD_OVERRIDE
 * Syncs learning store when rules are created.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, FieldRule, MessageType } from "@/types";
import { getRules, saveRule, deleteRule } from "@/lib/storage/rules-storage";
import {
  buildSignalsFromRule,
  storeLearnedEntry,
} from "@/lib/ai/learning-store";
import { addDatasetEntry } from "@/lib/dataset/runtime-dataset";
import {
  parseRulePayload,
  parseStringPayload,
  parseSaveFieldOverridePayload,
  parseDeleteFieldOverridePayload,
} from "@/lib/messaging/validators";
import { broadcastToAllTabs } from "@/background/broadcast";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";

const SUPPORTED: ReadonlyArray<MessageType> = [
  "GET_RULES",
  "SAVE_RULE",
  "DELETE_RULE",
  "SAVE_FIELD_OVERRIDE",
  "DELETE_FIELD_OVERRIDE",
];

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_RULES":
      return getRules();

    case "SAVE_RULE": {
      const rule = parseRulePayload(message.payload);
      if (!rule) return { error: "Invalid payload for SAVE_RULE" };

      // Upsert by selector + URL pattern: if a rule already exists for the same
      // fieldSelector and matching URL pattern, re-use its ID so it gets updated
      // instead of creating a duplicate with a different ID.
      const allRules = await getRules();
      const existing = allRules.find(
        (r) =>
          r.fieldSelector === rule.fieldSelector &&
          r.urlPattern === rule.urlPattern,
      );
      const ruleToSave = existing
        ? { ...rule, id: existing.id, createdAt: existing.createdAt }
        : rule;

      await saveRule(ruleToSave);
      const signals = buildSignalsFromRule(ruleToSave);
      if (signals) {
        await storeLearnedEntry(
          signals,
          ruleToSave.fieldType,
          undefined,
          "rule",
        );
        await addDatasetEntry({
          signals,
          type: ruleToSave.fieldType,
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

    case "SAVE_FIELD_OVERRIDE": {
      const p = parseSaveFieldOverridePayload(message.payload);
      if (!p) return { error: "Invalid payload for SAVE_FIELD_OVERRIDE" };

      // Derive a hostname-level URL pattern so the rule applies to all pages
      // on the same domain (e.g. *://example.com/*)
      let urlPattern = "*";
      try {
        const parsed = new URL(p.url);
        urlPattern = `${parsed.protocol}//${parsed.hostname}/*`;
      } catch {
        // Fallback: use the raw URL as pattern
        urlPattern = p.url;
      }

      // Find existing rule for same URL pattern + fieldSelector
      const allRules = await getRules();
      const existing = allRules.find(
        (r) =>
          r.fieldSelector === p.fieldSelector &&
          matchUrlPattern(p.url, r.urlPattern),
      );

      const now = Date.now();
      const rule: FieldRule = {
        id: existing?.id ?? crypto.randomUUID(),
        urlPattern,
        fieldSelector: p.fieldSelector,
        fieldName: p.fieldName,
        fieldType: p.fieldType,
        generator: p.generator,
        fixedValue: p.fixedValue,
        aiPrompt: p.aiPrompt,
        generatorParams: p.generatorParams,
        selectOptionIndex: p.selectOptionIndex,
        priority: 100,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

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
      return { success: true, rule };
    }

    case "DELETE_FIELD_OVERRIDE": {
      const p = parseDeleteFieldOverridePayload(message.payload);
      if (!p) return { error: "Invalid payload for DELETE_FIELD_OVERRIDE" };

      const allRules = await getRules();
      const match = allRules.find(
        (r) =>
          r.fieldSelector === p.fieldSelector &&
          matchUrlPattern(p.url, r.urlPattern),
      );
      if (!match) return { success: true }; // no rule to delete

      await deleteRule(match.id);
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
