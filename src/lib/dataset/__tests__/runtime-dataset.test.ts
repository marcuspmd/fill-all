import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RUNTIME_DATASET_KEY,
  addDatasetEntry,
  clearDataset,
  exportDatasetEntries,
  getDatasetCount,
  getDatasetEntries,
  importDatasetEntries,
  removeDatasetEntry,
} from "@/lib/dataset/runtime-dataset";

describe("runtime-dataset", () => {
  const mockGet = chrome.storage.local.get as ReturnType<typeof vi.fn>;
  const mockSet = chrome.storage.local.set as ReturnType<typeof vi.fn>;

  let memory: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    memory = {};

    mockGet.mockImplementation(async (key: string) => ({
      [key]: memory[key],
    }));
    mockSet.mockImplementation(async (payload: Record<string, unknown>) => {
      Object.assign(memory, payload);
    });
  });

  it("retorna entradas ordenadas por createdAt desc", async () => {
    // Arrange
    memory[RUNTIME_DATASET_KEY] = [
      {
        id: "1",
        signals: "email",
        type: "email",
        source: "manual",
        difficulty: "easy",
        createdAt: 10,
      },
      {
        id: "2",
        signals: "nome",
        type: "name",
        source: "manual",
        difficulty: "easy",
        createdAt: 20,
      },
    ];

    // Act
    const entries = await getDatasetEntries();
    const count = await getDatasetCount();

    // Assert
    expect(entries.map((entry) => entry.id)).toEqual(["2", "1"]);
    expect(count).toBe(2);
  });

  it("retorna null quando signals fica vazio após normalização", async () => {
    // Arrange
    const entry = {
      signals: "!!!",
      type: "email" as const,
      source: "manual" as const,
      difficulty: "easy" as const,
    };

    // Act
    const result = await addDatasetEntry(entry);

    // Assert
    expect(result).toBeNull();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("deduplica por signals+type e atualiza metadados da entrada existente", async () => {
    // Arrange
    memory[RUNTIME_DATASET_KEY] = [
      {
        id: "base-1",
        signals: "nome do cliente",
        type: "name",
        source: "manual",
        difficulty: "easy",
        createdAt: 100,
      },
    ];
    vi.spyOn(Date, "now").mockReturnValue(999);

    // Act
    const updated = await addDatasetEntry({
      signals: "NÓME   do cliente!!!",
      type: "name",
      source: "imported",
      difficulty: "hard",
    });

    // Assert
    expect(updated).toEqual({
      id: "base-1",
      signals: "nome do cliente",
      type: "name",
      source: "imported",
      difficulty: "hard",
      createdAt: 999,
    });
    const saved = memory[RUNTIME_DATASET_KEY] as Array<{ id: string }>;
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe("base-1");

    vi.restoreAllMocks();
  });

  it("importa apenas entradas novas (dedupe) e normaliza sinais", async () => {
    // Arrange
    memory[RUNTIME_DATASET_KEY] = [
      {
        id: "existing",
        signals: "email principal",
        type: "email",
        source: "manual",
        difficulty: "easy",
        createdAt: 1,
      },
    ];

    // Act
    const added = await importDatasetEntries([
      {
        signals: "EMAIL principal",
        type: "email",
        source: "imported",
        difficulty: "medium",
      },
      {
        signals: "Nome do cliente",
        type: "name",
        source: "imported",
        difficulty: "easy",
      },
    ]);

    // Assert
    expect(added).toBe(1);
    const saved = memory[RUNTIME_DATASET_KEY] as Array<{
      signals: string;
      type: string;
    }>;
    expect(saved).toHaveLength(2);
    expect(saved.some((entry) => entry.signals === "nome do cliente")).toBe(
      true,
    );
  });

  it("remove, exporta e limpa dataset", async () => {
    // Arrange
    memory[RUNTIME_DATASET_KEY] = [
      {
        id: "to-remove",
        signals: "email",
        type: "email",
        source: "manual",
        difficulty: "easy",
        createdAt: 10,
      },
      {
        id: "keep",
        signals: "nome",
        type: "name",
        source: "manual",
        difficulty: "easy",
        createdAt: 20,
      },
    ];

    // Act
    await removeDatasetEntry("to-remove");
    const exportedAfterRemove = await exportDatasetEntries();
    await clearDataset();
    const exportedAfterClear = await exportDatasetEntries();

    // Assert
    expect(exportedAfterRemove.map((entry) => entry.id)).toEqual(["keep"]);
    expect(exportedAfterClear).toEqual([]);
  });
});
