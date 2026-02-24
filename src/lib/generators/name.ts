/**
 * Brazilian name generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

export function generateFirstName(): string {
  return faker.person.firstName();
}

export function generateLastName(): string {
  return faker.person.lastName();
}

export function generateFullName(): string {
  return faker.person.fullName();
}

export function generateCompanyName(): string {
  return faker.company.name();
}
