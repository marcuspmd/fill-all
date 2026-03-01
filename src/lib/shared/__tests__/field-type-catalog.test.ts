import { describe, expect, it } from "vitest";
import {
  getFieldTypeLabel,
  getFieldTypeOptions,
  getFieldTypeGroupedOptions,
} from "../field-type-catalog";

describe("field-type-catalog", () => {
  it("getFieldTypeLabel uses overrides when available", () => {
    expect(getFieldTypeLabel("cpf")).toBe("CPF");
    expect(getFieldTypeLabel("cnpj")).toBe("CNPJ");
    expect(getFieldTypeLabel("full-name")).toBe("Nome Completo");
  });

  it("getFieldTypeLabel falls back to title-cased string when no override", () => {
    // "tax-id" may not be in overrides, let's test one that definitely isn't or could be manually provided
    expect(getFieldTypeLabel("foo-bar" as any)).toBe("Foo Bar");
    expect(getFieldTypeLabel("something" as any)).toBe("Something");
  });

  it("getFieldTypeOptions returns a sorted array of options", () => {
    const options = getFieldTypeOptions(["cpf", "cep", "email", "address"]);

    // Label for address will be "Address", cep is "CEP", cpf is "CPF", email is "Email"
    // Order in pt-BR should roughly be: Address, CEP, CPF, Email
    expect(options[0].value).toBe("address");
    expect(options[1].value).toBe("cep");
    expect(options[2].value).toBe("cpf");
    expect(options[3].value).toBe("email");
  });

  it("getFieldTypeOptions defaults to all FIELD_TYPES", () => {
    const options = getFieldTypeOptions();
    expect(options.length).toBeGreaterThan(10);
    // Spot check one
    expect(options.find((o) => o.value === "cpf")?.label).toBe("CPF");
  });
});

describe("getFieldTypeGroupedOptions", () => {
  it("returns groups with non-empty options only", () => {
    const groups = getFieldTypeGroupedOptions(["cpf", "email"]);
    expect(groups.every((g) => g.options.length > 0)).toBe(true);
  });

  it("options within each group are sorted alphabetically in pt-BR", () => {
    const groups = getFieldTypeGroupedOptions();
    for (const group of groups) {
      const labels = group.options.map((o) => o.label);
      const sorted = [...labels].sort((a, b) => a.localeCompare(b, "pt-BR"));
      expect(labels).toEqual(sorted);
    }
  });

  it("groups themselves are sorted alphabetically in pt-BR", () => {
    const groups = getFieldTypeGroupedOptions();
    const labels = groups.map((g) => g.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, "pt-BR"));
    expect(labels).toEqual(sorted);
  });

  it("each group has a label and category", () => {
    const groups = getFieldTypeGroupedOptions(["cpf", "email", "address"]);
    for (const group of groups) {
      expect(typeof group.label).toBe("string");
      expect(group.label.length).toBeGreaterThan(0);
      expect(typeof group.category).toBe("string");
    }
  });

  it("respects the provided subset of types", () => {
    const groups = getFieldTypeGroupedOptions(["cpf", "cnpj"]);
    const allValues = groups.flatMap((g) => g.options.map((o) => o.value));
    expect(allValues).toContain("cpf");
    expect(allValues).toContain("cnpj");
    expect(allValues).not.toContain("email");
  });

  it("defaults to all FIELD_TYPES when called with no arguments", () => {
    const groups = getFieldTypeGroupedOptions();
    const allValues = groups.flatMap((g) => g.options.map((o) => o.value));
    expect(allValues.length).toBeGreaterThan(10);
    expect(allValues).toContain("cpf");
    expect(allValues).toContain("email");
  });
});
