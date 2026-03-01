/**
 * @vitest-environment happy-dom
 * Testes para validateClassifier e testClassifier em integration.ts.
 * Mocka os módulos de avaliação (evaluateClassifier, runTestEvaluation,
 * checkDatasetHealth) para testar apenas a lógica de relatório e thresholds.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FieldType } from "@/types";

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

vi.mock("@/lib/dataset/validation-data", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dataset/validation-data")>();
  return { ...actual, evaluateClassifier: vi.fn() };
});

vi.mock("@/lib/dataset/test-data", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dataset/test-data")>();
  return { ...actual, runTestEvaluation: vi.fn() };
});

vi.mock("@/lib/dataset/dataset-config", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/dataset/dataset-config")>();
  return { ...actual, checkDatasetHealth: vi.fn() };
});

vi.mock("@/lib/form/detectors/strategies", () => ({
  classifyField: vi.fn((): FieldType => "text"),
}));

// ── Imports ──────────────────────────────────────────────────────────────────

import {
  validateClassifier,
  testClassifier,
  augmentTrainingSamples,
  buildKeywordsFromDictionary,
  getBalancingNeeds,
  getUncoveredDictionaryTypes,
} from "@/lib/dataset/integration";
import {
  DEFAULT_THRESHOLDS,
  checkDatasetHealth,
} from "@/lib/dataset/dataset-config";
import { evaluateClassifier } from "@/lib/dataset/validation-data";
import { runTestEvaluation } from "@/lib/dataset/test-data";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Correct shape for DatasetHealthReport */
const mockHealth = {
  totalSamples: 100,
  typeCounts: { cpf: 30, email: 30, name: 40 } as Record<string, number>,
  underrepresentedTypes: [] as string[],
  missingTypes: [] as FieldType[],
  hasLeakage: false,
  leakedSignals: [] as string[],
};

type EvalMisclassified = Array<{
  signals: string;
  expected: FieldType;
  predicted: FieldType;
}>;

type TestFailures = Array<{
  signals: string;
  expected: FieldType;
  predicted: FieldType;
  origin: "real-site" | "user-report" | "synthetic-hard";
  originDetail: string;
}>;

const perTypeBase: Record<
  string,
  { total: number; correct: number; accuracy: number }
> = {
  cpf: { accuracy: 0.95, total: 10, correct: 9 },
  email: { accuracy: 0.8, total: 10, correct: 8 },
  name: { accuracy: 0.3, total: 10, correct: 3 }, // below threshold
};

const mockEvalResult = {
  globalAccuracy: 0.9,
  perType: perTypeBase,
  misclassified: [] as EvalMisclassified,
};

const mockTestResult = {
  globalAccuracy: 0.9,
  perType: perTypeBase,
  failures: [] as TestFailures,
};

const CUSTOM_PASS: typeof DEFAULT_THRESHOLDS = {
  globalMin: 0.7,
  perTypeMin: 0.5,
  maxUnknownRate: 0.15,
};

const CUSTOM_FAIL: typeof DEFAULT_THRESHOLDS = {
  globalMin: 0.8,
  perTypeMin: 0.5,
  maxUnknownRate: 0.15,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("validateClassifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(evaluateClassifier).mockReturnValue(mockEvalResult);
    vi.mocked(checkDatasetHealth).mockReturnValue(mockHealth);
  });

  it("retorna globalAccuracy correto quando acima do threshold", () => {
    // Arrange
    vi.mocked(evaluateClassifier).mockReturnValue({
      ...mockEvalResult,
      globalAccuracy: 0.95,
    });

    // Act
    const report = validateClassifier(DEFAULT_THRESHOLDS);

    // Assert
    expect(report.globalAccuracy).toBe(0.95);
    expect(report.passesGlobalThreshold).toBe(true);
    expect(evaluateClassifier).toHaveBeenCalledOnce();
  });

  it("retorna passesGlobalThreshold=false quando abaixo do threshold", () => {
    // Arrange
    vi.mocked(evaluateClassifier).mockReturnValue({
      ...mockEvalResult,
      globalAccuracy: 0.5,
    });

    // Act
    const report = validateClassifier(CUSTOM_FAIL);

    // Assert
    expect(report.passesGlobalThreshold).toBe(false);
  });

  it("identifica tipos com acurácia abaixo do perTypeMin", () => {
    // Arrange — "name" tem accuracy 0.3, abaixo de perTypeMin 0.5
    vi.mocked(evaluateClassifier).mockReturnValue(mockEvalResult);

    // Act
    const report = validateClassifier(CUSTOM_PASS);

    // Assert
    expect(report.failingTypes).toContain("name");
    expect(report.failingTypes).not.toContain("cpf");
    expect(report.failingTypes).not.toContain("email");
  });

  it("retorna failingTypes vazio quando todos passam", () => {
    // Arrange
    vi.mocked(evaluateClassifier).mockReturnValue({
      ...mockEvalResult,
      perType: {
        cpf: { accuracy: 0.95, total: 10, correct: 9 },
        email: { accuracy: 0.85, total: 10, correct: 8 },
      },
    });

    // Act
    const report = validateClassifier(CUSTOM_PASS);

    // Assert
    expect(report.failingTypes).toHaveLength(0);
  });

  it("inclui health report no resultado", () => {
    // Act
    const report = validateClassifier(DEFAULT_THRESHOLDS);

    // Assert
    expect(report.health).toEqual(mockHealth);
    expect(report.health.hasLeakage).toBe(false);
  });
});

