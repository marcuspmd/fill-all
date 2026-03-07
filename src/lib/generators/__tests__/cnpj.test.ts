import { describe, expect, it } from "vitest";
import {
  generateCnpj,
  generateCnpjAlphanumeric,
  validateCnpj,
  validateCnpjAlphanumeric,
} from "@/lib/generators/cnpj";

// ── Classic numeric CNPJ ──────────────────────────────────────────────────────

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

// ── Alphanumeric CNPJ (RFB IN nº 2.229/2024) ─────────────────────────────────

describe("generateCnpjAlphanumeric", () => {
  it("returns formatted alphanumeric CNPJ by default", () => {
    const cnpj = generateCnpjAlphanumeric();
    // Raiz can be letters or digits; ordem and DV are digits only
    expect(cnpj).toMatch(
      /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/\d{4}-\d{2}$/,
    );
  });

  it("returns raw 14-char string when formatted=false", () => {
    const cnpj = generateCnpjAlphanumeric(false);
    expect(cnpj).toMatch(/^[0-9A-Z]{8}\d{4}\d{2}$/);
    expect(cnpj).toHaveLength(14);
  });

  it("raiz always contains at least one letter", () => {
    for (let i = 0; i < 20; i++) {
      const cnpj = generateCnpjAlphanumeric(false);
      expect(/[A-Z]/.test(cnpj.slice(0, 8))).toBe(true);
    }
  });

  it("ordem (positions 9-12) is always numeric", () => {
    for (let i = 0; i < 20; i++) {
      const cnpj = generateCnpjAlphanumeric(false);
      expect(cnpj.slice(8, 12)).toMatch(/^\d{4}$/);
    }
  });

  it("always generates a CNPJ with valid check digits", () => {
    for (let i = 0; i < 30; i++) {
      expect(validateCnpj(generateCnpjAlphanumeric(false))).toBe(true);
    }
  });

  it("generateCnpj(formatted, alphanumeric=true) delegates to alphanumeric generator", () => {
    for (let i = 0; i < 10; i++) {
      const cnpj = generateCnpj(false, true);
      expect(validateCnpjAlphanumeric(cnpj)).toBe(true);
    }
  });
});

// ── Validators ────────────────────────────────────────────────────────────────

describe("validateCnpj (classic)", () => {
  it("returns true for a known valid CNPJ (formatted)", () => {
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
    expect(validateCnpj("11222333000180")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateCnpj("")).toBe(false);
  });
});

describe("validateCnpj (alphanumeric)", () => {
  it("accepts a generated alphanumeric CNPJ (unformatted)", () => {
    const cnpj = generateCnpjAlphanumeric(false);
    expect(validateCnpj(cnpj)).toBe(true);
  });

  it("accepts a generated alphanumeric CNPJ (formatted)", () => {
    const cnpj = generateCnpjAlphanumeric(true);
    expect(validateCnpj(cnpj)).toBe(true);
  });

  it("strips formatting before validation (formatted alphanumeric)", () => {
    // Build a hand-crafted valid alphanumeric CNPJ to test formatting stripping
    const raw = generateCnpjAlphanumeric(false);
    const formatted = `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
    expect(validateCnpj(formatted)).toBe(true);
    expect(validateCnpj(raw)).toBe(true);
  });
});

describe("validateCnpjAlphanumeric", () => {
  it("returns true for a generated alphanumeric CNPJ", () => {
    expect(validateCnpjAlphanumeric(generateCnpjAlphanumeric(false))).toBe(
      true,
    );
  });

  it("returns false for an all-numeric CNPJ even if valid", () => {
    expect(validateCnpjAlphanumeric("11222333000181")).toBe(false);
  });

  it("returns false for invalid alphanumeric CNPJ (bad check digit)", () => {
    const cnpj = generateCnpjAlphanumeric(false);
    // Tamper with last character
    const tampered = cnpj.slice(0, 13) + (cnpj[13] === "0" ? "1" : "0");
    expect(validateCnpjAlphanumeric(tampered)).toBe(false);
  });
});
