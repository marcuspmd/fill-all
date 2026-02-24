/**
 * Random email generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

/**
 * Generates a random realistic email address using Brazilian locale.
 * @returns A valid email string (e.g. `joao.silva@example.com`)
 */
export function generateEmail(): string {
  return faker.internet.email();
}
