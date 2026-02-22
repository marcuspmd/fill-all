/**
 * Continuous-learning store for field classifications.
 *
 * Every time Chrome AI classifies a field (either as a fallback for "unknown"
 * or to refine a low-confidence TF.js result), the signal→type mapping is
 * persisted here. On next page load, these entries are loaded back into the
 * TF.js classifier so its prototype vectors shift toward real-world patterns.
 */

import type { FieldRule, FieldType } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("LearningStore");

export const LEARNED_STORAGE_KEY = "fill_all_learned_classifications";

/** Maximum number of entries to keep. Older entries are discarded first. */
const MAX_LEARNED_ENTRIES = 500;

export interface LearnedEntry {
  /** Normalised field signals used to produce the classification. */
  signals: string;
  type: FieldType;
  /**
   * Which generator the AI recommended for this field type.
   * Defaults to `type` when not provided (backward-compatible).
   */
  generatorType?: FieldType;
  timestamp: number;
  /**
   * Origin of this entry:
   * - "auto" → learned organicallule" → imported/rebuilt fy during real-use (Chrome AI / TF.js feedback)
   * - "rrom a configured FieldRule during retrain
   * Defaults to "auto" when absent (backward-compatible).
   */
  source?: "auto" | "rule";
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
 *
 * @param generatorType - Optional explicit generator type recommended by the AI.
 *   Defaults to `type` when omitted.
 * @param source - Origin of the entry: "auto" (organic) or "rule" (from retrain).
 *   Defaults to "auto".
 */
export async function storeLearnedEntry(
  signals: string,
  type: FieldType,
  generatorType?: FieldType,
  source: "auto" | "rule" = "auto",
): Promise<void> {
  const normalized = normaliseSignals(signals);
  if (!normalized) return;
  const existing = await getLearnedEntries();
  const filtered = existing.filter((e) => e.signals !== normalized);
  filtered.push({
    signals: normalized,
    type,
    generatorType: generatorType ?? type,
    timestamp: Date.now(),
    source,
  });
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

/**
 * Remove a single learned entry by its normalised signals string.
 * No-op if no matching entry exists. Used to keep the learning store in sync
 * when a dataset entry is deleted.
 */
export async function removeLearnedEntryBySignals(
  signals: string,
): Promise<void> {
  const normalized = normaliseSignals(signals);
  if (!normalized) return;
  const existing = await getLearnedEntries();
  const filtered = existing.filter((e) => e.signals !== normalized);
  if (filtered.length !== existing.length) {
    await chrome.storage.local.set({ [LEARNED_STORAGE_KEY]: filtered });
  }
}

/** Remove only entries that were imported from rules (source === "rule"), preserving organic entries. */
export async function clearRuleDerivedEntries(): Promise<void> {
  const existing = await getLearnedEntries();
  const autoOnly = existing.filter((e) => (e.source ?? "auto") !== "rule");
  await chrome.storage.local.set({ [LEARNED_STORAGE_KEY]: autoOnly });
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

export interface RetrainDetail {
  ruleId: string;
  selector: string;
  type: string;
  signals: string;
  status: "imported" | "skipped";
}

export interface RetrainResult {
  imported: number;
  skipped: number;
  totalRules: number;
  durationMs: number;
  details: RetrainDetail[];
}

/** Rebuild learned entries from the currently configured rules. */
export async function retrainLearnedFromRules(
  rules: FieldRule[],
): Promise<RetrainResult> {
  const t0 = Date.now();

  log.info(`Iniciando retreino: ${rules.length} regra(s) encontrada(s).`);

  const prevCount = await getLearnedCount();
  log.debug(`Entradas aprendidas antes do retreino: ${prevCount}`);

  // Only remove rule-derived entries; organic (auto) entries are preserved.
  await clearRuleDerivedEntries();
  log.debug(
    "Entradas de regras anteriores removidas do storage (entradas orgânicas preservadas).",
  );

  let imported = 0;
  let skipped = 0;
  const details: RetrainDetail[] = [];

  for (const rule of rules) {
    const signals = buildSignalsFromRule(rule);
    if (!signals) {
      log.warn(
        `Regra ignorada (sem signals): id=${rule.id} selector=${rule.fieldSelector}`,
      );
      details.push({
        ruleId: rule.id,
        selector: rule.fieldSelector,
        type: rule.fieldType,
        signals: "",
        status: "skipped",
      });
      skipped += 1;
      continue;
    }

    await storeLearnedEntry(signals, rule.fieldType, undefined, "rule");
    details.push({
      ruleId: rule.id,
      selector: rule.fieldSelector,
      type: rule.fieldType,
      signals,
      status: "imported",
    });
    imported += 1;
    log.debug(
      `  ✔ ${rule.fieldType.padEnd(12)} ← "${signals.slice(0, 80)}" (${rule.fieldSelector})`,
    );
  }

  const durationMs = Date.now() - t0;

  log.info(
    `Retreino finalizado em ${durationMs}ms. ` +
      `Importadas: ${imported}, Ignoradas: ${skipped}`,
  );
  log.debug(
    "NOTA: este retreino atualiza apenas os vetores de " +
      +"aprendizado (cosine similarity). Os pesos da rede neural TF.js NÃO " +
      "são alterados. Para retreinar o modelo neural, execute: npm run train:model",
  );

  return { imported, skipped, totalRules: rules.length, durationMs, details };
}
