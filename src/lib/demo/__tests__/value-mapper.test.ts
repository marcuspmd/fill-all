import { describe, it, expect } from "vitest";
import { mapValueToSource, resolveValueSource } from "@/lib/demo/value-mapper";
import type { FlowValueSource } from "@/lib/demo/demo.types";
import type { FieldType, GeneratorParams } from "@/types";

describe("mapValueToSource", () => {
  it("returns a fixed source when fieldType is null", () => {
    const result = mapValueToSource("hello", null);
    expect(result).toEqual({ type: "fixed", value: "hello" });
  });

  it("returns a fixed source when fieldType is undefined", () => {
    const result = mapValueToSource("hello", undefined);
    expect(result).toEqual({ type: "fixed", value: "hello" });
  });

  it("returns a generator source when fieldType is provided", () => {
    const result = mapValueToSource("123.456.789-09", "cpf" as FieldType);
    expect(result).toEqual({ type: "generator", fieldType: "cpf" });
  });

  it("includes params when provided and non-empty", () => {
    const params: GeneratorParams = { min: 1, max: 100 };
    const result = mapValueToSource("50", "number" as FieldType, params);

    expect(result).toEqual({
      type: "generator",
      fieldType: "number",
      params: { min: 1, max: 100 },
    });
  });

  it("omits params when empty object", () => {
    const result = mapValueToSource("test", "email" as FieldType, {});
    expect(result).toEqual({ type: "generator", fieldType: "email" });
    expect(result).not.toHaveProperty("params");
  });

  it("omits params when undefined", () => {
    const result = mapValueToSource("test", "email" as FieldType, undefined);
    expect(result).toEqual({ type: "generator", fieldType: "email" });
    expect(result).not.toHaveProperty("params");
  });

  it("preserves original value in fixed source", () => {
    const result = mapValueToSource("  spaces  ", null);
    expect(result).toEqual({ type: "fixed", value: "  spaces  " });
  });
});

describe("resolveValueSource", () => {
  const mockGenerate = (
    fieldType: FieldType,
    _params?: GeneratorParams,
  ): string => `generated_${fieldType}`;

  it("returns the fixed value for fixed sources", () => {
    const source: FlowValueSource = { type: "fixed", value: "my value" };
    const result = resolveValueSource(source, mockGenerate);
    expect(result).toBe("my value");
  });

  it("calls generateFn for generator sources", () => {
    const source: FlowValueSource = {
      type: "generator",
      fieldType: "cpf" as FieldType,
    };
    const result = resolveValueSource(source, mockGenerate);
    expect(result).toBe("generated_cpf");
  });

  it("passes params to generateFn", () => {
    const params: GeneratorParams = { formatted: true };
    const source: FlowValueSource = {
      type: "generator",
      fieldType: "cnpj" as FieldType,
      params,
    };

    let receivedParams: GeneratorParams | undefined;
    const spyGenerate = (ft: FieldType, p?: GeneratorParams) => {
      receivedParams = p;
      return `generated_${ft}`;
    };

    resolveValueSource(source, spyGenerate);
    expect(receivedParams).toEqual(params);
  });

  it("returns empty string for fixed source with empty value", () => {
    const source: FlowValueSource = { type: "fixed", value: "" };
    expect(resolveValueSource(source, mockGenerate)).toBe("");
  });
});
