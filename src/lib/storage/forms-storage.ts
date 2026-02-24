/**
 * Saved forms storage — CRUD operations for form templates.
 */

import type { SavedForm } from "@/types";
import type {
  MutableStorageRepository,
  UrlFilterableRepository,
} from "@/types/interfaces";
import { STORAGE_KEYS, getFromStorage, updateStorageAtomically } from "./core";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";

/** Retrieves all saved form templates. */
export async function getSavedForms(): Promise<SavedForm[]> {
  return getFromStorage<SavedForm[]>(STORAGE_KEYS.SAVED_FORMS, []);
}

/**
 * Saves a form template (upsert). Updates timestamps appropriately.
 * @param form - The saved form to persist
 */
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

/**
 * Deletes a saved form by ID.
 * @param formId - The unique form identifier
 */
export async function deleteForm(formId: string): Promise<void> {
  await updateStorageAtomically(
    STORAGE_KEYS.SAVED_FORMS,
    [] as SavedForm[],
    (forms) => forms.filter((f) => f.id !== formId),
  );
}

/**
 * Retrieves saved forms whose `urlPattern` matches the given URL.
 * @param url - The page URL to match against
 */
export async function getSavedFormsForUrl(url: string): Promise<SavedForm[]> {
  const forms = await getSavedForms();
  return forms.filter((form) => matchUrlPattern(url, form.urlPattern));
}

/** Type-safe repository implementation for saved forms */
export const formsRepository: MutableStorageRepository<SavedForm> &
  UrlFilterableRepository<SavedForm> = {
  getAll: getSavedForms,
  save: saveForm,
  remove: deleteForm,
  getForUrl: getSavedFormsForUrl,
};
