// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { generateWithConstraints, adaptGeneratedValue } from "../adaptive";

describe("adaptive generator", () => {
  it("generateWithConstraints satisfies simple text constraints", () => {
    const generatorFn = vi.fn().mockReturnValue("hello   ");

    const input = document.createElement("input");
    input.maxLength = 3;
    // Constraints forcing it to be smaller
    const val = generateWithConstraints(generatorFn, {
      element: input,
      maxLength: 3,
      requireValidity: true,
    });

    expect(val).toBe("hel"); // Since "hello   " fails validity when length 3 is enforced, it falls back to slice
  });

  it("generateWithConstraints falls back when no constraint works but requireValidity is false", () => {
    // Return something that can't be trimmed/digits easily
    const generatorFn = vi.fn().mockReturnValue("abcdef");

    const input = document.createElement("input");
    input.type = "number"; // only accepts numbers or empty

    const val = generateWithConstraints(generatorFn, {
      element: input,
      requireValidity: false,
    });
    expect(val).toBe("abcdef"); // The best effort fallback
  });

  it("adaptGeneratedValue trims spaces when trailing spaces cause invalidity", () => {
    const input = document.createElement("input");
    input.pattern = "^[a-z]+$"; // only lowercase letters, no spaces
    expect(adaptGeneratedValue(" hello  ", { element: input })).toBe("hello");
  });

  it("adaptGeneratedValue respects maxLength", () => {
    const input = document.createElement("input");
    input.maxLength = 3;
    expect(adaptGeneratedValue("12345", { element: input, maxLength: 3 })).toBe(
      "123",
    );
  });

  it("adaptGeneratedValue accepts numeric inputs if adapted", () => {
    const input = document.createElement("input");
    input.type = "number";
    // " 12a3 " has spaces and letters
    expect(adaptGeneratedValue(" 12a3 ", { element: input })).toBe("123");
  });

  it("returns empty string if nothing matches and requireValidity is true", () => {
    const input = document.createElement("input");
    input.pattern = "^\\d+$"; // explicitly requires digits
    input.required = true;
    expect(
      adaptGeneratedValue("abc", { element: input, requireValidity: true }),
    ).toBe("");
  });
});
