import { describe, expect, it } from "vitest";
import { charNgrams, dotProduct, vectorize } from "../ngram";

describe("ngram", () => {
  it("charNgrams basic functionality", () => {
    const ngrams = charNgrams("Email");
    // padded: _email_ => _em, ema, mai, ail, il_
    expect(ngrams).toEqual(["_em", "ema", "mai", "ail", "il_"]);
  });

  it("charNgrams handles diacritics and separators", () => {
    const ngrams = charNgrams("e-máil");
    // _e mail_ => _e , e m,  ma, mai, ail, il_
    expect(ngrams).toEqual(["_e ", "e m", " ma", "mai", "ail", "il_"]);
  });

  it("dotProduct calculates similarity", () => {
    const vecA = new Float32Array([1, 0, 0]);
    const vecB = new Float32Array([1, 0, 0]);
    expect(dotProduct(vecA, vecB)).toBe(1);

    const vecC = new Float32Array([0, 1, 0]);
    expect(dotProduct(vecA, vecC)).toBe(0);

    const vecD = new Float32Array([0.5, 0.5, 0]);
    expect(dotProduct(vecA, vecD)).toBe(0.5);
  });

  it("vectorize applies L2 normalization", () => {
    const vocab = new Map<string, number>([
      ["_em", 0],
      ["ema", 1],
      ["mai", 2],
      ["ail", 3],
      ["il_", 4],
    ]);

    const vec = vectorize("Email", vocab);

    // Total ngrams in vocab is 5
    // Each string occurs once, total length 5 items
    // L2 norm = sqrt(1+1+1+1+1) = sqrt(5) ≈ 2.236
    // So each elem is 1 / sqrt(5)

    expect(vec.length).toBe(5);
    const expectedVal = 1 / Math.sqrt(5);
    expect(vec[0]).toBeCloseTo(expectedVal, 5);

    // Check missing ngrams don't affect indices they don't map to
    const vec2 = vectorize("Ema", vocab); // _ema_ => _em, ema, ma_
    // "_em", "ema" match. ma_ doesn't.
    // Length is 2. norm = sqrt(1+1) = sqrt(2).
    expect(vec2[0]).toBeCloseTo(1 / Math.sqrt(2), 5);
    expect(vec2[1]).toBeCloseTo(1 / Math.sqrt(2), 5);
    expect(vec2[2]).toBe(0);
  });
});
