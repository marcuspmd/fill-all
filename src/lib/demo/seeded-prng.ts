/**
 * Deterministic PRNG based on mulberry32.
 *
 * Used during replay so that every execution of a FlowScript with the
 * same `seed` string produces the exact same sequence of "random" values.
 *
 * The seed string is hashed via a simple FNV-1a variant to produce the
 * initial 32-bit state.
 */

/**
 * FNV-1a–style hash producing a 32-bit unsigned integer from a string.
 * Used purely for seeding — not for cryptographic purposes.
 */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return h >>> 0;
}

/**
 * Create a seeded PRNG instance.
 *
 * Returns a `SeededRng` object with utility methods that draw from the
 * same deterministic sequence.
 *
 * @example
 * ```ts
 * const rng = createSeededRng("demo-seed-42");
 * rng.next();         // 0 ≤ n < 1
 * rng.int(1, 100);    // 1 ≤ n ≤ 100
 * rng.pick(["a","b"]) // "a" or "b" deterministically
 * ```
 */
export function createSeededRng(seed: string): SeededRng {
  let state = hashSeed(seed);

  /** mulberry32 core — returns float [0, 1) */
  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,

    int(min: number, max: number): number {
      return Math.floor(next() * (max - min + 1)) + min;
    },

    pick<T>(array: readonly T[]): T {
      return array[Math.floor(next() * array.length)];
    },

    shuffle<T>(array: readonly T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },

    char(charset: string): string {
      return charset[Math.floor(next() * charset.length)];
    },

    string(
      length: number,
      charset = "abcdefghijklmnopqrstuvwxyz0123456789",
    ): string {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += charset[Math.floor(next() * charset.length)];
      }
      return result;
    },
  };
}

/** A deterministic pseudo-random number generator */
export interface SeededRng {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] (inclusive) */
  int(min: number, max: number): number;
  /** Pick a random element from the array */
  pick<T>(array: readonly T[]): T;
  /** Shuffle a copy of the array (Fisher-Yates) */
  shuffle<T>(array: readonly T[]): T[];
  /** Pick a random character from the charset */
  char(charset: string): string;
  /** Generate a random string of given length from charset */
  string(length: number, charset?: string): string;
}
