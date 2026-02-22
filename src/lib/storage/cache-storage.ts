/**
 * Field detection cache storage — per-URL cache of detected fields.
 */

import type { FieldDetectionCacheEntry, DetectedFieldSummary } from "@/types";
import {
  STORAGE_KEYS,
  MAX_FIELD_CACHE_ENTRIES,
  getFromStorage,
  updateStorageAtomically,
} from "./core";

export async function getFieldDetectionCache(): Promise<
  FieldDetectionCacheEntry[]
> {
  return getFromStorage<FieldDetectionCacheEntry[]>(
    STORAGE_KEYS.FIELD_CACHE,
    [],
  );
}

export async function getFieldDetectionCacheForUrl(
  url: string,
): Promise<FieldDetectionCacheEntry | null> {
  const entries = await getFieldDetectionCache();
  const exact = entries.find((entry) => entry.url === url);
  if (exact) return exact;

  try {
    const u = new URL(url);
    return (
      entries.find(
        (entry) => entry.origin === u.origin && entry.path === u.pathname,
      ) ?? null
    );
  } catch {
    return null;
  }
}

export async function saveFieldDetectionCacheForUrl(
  url: string,
  fields: DetectedFieldSummary[],
): Promise<FieldDetectionCacheEntry> {
  const now = Date.now();
  let parsed: URL | null = null;
  try {
    parsed = new URL(url);
  } catch {
    // keep null and fallback to plain values
  }

  const entry: FieldDetectionCacheEntry = {
    url,
    origin: parsed?.origin ?? "",
    hostname: parsed?.hostname ?? "",
    path: parsed?.pathname ?? "",
    count: fields.length,
    fields,
    updatedAt: now,
  };

  await updateStorageAtomically(
    STORAGE_KEYS.FIELD_CACHE,
    [] as FieldDetectionCacheEntry[],
    (existing) => {
      const filtered = existing.filter(
        (item) =>
          item.url !== url &&
          !(
            entry.origin &&
            entry.path &&
            item.origin === entry.origin &&
            item.path === entry.path
          ),
      );
      filtered.push(entry);

      return filtered
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_FIELD_CACHE_ENTRIES);
    },
  );
  return entry;
}

export async function deleteFieldDetectionCacheForUrl(
  url: string,
): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.FIELD_CACHE,
    [] as FieldDetectionCacheEntry[],
    (current) => current.filter((entry) => entry.url !== url),
  );
}

export async function clearFieldDetectionCache(): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.FIELD_CACHE,
    [] as FieldDetectionCacheEntry[],
    () => [],
  );
}
