/**
 * Miscellaneous generators: password, username, number
 */

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePassword(length = 12): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => chars[v % chars.length]).join("");
}

export function generateUsername(): string {
  const adjectives = [
    "cool",
    "fast",
    "smart",
    "brave",
    "dark",
    "epic",
    "wild",
    "neo",
    "dev",
    "pro",
  ];
  const nouns = [
    "coder",
    "ninja",
    "tiger",
    "wolf",
    "hawk",
    "fox",
    "byte",
    "node",
    "pixel",
    "stack",
  ];
  const num = Math.floor(Math.random() * 999);
  return `${randomItem(adjectives)}_${randomItem(nouns)}${num}`;
}

export function generateNumber(min = 1, max = 99999): string {
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export function generateText(wordCount = 5): string {
  const words = [
    "lorem",
    "ipsum",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipiscing",
    "elit",
    "sed",
    "tempor",
    "incididunt",
    "labore",
    "magna",
    "aliqua",
    "enim",
    "minim",
    "veniam",
    "quis",
    "nostrud",
    "exercitation",
  ];
  return Array.from({ length: wordCount }, () => randomItem(words)).join(" ");
}

export function generateMoney(min = 1, max = 10000): string {
  if (min === max) return min.toFixed(2);
  const raw = min + Math.random() * (max - min);
  return raw.toFixed(2);
}
