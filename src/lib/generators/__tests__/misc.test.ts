import { describe, expect, it } from "vitest";
import * as misc from "../misc";

describe("misc", () => {
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

  it("generateNumber within bounds", () => {
    const numStr = misc.generateNumber(1, 10);
    const num = parseInt(numStr, 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(10);
  });

  it("generateText returns words", () => {
    const text = misc.generateText(5);
    expect(text.split(" ").length).toBeGreaterThanOrEqual(1);
  });

  it("generateDescription returns a sentence", () => {
    expect(typeof misc.generateDescription()).toBe("string");
  });

  it("generateNotes returns sentences", () => {
    expect(typeof misc.generateNotes()).toBe("string");
  });

  it("generateMoney", () => {
    const m = misc.generateMoney(10, 20);
    expect(typeof m).toBe("string");
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

  it("generateCpfCnpj", () => {
    const doc = misc.generateCpfCnpj();
    // length of formatted cpf is 14, cnpj is 18
    expect([14, 18]).toContain(doc.length);
  });

  it("generateEmployeeCount", () => {
    const num = parseInt(misc.generateEmployeeCount(), 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(10000);
  });

  it("generateOtp", () => {
    expect(misc.generateOtp(4).length).toBe(4);
  });

  it("generateVerificationCode", () => {
    expect(misc.generateVerificationCode(5).length).toBe(5);
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
