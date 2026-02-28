import { describe, expect, it } from "vitest";
import { getConfidenceColor } from "../constants";

describe("constants", () => {
  it("getConfidenceColor returns correct colors based on thresholds", () => {
    // >= 0.8
    expect(getConfidenceColor(0.9)).toBe("#4ade80");
    expect(getConfidenceColor(0.8)).toBe("#4ade80");

    // >= 0.5
    expect(getConfidenceColor(0.79)).toBe("#fbbf24");
    expect(getConfidenceColor(0.5)).toBe("#fbbf24");

    // < 0.5
    expect(getConfidenceColor(0.49)).toBe("#f87171");
    expect(getConfidenceColor(0.1)).toBe("#f87171");
  });
});
