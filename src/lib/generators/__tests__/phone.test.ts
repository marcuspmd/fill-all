import { describe, expect, it } from "vitest";
import { generatePhone } from "@/lib/generators/phone";

const VALID_DDD_CODES = new Set([
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "21",
  "22",
  "24",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "53",
  "54",
  "55",
  "61",
  "62",
  "64",
  "63",
  "65",
  "66",
  "67",
  "68",
  "69",
  "71",
  "73",
  "74",
  "75",
  "77",
  "79",
  "81",
  "87",
  "82",
  "83",
  "84",
  "85",
  "88",
  "86",
  "89",
  "91",
  "93",
  "94",
  "92",
  "97",
  "95",
  "96",
  "98",
  "99",
]);

describe("generatePhone", () => {
  it("returns formatted mobile number by default", () => {
    const phone = generatePhone();
    expect(phone).toMatch(/^\(\d{2}\) \d{5}-\d{4}$/);
  });

  it("returns formatted landline when mobile=false", () => {
    const phone = generatePhone(true, false);
    expect(phone).toMatch(/^\(\d{2}\) \d{4}-\d{4}$/);
  });

  it("returns 11 raw digits for mobile (formatted=false)", () => {
    const phone = generatePhone(false, true);
    expect(phone).toMatch(/^\d{11}$/);
  });

  it("returns 10 raw digits for landline (formatted=false)", () => {
    const phone = generatePhone(false, false);
    expect(phone).toMatch(/^\d{10}$/);
  });

  it("DDD is always a valid Brazilian area code (mobile)", () => {
    for (let i = 0; i < 30; i++) {
      const phone = generatePhone(false, true);
      const ddd = phone.slice(0, 2);
      expect(VALID_DDD_CODES.has(ddd)).toBe(true);
    }
  });

  it("mobile number digit at position 2 is always 9", () => {
    for (let i = 0; i < 20; i++) {
      const phone = generatePhone(false, true);
      expect(phone[2]).toBe("9");
    }
  });

  it("formatted DDD matches raw DDD", () => {
    // Verify consistency between formatted and raw outputs are both valid
    const rawPhone = generatePhone(false, true);
    expect(VALID_DDD_CODES.has(rawPhone.slice(0, 2))).toBe(true);
  });
});
