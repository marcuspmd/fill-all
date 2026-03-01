import { describe, expect, it } from "vitest";
import {
  generateCreditCardNumber,
  generateCreditCardExpiration,
  generateCreditCardCvv,
  generatePixKey,
} from "@/lib/generators/finance";

describe("generateCreditCardNumber", () => {
  it("returns a non-empty string", () => {
    expect(generateCreditCardNumber()).toBeTruthy();
    expect(typeof generateCreditCardNumber()).toBe("string");
  });

  it("contains only digits and common separator characters", () => {
    const number = generateCreditCardNumber();
    expect(number).toMatch(/^[\d\s-]+$/);
  });
});

describe("generateCreditCardExpiration", () => {
  it("returns MM/YY format", () => {
    const exp = generateCreditCardExpiration();
    expect(exp).toMatch(/^\d{2}\/\d{2}$/);
  });

  it("month is between 01 and 12", () => {
    for (let i = 0; i < 20; i++) {
      const [mm] = generateCreditCardExpiration().split("/").map(Number);
      expect(mm).toBeGreaterThanOrEqual(1);
      expect(mm).toBeLessThanOrEqual(12);
    }
  });

  it("year is between 1 and 5 years ahead", () => {
    const currentYear = new Date().getFullYear() % 100;
    for (let i = 0; i < 20; i++) {
      const [, yy] = generateCreditCardExpiration().split("/").map(Number);
      expect(yy).toBeGreaterThan(currentYear);
      expect(yy).toBeLessThanOrEqual(currentYear + 5);
    }
  });
});

describe("generateCreditCardCvv", () => {
  it("returns a 3-digit string", () => {
    const cvv = generateCreditCardCvv();
    expect(cvv).toMatch(/^\d{3}$/);
  });
});

describe("generatePixKey", () => {
  it("returns a non-empty string", () => {
    const key = generatePixKey();
    expect(key.length).toBeGreaterThan(0);
    expect(typeof key).toBe("string");
  });

  it("returns different values across calls (probabilistic)", () => {
    const keys = new Set(Array.from({ length: 20 }, generatePixKey));
    expect(keys.size).toBeGreaterThan(1);
  });
});
