import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DetectedFieldSummary,
  FieldRule,
  IgnoredField,
  SavedForm,
} from "@/types";
import {
  STORAGE_KEYS,
  MAX_FIELD_CACHE_ENTRIES,
  getFromStorage,
} from "@/lib/storage/core";
import {
  getRules,
  saveRule,
  deleteRule,
  getRulesForUrl,
  getSavedForms,
  saveForm,
  deleteForm,
  getSavedFormsForUrl,
  getSettings,
  saveSettings,
  getIgnoredFields,
  addIgnoredField,
  removeIgnoredField,
  getIgnoredFieldsForUrl,
  getFieldDetectionCache,
  getFieldDetectionCacheForUrl,
  saveFieldDetectionCacheForUrl,
  deleteFieldDetectionCacheForUrl,
  clearFieldDetectionCache,
} from "@/lib/storage/storage";

const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
const mockSet = chrome.storage.local.set as ReturnType<typeof vi.fn>;

describe("storage modules", () => {
  let memory: Record<string, unknown>;

  beforeEach(() => {
    memory = {};
    vi.clearAllMocks();

    mockGet.mockImplementation(async (key: string) => ({
      [key]: memory[key],
    }));
    mockSet.mockImplementation(async (payload: Record<string, unknown>) => {
      Object.assign(memory, payload);
    });
  });

  it("rules: saves, sorts by priority and deletes", async () => {
    // Arrange
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    const low: FieldRule = {
      id: "r-low",
      urlPattern: "*example.com*",
      fieldSelector: "#email",
      fieldType: "email",
      generator: "auto",
      priority: 10,
      createdAt: 0,
      updatedAt: 0,
    };
    const high: FieldRule = {
      ...low,
      id: "r-high",
      fieldSelector: "#name",
      fieldType: "name",
      priority: 90,
    };

    // Act
    await saveRule(low);
    now.mockReturnValue(2000);
    await saveRule(high);
    const sorted = await getRulesForUrl("https://example.com/register");
    await deleteRule("r-low");
    const all = await getRules();

    // Assert
    expect(sorted.map((r) => r.id)).toEqual(["r-high", "r-low"]);
    expect(all.map((r) => r.id)).toEqual(["r-high"]);
    now.mockRestore();
  });

  it("forms: upserts by id and filters by URL", async () => {
    // Arrange
    const now = vi.spyOn(Date, "now").mockReturnValue(5000);
    const form: SavedForm = {
      id: "form-1",
      name: "Cadastro",
      urlPattern: "*example.com*",
      fields: { "#email": "a@b.com" },
      createdAt: 0,
      updatedAt: 0,
    };

    // Act
    await saveForm(form);
    now.mockReturnValue(6000);
    await saveForm({ ...form, name: "Cadastro atualizado" });
    const matches = await getSavedFormsForUrl("https://example.com/checkout");
    await deleteForm("form-1");
    const all = await getSavedForms();

    // Assert
    expect(matches).toHaveLength(1);
    expect(matches[0].name).toBe("Cadastro atualizado");
    expect(all).toEqual([]);
    now.mockRestore();
  });

  it("settings: merges partial updates over defaults", async () => {
    // Arrange
    expect(await getSettings()).toMatchObject({
      cacheEnabled: true,
      useChromeAI: true,
    });

    // Act
    await saveSettings({ useChromeAI: false, fillEmptyOnly: true });
    const settings = await getSettings();

    // Assert
    expect(settings.useChromeAI).toBe(false);
    expect(settings.fillEmptyOnly).toBe(true);
    expect(settings.cacheEnabled).toBe(true);
  });

  it("ignored fields: avoids duplicates, filters by URL and removes", async () => {
    // Arrange
    const now = vi.spyOn(Date, "now").mockReturnValue(7000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    // Act
    const first = await addIgnoredField({
      urlPattern: "*example.com*",
      selector: "#password",
      label: "Senha",
    });
    const duplicate = await addIgnoredField({
      urlPattern: "*example.com*",
      selector: "#password",
      label: "Senha",
    });
    const scoped = await getIgnoredFieldsForUrl("https://example.com/login");
    if (first) {
      await removeIgnoredField(first.id);
    }
    const remaining = await getIgnoredFields();

    // Assert
    expect(first).not.toBeNull();
    expect(duplicate?.id).toBe(first?.id);
    expect(scoped).toHaveLength(1);
    expect(remaining).toEqual([]);

    now.mockRestore();
    vi.restoreAllMocks();
  });

  it("field cache: resolves exact and origin/path fallback", async () => {
    // Arrange
    const fields: DetectedFieldSummary[] = [
      {
        selector: "#email",
        fieldType: "email",
        label: "Email",
      },
    ];

    // Act
    await saveFieldDetectionCacheForUrl("https://site.com/form?a=1", fields);
    const exact = await getFieldDetectionCacheForUrl(
      "https://site.com/form?a=1",
    );
    const fallback = await getFieldDetectionCacheForUrl(
      "https://site.com/form?other=2",
    );

    // Assert
    expect(exact?.count).toBe(1);
    expect(fallback?.path).toBe("/form");
  });

  it("field cache: deletes and clears entries", async () => {
    // Arrange
    await saveFieldDetectionCacheForUrl("https://site.com/a", []);
    await saveFieldDetectionCacheForUrl("https://site.com/b", []);

    // Act
    await deleteFieldDetectionCacheForUrl("https://site.com/a");
    const afterDelete = await getFieldDetectionCache();
    await clearFieldDetectionCache();
    const afterClear = await getFieldDetectionCache();

    // Assert
    expect(afterDelete).toHaveLength(1);
    expect(afterDelete[0].url).toBe("https://site.com/b");
    expect(afterClear).toEqual([]);
  });

  it("field cache: enforces max entries and handles invalid URL fallback", async () => {
    // Arrange
    const base = Date.now();
    const many = Array.from(
      { length: MAX_FIELD_CACHE_ENTRIES + 1 },
      (_, i) => ({
        url: `https://example.com/${i}`,
        origin: "https://example.com",
        hostname: "example.com",
        path: `/${i}`,
        count: 0,
        fields: [],
        updatedAt: base - i,
      }),
    );
    memory[STORAGE_KEYS.FIELD_CACHE] = many;

    // Act
    await saveFieldDetectionCacheForUrl("https://example.com/new", []);
    const all = (await getFromStorage(STORAGE_KEYS.FIELD_CACHE, [])) as Array<{
      url: string;
    }>;
    const invalid = await getFieldDetectionCacheForUrl("not-an-url");

    // Assert
    expect(all).toHaveLength(MAX_FIELD_CACHE_ENTRIES);
    expect(all.some((entry) => entry.url === "https://example.com/new")).toBe(
      true,
    );
    expect(invalid).toBeNull();
  });
});
