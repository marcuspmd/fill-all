/**
 * RG (Registro Geral) generator
 */

function randomDigits(count: number): string {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
}

export function generateRg(formatted = true): string {
  const digits = randomDigits(9);

  if (!formatted) return digits;

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
}
