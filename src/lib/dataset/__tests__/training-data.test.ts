import { describe, expect, it } from "vitest";
import {
  TRAINING_SAMPLES,
  flattenStructuredSignals,
  getTrainingDistribution,
  getTrainingSamplesByDifficulty,
  getTrainingSamplesByType,
  getTrainingV2ByDifficulty,
  getTrainingV2ByType,
  getTrainingV2Distribution,
  normalizeStructuredSignals,
  toTrainingSignalText,
} from "@/lib/dataset/training-data";

describe("training-data", () => {
  it("normaliza sinais estruturados removendo ruído", () => {
    // Arrange
    const raw = {
      primary: ["  Nome   Completo  ", "NOME completo"],
      secondary: ["cliente"],
      metadata: [],
      structural: [],
    };

    // Act
    const normalized = normalizeStructuredSignals(raw);

    // Assert
    expect(normalized.primary.length).toBeGreaterThan(0);
    expect(normalized.primary[0]).toContain("nome");
  });

  it("gera texto flatten e texto de treino para uma amostra", () => {
    // Arrange
    const sample = TRAINING_SAMPLES[0];

    // Act
    const flat = flattenStructuredSignals(sample.signals);
    const trainingText = toTrainingSignalText(sample);

    // Assert
    expect(flat.length).toBeGreaterThan(0);
    expect(trainingText.length).toBeGreaterThan(0);
  });

  it("filtra por dificuldade e por tipo", () => {
    // Arrange
    const sample = TRAINING_SAMPLES[0];

    // Act
    const byDifficulty = getTrainingSamplesByDifficulty(sample.difficulty);
    const byType = getTrainingSamplesByType(sample.type);

    // Assert
    expect(
      byDifficulty.every((item) => item.difficulty === sample.difficulty),
    ).toBe(true);
    expect(byType.every((item) => item.type === sample.type)).toBe(true);
  });

  it("mantém compatibilidade entre distribuição V1 e V2", () => {
    // Arrange & Act
    const dist = getTrainingDistribution();
    const distV2 = getTrainingV2Distribution();

    // Assert
    expect(distV2).toEqual(dist);
  });

  it("filtros V2 retornam itens consistentes", () => {
    // Arrange
    const sample = TRAINING_SAMPLES[0];

    // Act
    const byDifficulty = getTrainingV2ByDifficulty(sample.difficulty);
    const byType = getTrainingV2ByType(sample.type);

    // Assert
    expect(
      byDifficulty.every((item) => item.difficulty === sample.difficulty),
    ).toBe(true);
    expect(byType.every((item) => item.type === sample.type)).toBe(true);
  });
});
