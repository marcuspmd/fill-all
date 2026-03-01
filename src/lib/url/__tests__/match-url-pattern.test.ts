import { describe, expect, it } from "vitest";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";

describe("matchUrlPattern", () => {
  // ── Edge cases ──────────────────────────────────────────────────────────────
  it("returns false when url is empty", () => {
    expect(matchUrlPattern("", "example.com")).toBe(false);
  });

  it("returns false when pattern is empty", () => {
    expect(matchUrlPattern("https://example.com", "")).toBe(false);
  });

  it("returns false when both are empty", () => {
    expect(matchUrlPattern("", "")).toBe(false);
  });

  // ── Exact match ─────────────────────────────────────────────────────────────
  it("returns true on exact match", () => {
    expect(matchUrlPattern("https://example.com", "https://example.com")).toBe(
      true,
    );
  });

  it("is case-insensitive for non-wildcard patterns", () => {
    expect(matchUrlPattern("https://EXAMPLE.COM", "https://example.com")).toBe(
      true,
    );
  });

  // ── Wildcard matching ────────────────────────────────────────────────────────
  it("matches trailing wildcard", () => {
    expect(
      matchUrlPattern("https://example.com/path/page", "https://example.com/*"),
    ).toBe(true);
  });

  it("matches leading wildcard", () => {
    expect(
      matchUrlPattern("https://sub.example.com/page", "*.example.com/*"),
    ).toBe(true);
  });

  it("matches mid-pattern wildcard", () => {
    expect(
      matchUrlPattern("https://example.com/en/dashboard", "*/dashboard"),
    ).toBe(true);
  });

  it("matches multiple wildcards", () => {
    expect(
      matchUrlPattern(
        "https://example.com/section/subsection/page",
        "*/section/*/page",
      ),
    ).toBe(true);
  });

  it("does not match when segment order is wrong", () => {
    expect(matchUrlPattern("https://example.com/a/b", "*/b/a")).toBe(false);
  });

  // ── No wildcard substring matching ──────────────────────────────────────────
  it("no wildcard: requires full equality (case-insensitive)", () => {
    expect(matchUrlPattern("https://example.com/page", "example.com")).toBe(
      false,
    );
  });

  it("no wildcard: returns true for case-insensitive exact match", () => {
    expect(
      matchUrlPattern("https://Example.Com/Page", "https://example.com/page"),
    ).toBe(true);
  });

  // ── Wildcard prefix/suffix ───────────────────────────────────────────────────
  it("first segment acts as prefix — mismatch returns false", () => {
    expect(
      matchUrlPattern("https://other.com/path", "https://example.com/*"),
    ).toBe(false);
  });

  it("last segment acts as suffix", () => {
    expect(matchUrlPattern("https://example.com/api/v1/users", "*/users")).toBe(
      true,
    );
  });

  it("suffix mismatch returns false", () => {
    expect(
      matchUrlPattern("https://example.com/api/v1/orders", "*/users"),
    ).toBe(false);
  });

  // ── Wildcard-only pattern ────────────────────────────────────────────────────
  it("single wildcard matches any non-empty url", () => {
    expect(matchUrlPattern("https://anything.com", "*")).toBe(true);
  });

  // ── Suffix overlap detection ─────────────────────────────────────────────────
  it("returns false when suffix position overlaps with already-matched prefix", () => {
    // prefix "https://a" consumes up to pos=9; suffix "abc" would start at pos 8 (11-3) → overlap
    expect(matchUrlPattern("https://abc", "https://a*abc")).toBe(false);
  });

  // ── Middle segment not found ─────────────────────────────────────────────────
  it("returns false when a middle segment does not exist in the url", () => {
    expect(
      matchUrlPattern("https://example.com/home", "*/notfound/*/home"),
    ).toBe(false);
  });
});
