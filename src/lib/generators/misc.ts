/**
 * Miscellaneous generators — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";
import { generateCpf } from "./cpf";
import { generateCnpj } from "./cnpj";

export function generatePassword(length = 12): string {
  return faker.internet.password({ length });
}

export function generateUsername(): string {
  return faker.internet.username();
}

export function generateNumber(min = 1, max = 99999): string {
  return String(faker.number.int({ min, max }));
}

export function generateText(wordCount = 5): string {
  return faker.lorem.words(wordCount);
}

export function generateDescription(): string {
  return faker.lorem.sentence();
}

export function generateNotes(): string {
  return faker.lorem.sentences(2);
}

export function generateMoney(min = 1, max = 10000): string {
  return faker.finance.amount({ min, max, dec: 2 });
}

export function generateWebsite(): string {
  return faker.internet.url();
}

export function generateProductName(): string {
  return faker.commerce.productName();
}

export function generateSku(): string {
  return faker.string.alphanumeric({ length: 8, casing: "upper" });
}

export function generateCoupon(): string {
  return faker.string.alphanumeric({ length: 10, casing: "upper" });
}

export function generateJobTitle(): string {
  return faker.person.jobTitle();
}

export function generateDepartment(): string {
  return faker.commerce.department();
}

export function generateCpfCnpj(): string {
  return Math.random() < 0.6 ? generateCpf(true) : generateCnpj(true);
}

export function generateEmployeeCount(): string {
  return String(faker.number.int({ min: 1, max: 10_000 }));
}

export function generateOtp(length = 6): string {
  return faker.string.numeric(length);
}

export function generateVerificationCode(length = 6): string {
  return faker.string.numeric(length);
}

export function generatePassport(): string {
  return faker.string.alphanumeric({ length: 8, casing: "upper" });
}

export function generateNationalId(): string {
  return faker.string.numeric(10);
}

export function generateTaxId(): string {
  return faker.string.numeric(11);
}
