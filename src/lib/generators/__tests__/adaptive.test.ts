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

  it("generateWithConstraints returns empty when requireValidity and all attempts fail", () => {
    // Always generate something that won't pass email pattern
    const generatorFn = vi.fn().mockReturnValue("not-valid");

    const input = document.createElement("input");
    input.type = "email";

    const val = generateWithConstraints(generatorFn, {
      element: input,
      requireValidity: true,
      attempts: 3,
    });

    expect(val).toBe("");
    expect(generatorFn).toHaveBeenCalledTimes(3);
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

  it("adaptGeneratedValue returns value as-is for non-form elements (div, span)", () => {
    const div = document.createElement("div");
    expect(adaptGeneratedValue("anything", { element: div })).toBe("anything");
  });

  it("adaptGeneratedValue returns value for HTMLSelectElement", () => {
    const select = document.createElement("select");
    expect(adaptGeneratedValue("opt", { element: select })).toBe("opt");
  });

  it("adaptGeneratedValue returns value for checkbox/radio/file inputs", () => {
    for (const type of ["checkbox", "radio", "file"]) {
      const input = document.createElement("input");
      input.type = type;
      expect(adaptGeneratedValue("val", { element: input })).toBe("val");
    }
  });

  it("resolveMaxLength reads maxLength from HTMLTextAreaElement", () => {
    const textarea = document.createElement("textarea");
    textarea.maxLength = 50;
    expect(
      adaptGeneratedValue("a".repeat(100), {
        element: textarea,
        maxLength: 50,
      }),
    ).toHaveLength(50);
  });

  it("adaptGeneratedValue handles empty string input", () => {
    expect(adaptGeneratedValue("")).toBe("");
  });

  it("adaptGeneratedValue returns value when no element given", () => {
    expect(adaptGeneratedValue("hello world", { maxLength: 5 })).toBe(
      "hello world",
    );
  });
});
