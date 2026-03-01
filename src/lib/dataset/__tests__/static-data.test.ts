import { describe, it, expect } from "vitest";
import { TEST_SAMPLES, runTestEvaluation } from "../test-data";
import { VALIDATION_SAMPLES, evaluateClassifier } from "../validation-data";
import {
  FIELD_DICTIONARY,
  getDictionaryEntry,
  getEntriesByCategory,
  getEntriesByTag,
  matchSelectContext,
  getSelectableTypes,
} from "../field-dictionary";

describe("Dataset static exports", () => {
  it("should export valid test samples", () => {
    expect(TEST_SAMPLES).toBeDefined();
    expect(TEST_SAMPLES.length).toBeGreaterThan(0);
  });
  it("should export valid validation samples", () => {
    expect(VALIDATION_SAMPLES).toBeDefined();
    expect(VALIDATION_SAMPLES.length).toBeGreaterThan(0);
  });
  it("should export valid field dictionary", () => {
    expect(FIELD_DICTIONARY).toBeDefined();
    expect(Object.keys(FIELD_DICTIONARY).length).toBeGreaterThan(0);
  });
});

describe("Dataset functions", () => {
  it("should run runTestEvaluation", () => {
    const result = runTestEvaluation(() => "cpf" as any);
    expect(result.globalAccuracy).toBeGreaterThanOrEqual(0);
  });
  it("should run evaluateClassifier", () => {
    const result = evaluateClassifier(() => "email" as any);
    expect(result.globalAccuracy).toBeGreaterThanOrEqual(0);
  });
  it("should run getDictionaryEntry", () => {
    expect(getDictionaryEntry("cpf" as any)).toBeDefined();
    expect(getDictionaryEntry("unknown_type_xxx" as any)).toBeUndefined();
  });
  it("should run getEntriesByCategory", () => {
    expect(getEntriesByCategory("document").length).toBeGreaterThan(0);
  });
  it("should run getEntriesByTag", () => {
    expect(getEntriesByTag("tax").length).toBeGreaterThanOrEqual(0);
    expect(getEntriesByTag("unknown_tag").length).toBe(0);
  });
  it("should run matchSelectContext", () => {
    expect(matchSelectContext("estado")).toBeDefined();
    expect(matchSelectContext("unknown")).toBeUndefined();
  });
  it("should run getSelectableTypes", () => {
    expect(getSelectableTypes().length).toBeGreaterThan(0);
  });
});
