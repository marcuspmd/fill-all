/**
 * Storage barrel — re-exports all storage sub-modules for backward compatibility.
 *
 * New code should import directly from sub-modules:
 *   import { getRules } from "@/lib/storage/rules-storage";
 *
 * Legacy imports from "@/lib/storage/storage" still work via this barrel.
 */

export {
  STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  updateStorageAtomically,
} from "./core";
export type { StorageKey } from "./core";

export {
  getRules,
  saveRule,
  deleteRule,
  getRulesForUrl,
  rulesRepository,
} from "./rules-storage";

export {
  getSavedForms,
  saveForm,
  deleteForm,
  getSavedFormsForUrl,
  formsRepository,
} from "./forms-storage";

export { getSettings, saveSettings } from "./settings-storage";

export {
  getIgnoredFields,
  addIgnoredField,
  removeIgnoredField,
  getIgnoredFieldsForUrl,
  ignoredFieldsRepository,
} from "./ignored-storage";

export {
  getFieldDetectionCache,
  getFieldDetectionCacheForUrl,
  saveFieldDetectionCacheForUrl,
  deleteFieldDetectionCacheForUrl,
  clearFieldDetectionCache,
} from "./cache-storage";

export { matchUrlPattern } from "@/lib/url/match-url-pattern";
