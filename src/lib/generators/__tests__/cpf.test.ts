import { describe, expect, it, vi } from "vitest";
import { generateCpf, validateCpf } from "@/lib/generators/cpf";

describe("generateCpf", () => {
  it("returns formatted CPF by default", () => {
    const cpf = generateCpf();
    expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  it("returns formatted CPF when formatted=true", () => {
    const cpf = generateCpf(true);
    expect(cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  it("returns raw 11 digits when formatted=false", () => {
    const cpf = generateCpf(false);
    expect(cpf).toMatch(/^\d{11}$/);
  });

  it("always generates a CPF with valid check digits (unformatted)", () => {
    for (let i = 0; i < 30; i++) {
      expect(validateCpf(generateCpf(false))).toBe(true);
    }
  });

  it("always generates a CPF with valid check digits (formatted)", () => {
    for (let i = 0; i < 10; i++) {
      expect(validateCpf(generateCpf(true))).toBe(true);
    }
  });

  it("retries when all 9 random digits are the same", () => {
    const randomSpy = vi.spyOn(Math, "random");
    // First 9 calls return 0.5 → all digits = 5 → triggers retry
    for (let i = 0; i < 9; i++) randomSpy.mockReturnValueOnce(0.5);
    // Next 9 calls return valid distinct digits
    const validDigits = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    for (const d of validDigits) randomSpy.mockReturnValueOnce(d);

    const cpf = generateCpf(false);
    expect(cpf).toMatch(/^\d{11}$/);
    expect(validateCpf(cpf)).toBe(true);
    randomSpy.mockRestore();
  });
});

describe("validateCpf", () => {
  it("returns true for a known valid CPF (formatted)", () => {
    // 529.982.247-25 is a mathematically valid CPF
    expect(validateCpf("529.982.247-25")).toBe(true);
  });

  it("returns true for a known valid CPF (raw digits)", () => {
    expect(validateCpf("52998224725")).toBe(true);
  });

  it("returns false for all-same-digit CPFs", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validateCpf(String(d).repeat(11))).toBe(false);
    }
  });

  it("returns false for CPF with wrong length (too short)", () => {
    expect(validateCpf("123456789")).toBe(false);
  });

  it("returns false for CPF with wrong length (too long)", () => {
    expect(validateCpf("1234567890123")).toBe(false);
  });

  it("returns false for CPF with invalid last check digit", () => {
    // 52998224724 — last digit should be 5
    expect(validateCpf("52998224724")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateCpf("")).toBe(false);
  });
});
