import { describe, expect, it, vi } from "vitest";
import {
  DATASET_META,
  DATASET_VERSION,
  augmentDrop,
  augmentShuffle,
  augmentTypo,
  checkDatasetHealth,
  normalizeSignals,
} from "@/lib/dataset/dataset-config";

describe("dataset-config", () => {
  it("expõe metadados e versão consistentes", () => {
    // Arrange & Act
    const version = DATASET_VERSION;
    const meta = DATASET_META;

    // Assert
    expect(meta.version).toBe(version);
    expect(meta.splits.total).toBe(
      meta.splits.training + meta.splits.validation + meta.splits.test,
    );
  });

  it("normaliza sinais com lowercase e trim", () => {
    // Arrange
    const label = "  Nome Completo  ";
    const placeholder = " Digite Aqui ";

    // Act
    const normalized = normalizeSignals(
      label,
      undefined,
      undefined,
      placeholder,
    );

    // Assert
    expect(normalized).toBe("nome completo digite aqui");
  });

  it("shuffle e typo mantêm tokens válidos", () => {
    // Arrange
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Act
    const shuffled = augmentShuffle("nome completo cliente");
    const typo = augmentTypo("cliente");

    // Assert
    expect(shuffled.split(" ").sort()).toEqual(
      ["nome", "completo", "cliente"].sort(),
    );
    expect(typo).toHaveLength("cliente".length);

    vi.restoreAllMocks();
  });

  it("drop mantém ao menos uma palavra", () => {
    // Arrange
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Act
    const dropped = augmentDrop("campo email principal", 1);

    // Assert
    expect(dropped).toBe("campo");

    vi.restoreAllMocks();
  });

  it("gera relatório de saúde com estrutura esperada", () => {
    // Arrange & Act
    const report = checkDatasetHealth();

    // Assert
    expect(report.totalSamples).toBeGreaterThan(0);
    expect(typeof report.hasLeakage).toBe("boolean");
    expect(Array.isArray(report.underrepresentedTypes)).toBe(true);
    expect(Array.isArray(report.leakedSignals)).toBe(true);
    expect(report.typeCounts).toBeTypeOf("object");
  });
});
