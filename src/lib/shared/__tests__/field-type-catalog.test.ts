import { describe, expect, it } from "vitest";
import { getFieldTypeLabel, getFieldTypeOptions } from "../field-type-catalog";

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
