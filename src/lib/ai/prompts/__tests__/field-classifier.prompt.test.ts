import { describe, expect, it } from "vitest";
import {
  fieldClassifierPrompt,
  CLASSIFIER_MIN_CONFIDENCE,
} from "../field-classifier.prompt";
import type {
  FieldClassifierInput,
  FieldClassifierOutput,
} from "../field-classifier.prompt";

// ── Constants ─────────────────────────────────────────────────────────────────

describe("CLASSIFIER_MIN_CONFIDENCE", () => {
  it("is a number between 0 and 1", () => {
    expect(typeof CLASSIFIER_MIN_CONFIDENCE).toBe("number");
    expect(CLASSIFIER_MIN_CONFIDENCE).toBeGreaterThan(0);
    expect(CLASSIFIER_MIN_CONFIDENCE).toBeLessThan(1);
  });
});

// ── fieldClassifierPrompt metadata ───────────────────────────────────────────

describe("fieldClassifierPrompt metadata", () => {
  it("has expected id and version", () => {
    expect(fieldClassifierPrompt.id).toBe("field-classifier");
    expect(fieldClassifierPrompt.version).toBe("2.0.0");
  });

  it("has role system", () => {
    expect(fieldClassifierPrompt.role).toBe("system");
  });

  it("has persona about Brazilian web forms", () => {
    expect(fieldClassifierPrompt.persona).toContain("Brazilian");
  });

  it("has outputSchema with fieldType, confidence and generatorType", () => {
    const schema = fieldClassifierPrompt.outputSchema!;
    const names = schema.map((f) => f.name);
    expect(names).toContain("fieldType");
    expect(names).toContain("confidence");
    expect(names).toContain("generatorType");
  });

  it("has at least one example", () => {
    expect(fieldClassifierPrompt.examples?.length).toBeGreaterThan(0);
  });

  it("has at least one rule", () => {
    expect(fieldClassifierPrompt.rules.length).toBeGreaterThan(0);
  });
});

// ── buildPrompt ───────────────────────────────────────────────────────────────

describe("fieldClassifierPrompt.buildPrompt", () => {
  it("includes the element HTML in the output", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="email" name="email">',
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain('<input type="email" name="email">');
    expect(result).toContain("Element HTML");
  });

  it("includes surrounding HTML when provided", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text" name="cpf">',
      contextHtml: "<label>CPF</label>",
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain("<label>CPF</label>");
    expect(result).toContain("Surrounding HTML");
  });

  it("omits surrounding HTML section when contextHtml is undefined", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).not.toContain("Surrounding HTML");
  });

  it("includes field signals when provided", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
      signals: "cpf documento número",
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain("cpf documento número");
    expect(result).toContain("Field Signals");
  });

  it("omits field signals section when signals is empty string", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
      signals: "   ",
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).not.toContain("Field Signals");
  });

  it("omits field signals section when signals is undefined", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).not.toContain("Field Signals");
  });

  it("truncates elementHtml longer than 1000 chars with ellipsis", () => {
    const longHtml = "a".repeat(1200);
    const input: FieldClassifierInput = { elementHtml: longHtml };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain("a".repeat(1000) + "…");
    expect(result).not.toContain("a".repeat(1001));
  });

  it("does not truncate elementHtml of exactly 1000 chars", () => {
    const exactHtml = "a".repeat(1000);
    const input: FieldClassifierInput = { elementHtml: exactHtml };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).not.toContain("…");
  });

  it("truncates contextHtml longer than 1000 chars with ellipsis", () => {
    const longCtx = "x".repeat(1200);
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
      contextHtml: longCtx,
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain("x".repeat(1000) + "…");
  });

  it("does not truncate contextHtml of exactly 1000 chars", () => {
    const exactCtx = "x".repeat(1000);
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
      contextHtml: exactCtx,
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    // The exact html won't have ellipsis
    expect(result).toContain(exactCtx);
    expect(result).not.toContain("x".repeat(1001));
  });

  it("includes persona, task and rules from the base", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain(fieldClassifierPrompt.persona);
    expect(result).toContain(fieldClassifierPrompt.task);
  });

  it("includes 'Classify this form field' context marker", () => {
    const input: FieldClassifierInput = {
      elementHtml: '<input type="text">',
    };
    const result = fieldClassifierPrompt.buildPrompt(input);
    expect(result).toContain("Classify this form field");
  });
});

