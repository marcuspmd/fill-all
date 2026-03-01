import { describe, expect, it } from "vitest";
import { generateCnpj, validateCnpj } from "@/lib/generators/cnpj";

describe("generateCnpj", () => {
  it("returns formatted CNPJ by default", () => {
    const cnpj = generateCnpj();
    expect(cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  });

  it("returns formatted CNPJ when formatted=true", () => {
    const cnpj = generateCnpj(true);
    expect(cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  });

  it("returns raw 14 digits when formatted=false", () => {
    const cnpj = generateCnpj(false);
    expect(cnpj).toMatch(/^\d{14}$/);
  });

  it("always generates a CNPJ with valid check digits (unformatted)", () => {
    for (let i = 0; i < 30; i++) {
      expect(validateCnpj(generateCnpj(false))).toBe(true);
    }
  });

  it("always generates a CNPJ with valid check digits (formatted)", () => {
    for (let i = 0; i < 10; i++) {
      expect(validateCnpj(generateCnpj(true))).toBe(true);
    }
  });

  it("generated CNPJ branch is always 0001", () => {
    for (let i = 0; i < 10; i++) {
      const cnpj = generateCnpj(false);
      expect(cnpj.slice(8, 12)).toBe("0001");
    }
  });
});

describe("validateCnpj", () => {
  it("returns true for a known valid CNPJ (formatted)", () => {
    // 11.222.333/0001-81 is mathematically valid
    expect(validateCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("returns true for a known valid CNPJ (raw digits)", () => {
    expect(validateCnpj("11222333000181")).toBe(true);
  });

  it("returns false for all-same-digit CNPJs", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validateCnpj(String(d).repeat(14))).toBe(false);
    }
  });

  it("returns false for CNPJ with wrong length (too short)", () => {
    expect(validateCnpj("112223330001")).toBe(false);
  });

  it("returns false for CNPJ with wrong length (too long)", () => {
    expect(validateCnpj("112223330001811")).toBe(false);
  });

  it("returns false for CNPJ with invalid check digits", () => {
    // 11222333000180 — last digit should be 1
    expect(validateCnpj("11222333000180")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateCnpj("")).toBe(false);
  });
});
