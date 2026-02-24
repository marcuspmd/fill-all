/**
 * Random email generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

export function generateEmail(): string {
  return faker.internet.email();
}
