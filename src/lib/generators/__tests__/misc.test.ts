import { afterEach, describe, expect, it, vi } from "vitest";
import * as misc from "../misc";

describe("misc", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generatePassword generates default length", () => {
    const pwd = misc.generatePassword();
    expect(typeof pwd).toBe("string");
    expect(pwd.length).toBe(12);
  });

  it("generatePassword generates custom length", () => {
    const pwd = misc.generatePassword(8);
    expect(typeof pwd).toBe("string");
    expect(pwd.length).toBe(8);
  });

  it("generateUsername returns string", () => {
    expect(typeof misc.generateUsername()).toBe("string");
  });

  it("generateNumber with custom bounds", () => {
    const numStr = misc.generateNumber(1, 10);
    const num = parseInt(numStr, 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(10);
  });

  it("generateNumber with default bounds", () => {
    const numStr = misc.generateNumber();
    const num = parseInt(numStr, 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(99999);
  });

  it("generateNumber with partial defaults", () => {
    const numStr = misc.generateNumber(50);
    const num = parseInt(numStr, 10);
    expect(num).toBeGreaterThanOrEqual(50);
    expect(num).toBeLessThanOrEqual(99999);
  });

  it("generateText with custom word count", () => {
    const text = misc.generateText(5);
    expect(text.split(" ").length).toBeGreaterThanOrEqual(1);
  });

  it("generateText with default word count", () => {
    const text = misc.generateText();
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  });

  it("generateDescription returns a sentence", () => {
    expect(typeof misc.generateDescription()).toBe("string");
  });

  it("generateNotes returns sentences", () => {
    expect(typeof misc.generateNotes()).toBe("string");
  });

  it("generateMoney with custom bounds", () => {
    const m = misc.generateMoney(10, 20);
    expect(typeof m).toBe("string");
  });

  it("generateMoney with default bounds", () => {
    const m = misc.generateMoney();
    const val = parseFloat(m);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(10000);
  });

  it("generateMoney with partial defaults", () => {
    const m = misc.generateMoney(500);
    const val = parseFloat(m);
    expect(val).toBeGreaterThanOrEqual(500);
  });

  it("generateWebsite", () => {
    expect(typeof misc.generateWebsite()).toBe("string");
  });

  it("generateProductName", () => {
    expect(typeof misc.generateProductName()).toBe("string");
  });

  it("generateSku", () => {
    const sku = misc.generateSku();
    expect(sku.length).toBe(8);
  });

  it("generateCoupon", () => {
    const coupon = misc.generateCoupon();
    expect(coupon.length).toBe(10);
  });

  it("generateJobTitle", () => {
    expect(typeof misc.generateJobTitle()).toBe("string");
  });

  it("generateDepartment", () => {
    expect(typeof misc.generateDepartment()).toBe("string");
  });

  it("generateCpfCnpj returns CPF when random < 0.6", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.3);
    const doc = misc.generateCpfCnpj();
    expect(doc.length).toBe(14);
  });

  it("generateCpfCnpj returns CNPJ when random >= 0.6", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.8);
    const doc = misc.generateCpfCnpj();
    expect(doc.length).toBe(18);
  });

  it("generateEmployeeCount", () => {
    const num = parseInt(misc.generateEmployeeCount(), 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(10000);
  });

  it("generateOtp with custom length", () => {
    expect(misc.generateOtp(4).length).toBe(4);
  });

  it("generateOtp with default length", () => {
    expect(misc.generateOtp().length).toBe(6);
  });

  it("generateVerificationCode with custom length", () => {
    expect(misc.generateVerificationCode(5).length).toBe(5);
  });

  it("generateVerificationCode with default length", () => {
    expect(misc.generateVerificationCode().length).toBe(6);
  });

  it("generatePassport", () => {
    expect(misc.generatePassport().length).toBe(8);
  });

  it("generateNationalId", () => {
    expect(misc.generateNationalId().length).toBe(10);
  });

  it("generateTaxId", () => {
    expect(misc.generateTaxId().length).toBe(11);
  });

  it("generateDocumentIssuer", () => {
    expect(typeof misc.generateDocumentIssuer()).toBe("string");
  });
});
