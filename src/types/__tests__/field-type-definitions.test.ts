import { describe, expect, it } from "vitest";
import {
  FIELD_TYPE_DEFINITIONS,
  GENERATOR_PARAM_DEFS,
  getDefinition,
  getDefaultParams,
  getGeneratorKey,
  getGeneratorParamDefs,
  getRange,
} from "@/types/field-type-definitions";

describe("FIELD_TYPE_DEFINITIONS", () => {
  it("contains at least one definition", () => {
    expect(FIELD_TYPE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("has no duplicate types", () => {
    const types = FIELD_TYPE_DEFINITIONS.map((d) => d.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every entry has type, category and description", () => {
    for (const def of FIELD_TYPE_DEFINITIONS) {
      expect(def.type).toBeTruthy();
      expect(def.category).toBeTruthy();
      expect(def.description).toBeTruthy();
    }
  });
});

describe("getDefinition", () => {
  it("returns definition for a known type", () => {
    const def = getDefinition("cpf");
    expect(def).toBeDefined();
    expect(def?.type).toBe("cpf");
    expect(def?.generator).toBe("cpf");
  });

  it("returns undefined for unknown type", () => {
    expect(getDefinition("unknown-type-xyz" as never)).toBeUndefined();
  });
});

describe("getDefaultParams", () => {
  it("returns params for cpf", () => {
    const params = getDefaultParams("cpf");
    expect(params).toEqual({ formatted: true });
  });

  it("returns undefined for type without params", () => {
    const def = FIELD_TYPE_DEFINITIONS.find((d) => !d.params);
    if (def) {
      expect(getDefaultParams(def.type)).toBeUndefined();
    }
  });
});

describe("getRange", () => {
  it("returns min/max from definition when present", () => {
    const range = getRange("money");
    expect(range.min).toBeGreaterThanOrEqual(0);
    expect(range.max).toBeGreaterThan(range.min);
  });

  it("returns fallbacks when type has no min/max", () => {
    const range = getRange("cpf", 5, 50);
    expect(range).toEqual({ min: 5, max: 50 });
  });
});

describe("getGeneratorKey", () => {
  it("returns generator key for a type with a generator", () => {
    expect(getGeneratorKey("cpf")).toBe("cpf");
  });

  it("returns null for a type without a generator", () => {
    const def = FIELD_TYPE_DEFINITIONS.find((d) => !d.generator);
    if (def) {
      expect(getGeneratorKey(def.type)).toBeNull();
    }
  });
});

describe("GENERATOR_PARAM_DEFS", () => {
  it("contains entries for key generators", () => {
    expect(GENERATOR_PARAM_DEFS["cpf"]).toBeDefined();
    expect(GENERATOR_PARAM_DEFS["money"]).toBeDefined();
    expect(GENERATOR_PARAM_DEFS["password"]).toBeDefined();
  });

  it("every param def has key, type, labelKey and defaultValue", () => {
    for (const [, defs] of Object.entries(GENERATOR_PARAM_DEFS)) {
      for (const def of defs) {
        expect(def.key).toBeTruthy();
        expect(["number", "boolean", "select"]).toContain(def.type);
        expect(def.labelKey).toBeTruthy();
        expect(def.defaultValue).toBeDefined();
      }
    }
  });

  it("boolean params have boolean defaultValue", () => {
    for (const [, defs] of Object.entries(GENERATOR_PARAM_DEFS)) {
      for (const def of defs) {
        if (def.type === "boolean") {
          expect(typeof def.defaultValue).toBe("boolean");
        }
      }
    }
  });

  it("number params have number defaultValue and valid min/max", () => {
    for (const [, defs] of Object.entries(GENERATOR_PARAM_DEFS)) {
      for (const def of defs) {
        if (def.type === "number") {
          expect(typeof def.defaultValue).toBe("number");
          if (def.min !== undefined && def.max !== undefined) {
            expect(def.min).toBeLessThanOrEqual(def.max);
          }
        }
      }
    }
  });

  it("select params have string defaultValue and non-empty selectOptions", () => {
    for (const [, defs] of Object.entries(GENERATOR_PARAM_DEFS)) {
      for (const def of defs) {
        if (def.type === "select") {
          expect(typeof def.defaultValue).toBe("string");
          expect(def.selectOptions).toBeDefined();
          expect(def.selectOptions!.length).toBeGreaterThan(0);
          for (const opt of def.selectOptions!) {
            expect(opt.value).toBeTruthy();
            expect(opt.labelKey).toBeTruthy();
          }
        }
      }
    }
  });
});

describe("getGeneratorParamDefs", () => {
  it("returns param defs for a known generator", () => {
    const defs = getGeneratorParamDefs("cpf");
    expect(defs).toHaveLength(1);
    expect(defs[0].key).toBe("formatted");
  });

  it("returns empty array for unknown generator", () => {
    expect(getGeneratorParamDefs("nonexistent")).toEqual([]);
  });

  it("returns multiple params for birth-date", () => {
    const defs = getGeneratorParamDefs("birth-date");
    expect(defs.length).toBeGreaterThanOrEqual(2);
    const keys = defs.map((d) => d.key);
    expect(keys).toContain("min");
    expect(keys).toContain("max");
  });

  it("returns dateFormat select param for date generators", () => {
    for (const genKey of ["date-iso", "birth-date", "future-date"]) {
      const defs = getGeneratorParamDefs(genKey);
      const dateFmt = defs.find((d) => d.key === "dateFormat");
      expect(dateFmt).toBeDefined();
      expect(dateFmt!.type).toBe("select");
      expect(dateFmt!.selectOptions!.length).toBeGreaterThanOrEqual(3);
    }
  });
});
