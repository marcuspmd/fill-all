/**
 * Core storage utilities — low-level wrappers over chrome.storage.local
 * with atomic update support and write queue per key.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("Storage");

export const STORAGE_KEYS = {
  RULES: "fill_all_rules",
  SAVED_FORMS: "fill_all_saved_forms",
  SETTINGS: "fill_all_settings",
  IGNORED_FIELDS: "fill_all_ignored_fields",
  FIELD_CACHE: "fill_all_field_cache",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const MAX_FIELD_CACHE_ENTRIES = 100;
const WRITE_TIMEOUT_MS = 30_000;
const writeQueues = new Map<StorageKey, Promise<void>>();

export { MAX_FIELD_CACHE_ENTRIES };

export async function getFromStorage<T>(
  key: string,
  defaultValue: T,
): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? defaultValue;
}

export async function setToStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Storage write timeout (${ms}ms)`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function updateStorageAtomically<T>(
  key: StorageKey,
  defaultValue: T,
  updater: (current: T) => T,
): Promise<T> {
  const previous = writeQueues.get(key) ?? Promise.resolve();
  let nextValue = defaultValue;

  const currentWrite = previous.then(async () => {
    const current = await getFromStorage<T>(key, defaultValue);
    nextValue = updater(current);
    await setToStorage(key, nextValue);
  });

  const guardedWrite = withTimeout(currentWrite, WRITE_TIMEOUT_MS).catch(
    (err) => {
      log.warn(`Atomic update for key "${key}" failed:`, err);
    },
  );

  writeQueues.set(
    key,
    guardedWrite.then(() => {}),
  );

  await currentWrite;
  return nextValue;
}
