/**
 * Valid CPF generator with proper check digits
 */

function randomDigits(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10));
}

function calculateCpfCheckDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function generateCpf(formatted = true): string {
  const digits = randomDigits(9);

  // All same digits are invalid
  if (digits.every((d) => d === digits[0])) {
    return generateCpf(formatted);
  }

  const firstCheckDigit = calculateCpfCheckDigit(
    digits,
    [10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  digits.push(firstCheckDigit);

  const secondCheckDigit = calculateCpfCheckDigit(
    digits,
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  digits.push(secondCheckDigit);

  const cpf = digits.join("");

  if (!formatted) return cpf;

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export function validateCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  const digits = cleaned.split("").map(Number);

  const first = calculateCpfCheckDigit(
    digits.slice(0, 9),
    [10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  if (first !== digits[9]) return false;

  const second = calculateCpfCheckDigit(
    digits.slice(0, 10),
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return second === digits[10];
}
