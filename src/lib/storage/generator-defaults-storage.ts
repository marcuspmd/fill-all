/**
 * Generator defaults storage — persists per-type default generator params.
 *
 * These defaults apply when no rule overrides the params for a given field type,
 * acting as a middle layer between built-in definition defaults and rule-level overrides.
 */

import type { FieldType, GeneratorParams } from "@/types";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "./core";

/** Map from FieldType to its user-configured default GeneratorParams. */
export type GeneratorDefaults = Partial<Record<FieldType, GeneratorParams>>;

/** Retrieves all stored generator defaults. */
export async function getGeneratorDefaults(): Promise<GeneratorDefaults> {
  return getFromStorage<GeneratorDefaults>(STORAGE_KEYS.GENERATOR_DEFAULTS, {});
}

/**
 * Saves default generator params for a specific field type.
 * Merges with existing defaults (does not replace other types).
 */
export async function saveGeneratorDefault(
  fieldType: FieldType,
  params: GeneratorParams,
): Promise<void> {
  const current = await getGeneratorDefaults();
  await setToStorage(STORAGE_KEYS.GENERATOR_DEFAULTS, {
    ...current,
    [fieldType]: params,
  });
}

/**
 * Saves all generator defaults at once (full replace).
 */
export async function saveAllGeneratorDefaults(
  defaults: GeneratorDefaults,
): Promise<void> {
  await setToStorage(STORAGE_KEYS.GENERATOR_DEFAULTS, defaults);
}
