/**
 * Valid CNPJ generator with proper check digits
 */

function randomDigits(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10));
}

function calculateCnpjCheckDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Generates a valid Brazilian CNPJ (Cadastro Nacional de Pessoa Jurídica) with correct check digits.
 * @param formatted - Whether to format as `XX.XXX.XXX/XXXX-XX` (default: `true`)
 * @returns A valid CNPJ string
 */
export function generateCnpj(formatted = true): string {
  // First 8 digits are random, then 0001 (branch), then 2 check digits
  const base = [...randomDigits(8), 0, 0, 0, 1];

  const firstCheckDigit = calculateCnpjCheckDigit(
    base,
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  base.push(firstCheckDigit);

  const secondCheckDigit = calculateCnpjCheckDigit(
    base,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  base.push(secondCheckDigit);

  const cnpj = base.join("");

  if (!formatted) return cnpj;

  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

/**
 * Validates a Brazilian CNPJ string.
 * @param cnpj - CNPJ string (formatted or raw digits)
 * @returns `true` if the CNPJ has valid check digits
 */
export function validateCnpj(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const digits = cleaned.split("").map(Number);

  const first = calculateCnpjCheckDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  if (first !== digits[12]) return false;

  const second = calculateCnpjCheckDigit(
    digits.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return second === digits[13];
}
