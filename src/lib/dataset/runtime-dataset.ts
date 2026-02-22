/**
 * Runtime Dataset Store
 *
 * Manages user-curated training samples persisted in chrome.storage.local.
 * These entries are used to train the TF.js model entirely in the browser
 * (options page), giving the user full control over classification quality.
 *
 * Unlike the bundled `training-data.ts` (static, ship-time), entries here
 * are created, edited and deleted by the user at runtime.
 */

import type { FieldType } from "@/types";

export const RUNTIME_DATASET_KEY = "fill_all_runtime_dataset";

export type DatasetEntrySource = "manual" | "auto" | "imported" | "builtin";
export type DatasetEntryDifficulty = "easy" | "medium" | "hard";

export interface DatasetEntry {
  id: string;
  /** Normalised signals string (label + name + id + placeholder concatenated) */
  signals: string;
  /** Expected field type */
  type: FieldType;
  /** Where this sample came from */
  source: DatasetEntrySource;
  /** Relative difficulty for curriculum tracking */
  difficulty: DatasetEntryDifficulty;
  /** When this entry was created */
  createdAt: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalise(signals: string): string {
  return signals
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns all dataset entries, sorted by createdAt descending. */
export async function getDatasetEntries(): Promise<DatasetEntry[]> {
  const result = await chrome.storage.local.get(RUNTIME_DATASET_KEY);
  const entries = (result[RUNTIME_DATASET_KEY] as DatasetEntry[]) ?? [];
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

/** Returns the total number of entries without loading all data. */
export async function getDatasetCount(): Promise<number> {
  return (await getDatasetEntries()).length;
}

/**
 * Adds a single entry to the dataset.
 * Deduplicates by normalised signals — if an identical signals string already
 * exists with the same type, the entry is updated in place.
 */
export async function addDatasetEntry(
  entry: Omit<DatasetEntry, "id" | "createdAt">,
): Promise<DatasetEntry> {
  const normalized = normalise(entry.signals);
  if (!normalized) throw new Error("signals não pode ser vazio");

  const existing = await getDatasetEntries();

  const dupIdx = existing.findIndex(
    (e) => e.signals === normalized && e.type === entry.type,
  );

  const newEntry: DatasetEntry =
    dupIdx >= 0
      ? {
          ...existing[dupIdx],
          source: entry.source,
          difficulty: entry.difficulty,
          createdAt: Date.now(),
        }
      : {
          id: generateId(),
          signals: normalized,
          type: entry.type,
          source: entry.source,
          difficulty: entry.difficulty,
          createdAt: Date.now(),
        };

  const updated =
    dupIdx >= 0
      ? existing.map((e, i) => (i === dupIdx ? newEntry : e))
      : [...existing, newEntry];

  await chrome.storage.local.set({ [RUNTIME_DATASET_KEY]: updated });
  return newEntry;
}

/** Removes an entry by id. */
export async function removeDatasetEntry(id: string): Promise<void> {
  const existing = await getDatasetEntries();
  const updated = existing.filter((e) => e.id !== id);
  await chrome.storage.local.set({ [RUNTIME_DATASET_KEY]: updated });
}

/** Clears all dataset entries. */
export async function clearDataset(): Promise<void> {
  await chrome.storage.local.set({ [RUNTIME_DATASET_KEY]: [] });
}

/**
 * Bulk-import entries (e.g. from JSON file). Deduplicates by signals+type.
 * Returns the number of newly added entries.
 */
export async function importDatasetEntries(
  entries: Array<
    Omit<DatasetEntry, "id" | "createdAt"> & { id?: string; createdAt?: number }
  >,
): Promise<number> {
  const existing = await getDatasetEntries();
  const existingKeys = new Set(existing.map((e) => `${e.signals}::${e.type}`));

  let added = 0;
  const toAdd: DatasetEntry[] = [];

  for (const raw of entries) {
    const normalized = normalise(raw.signals);
    if (!normalized) continue;
    const key = `${normalized}::${raw.type}`;
    if (existingKeys.has(key)) continue;

    toAdd.push({
      id: raw.id ?? generateId(),
      signals: normalized,
      type: raw.type,
      source: raw.source ?? "imported",
      difficulty: raw.difficulty ?? "easy",
      createdAt: raw.createdAt ?? Date.now(),
    });
    existingKeys.add(key);
    added++;
  }

  if (added > 0) {
    await chrome.storage.local.set({
      [RUNTIME_DATASET_KEY]: [...existing, ...toAdd],
    });
  }

  return added;
}

/** Exports all entries as a plain JSON-serialisable array. */
export async function exportDatasetEntries(): Promise<DatasetEntry[]> {
  return getDatasetEntries();
}
