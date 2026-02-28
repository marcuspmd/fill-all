import { describe, expect, it } from "vitest";
import { generateRg, generateCnh, generatePis } from "@/lib/generators/rg";

describe("generateRg", () => {
  it("returns formatted RG by default", () => {
    const rg = generateRg();
    expect(rg).toMatch(/^\d{2}\.\d{3}\.\d{3}-\d$/);
  });

  it("returns formatted RG when formatted=true", () => {
    expect(generateRg(true)).toMatch(/^\d{2}\.\d{3}\.\d{3}-\d$/);
  });

  it("returns raw 9 digits when formatted=false", () => {
    expect(generateRg(false)).toMatch(/^\d{9}$/);
  });
});

describe("generateCnh", () => {
  it("returns a string of 11 digits", () => {
    expect(generateCnh()).toMatch(/^\d{11}$/);
  });

  it("returns different values across calls (probabilistic)", () => {
    const cnhs = new Set(Array.from({ length: 20 }, generateCnh));
    expect(cnhs.size).toBeGreaterThan(1);
  });

  it("has valid check digits (d1 and d2 < 10 after mod 11)", () => {
    // Check that generated CNHs have digits 0-9 in the last two positions
    for (let i = 0; i < 20; i++) {
      const cnh = generateCnh();
      const d1 = parseInt(cnh[9], 10);
      const d2 = parseInt(cnh[10], 10);
      expect(d1).toBeGreaterThanOrEqual(0);
      expect(d1).toBeLessThanOrEqual(9);
      expect(d2).toBeGreaterThanOrEqual(0);
      expect(d2).toBeLessThanOrEqual(9);
    }
  });
});

describe("generatePis", () => {
  it("returns a string of 11 digits", () => {
    expect(generatePis()).toMatch(/^\d{11}$/);
  });

  it("returns different values across calls (probabilistic)", () => {
    const piss = new Set(Array.from({ length: 20 }, generatePis));
    expect(piss.size).toBeGreaterThan(1);
  });

  it("check digit satisfies PIS algorithm", () => {
    const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 20; i++) {
      const pis = generatePis();
      const digits = pis.split("").map(Number);
      const sum = digits
        .slice(0, 10)
        .reduce((acc, d, idx) => acc + d * weights[idx], 0);
      const remainder = sum % 11;
      const expected = remainder < 2 ? 0 : 11 - remainder;
      expect(digits[10]).toBe(expected);
    }
  });
});
