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
});
