// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { escapeHtml, escapeAttr } from "../html-utils";

describe("html-utils", () => {
  it("escapeHtml escapes tags", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("escapeHtml handles empty/null values", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("escapeAttr escapes single/double quotes, ampersands, and angle brackets", () => {
    expect(escapeAttr(`"Tom & Jerry's"`)).toBe(
      "&quot;Tom &amp; Jerry&#39;s&quot;",
    );
    expect(escapeAttr("<hello>")).toBe("&lt;hello&gt;");
  });
});
