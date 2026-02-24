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

/** Retrieves all field detection cache entries. */
export async function getFieldDetectionCache(): Promise<
  FieldDetectionCacheEntry[]
> {
  return getFromStorage<FieldDetectionCacheEntry[]>(
    STORAGE_KEYS.FIELD_CACHE,
    [],
  );
}

/**
 * Retrieves the cached detection result for a specific URL.
 * Falls back to origin + path matching when an exact URL match isn't found.
 * @param url - Full page URL
 * @returns The matching cache entry, or `null`
 */
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

/**
 * Saves detected fields for a URL in the cache.
 * Deduplicates by URL and origin+path. Evicts oldest entries beyond the limit.
 * @param url - Full page URL
 * @param fields - Array of detected field summaries
 * @returns The saved cache entry
 */
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

/**
 * Deletes the cached detection result for a specific URL.
 * @param url - Full page URL to remove from cache
 */
export async function deleteFieldDetectionCacheForUrl(
  url: string,
): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.FIELD_CACHE,
    [] as FieldDetectionCacheEntry[],
    (current) => current.filter((entry) => entry.url !== url),
  );
}

/** Clears all field detection cache entries. */
export async function clearFieldDetectionCache(): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.FIELD_CACHE,
    [] as FieldDetectionCacheEntry[],
    () => [],
  );
}
