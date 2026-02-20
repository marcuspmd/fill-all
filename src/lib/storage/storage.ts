/**
 * Chrome Storage wrapper for rules
 */

import type { FieldRule, SavedForm, Settings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

const STORAGE_KEYS = {
  RULES: "fill_all_rules",
  SAVED_FORMS: "fill_all_saved_forms",
  SETTINGS: "fill_all_settings",
} as const;

async function getFromStorage<T>(key: string, defaultValue: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? defaultValue;
}

async function setToStorage<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// --- Rules ---

export async function getRules(): Promise<FieldRule[]> {
  return getFromStorage<FieldRule[]>(STORAGE_KEYS.RULES, []);
}

export async function saveRule(rule: FieldRule): Promise<void> {
  const rules = await getRules();
  const existingIndex = rules.findIndex((r) => r.id === rule.id);

  if (existingIndex >= 0) {
    rules[existingIndex] = { ...rule, updatedAt: Date.now() };
  } else {
    rules.push({ ...rule, createdAt: Date.now(), updatedAt: Date.now() });
  }

  await setToStorage(STORAGE_KEYS.RULES, rules);
}

export async function deleteRule(ruleId: string): Promise<void> {
  const rules = await getRules();
  const filtered = rules.filter((r) => r.id !== ruleId);
  await setToStorage(STORAGE_KEYS.RULES, filtered);
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
  const forms = await getSavedForms();
  const existingIndex = forms.findIndex((f) => f.id === form.id);

  if (existingIndex >= 0) {
    forms[existingIndex] = { ...form, updatedAt: Date.now() };
  } else {
    forms.push({ ...form, createdAt: Date.now(), updatedAt: Date.now() });
  }

  await setToStorage(STORAGE_KEYS.SAVED_FORMS, forms);
}

export async function deleteForm(formId: string): Promise<void> {
  const forms = await getSavedForms();
  const filtered = forms.filter((f) => f.id !== formId);
  await setToStorage(STORAGE_KEYS.SAVED_FORMS, filtered);
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
  const current = await getSettings();
  await setToStorage(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
}

// --- URL Pattern Matching ---

export function matchUrlPattern(url: string, pattern: string): boolean {
  try {
    // Convert wildcard pattern to regex
    const escaped = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    const regex = new RegExp(`^${escaped}$`, "i");
    return regex.test(url);
  } catch {
    return url.includes(pattern);
  }
}
