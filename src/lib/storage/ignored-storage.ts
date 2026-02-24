/**
 * Ignored fields storage — CRUD for fields that should be skipped during auto-fill.
 */

import type { IgnoredField } from "@/types";
import type {
  StorageRepository,
  UrlFilterableRepository,
} from "@/types/interfaces";
import { STORAGE_KEYS, getFromStorage, updateStorageAtomically } from "./core";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";
import { createLogger } from "@/lib/logger";

const log = createLogger("Storage");

/** Retrieves all ignored field entries. */
export async function getIgnoredFields(): Promise<IgnoredField[]> {
  return getFromStorage<IgnoredField[]>(STORAGE_KEYS.IGNORED_FIELDS, []);
}

/**
 * Adds a field to the ignored list. If a matching entry already exists
 * (same URL pattern + selector), returns the existing entry instead.
 * @param field - The field to ignore (without ID and createdAt)
 * @returns The created or existing `IgnoredField`, or `null` on failure
 */
export async function addIgnoredField(
  field: Omit<IgnoredField, "id" | "createdAt">,
): Promise<IgnoredField | null> {
  let resolvedField: IgnoredField | null = null;

  await updateStorageAtomically(
    STORAGE_KEYS.IGNORED_FIELDS,
    [] as IgnoredField[],
    (fields) => {
      const existing = fields.find(
        (f) =>
          f.urlPattern === field.urlPattern && f.selector === field.selector,
      );
      if (existing) {
        resolvedField = existing;
        return fields;
      }

      const nextField: IgnoredField = {
        ...field,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: Date.now(),
      };
      resolvedField = nextField;
      return [...fields, nextField];
    },
  );

  if (!resolvedField) {
    log.warn("Failed to resolve ignored field — returning null");
    return null;
  }
  return resolvedField;
}

/**
 * Removes an ignored field entry by ID.
 * @param id - The unique ignored-field identifier
 */
export async function removeIgnoredField(id: string): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.IGNORED_FIELDS,
    [] as IgnoredField[],
    (fields) => fields.filter((f) => f.id !== id),
  );
}

/**
 * Retrieves ignored fields whose `urlPattern` matches the given URL.
 * @param url - The page URL to match against
 */
export async function getIgnoredFieldsForUrl(
  url: string,
): Promise<IgnoredField[]> {
  const fields = await getIgnoredFields();
  return fields.filter((f) => matchUrlPattern(url, f.urlPattern));
}

/** Type-safe repository implementation for ignored fields */
export const ignoredFieldsRepository: StorageRepository<IgnoredField> &
  UrlFilterableRepository<IgnoredField> = {
  getAll: getIgnoredFields,
  remove: removeIgnoredField,
  getForUrl: getIgnoredFieldsForUrl,
};
