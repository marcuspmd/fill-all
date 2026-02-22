/**
 * Chrome Storage wrapper for rules
 */

import type {
  FieldRule,
  SavedForm,
  Settings,
  IgnoredField,
  FieldDetectionCacheEntry,
  DetectedFieldSummary,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";

const STORAGE_KEYS = {
  RULES: "fill_all_rules",
  SAVED_FORMS: "fill_all_saved_forms",
  SETTINGS: "fill_all_settings",
  IGNORED_FIELDS: "fill_all_ignored_fields",
  FIELD_CACHE: "fill_all_field_cache",
} as const;
type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

const MAX_FIELD_CACHE_ENTRIES = 100;
const writeQueues = new Map<StorageKey, Promise<void>>();

async function getFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? defaultValue;
}

async function setToStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function updateStorageAtomically<T>(
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

  writeQueues.set(
    key,
    currentWrite.catch(() => {
      // Keep queue alive after errors.
    }),
  );

  await currentWrite;
  return nextValue;
}

// --- Rules ---

export async function getRules(): Promise<FieldRule[]> {
  return getFromStorage<FieldRule[]>(STORAGE_KEYS.RULES, []);
}

export async function saveRule(rule: FieldRule): Promise<void> {
  await updateStorageAtomically(STORAGE_KEYS.RULES, [] as FieldRule[], (rules) => {
    const next = [...rules];
    const existingIndex = next.findIndex((r) => r.id === rule.id);

    if (existingIndex >= 0) {
      next[existingIndex] = { ...rule, updatedAt: Date.now() };
    } else {
      next.push({ ...rule, createdAt: Date.now(), updatedAt: Date.now() });
    }

    return next;
  });
}

export async function deleteRule(ruleId: string): Promise<void> {
  await updateStorageAtomically(STORAGE_KEYS.RULES, [] as FieldRule[], (rules) =>
    rules.filter((r) => r.id !== ruleId),
  );
}

export async function getRulesForUrl(url: string): Promise<FieldRule[]> {
  const rules = await getRules();
  return rules
    .filter((rule) => matchUrlPattern(url, rule.urlPattern))
    .sort((a, b) => b.priority - a.priority);
}

// --- Saved Forms ---

export async function getSavedForms(): Promise<SavedForm[]> {
  return getFromStorage<SavedForm[]>(STORAGE_KEYS.SAVED_FORMS, []);
}

export async function saveForm(form: SavedForm): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.SAVED_FORMS,
    [] as SavedForm[],
    (forms) => {
      const next = [...forms];
      const existingIndex = next.findIndex((f) => f.id === form.id);

      if (existingIndex >= 0) {
        next[existingIndex] = { ...form, updatedAt: Date.now() };
      } else {
        next.push({ ...form, createdAt: Date.now(), updatedAt: Date.now() });
      }

      return next;
    },
  );
}

export async function deleteForm(formId: string): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.SAVED_FORMS,
    [] as SavedForm[],
    (forms) => forms.filter((f) => f.id !== formId),
  );
}

export async function getSavedFormsForUrl(url: string): Promise<SavedForm[]> {
  const forms = await getSavedForms();
  return forms.filter((form) => matchUrlPattern(url, form.urlPattern));
}

// --- Settings ---

export async function getSettings(): Promise<Settings> {
  return getFromStorage<Settings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS,
    (current) => ({ ...current, ...settings }),
  );
}

// --- Ignored Fields ---

export async function getIgnoredFields(): Promise<IgnoredField[]> {
  return getFromStorage<IgnoredField[]>(STORAGE_KEYS.IGNORED_FIELDS, []);
}

export async function addIgnoredField(
  field: Omit<IgnoredField, "id" | "createdAt">,
): Promise<IgnoredField> {
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
    throw new Error("Failed to resolve ignored field");
  }
  return resolvedField;
}

export async function removeIgnoredField(id: string): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.IGNORED_FIELDS,
    [] as IgnoredField[],
    (fields) => fields.filter((f) => f.id !== id),
  );
}

export async function getIgnoredFieldsForUrl(
  url: string,
): Promise<IgnoredField[]> {
  const fields = await getIgnoredFields();
  return fields.filter((f) => matchUrlPattern(url, f.urlPattern));
}

// --- Field Detection Cache ---

export async function getFieldDetectionCache(): Promise<FieldDetectionCacheEntry[]> {
  return getFromStorage<FieldDetectionCacheEntry[]>(STORAGE_KEYS.FIELD_CACHE, []);
}

export async function getFieldDetectionCacheForUrl(
  url: string,
): Promise<FieldDetectionCacheEntry | null> {
  const entries = await getFieldDetectionCache();
  const exact = entries.find((entry) => entry.url === url);
  if (exact) return exact;

  // fallback: origin+path match in case query/hash changed
  try {
    const u = new URL(url);
    return (
      entries.find((entry) => entry.origin === u.origin && entry.path === u.pathname) ??
      null
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

export async function deleteFieldDetectionCacheForUrl(url: string): Promise<void> {
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

export { matchUrlPattern } from "@/lib/url/match-url-pattern";
