/**
 * Rules storage — CRUD operations for field rules.
 */

import type { FieldRule } from "@/types";
import type {
  MutableStorageRepository,
  UrlFilterableRepository,
} from "@/types/interfaces";
import { STORAGE_KEYS, getFromStorage, updateStorageAtomically } from "./core";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";

export async function getRules(): Promise<FieldRule[]> {
  return getFromStorage<FieldRule[]>(STORAGE_KEYS.RULES, []);
}

export async function saveRule(rule: FieldRule): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.RULES,
    [] as FieldRule[],
    (rules) => {
      const next = [...rules];
      const existingIndex = next.findIndex((r) => r.id === rule.id);

      if (existingIndex >= 0) {
        next[existingIndex] = { ...rule, updatedAt: Date.now() };
      } else {
        next.push({ ...rule, createdAt: Date.now(), updatedAt: Date.now() });
      }

      return next;
    },
  );
}

export async function deleteRule(ruleId: string): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.RULES,
    [] as FieldRule[],
    (rules) => rules.filter((r) => r.id !== ruleId),
  );
}

export async function getRulesForUrl(url: string): Promise<FieldRule[]> {
  const rules = await getRules();
  return rules
    .filter((rule) => matchUrlPattern(url, rule.urlPattern))
    .sort((a, b) => b.priority - a.priority);
}

/** Type-safe repository implementation for rules */
export const rulesRepository: MutableStorageRepository<FieldRule> &
  UrlFilterableRepository<FieldRule> = {
  getAll: getRules,
  save: saveRule,
  remove: deleteRule,
  getForUrl: getRulesForUrl,
};
