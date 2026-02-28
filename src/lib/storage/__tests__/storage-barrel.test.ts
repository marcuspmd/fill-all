import { describe, expect, it } from "vitest";
import * as storageBarrel from "@/lib/storage/storage";
import * as core from "@/lib/storage/core";
import * as rules from "@/lib/storage/rules-storage";
import * as forms from "@/lib/storage/forms-storage";
import * as settings from "@/lib/storage/settings-storage";
import * as ignored from "@/lib/storage/ignored-storage";
import * as cache from "@/lib/storage/cache-storage";

describe("storage barrel exports", () => {
  it("reexporta funções de core", () => {
    expect(storageBarrel.getFromStorage).toBe(core.getFromStorage);
    expect(storageBarrel.setToStorage).toBe(core.setToStorage);
    expect(storageBarrel.updateStorageAtomically).toBe(
      core.updateStorageAtomically,
    );
  });

  it("reexporta módulos de domínio de storage", () => {
    expect(storageBarrel.getRules).toBe(rules.getRules);
    expect(storageBarrel.getSavedForms).toBe(forms.getSavedForms);
    expect(storageBarrel.getSettings).toBe(settings.getSettings);
    expect(storageBarrel.getIgnoredFields).toBe(ignored.getIgnoredFields);
    expect(storageBarrel.getFieldDetectionCache).toBe(
      cache.getFieldDetectionCache,
    );
  });
});
