import { describe, expect, it, vi } from "vitest";
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

describe("dataset integration utils", () => {
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
