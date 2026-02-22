/**
 * Continuous-learning store for field classifications.
 *
 * Every time Chrome AI classifies a field (either as a fallback for "unknown"
 * or to refine a low-confidence TF.js result), the signal→type mapping is
 * persisted here. On next page load, these entries are loaded back into the
 * TF.js classifier so its prototype vectors shift toward real-world patterns.
 */

import type { FieldRule, FieldType } from "@/types";

export const LEARNED_STORAGE_KEY = "fill_all_learned_classifications";

/** Maximum number of entries to keep. Older entries are discarded first. */
const MAX_LEARNED_ENTRIES = 500;

export interface LearnedEntry {
  /** Normalised field signals used to produce the classification. */
  signals: string;
  type: FieldType;
  timestamp: number;
}

function normaliseSignals(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Persist a new signal→type mapping.
 * Deduplicates by `signals` string — if the same signal set was already
 * stored, its entry is updated (type + timestamp). Caps at MAX_LEARNED_ENTRIES.
 */
export async function storeLearnedEntry(
  signals: string,
  type: FieldType,
): Promise<void> {
  const normalized = normaliseSignals(signals);
  if (!normalized) return;
  const existing = await getLearnedEntries();
  const filtered = existing.filter((e) => e.signals !== normalized);
  filtered.push({ signals: normalized, type, timestamp: Date.now() });
  // Keep only the most recent MAX_LEARNED_ENTRIES
  const trimmed = filtered.slice(-MAX_LEARNED_ENTRIES);
  await chrome.storage.local.set({ [LEARNED_STORAGE_KEY]: trimmed });
}

/** Retrieve all stored learned entries. */
export async function getLearnedEntries(): Promise<LearnedEntry[]> {
  const result = await chrome.storage.local.get(LEARNED_STORAGE_KEY);
  return (result[LEARNED_STORAGE_KEY] as LearnedEntry[]) ?? [];
}

/** Remove all learned entries (full retrain from scratch). */
export async function clearLearnedEntries(): Promise<void> {
  await chrome.storage.local.remove(LEARNED_STORAGE_KEY);
}

/** Return the count of stored entries without loading all data. */
export async function getLearnedCount(): Promise<number> {
  return (await getLearnedEntries()).length;
}

/**
 * Builds synthetic classifier signals from a rule.
 * This allows the extension to learn from explicit user mappings.
 */
export function buildSignalsFromRule(rule: FieldRule): string {
  const selectorTokens = rule.fieldSelector
    .replace(/[#.[\]=:'"]/g, " ")
    .replace(/>/g, " ")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = [
    rule.fieldType,
    rule.fieldName,
    selectorTokens,
    rule.fieldSelector,
  ].filter(Boolean) as string[];

  return normaliseSignals(parts.join(" "));
}

/** Rebuild learned entries from the currently configured rules. */
export async function retrainLearnedFromRules(rules: FieldRule[]): Promise<number> {
  await clearLearnedEntries();

  let imported = 0;
  for (const rule of rules) {
    const signals = buildSignalsFromRule(rule);
    if (!signals) continue;
    await storeLearnedEntry(signals, rule.fieldType);
    imported += 1;
  }

  return imported;
}
