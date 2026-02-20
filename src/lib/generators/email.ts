/**
 * Random email generator
 */

const DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com.br",
  "uol.com.br",
  "terra.com.br",
  "bol.com.br",
  "protonmail.com",
  "icloud.com",
];

const PREFIXES = [
  "joao",
  "maria",
  "pedro",
  "ana",
  "carlos",
  "julia",
  "lucas",
  "fernanda",
  "rafael",
  "camila",
  "bruno",
  "larissa",
  "gustavo",
  "beatriz",
  "thiago",
  "amanda",
  "diego",
  "patricia",
  "marcelo",
  "vanessa",
  "rodrigo",
  "priscila",
  "andre",
  "aline",
  "felipe",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateEmail(): string {
  const prefix = randomItem(PREFIXES);
  const suffix = Math.floor(Math.random() * 9999);
  const domain = randomItem(DOMAINS);
  return `${prefix}${suffix}@${domain}`;
}
