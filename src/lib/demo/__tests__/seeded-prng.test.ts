import { describe, it, expect } from "vitest";
import { createSeededRng } from "@/lib/demo/seeded-prng";

describe("createSeededRng", () => {
  describe("determinism", () => {
    it("produces the same sequence for the same seed", () => {
      const a = createSeededRng("test-seed");
      const b = createSeededRng("test-seed");

      const seqA = Array.from({ length: 10 }, () => a.next());
      const seqB = Array.from({ length: 10 }, () => b.next());

      expect(seqA).toEqual(seqB);
    });

    it("produces different sequences for different seeds", () => {
      const a = createSeededRng("seed-alpha");
      const b = createSeededRng("seed-beta");

      const seqA = Array.from({ length: 5 }, () => a.next());
      const seqB = Array.from({ length: 5 }, () => b.next());

      expect(seqA).not.toEqual(seqB);
    });
  });

  describe("next()", () => {
    it("returns values in [0, 1)", () => {
      const rng = createSeededRng("range-check");
      for (let i = 0; i < 100; i++) {
        const v = rng.next();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe("int()", () => {
    it("returns integers in [min, max] inclusive", () => {
      const rng = createSeededRng("int-test");
      const results = new Set<number>();

      for (let i = 0; i < 200; i++) {
        const v = rng.int(1, 5);
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
        expect(Number.isInteger(v)).toBe(true);
        results.add(v);
      }

      // With 200 rolls on [1,5], all values should appear
      expect(results.size).toBe(5);
    });

    it("returns min when min === max", () => {
      const rng = createSeededRng("same");
      expect(rng.int(7, 7)).toBe(7);
    });
  });

  describe("pick()", () => {
    it("picks an element from the array", () => {
      const rng = createSeededRng("pick-test");
      const items = ["a", "b", "c"] as const;

      for (let i = 0; i < 30; i++) {
        expect(items).toContain(rng.pick(items));
      }
    });

    it("is deterministic", () => {
      const a = createSeededRng("pick-det");
      const b = createSeededRng("pick-det");
      const items = [10, 20, 30, 40, 50];

      const seqA = Array.from({ length: 10 }, () => a.pick(items));
      const seqB = Array.from({ length: 10 }, () => b.pick(items));

      expect(seqA).toEqual(seqB);
    });
  });

  describe("shuffle()", () => {
    it("returns a new array (does not mutate the original)", () => {
      const rng = createSeededRng("shuffle");
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(original).toEqual([1, 2, 3, 4, 5]);
      // Same elements
      expect([...shuffled].sort()).toEqual([...original].sort());
    });

    it("is deterministic", () => {
      const a = createSeededRng("shuffle-det");
      const b = createSeededRng("shuffle-det");
      const items = [1, 2, 3, 4, 5, 6, 7, 8];

      expect(a.shuffle(items)).toEqual(b.shuffle(items));
    });
  });

  describe("char()", () => {
    it("returns a single character from the charset", () => {
      const rng = createSeededRng("char-test");
      const charset = "ABC";

      for (let i = 0; i < 30; i++) {
        const c = rng.char(charset);
        expect(c).toHaveLength(1);
        expect(charset).toContain(c);
      }
    });
  });

  describe("string()", () => {
    it("returns a string of the specified length", () => {
      const rng = createSeededRng("str-len");
      const s = rng.string(16);
      expect(s).toHaveLength(16);
    });

    it("uses default charset (alphanumeric lowercase)", () => {
      const rng = createSeededRng("str-default");
      const s = rng.string(100);
      expect(s).toMatch(/^[a-z0-9]+$/);
    });

    it("respects custom charset", () => {
      const rng = createSeededRng("str-custom");
      const s = rng.string(50, "XY");
      expect(s).toMatch(/^[XY]+$/);
      expect(s).toHaveLength(50);
    });

    it("returns empty string for length 0", () => {
      const rng = createSeededRng("str-zero");
      expect(rng.string(0)).toBe("");
    });
  });
});
