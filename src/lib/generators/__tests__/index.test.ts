import { describe, expect, it } from "vitest";
import { generate } from "../index";

describe("index central generator map", () => {
  it("generates for known field types", () => {
    const val = generate("cpf");
    expect(typeof val).toBe("string");
    expect(val.length).toBeGreaterThan(0);
  });

  it("falls back to text generator for unknown types", () => {
    // We cast to any because TS wouldn't let us pass an invalid type normally
    const val = generate("unknown-weird-type" as any);
    expect(typeof val).toBe("string");
    expect(val.split(" ").length).toBeGreaterThan(0);
  });

  describe("overrideParams", () => {
    it("generates CPF without formatting when formatted=false", () => {
      const val = generate("cpf", { formatted: false });
      expect(val).toMatch(/^\d{11}$/);
    });

    it("generates CPF with formatting when formatted=true", () => {
      const val = generate("cpf", { formatted: true });
      expect(val).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });

    it("generates CNPJ without formatting when formatted=false", () => {
      const val = generate("cnpj", { formatted: false });
      expect(val).toMatch(/^\d{14}$/);
    });

    it("generates password with custom length", () => {
      const val = generate("password", { length: 20 });
      expect(val.length).toBe(20);
    });

    it("generates OTP with custom length", () => {
      const val = generate("otp", { length: 8 });
      expect(val).toMatch(/^\d{8}$/);
    });

    it("generates number within custom min/max range", () => {
      for (let i = 0; i < 10; i++) {
        const val = Number(generate("number", { min: 100, max: 200 }));
        expect(val).toBeGreaterThanOrEqual(100);
        expect(val).toBeLessThanOrEqual(200);
      }
    });

    it("merges overrideParams with default params from definitions", () => {
      // birth-date has default min=18, max=65
      // Override only min — max should still be 65
      const val = generate("birth-date", { min: 25 });
      expect(typeof val).toBe("string");
      expect(val.length).toBeGreaterThan(0);
    });

    it("falls back to text when fieldType has no generator and overrideParams given", () => {
      const val = generate("unknown" as any, { formatted: true });
      expect(typeof val).toBe("string");
    });

    it("uses default params when overrideParams is undefined", () => {
      // CPF defaults to formatted=true
      const val = generate("cpf");
      expect(val).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
    });

    it("generates date in ISO format when dateFormat='iso'", () => {
      const val = generate("date", { dateFormat: "iso" });
      expect(val).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("generates date in BR format when dateFormat='br'", () => {
      const val = generate("date", { dateFormat: "br" });
      expect(val).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("generates date in US format when dateFormat='us'", () => {
      const val = generate("date", { dateFormat: "us" });
      expect(val).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("generates birth-date with custom dateFormat", () => {
      const val = generate("birth-date", { dateFormat: "br" });
      expect(val).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("generates future-date with custom dateFormat", () => {
      const val = generate("start-date", { dateFormat: "br" });
      expect(val).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });
});