// ── parseResponse ─────────────────────────────────────────────────────────────

describe("fieldClassifierPrompt.parseResponse", () => {
  it("parses a valid JSON response", () => {
    const raw =
      '{"fieldType": "email", "confidence": 0.95, "generatorType": "email"}';
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result.fieldType).toBe("email");
    expect(result.confidence).toBe(0.95);
    expect(result.generatorType).toBe("email");
  });

  it("parses a valid JSON response embedded in other text", () => {
    const raw =
      'Here is the result: {"fieldType": "cpf", "confidence": 0.90, "generatorType": "cpf"} done.';
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result.fieldType).toBe("cpf");
    expect(result.confidence).toBe(0.9);
  });

  it("returns null when raw has no JSON object", () => {
    expect(fieldClassifierPrompt.parseResponse("just plain text")).toBeNull();
    expect(fieldClassifierPrompt.parseResponse("")).toBeNull();
  });

  it("returns null when JSON has invalid fieldType", () => {
    const raw =
      '{"fieldType": "invalid-type-xyz", "confidence": 0.95, "generatorType": "email"}';
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("returns null when fieldType is missing", () => {
    const raw = '{"confidence": 0.95, "generatorType": "email"}';
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("returns null when confidence is missing", () => {
    const raw = '{"fieldType": "email", "generatorType": "email"}';
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("returns null when confidence is a string instead of number", () => {
    const raw =
      '{"fieldType": "email", "confidence": "high", "generatorType": "email"}';
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("returns null when fieldType is 'unknown'", () => {
    const raw =
      '{"fieldType": "unknown", "confidence": 0.95, "generatorType": "unknown"}';
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("returns null when confidence is below CLASSIFIER_MIN_CONFIDENCE", () => {
    const raw = `{"fieldType": "email", "confidence": ${CLASSIFIER_MIN_CONFIDENCE - 0.01}, "generatorType": "email"}`;
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("accepts confidence exactly at CLASSIFIER_MIN_CONFIDENCE", () => {
    const raw = `{"fieldType": "email", "confidence": ${CLASSIFIER_MIN_CONFIDENCE}, "generatorType": "email"}`;
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result.confidence).toBe(CLASSIFIER_MIN_CONFIDENCE);
  });

  it("clamps confidence above 1.0 to 1.0", () => {
    const raw =
      '{"fieldType": "email", "confidence": 1.5, "generatorType": "email"}';
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(1);
  });

  it("clamps confidence below 0 to 0 (and returns null because below min confidence)", () => {
    const raw =
      '{"fieldType": "email", "confidence": -0.5, "generatorType": "email"}';
    expect(fieldClassifierPrompt.parseResponse(raw)).toBeNull();
  });

  it("falls back to fieldType when generatorType is invalid", () => {
    const raw =
      '{"fieldType": "email", "confidence": 0.95, "generatorType": "not-valid-type"}';
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result!.generatorType).toBe("email");
  });

  it("falls back to fieldType when generatorType is missing", () => {
    const raw = '{"fieldType": "cpf", "confidence": 0.90}';
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result!.generatorType).toBe("cpf");
  });

  it("returns null for malformed JSON", () => {
    expect(fieldClassifierPrompt.parseResponse("{broken json")).toBeNull();
  });

  it("handles JSON with extra whitespace", () => {
    const raw = `{
      "fieldType": "phone",
      "confidence": 0.88,
      "generatorType": "phone"
    }`;
    const result = fieldClassifierPrompt.parseResponse(
      raw,
    ) as FieldClassifierOutput;
    expect(result).not.toBeNull();
    expect(result!.fieldType).toBe("phone");
  });
});
