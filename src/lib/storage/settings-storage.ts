/**
 * Settings storage — read/write extension settings.
 */

import type { Settings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { STORAGE_KEYS, getFromStorage, updateStorageAtomically } from "./core";

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
