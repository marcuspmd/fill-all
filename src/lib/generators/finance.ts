/**
 * Financial generators — credit card, PIX key
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

/** Generates a random credit card number (Luhn-valid). */
export function generateCreditCardNumber(): string {
  return faker.finance.creditCardNumber();
}

/** Generates a random credit card expiration date (`MM/YY`, 1–5 years ahead). */
export function generateCreditCardExpiration(): string {
  const month = String(faker.number.int({ min: 1, max: 12 })).padStart(2, "0");
  const year = new Date().getFullYear() + faker.number.int({ min: 1, max: 5 });
  return `${month}/${String(year).slice(-2)}`;
}

/** Generates a random 3-digit credit card CVV. */
export function generateCreditCardCvv(): string {
  return faker.finance.creditCardCVV();
}

/**
 * Generates a random PIX key (CPF, email, phone, or UUID format).
 * @returns A randomly typed PIX key string
 */
export function generatePixKey(): string {
  const types = ["cpf", "email", "phone", "random"] as const;
  const type = faker.helpers.arrayElement(types);

  switch (type) {
    case "cpf":
      return faker.string.numeric(11);
    case "email":
      return faker.internet.email();
    case "phone":
      return `+55${faker.string.numeric(11)}`;
    case "random":
      return faker.string.uuid();
  }
}
