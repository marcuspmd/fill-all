/**
 * Brazilian document generators: RG, CNH, PIS
 */

function randomDigits(count: number): string {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

/**
 * Generates a random Brazilian RG (Registro Geral) number.
 * @param formatted - Whether to format as `XX.XXX.XXX-X` (default: `true`)
 * @returns A 9-digit RG string
 */
export function generateRg(formatted = true): string {
  const digits = randomDigits(9);

  if (!formatted) return digits;

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
}

/** Gera um número de CNH válido (11 dígitos com verificadores). */
export function generateCnh(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += base[i] * (9 - i);
    sum2 += base[i] * (1 + i);
  }

  let d1 = sum1 % 11;
  d1 = d1 >= 10 ? 0 : d1;

  let d2 = sum2 % 11;
  d2 = d2 >= 10 ? 0 : d2;

  return [...base, d1, d2].join("");
}

/** Gera um número PIS/PASEP válido (11 dígitos com verificador). */
export function generatePis(): string {
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const base = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));

  const sum = base.reduce((acc, d, i) => acc + d * weights[i], 0);
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;

  return [...base, checkDigit].join("");
}
