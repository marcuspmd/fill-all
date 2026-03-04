/**
 * Pattern-based generator — generates strings from a custom mask pattern.
 *
 * Pattern syntax:
 *   `#`  → random digit (0–9)
 *   `A`  → random uppercase letter (A–Z)
 *   `a`  → random lowercase letter (a–z)
 *   `?`  → random letter, mixed case (a–z or A–Z)
 *   `*`  → random alphanumeric character (a–z, A–Z, 0–9)
 *   `\X` → literal character X (escape any token with backslash)
 *   Any other character → literal
 *
 * Examples:
 *   `"###-###-####"` → `"412-873-0291"`
 *   `"AAA-###"` → `"XKP-047"`
 *   `"aaa_###"` → `"btz_519"`
 *   `"****-****"` → `"3aB2-Xz9K"`
 *   `"PREFIX-###"` → `"PREFIX-724"`
 */

const DIGITS = "0123456789";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const ALPHA = UPPER + LOWER;
const ALNUM = UPPER + LOWER + DIGITS;

function randomChar(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

/**
 * Generates a string following the given pattern mask.
 *
 * | Token | Replacement             |
 * |-------|-------------------------|
 * | `#`   | random digit (0–9)      |
 * | `A`   | random uppercase letter |
 * | `a`   | random lowercase letter |
 * | `?`   | random letter (any case)|
 * | `*`   | random alphanumeric     |
 * | `\X`  | literal `X`             |
 *
 * @param pattern - Mask pattern string (default: `"########"`)
 * @returns Generated string matching the pattern
 */
export function generateFromPattern(pattern = "########"): string {
  let result = "";
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];

    // Escape: next character is literal
    if (ch === "\\" && i + 1 < pattern.length) {
      result += pattern[i + 1];
      i += 2;
      continue;
    }

    switch (ch) {
      case "#":
        result += randomChar(DIGITS);
        break;
      case "A":
        result += randomChar(UPPER);
        break;
      case "a":
        result += randomChar(LOWER);
        break;
      case "?":
        result += randomChar(ALPHA);
        break;
      case "*":
        result += randomChar(ALNUM);
        break;
      default:
        result += ch;
    }

    i++;
  }

  return result;
}
