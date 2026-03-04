import { describe, expect, it } from "vitest";
import { generateFromPattern } from "../pattern";

describe("generateFromPattern", () => {
  it("returns a string for default pattern", () => {
    const result = generateFromPattern();
    expect(typeof result).toBe("string");
    expect(result).toMatch(/^\d{8}$/);
  });

  it("# is replaced by a digit (0–9)", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateFromPattern("#")).toMatch(/^\d$/);
    }
  });

  it("A is replaced by an uppercase letter", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateFromPattern("A")).toMatch(/^[A-Z]$/);
    }
  });

  it("a is replaced by a lowercase letter", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateFromPattern("a")).toMatch(/^[a-z]$/);
    }
  });

  it("? is replaced by any letter (upper or lower)", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateFromPattern("?")).toMatch(/^[a-zA-Z]$/);
    }
  });

  it("* is replaced by any alphanumeric character", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateFromPattern("*")).toMatch(/^[a-zA-Z0-9]$/);
    }
  });

  it("literal characters are preserved", () => {
    const result = generateFromPattern("PREFIX-###");
    expect(result).toMatch(/^PREFIX-\d{3}$/);
  });

  it("mixed pattern generates correct structure", () => {
    const result = generateFromPattern("AA-##-aa");
    expect(result).toMatch(/^[A-Z]{2}-\d{2}-[a-z]{2}$/);
  });

  it("hyphen and other punctuation are treated as literals", () => {
    expect(generateFromPattern("###-###")).toMatch(/^\d{3}-\d{3}$/);
  });

  it("backslash escapes the next token as literal", () => {
    // \# should produce the literal character '#', not a digit
    const result = generateFromPattern("\\##");
    expect(result).toMatch(/^#\d$/);
  });

  it("complex pattern produces correct length", () => {
    const pattern = "AAA-###-aaa-???-***";
    const result = generateFromPattern(pattern);
    // AAA(3) + -(1) + ###(3) + -(1) + aaa(3) + -(1) + ???(3) + -(1) + ***(3) = 19
    expect(result.length).toBe(19);
  });

  it("all-digit pattern AAA produces 3 uppercase letters", () => {
    expect(generateFromPattern("AAA")).toMatch(/^[A-Z]{3}$/);
  });

  it("empty pattern returns empty string", () => {
    expect(generateFromPattern("")).toBe("");
  });
});
