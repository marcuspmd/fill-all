import { describe, expect, it } from "vitest";
import * as address from "../address";

describe("address generator", () => {
  it("generateStreet creates a string", () => {
    expect(typeof address.generateStreet()).toBe("string");
    expect(typeof address.generateStreet(true)).toBe("string");
  });

  it("generateHouseNumber creates a string number", () => {
    const num = parseInt(address.generateHouseNumber(), 10);
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(9999);
  });

  it("generateComplement creates a string", () => {
    expect(typeof address.generateComplement()).toBe("string");
    expect(typeof address.generateComplement(true)).toBe("string");
  });

  it("generateNeighborhood creates a string", () => {
    expect(typeof address.generateNeighborhood()).toBe("string");
    expect(typeof address.generateNeighborhood(true)).toBe("string");
  });

  it("generateCity creates a string", () => {
    expect(typeof address.generateCity()).toBe("string");
  });

  it("generateState creates a string", () => {
    expect(typeof address.generateState()).toBe("string");
  });

  it("generateStateName creates a string", () => {
    expect(typeof address.generateStateName()).toBe("string");
  });

  it("generateCountry creates a string", () => {
    expect(typeof address.generateCountry()).toBe("string");
  });

  it("generateCep formats correctly", () => {
    const cepFormatted = address.generateCep(true);
    expect(cepFormatted).toMatch(/^\d{5}-\d{3}$/);

    const cepUnformatted = address.generateCep(false);
    expect(cepUnformatted).toMatch(/^\d{8}$/);
  });

  it("generateFullAddress creates a valid full address", () => {
    const addr = address.generateFullAddress();
    expect(typeof addr).toBe("string");
    expect(addr).toContain("- CEP:");
  });
});
