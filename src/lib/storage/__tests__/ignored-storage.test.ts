import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IgnoredField } from "@/types";
import {
  getIgnoredFields,
  addIgnoredField,
  removeIgnoredField,
  getIgnoredFieldsForUrl,
  ignoredFieldsRepository,
} from "@/lib/storage/ignored-storage";

const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
const mockSet = chrome.storage.local.set as ReturnType<typeof vi.fn>;

function makeField(
  overrides: Partial<Omit<IgnoredField, "id" | "createdAt">> = {},
): Omit<IgnoredField, "id" | "createdAt"> {
  return {
    urlPattern: "*example.com*",
    selector: "#email",
    label: "Email",
    ...overrides,
  };
}

describe("ignored-storage", () => {
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

  // ── getIgnoredFields ──────────────────────────────────────────────────────

  describe("getIgnoredFields", () => {
    it("returns empty array when storage is empty", async () => {
      const fields = await getIgnoredFields();
      expect(fields).toEqual([]);
    });

    it("returns all stored ignored fields", async () => {
      const stored: IgnoredField[] = [
        {
          id: "1",
          urlPattern: "*example.com*",
          selector: "#a",
          label: "A",
          createdAt: 1,
        },
      ];
      memory["fill_all_ignored_fields"] = stored;

      const fields = await getIgnoredFields();
      expect(fields).toHaveLength(1);
      expect(fields[0].selector).toBe("#a");
    });
  });

  // ── addIgnoredField ───────────────────────────────────────────────────────

  describe("addIgnoredField", () => {
    it("creates a new ignored field and assigns id + createdAt", async () => {
      const field = makeField();

      const result = await addIgnoredField(field);

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeGreaterThan(0);
      expect(result?.selector).toBe(field.selector);
    });

    it("returns existing entry when urlPattern + selector already match", async () => {
      const field = makeField();

      const first = await addIgnoredField(field);
      const second = await addIgnoredField(field);

      expect(second?.id).toBe(first?.id);

      const all = await getIgnoredFields();
      expect(all).toHaveLength(1);
    });

    it("stores multiple fields with different selectors", async () => {
      await addIgnoredField(makeField({ selector: "#name" }));
      await addIgnoredField(makeField({ selector: "#email" }));

      const all = await getIgnoredFields();
      expect(all).toHaveLength(2);
    });

    it("returns null when updateStorageAtomically does not call updater", async () => {
      // Mock core module so updateStorageAtomically never invokes updater
      vi.doMock("@/lib/storage/core", async (importOriginal) => {
        const original =
          await importOriginal<typeof import("@/lib/storage/core")>();
        return {
          ...original,
          updateStorageAtomically: vi.fn().mockResolvedValue(undefined),
        };
      });

      vi.resetModules();
      const { addIgnoredField: addMocked } =
        await import("@/lib/storage/ignored-storage");

      const result = await addMocked(makeField());
      expect(result).toBeNull();

      vi.doUnmock("@/lib/storage/core");
      vi.resetModules();
    });
  });

  // ── removeIgnoredField ────────────────────────────────────────────────────

  describe("removeIgnoredField", () => {
    it("removes the field with the given id", async () => {
      const added = await addIgnoredField(makeField());

      await removeIgnoredField(added!.id);

      const all = await getIgnoredFields();
      expect(all).toHaveLength(0);
    });

    it("does not throw when id does not exist", async () => {
      await expect(
        removeIgnoredField("non-existent-id"),
      ).resolves.not.toThrow();
    });
  });

  // ── getIgnoredFieldsForUrl ────────────────────────────────────────────────

  describe("getIgnoredFieldsForUrl", () => {
    it("returns fields whose urlPattern matches the given url", async () => {
      await addIgnoredField(
        makeField({ urlPattern: "*example.com*", selector: "#a" }),
      );
      await addIgnoredField(
        makeField({ urlPattern: "*other.com*", selector: "#b" }),
      );

      const result = await getIgnoredFieldsForUrl("https://example.com/login");

      expect(result).toHaveLength(1);
      expect(result[0].selector).toBe("#a");
    });

    it("returns empty array when no patterns match", async () => {
      await addIgnoredField(makeField({ urlPattern: "*admin.internal*" }));

      const result = await getIgnoredFieldsForUrl("https://example.com/page");
      expect(result).toHaveLength(0);
    });
  });

  // ── ignoredFieldsRepository ───────────────────────────────────────────────

  describe("ignoredFieldsRepository", () => {
    it("getAll delegates to getIgnoredFields", async () => {
      const all = await ignoredFieldsRepository.getAll();
      expect(all).toEqual([]);
    });

    it("remove delegates to removeIgnoredField", async () => {
      const added = await addIgnoredField(makeField());
      await ignoredFieldsRepository.remove(added!.id);
      expect(await getIgnoredFields()).toHaveLength(0);
    });

    it("getForUrl delegates to getIgnoredFieldsForUrl", async () => {
      await addIgnoredField(makeField({ urlPattern: "*example.com*" }));
      const result = await ignoredFieldsRepository.getForUrl(
        "https://example.com/",
      );
      expect(result).toHaveLength(1);
    });
  });
});
