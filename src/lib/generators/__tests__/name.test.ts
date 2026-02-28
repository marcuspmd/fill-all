import { describe, expect, it } from "vitest";
import * as names from "../name";

describe("name generator", () => {
  it("generateFirstName creates a string", () => {
    expect(typeof names.generateFirstName()).toBe("string");
    expect(names.generateFirstName().length).toBeGreaterThan(0);
  });

  it("generateLastName creates a string", () => {
    expect(typeof names.generateLastName()).toBe("string");
    expect(names.generateLastName().length).toBeGreaterThan(0);
  });

  it("generateFullName creates a string", () => {
    expect(typeof names.generateFullName()).toBe("string");
    expect(names.generateFullName().length).toBeGreaterThan(0);
  });

  it("generateCompanyName creates a string", () => {
    expect(typeof names.generateCompanyName()).toBe("string");
    expect(names.generateCompanyName().length).toBeGreaterThan(0);
  });
});