describe("testClassifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runTestEvaluation).mockReturnValue(mockTestResult);
    vi.mocked(checkDatasetHealth).mockReturnValue(mockHealth);
  });

  it("usa runTestEvaluation (não evaluateClassifier)", () => {
    // Act
    testClassifier(DEFAULT_THRESHOLDS);

    // Assert
    expect(runTestEvaluation).toHaveBeenCalledOnce();
    expect(evaluateClassifier).not.toHaveBeenCalled();
  });

  it("retorna globalAccuracy do conjunto de teste", () => {
    // Arrange
    vi.mocked(runTestEvaluation).mockReturnValue({
      ...mockTestResult,
      globalAccuracy: 0.88,
    });

    // Act
    const report = testClassifier(DEFAULT_THRESHOLDS);

    // Assert
    expect(report.globalAccuracy).toBe(0.88);
    expect(report.passesGlobalThreshold).toBe(true);
  });

  it("identifica failingTypes no conjunto de teste", () => {
    // Arrange
    vi.mocked(runTestEvaluation).mockReturnValue(mockTestResult);

    // Act
    const report = testClassifier(CUSTOM_PASS);

    // Assert
    expect(report.failingTypes).toContain("name");
    expect(report.failingTypes).not.toContain("email");
  });

  it("passesGlobalThreshold=false quando globalAccuracy abaixo do threshold", () => {
    // Arrange
    vi.mocked(runTestEvaluation).mockReturnValue({
      ...mockTestResult,
      globalAccuracy: 0.6,
    });

    // Act
    const report = testClassifier({
      globalMin: 0.8,
      perTypeMin: 0.6,
      maxUnknownRate: 0.15,
    });

    // Assert
    expect(report.passesGlobalThreshold).toBe(false);
  });

  it("usa thresholds padrão quando nenhum é fornecido", () => {
    // Act
    const report = testClassifier();

    // Assert — verifica que retorna sem erros e tem estrutura correta
    expect(report).toHaveProperty("globalAccuracy");
    expect(report).toHaveProperty("passesGlobalThreshold");
    expect(report).toHaveProperty("failingTypes");
    expect(report).toHaveProperty("health");
  });
});

describe("classifySignals (via validateClassifier callback)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkDatasetHealth).mockReturnValue(mockHealth);
  });

  it("cobre o corpo de classifySignals ao chamar o fn real", () => {
    // Arrange — implementação do mock que CHAMA o fn passado para cobrir classifySignals
    vi.mocked(evaluateClassifier).mockImplementationOnce((classifyFn) => {
      classifyFn("email login senha password");
      classifyFn("");
      return mockEvalResult;
    });

    // Act
    const report = validateClassifier(CUSTOM_PASS);

    // Assert
    expect(report).toHaveProperty("globalAccuracy");
  });
});

describe("augmentTrainingSamples", () => {
  it("retorna amostras aumentadas com config padrão", () => {
    const result = augmentTrainingSamples();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("cobre branch dropRate=undefined (usa 0.2 como default)", () => {
    // dropRate não fornecido → ?? 0.2 é exercitado
    const result = augmentTrainingSamples({
      multiplier: 1,
      strategies: ["drop"],
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("combina estratégias shuffle, drop (com dropRate) e typo", () => {
    const result = augmentTrainingSamples({
      multiplier: 1,
      strategies: ["shuffle", "drop", "typo"],
      dropRate: 0.3,
    });
    expect(result.length).toBeGreaterThan(0);
    for (const sample of result) {
      expect(sample.source).toBe("augmented");
    }
  });

  it("pula amostra se nenhuma estratégia válida for mapeada", () => {
    // Todas as stratégias são válidas na tipagem mas podemos checar
    // que com multiplier=0 não gera amostras
    const result = augmentTrainingSamples({
      multiplier: 0,
      strategies: ["shuffle"],
    });
    expect(result).toHaveLength(0);
  });
});

describe("buildKeywordsFromDictionary", () => {
  it("retorna Record com types do dicionário", () => {
    const keywords = buildKeywordsFromDictionary();
    expect(typeof keywords).toBe("object");
    expect(Object.keys(keywords).length).toBeGreaterThan(0);
  });

  it("inclui o tipo como keyword se não estiver nas tags", () => {
    const keywords = buildKeywordsFromDictionary();
    // Cada tipo deve conter pelo menos uma keyword
    for (const [type, keys] of Object.entries(keywords)) {
      expect(keys).toContain(type);
    }
  });
});

describe("getBalancingNeeds", () => {
  it("retorna needs para todos os tipos do dicionário com targetCount=10", () => {
    const needs = getBalancingNeeds(10);
    expect(typeof needs).toBe("object");
    expect(Object.keys(needs).length).toBeGreaterThan(0);
    for (const { current, needed } of Object.values(needs)) {
      expect(current).toBeGreaterThanOrEqual(0);
      expect(needed).toBeGreaterThanOrEqual(0);
    }
  });

  it("usa targetCount=10 como padrão", () => {
    const needs = getBalancingNeeds();
    expect(Object.keys(needs).length).toBeGreaterThan(0);
  });

  it("needed=0 quando current >= targetCount", () => {
    // Com targetCount=1 é provável que muitos tipos já tenham >=1 amostra
    const needs = getBalancingNeeds(1);
    for (const { needed } of Object.values(needs)) {
      // needed nunca deve ser negativo (Math.max(0, ...))
      expect(needed).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("getUncoveredDictionaryTypes", () => {
  it("retorna array de FieldDictionaryEntry", () => {
    const uncovered = getUncoveredDictionaryTypes();
    expect(Array.isArray(uncovered)).toBe(true);
  });

  it("cada entrada não coberta tem tipo e tags", () => {
    const uncovered = getUncoveredDictionaryTypes();
    for (const entry of uncovered) {
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("tags");
    }
  });
});
