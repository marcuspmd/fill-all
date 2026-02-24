/**
 * Financial generators — credit card, PIX key
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

export function generateCreditCardNumber(): string {
  return faker.finance.creditCardNumber();
}

export function generateCreditCardExpiration(): string {
  const month = String(faker.number.int({ min: 1, max: 12 })).padStart(2, "0");
  const year = new Date().getFullYear() + faker.number.int({ min: 1, max: 5 });
  return `${month}/${String(year).slice(-2)}`;
}

export function generateCreditCardCvv(): string {
  return faker.finance.creditCardCVV();
}

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
