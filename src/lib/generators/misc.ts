/**
 * Miscellaneous generators — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";
import { generateCpf } from "./cpf";
import { generateCnpj } from "./cnpj";

/**
 * Generates a random password with configurable character classes.
 * @param length - Password length (default: `12`)
 * @param withNumbers - Include numeric digits (default: `true`)
 * @param withSpecialChars - Include special characters (default: `true`)
 * @param withUppercase - Include uppercase letters (default: `true`)
 */
export function generatePassword(
  length = 12,
  withNumbers = true,
  withSpecialChars = true,
  withUppercase = true,
): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  let charset = lowercase;
  const mandatory: string[] = [
    lowercase[Math.floor(Math.random() * lowercase.length)],
  ];

  if (withUppercase) {
    charset += upper;
    mandatory.push(upper[Math.floor(Math.random() * upper.length)]);
  }
  if (withNumbers) {
    charset += digits;
    mandatory.push(digits[Math.floor(Math.random() * digits.length)]);
  }
  if (withSpecialChars) {
    charset += special;
    mandatory.push(special[Math.floor(Math.random() * special.length)]);
  }

  const remaining = Math.max(0, length - mandatory.length);
  const result = [...mandatory];
  for (let i = 0; i < remaining; i++) {
    result.push(charset[Math.floor(Math.random() * charset.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("");
}

/** Generates a random internet username. */
export function generateUsername(): string {
  return faker.internet.username();
}

/**
 * Generates a random integer as string.
 * @param min - Minimum value (default: `1`)
 * @param max - Maximum value (default: `99999`)
 */
export function generateNumber(min = 1, max = 99999): string {
  return String(faker.number.int({ min, max }));
}

/**
 * Generates random lorem ipsum words.
 * @param wordCount - Number of words (default: `5`)
 */
export function generateText(wordCount = 5): string {
  return faker.lorem.words(wordCount);
}

/**
 * Generates a random description.
 * @param paragraphs - Number of paragraphs (default: `1`)
 */
export function generateDescription(paragraphs = 1): string {
  if (paragraphs <= 1) return faker.lorem.sentence();
  return faker.lorem.paragraphs(paragraphs, "\n\n");
}

/**
 * Generates random notes text.
 * @param sentences - Number of sentences (default: `2`)
 */
export function generateNotes(sentences = 2): string {
  return faker.lorem.sentences(sentences);
}

/**
 * Generates a random monetary amount string with 2 decimal places.
 * @param min - Minimum value (default: `1`)
 * @param max - Maximum value (default: `10000`)
 */
export function generateMoney(min = 1, max = 10000): string {
  return faker.finance.amount({ min, max, dec: 2 });
}

/** Generates a random website URL. */
export function generateWebsite(): string {
  return faker.internet.url();
}

/** Generates a random product name. */
export function generateProductName(): string {
  return faker.commerce.productName();
}

/** Generates a random 8-character alphanumeric SKU (uppercase). */
export function generateSku(): string {
  return faker.string.alphanumeric({ length: 8, casing: "upper" });
}

/** Generates a random 10-character alphanumeric coupon code (uppercase). */
export function generateCoupon(): string {
  return faker.string.alphanumeric({ length: 10, casing: "upper" });
}

/** Generates a random job title. */
export function generateJobTitle(): string {
  return faker.person.jobTitle();
}

/** Generates a random commerce department name. */
export function generateDepartment(): string {
  return faker.commerce.department();
}

/** Generates either a CPF (60% chance) or CNPJ (40% chance). */
export function generateCpfCnpj(): string {
  return Math.random() < 0.6 ? generateCpf(true) : generateCnpj(true);
}

/** Generates a random employee count (1–10,000). */
export function generateEmployeeCount(): string {
  return String(faker.number.int({ min: 1, max: 10_000 }));
}

/**
 * Generates a random numeric OTP (one-time password).
 * @param length - Number of digits (default: `6`)
 */
export function generateOtp(length = 6): string {
  return faker.string.numeric(length);
}

/**
 * Generates a random numeric verification code.
 * @param length - Number of digits (default: `6`)
 */
export function generateVerificationCode(length = 6): string {
  return faker.string.numeric(length);
}

/** Generates a random 8-character alphanumeric passport number (uppercase). */
export function generatePassport(): string {
  return faker.string.alphanumeric({ length: 8, casing: "upper" });
}

/** Generates a random 10-digit national ID number. */
export function generateNationalId(): string {
  return faker.string.numeric(10);
}

/** Generates a random 11-digit tax ID number. */
export function generateTaxId(): string {
  return faker.string.numeric(11);
}

/** Known Brazilian document issuing authorities. */
const DOCUMENT_ISSUERS = [
  "SSP",
  "SDS",
  "DETRAN",
  "IFP",
  "PC",
  "PM",
  "CBM",
  "SESP",
  "SEJUSP",
  "POLITEC",
  "IGP",
  "SSP/SP",
  "SSP/RJ",
  "SSP/MG",
  "SSP/BA",
  "SSP/PR",
  "SSP/RS",
  "SSP/SC",
  "SSP/PE",
  "SSP/CE",
  "SSP/GO",
  "SSP/DF",
  "SSP/PA",
  "SSP/AM",
  "SSP/MT",
  "SSP/MS",
  "SSP/MA",
  "SSP/PB",
  "SSP/ES",
  "SSP/RN",
  "SDS/PE",
  "SDS/AL",
  "SESP/MT",
  "DGPC/GO",
  "IGP/RS",
  "IGP/SC",
  "POLITEC/MT",
];

/** Generates a random Brazilian document issuing authority (e.g. `SSP/SP`). */
export function generateDocumentIssuer(): string {
  return faker.helpers.arrayElement(DOCUMENT_ISSUERS);
}

/**
 * Generates a URL-friendly slug from random words.
 * @param wordCount - Number of words in the slug (default: `3`)
 * @returns Lowercase hyphen-separated slug, e.g. `"lorem-ipsum-dolor"`
 */
export function generateSlug(wordCount = 3): string {
  const words = faker.lorem.words(wordCount);
  return words
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
