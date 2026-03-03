import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  augmentTrainingSamples,
  buildKeywordsFromDictionary,
  getBalancingNeeds,
  getUncoveredDictionaryTypes,
} from "@/lib/dataset/integration";
import { FIELD_DICTIONARY } from "@/lib/dataset/field-dictionary";
import {
  getTrainingDistribution,
  TRAINING_SAMPLES,
} from "@/lib/dataset/training-data";

// ── Hoisted mutable references for per-test overrides ────────────────────────

const mocks = vi.hoisted(() => ({
  fieldDictionary: null as null | unknown[],
  trainingDistribution: null as null | Record<string, number>,
}));

vi.mock("@/lib/dataset/field-dictionary", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dataset/field-dictionary")>();
  return {
    ...actual,
    get FIELD_DICTIONARY() {
      return mocks.fieldDictionary ?? actual.FIELD_DICTIONARY;
    },
  };
});

vi.mock("@/lib/dataset/training-data", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dataset/training-data")>();
  return {
    ...actual,
    getTrainingDistribution() {
      return mocks.trainingDistribution ?? actual.getTrainingDistribution();
    },
  };
});

describe("dataset integration utils", () => {
  beforeEach(() => {
    mocks.fieldDictionary = null;
    mocks.trainingDistribution = null;
  });

  it("inclui o próprio tipo como keyword e evita duplicatas", () => {
    // Arrange
    const sampleTypes = FIELD_DICTIONARY.slice(0, 5).map((entry) => entry.type);

    // Act
    const keywordsMap = buildKeywordsFromDictionary();

    // Assert
    for (const type of sampleTypes) {
      const keywords = keywordsMap[type];
      expect(keywords).toContain(type);
      expect(new Set(keywords).size).toBe(keywords.length);
    }
  });

  it("inclui o tipo como keyword quando entry não possui tags", () => {
    // Arrange — entry with empty tags so `if (entry.tags.length > 0)` is skipped
    mocks.fieldDictionary = [
      {
        type: "text" as const,
        tags: [] as string[],
        description: "Generic text",
        examples: [] as string[],
        generators: [] as string[],
      },
    ];

    // Act
    const keywordsMap = buildKeywordsFromDictionary();

    // Assert — type itself should be added even when tags are empty
    expect(keywordsMap["text"]).toContain("text");
    expect(keywordsMap["text"]).toHaveLength(1);
  });

  it("gera amostras augmentadas quando estratégia de shuffle está ativa", () => {
    // Arrange
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Act
    const augmented = augmentTrainingSamples({
      multiplier: 1,
      strategies: ["shuffle"],
    });

    // Assert
    expect(augmented).toHaveLength(TRAINING_SAMPLES.length);
    expect(augmented.every((sample) => sample.source === "augmented")).toBe(
      true,
    );

    vi.restoreAllMocks();
  });

  it("não gera amostra quando estratégia desconhecida não tem função correspondente", () => {
    // Arrange — force Math.random to always pick index 0
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Act — cast to bypass TypeScript so `fn` lookup returns undefined
    const augmented = augmentTrainingSamples({
      multiplier: 1,
      strategies: ["unknown-strategy" as unknown as "shuffle"],
    });

    // Assert — no samples augmented because fn is undefined
    expect(augmented).toHaveLength(0);

    vi.restoreAllMocks();
  });

  it("calcula necessidades de balanceamento sem valores negativos", () => {
    // Arrange
    const targetCount = 10;

    // Act
    const needs = getBalancingNeeds(targetCount);

    // Assert
    for (const value of Object.values(needs)) {
      expect(value.needed).toBeGreaterThanOrEqual(0);
      expect(value.current).toBeGreaterThanOrEqual(0);
    }
  });

  it("usa 0 como fallback quando tipo não existe na distribuição de treino", () => {
    // Arrange — empty distribution forces `dist[entry.type] || 0` fallback
    mocks.trainingDistribution = {};

    // Act
    const needs = getBalancingNeeds(5);

    // Assert — all entries have current === 0 (|| 0 branch)
    for (const value of Object.values(needs)) {
      expect(value.current).toBe(0);
    }
  });

  it("retorna apenas tipos não cobertos pelo dataset de treino", () => {
    // Arrange
    const distribution = getTrainingDistribution();

    // Act
    const uncovered = getUncoveredDictionaryTypes();

    // Assert
    for (const entry of uncovered) {
      expect(distribution[entry.type]).toBeUndefined();
    }
  });
});
