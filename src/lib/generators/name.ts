/**
 * Brazilian name generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

/** Generates a random Brazilian first name. */
export function generateFirstName(): string {
  return faker.person.firstName();
}

/** Generates a random Brazilian last name. */
export function generateLastName(): string {
  return faker.person.lastName();
}

/** Generates a random Brazilian full name (first + last). */
export function generateFullName(): string {
  return faker.person.fullName();
}

/** Generates a random Brazilian company name. */
export function generateCompanyName(): string {
  return faker.company.name();
}
