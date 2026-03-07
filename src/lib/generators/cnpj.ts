/**
 * Valid CNPJ generator with proper check digits.
 * Supports both the classic all-numeric format and the new alphanumeric format
 * introduced by RFB Instrução Normativa nº 2.229/2024 (effective 2026-01-01).
 *
 * Alphanumeric CNPJ:
 *  - Raiz (positions 1–8): uppercase letters A-Z and digits 0-9
 *  - Ordem (positions 9–12): digits only
 *  - Dígitos verificadores (positions 13–14): digits only
 *  - Check digit algorithm: same modulo-11 as classic, but each character maps to
 *    its ordinal value (0→0 … 9→9, A→10 … Z→35)
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

const ALPHANUM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Numeric value of a single CNPJ character in the alphanumeric algorithm. */
function charValue(c: string): number {
  const idx = ALPHANUM_CHARS.indexOf(c.toUpperCase());
  return idx === -1 ? 0 : idx;
}

/**
 * Generic check-digit calculation for both numeric and alphanumeric CNPJs.
 * Accepts an array of characters (digits or uppercase letters).
 */
function calcCheckDigit(chars: string[], weights: number[]): number {
  const sum = chars.reduce((acc, c, i) => acc + charValue(c) * weights[i], 0);
  const rem = sum % 11;
  return rem < 2 ? 0 : 11 - rem;
}

function randomDigits(count: number): string[] {
  return Array.from({ length: count }, () =>
    String(Math.floor(Math.random() * 10)),
  );
}

function randomAlphanumChars(count: number): string[] {
  return Array.from(
    { length: count },
    () => ALPHANUM_CHARS[Math.floor(Math.random() * ALPHANUM_CHARS.length)],
  );
}

/** Strips CNPJ formatting (dots, slash, dash) but preserves letters. */
function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/[.\-/\s]/g, "").toUpperCase();
}

/** Returns `true` when the cleaned CNPJ string contains at least one letter. */
function hasLetters(s: string): boolean {
  return /[A-Z]/.test(s);
}

const WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

// ── Generators ───────────────────────────────────────────────────────────────

/**
 * Generates a valid Brazilian CNPJ with correct check digits.
 *
 * @param formatted    - Whether to format as `XX.XXX.XXX/XXXX-DD` (default: `true`)
 * @param alphanumeric - When `true`, generates the new alphanumeric format
 *                       (RFB IN nº 2.229/2024). When `false` (default), generates
 *                       the classic all-numeric format.
 */
export function generateCnpj(formatted = true, alphanumeric = false): string {
  if (alphanumeric) return generateCnpjAlphanumeric(formatted);

  // Classic numeric CNPJ
  const base: string[] = [...randomDigits(8), "0", "0", "0", "1"];
  base.push(String(calcCheckDigit(base, WEIGHTS_1)));
  base.push(String(calcCheckDigit(base, WEIGHTS_2)));

  const raw = base.join("");
  if (!formatted) return raw;
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
}

/**
 * Generates a valid alphanumeric CNPJ following RFB IN nº 2.229/2024.
 * The raiz (positions 1-8) will contain at least one letter to make it
 * distinguishable from classic numeric CNPJs.
 *
 * @param formatted - Whether to format as `XX.XXX.XXX/XXXX-DD` (default: `true`)
 */
export function generateCnpjAlphanumeric(formatted = true): string {
  // Raiz: 8 alphanumeric chars — guarantee at least one letter so it doesn't
  // accidentally look like a plain numeric CNPJ.
  let raiz: string[];
  do {
    raiz = randomAlphanumChars(8);
  } while (!hasLetters(raiz.join("")));

  const base: string[] = [...raiz, "0", "0", "0", "1"];
  base.push(String(calcCheckDigit(base, WEIGHTS_1)));
  base.push(String(calcCheckDigit(base, WEIGHTS_2)));

  const raw = base.join("");
  if (!formatted) return raw;
  return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
}

// ── Validators ───────────────────────────────────────────────────────────────

/**
 * Validates a Brazilian CNPJ string (classic or alphanumeric).
 * Accepts both formatted (`XX.XXX.XXX/XXXX-DD`) and raw strings.
 *
 * @param cnpj - CNPJ string to validate
 * @returns `true` if the CNPJ has valid check digits
 */
export function validateCnpj(cnpj: string): boolean {
  const c = cleanCnpj(cnpj);
  if (c.length !== 14) return false;

  // For classic numeric CNPJs reject all-same-digit patterns
  if (!hasLetters(c) && /^(\d)\1{13}$/.test(c)) return false;

  const chars = c.split("");
  const first = calcCheckDigit(chars.slice(0, 12), WEIGHTS_1);
  if (first !== charValue(chars[12])) return false;

  const second = calcCheckDigit(chars.slice(0, 13), WEIGHTS_2);
  return second === charValue(chars[13]);
}

/**
 * Validates only alphanumeric (new-format) CNPJs.
 * Returns `false` for all-numeric CNPJs even if mathematically valid.
 *
 * @param cnpj - CNPJ string to validate
 */
export function validateCnpjAlphanumeric(cnpj: string): boolean {
  const c = cleanCnpj(cnpj);
  if (!hasLetters(c)) return false;
  return validateCnpj(c);
}
