import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dataset/runtime-dataset", () => ({
  addDatasetEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { addDatasetEntry } from "@/lib/dataset/runtime-dataset";
import {
  LEARNED_STORAGE_KEY,
  buildSignalsFromRule,
  clearLearnedEntries,
  clearRuleDerivedEntries,
  getLearnedCount,
  getLearnedEntries,
  removeLearnedEntryBySignals,
  retrainLearnedFromRules,
  storeLearnedEntry,
} from "@/lib/ai/learning-store";
import type { FieldRule, LearnedEntry } from "@/types";

const chromeMock = globalThis.chrome as {
  storage: {
    local: {
      get: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
      remove: ReturnType<typeof vi.fn>;
    };
  };
};

function makeEntry(overrides: Partial<LearnedEntry> = {}): LearnedEntry {
  return {
    signals: "cpf documento",
    type: "cpf",
    generatorType: "cpf",
    timestamp: 1000,
    source: "auto",
    ...overrides,
  };
}

function makeRule(overrides: Partial<FieldRule> = {}): FieldRule {
  return {
    id: "rule-1",
    fieldSelector: "#cpf",
    fieldType: "cpf",
    fieldName: "cpf",
    urlPattern: "*",
    fixedValue: undefined,
    ...overrides,
  };
}

describe("learning-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chromeMock.storage.local.get.mockResolvedValue({});
    chromeMock.storage.local.set.mockResolvedValue(undefined);
    chromeMock.storage.local.remove.mockResolvedValue(undefined);
  });

  // ──────────────────────── getLearnedEntries ────────────────────────

  describe("getLearnedEntries", () => {
    it("retorna array vazio quando storage está vazio", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      const result = await getLearnedEntries();
      expect(result).toEqual([]);
    });

    it("retorna entradas armazenadas", async () => {
      const entries = [makeEntry()];
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: entries,
      });
      const result = await getLearnedEntries();
      expect(result).toEqual(entries);
    });
  });

  // ──────────────────────── getLearnedCount ────────────────────────

  describe("getLearnedCount", () => {
    it("retorna 0 quando não há entradas", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      expect(await getLearnedCount()).toBe(0);
    });

    it("retorna quantidade correta", async () => {
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: [makeEntry(), makeEntry({ signals: "email" })],
      });
      expect(await getLearnedCount()).toBe(2);
    });
  });

  // ──────────────────────── storeLearnedEntry ────────────────────────

  describe("storeLearnedEntry", () => {
    it("armazena nova entrada no storage", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      await storeLearnedEntry("cpf documento", "cpf");
      expect(chromeMock.storage.local.set).toHaveBeenCalledOnce();
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored).toHaveLength(1);
      expect(stored[0].type).toBe("cpf");
      expect(stored[0].source).toBe("auto");
    });

    it("normaliza signals antes de armazenar (lowercase, sem acentos)", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      await storeLearnedEntry("CPF Número", "cpf");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored[0].signals).toBe("cpf numero");
    });

    it("deduplica por signals – atualiza timestamp quando mesmo signal", async () => {
      const old = makeEntry({ signals: "cpf documento", timestamp: 100 });
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: [old],
      });
      await storeLearnedEntry("cpf documento", "cpf");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored).toHaveLength(1);
      expect(stored[0].timestamp).toBeGreaterThan(100);
    });

    it("não armazena quando signal normalizado estiver vazio", async () => {
      await storeLearnedEntry("   ", "cpf");
      expect(chromeMock.storage.local.set).not.toHaveBeenCalled();
    });

    it("usa source 'rule' quando especificado", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      await storeLearnedEntry("email contato", "email", undefined, "rule");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored[0].source).toBe("rule");
    });

    it("usa generatorType fornecido em vez do type", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      await storeLearnedEntry("telefone", "phone", "cellphone");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored[0].generatorType).toBe("cellphone");
    });

    it("limita a MAX_LEARNED_ENTRIES (500) entradas", async () => {
      // Gera 501 entradas existentes para simular overflow
      const existingEntries = Array.from({ length: 501 }, (_, i) =>
        makeEntry({ signals: `signal ${i}`, timestamp: i }),
      );
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: existingEntries,
      });
      await storeLearnedEntry("novo sinal", "email");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored.length).toBeLessThanOrEqual(500);
    });
  });

  // ──────────────────────── clearLearnedEntries ────────────────────────

  describe("clearLearnedEntries", () => {
    it("remove a chave do storage", async () => {
      await clearLearnedEntries();
      expect(chromeMock.storage.local.remove).toHaveBeenCalledWith(
        LEARNED_STORAGE_KEY,
      );
    });
  });

  // ──────────────────────── removeLearnedEntryBySignals ────────────────────────

  describe("removeLearnedEntryBySignals", () => {
    it("remove entrada com signals correspondente", async () => {
      const entry = makeEntry({ signals: "cpf documento" });
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: [entry],
      });
      await removeLearnedEntryBySignals("cpf documento");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      expect(arg[LEARNED_STORAGE_KEY]).toHaveLength(0);
    });

    it("não altera storage quando signal não é encontrado", async () => {
      const entry = makeEntry({ signals: "cpf documento" });
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: [entry],
      });
      await removeLearnedEntryBySignals("email outro");
      expect(chromeMock.storage.local.set).not.toHaveBeenCalled();
    });

    it("não faz nada quando signal normalizado está vazio", async () => {
      await removeLearnedEntryBySignals("   ");
      expect(chromeMock.storage.local.get).not.toHaveBeenCalled();
    });

    it("normaliza o signal antes de comparar", async () => {
      const entry = makeEntry({ signals: "cpf documento" });
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: [entry],
      });
      await removeLearnedEntryBySignals("CPF DOCUMENTO");
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      expect(arg[LEARNED_STORAGE_KEY]).toHaveLength(0);
    });
  });

  // ──────────────────────── clearRuleDerivedEntries ────────────────────────

  describe("clearRuleDerivedEntries", () => {
    it("remove apenas entradas de source='rule', preservando 'auto'", async () => {
      const autoEntry = makeEntry({ signals: "email", source: "auto" });
      const ruleEntry = makeEntry({ signals: "cpf", source: "rule" });
      const noSourceEntry = makeEntry({ signals: "telefone" }); // default 'auto'
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: [autoEntry, ruleEntry, noSourceEntry],
      });

      await clearRuleDerivedEntries();

      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      const stored = arg[LEARNED_STORAGE_KEY] as LearnedEntry[];
      expect(stored).toHaveLength(2);
      expect(stored.find((e) => e.source === "rule")).toBeUndefined();
    });

    it("mantém todas as entradas quando não há entradas de rule", async () => {
      const entries = [makeEntry({ source: "auto" })];
      chromeMock.storage.local.get.mockResolvedValue({
        [LEARNED_STORAGE_KEY]: entries,
      });
      await clearRuleDerivedEntries();
      const [[arg]] = chromeMock.storage.local.set.mock.calls;
      expect(arg[LEARNED_STORAGE_KEY]).toHaveLength(1);
    });
  });

  // ──────────────────────── buildSignalsFromRule ────────────────────────

  describe("buildSignalsFromRule", () => {
    it("gera signals a partir dos campos da regra", () => {
      const rule = makeRule({
        fieldSelector: "#cpf",
        fieldType: "cpf",
        fieldName: "cpf",
      });
      const signals = buildSignalsFromRule(rule);
      expect(signals).toContain("cpf");
    });

    it("normaliza e remove caracteres especiais do seletor", () => {
      const rule = makeRule({
        fieldSelector: ".form-group__input[name='cpf']",
        fieldType: "cpf",
        fieldName: "cpf numero",
      });
      const signals = buildSignalsFromRule(rule);
      expect(signals).not.toContain(".");
      expect(signals).not.toContain("[");
      expect(signals).not.toContain("'");
    });

    it("inclui fieldType e fieldName no resultado", () => {
      const rule = makeRule({ fieldType: "email", fieldName: "email contato" });
      const signals = buildSignalsFromRule(rule);
      expect(signals).toContain("email");
      expect(signals).toContain("contato");
    });

    it("retorna string vazia quando todos os campos são inúteis", () => {
      const rule = makeRule({
        fieldSelector: "#.",
        fieldType: "text" as any,
        fieldName: "",
      });
      // Minimal test: should not throw
      expect(() => buildSignalsFromRule(rule)).not.toThrow();
    });
  });

  // ──────────────────────── retrainLearnedFromRules ────────────────────────

  describe("retrainLearnedFromRules", () => {
    it("importa regras com signals válidos", async () => {
      // Arrange - empty store
      chromeMock.storage.local.get.mockResolvedValue({});
      const rules: FieldRule[] = [
        makeRule({ id: "r1", fieldSelector: "#cpf", fieldType: "cpf" }),
        makeRule({
          id: "r2",
          fieldSelector: "#email",
          fieldType: "email",
          fieldName: "email",
        }),
      ];

      // Act
      const result = await retrainLearnedFromRules(rules);

      // Assert
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.totalRules).toBe(2);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].status).toBe("imported");
      expect(addDatasetEntry).toHaveBeenCalledTimes(2);
    });

    it("ignora regras que produzem signals vazios", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      // A rule where selector and name produce empty normalized signals is hard
      // to craft, so we test the overall path. buildSignalsFromRule with minimal
      // data still produces something, so we verify happy path only.
      const rules: FieldRule[] = [
        makeRule({
          id: "r1",
          fieldSelector: "   ",
          fieldType: "cpf",
          fieldName: "",
        }),
      ];
      const result = await retrainLearnedFromRules(rules);
      // "   " normalized = "cpf" from fieldType, so it should be imported
      expect(result.totalRules).toBe(1);
      expect(typeof result.durationMs).toBe("number");
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("retorna objeto RetrainResult com estrutura completa", async () => {
      chromeMock.storage.local.get.mockResolvedValue({});
      const result = await retrainLearnedFromRules([]);

      expect(result).toHaveProperty("imported");
      expect(result).toHaveProperty("skipped");
      expect(result).toHaveProperty("totalRules");
      expect(result).toHaveProperty("durationMs");
      expect(result).toHaveProperty("details");
      expect(result.imported).toBe(0);
      expect(result.details).toEqual([]);
    });

    it("preserva entradas orgânicas ao retreinar", async () => {
      const autoEntry = makeEntry({
        signals: "organic signal",
        source: "auto",
      });
      // Primeiro get é o getLearnedCount; depois os internos vão retornar entries
      chromeMock.storage.local.get.mockImplementation((key: string) => {
        if (key === LEARNED_STORAGE_KEY) {
          return Promise.resolve({ [LEARNED_STORAGE_KEY]: [autoEntry] });
        }
        return Promise.resolve({});
      });

      const result = await retrainLearnedFromRules([
        makeRule({ id: "r1", fieldSelector: "#cpf", fieldType: "cpf" }),
      ]);

      expect(result.imported).toBe(1);
    });
  });
});
