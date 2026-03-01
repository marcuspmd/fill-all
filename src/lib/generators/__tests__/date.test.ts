import { describe, expect, it } from "vitest";
import {
  generateDate,
  generateBirthDate,
  generateFutureDate,
  detectDateFormat,
  reformatDate,
} from "@/lib/generators/date";

describe("generateDate", () => {
  it("returns Brazilian format DD/MM/YYYY by default", () => {
    const date = generateDate();
    expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("returns Brazilian format when format='br'", () => {
    expect(generateDate("br")).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("returns ISO format YYYY-MM-DD when format='iso'", () => {
    const date = generateDate("iso");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns US format MM/DD/YYYY when format='us'", () => {
    const date = generateDate("us");
    expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("ISO date is parseable and within the past 5 years", () => {
    const dateStr = generateDate("iso");
    const date = new Date(dateStr);
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);

    expect(date.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(date.getTime()).toBeGreaterThanOrEqual(fiveYearsAgo.getTime());
  });
});

describe("generateBirthDate", () => {
  it("returns ISO date string YYYY-MM-DD", () => {
    expect(generateBirthDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("age is within default range 18-65", () => {
    const dateStr = generateBirthDate();
    const birthDate = new Date(dateStr + "T00:00:00Z");
    const now = new Date();
    const ageMs = now.getTime() - birthDate.getTime();
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);

    expect(ageYears).toBeGreaterThanOrEqual(17.9);
    expect(ageYears).toBeLessThanOrEqual(66);
  });

  it("respects custom minAge and maxAge", () => {
    const dateStr = generateBirthDate(25, 30);
    const birthDate = new Date(dateStr + "T00:00:00Z");
    const now = new Date();
    const ageYears =
      (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    expect(ageYears).toBeGreaterThanOrEqual(24.9);
    expect(ageYears).toBeLessThanOrEqual(31);
  });
});

describe("generateFutureDate", () => {
  it("returns ISO date string YYYY-MM-DD", () => {
    expect(generateFutureDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("date is in the future", () => {
    const dateStr = generateFutureDate();
    const futureDate = new Date(dateStr + "T23:59:59Z");
    expect(futureDate.getTime()).toBeGreaterThan(Date.now());
  });

  it("date is within default 365-day window", () => {
    const dateStr = generateFutureDate();
    const futureDate = new Date(dateStr + "T00:00:00Z");
    const maxFuture = new Date();
    maxFuture.setDate(maxFuture.getDate() + 366); // +1 day buffer

    expect(futureDate.getTime()).toBeLessThanOrEqual(maxFuture.getTime());
  });
});

describe("detectDateFormat", () => {
  it("returns 'iso' for inputType='date' regardless of placeholder", () => {
    expect(
      detectDateFormat({ inputType: "date", placeholder: "DD/MM/YYYY" }),
    ).toBe("iso");
    expect(detectDateFormat({ inputType: "date" })).toBe("iso");
  });

  it("returns 'br' when placeholder starts with DD", () => {
    expect(detectDateFormat({ placeholder: "DD/MM/YYYY" })).toBe("br");
    expect(detectDateFormat({ placeholder: "dd/mm/aaaa" })).toBe("br");
    expect(detectDateFormat({ placeholder: "DD-MM-YYYY" })).toBe("br");
  });

  it("returns 'us' when placeholder has MM before DD", () => {
    expect(detectDateFormat({ placeholder: "MM/DD/YYYY" })).toBe("us");
  });

  it("returns 'iso' when placeholder starts with YYYY or AAAA", () => {
    expect(detectDateFormat({ placeholder: "YYYY-MM-DD" })).toBe("iso");
    expect(detectDateFormat({ placeholder: "YYYY/MM/DD" })).toBe("iso");
  });

  it("returns 'iso' when pattern starts with 4-digit year", () => {
    expect(detectDateFormat({ pattern: "\\d{4}-\\d{2}-\\d{2}" })).toBe("iso");
  });

  it("returns 'br' when pattern ends with 4-digit year", () => {
    expect(detectDateFormat({ pattern: "\\d{2}/\\d{2}/\\d{4}" })).toBe("br");
  });

  it("returns 'iso' when no hints are present", () => {
    expect(detectDateFormat({})).toBe("iso");
    expect(detectDateFormat({ placeholder: "Enter date" })).toBe("iso");
  });
});

describe("reformatDate", () => {
  const isoDate = "2000-06-15";

  it("returns BR format DD/MM/YYYY", () => {
    expect(reformatDate(isoDate, "br")).toBe("15/06/2000");
  });

  it("returns US format MM/DD/YYYY", () => {
    expect(reformatDate(isoDate, "us")).toBe("06/15/2000");
  });

  it("returns ISO format YYYY-MM-DD unchanged", () => {
    expect(reformatDate(isoDate, "iso")).toBe("2000-06-15");
  });

  it("returns original string when input is not ISO format", () => {
    expect(reformatDate("15/06/2000", "iso")).toBe("15/06/2000");
    expect(reformatDate("invalid", "br")).toBe("invalid");
  });
});
