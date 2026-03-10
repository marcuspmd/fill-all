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

  it("generateCep always generates valid CEP ranges", () => {
    // Valid CEP ranges by state (first 5 digits)
    const validRanges = [
      [69900, 69999], // AC
      [82000, 82999], // AL
      [96000, 96999], // AP
      [92000, 92999], // AM part 1
      [97000, 97999], // AM part 2
      [40000, 48999], // BA
      [60000, 63999], // CE
      [70000, 72799], // DF
      [29000, 29999], // ES
      [72800, 76799], // GO
      [65000, 65099], // MA part 1
      [98000, 98999], // MA part 2
      [78000, 78899], // MT
      [79000, 79999], // MS
      [30000, 39999], // MG
      [66000, 68999], // PA
      [58000, 58999], // PB
      [80000, 87999], // PR
      [50000, 56999], // PE
      [64000, 64999], // PI
      [20000, 28999], // RJ
      [59000, 59999], // RN
      [90000, 99999], // RS
      [76800, 76999], // RO
      [69300, 69399], // RR
      [88000, 89999], // SC
      [1000, 19999], // SP
      [77000, 77999], // TO
    ];

    for (let i = 0; i < 100; i++) {
      const cepFormatted = address.generateCep(true);
      const prefix = parseInt(cepFormatted.slice(0, 5), 10);

      const isValid = validRanges.some(
        ([start, end]) => prefix >= start && prefix <= end,
      );

      expect(isValid).toBe(true);
    }
  });

  it("generateFullAddress creates a valid full address", () => {
    const addr = address.generateFullAddress();
    expect(typeof addr).toBe("string");
    expect(addr).toContain("- CEP:");
  });
});
