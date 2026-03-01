import { describe, expect, it } from "vitest";
import { fieldValueGeneratorPrompt } from "../field-value-generator.prompt";
import type { FieldValueInput } from "../field-value-generator.prompt";

// ── Metadata ──────────────────────────────────────────────────────────────────

describe("fieldValueGeneratorPrompt metadata", () => {
  it("has expected id and version", () => {
    expect(fieldValueGeneratorPrompt.id).toBe("field-value-generator");
    expect(fieldValueGeneratorPrompt.version).toBe("2.0.0");
  });

  it("has role system", () => {
    expect(fieldValueGeneratorPrompt.role).toBe("system");
  });

  it("has undefined outputSchema (plain-text response)", () => {
    expect(fieldValueGeneratorPrompt.outputSchema).toBeUndefined();
  });

  it("has persona about Brazilian web forms", () => {
    expect(fieldValueGeneratorPrompt.persona).toContain("Brazilian");
  });

  it("has at least one rule", () => {
    expect(fieldValueGeneratorPrompt.rules.length).toBeGreaterThan(0);
  });

  it("has at least one example with input/output", () => {
    expect(fieldValueGeneratorPrompt.examples?.length).toBeGreaterThan(0);
    const first = fieldValueGeneratorPrompt.examples![0];
    expect(first.input).toBeTruthy();
    expect(first.output).toBeTruthy();
  });
});

// ── buildPrompt ───────────────────────────────────────────────────────────────

describe("fieldValueGeneratorPrompt.buildPrompt", () => {
  it("includes inputType and fieldType in the output", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Type: text");
    expect(result).toContain("Detected as: cpf");
  });

  it("includes label when provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "full-name",
      label: "Nome completo",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Label: Nome completo");
  });

  it("omits label line when label is not provided", () => {
    const input: FieldValueInput = {
      inputType: "email",
      fieldType: "email",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    // Check only the context section (after the base prompt)
    const contextSection =
      result.split("Generate a value for this field:")[1] ?? "";
    expect(contextSection).not.toContain("Label:");
  });

  it("includes name when provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
      name: "cpf_number",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Name: cpf_number");
  });

  it("omits name line when name is not provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).not.toContain("Name:");
  });

  it("includes id when provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
      id: "field-cpf",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("ID: field-cpf");
  });

  it("omits id line when id is not provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).not.toContain("ID:");
  });

  it("includes placeholder when provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
      placeholder: "000.000.000-00",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Placeholder: 000.000.000-00");
  });

  it("omits placeholder line when placeholder is not provided", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).not.toContain("Placeholder:");
  });

  it("includes autocomplete when provided", () => {
    const input: FieldValueInput = {
      inputType: "email",
      fieldType: "email",
      autocomplete: "email",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Autocomplete: email");
  });

  it("omits autocomplete line when autocomplete is not provided", () => {
    const input: FieldValueInput = {
      inputType: "email",
      fieldType: "email",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).not.toContain("Autocomplete:");
  });

  it("includes 'Generate a value for this field' marker", () => {
    const input: FieldValueInput = {
      inputType: "text",
      fieldType: "cpf",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Generate a value for this field");
  });

  it("includes persona and task from the base prompt", () => {
    const input: FieldValueInput = {
      inputType: "email",
      fieldType: "email",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain(fieldValueGeneratorPrompt.persona);
    expect(result).toContain(fieldValueGeneratorPrompt.task);
  });

  it("builds prompt with all optional fields provided", () => {
    const input: FieldValueInput = {
      inputType: "email",
      fieldType: "email",
      label: "E-mail",
      name: "user_email",
      id: "email-field",
      placeholder: "seu@email.com",
      autocomplete: "email",
    };
    const result = fieldValueGeneratorPrompt.buildPrompt(input);
    expect(result).toContain("Label: E-mail");
    expect(result).toContain("Name: user_email");
    expect(result).toContain("ID: email-field");
    expect(result).toContain("Placeholder: seu@email.com");
    expect(result).toContain("Autocomplete: email");
    expect(result).toContain("Type: email");
    expect(result).toContain("Detected as: email");
  });
});

// ── parseResponse ─────────────────────────────────────────────────────────────

describe("fieldValueGeneratorPrompt.parseResponse", () => {
  it("returns the trimmed raw value when non-empty", () => {
    expect(
      fieldValueGeneratorPrompt.parseResponse("maria.santos@gmail.com"),
    ).toBe("maria.santos@gmail.com");
  });

  it("trims leading and trailing whitespace", () => {
    expect(fieldValueGeneratorPrompt.parseResponse("  529.982.247-25  ")).toBe(
      "529.982.247-25",
    );
  });

  it("returns null for empty string", () => {
    expect(fieldValueGeneratorPrompt.parseResponse("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(fieldValueGeneratorPrompt.parseResponse("   ")).toBeNull();
  });

  it("preserves multi-word values", () => {
    expect(
      fieldValueGeneratorPrompt.parseResponse("Ana Carolina de Souza"),
    ).toBe("Ana Carolina de Souza");
  });

  it("preserves values with special characters", () => {
    expect(fieldValueGeneratorPrompt.parseResponse("(11) 98765-4321")).toBe(
      "(11) 98765-4321",
    );
  });

  it("preserves single character values", () => {
    expect(fieldValueGeneratorPrompt.parseResponse("M")).toBe("M");
  });
});
