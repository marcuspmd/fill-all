/**
 * Brazilian address generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

export function generateStreet(): string {
  return faker.location.streetAddress();
}

export function generateHouseNumber(): string {
  return String(faker.number.int({ min: 1, max: 9999 }));
}

export function generateComplement(): string {
  return faker.location.secondaryAddress();
}

export function generateNeighborhood(): string {
  return faker.location.county();
}

export function generateCity(): string {
  return faker.location.city();
}

export function generateState(): string {
  return faker.location.state({ abbreviated: true });
}

export function generateStateName(): string {
  return faker.location.state();
}

export function generateCountry(): string {
  return faker.location.country();
}

export function generateCep(formatted = true): string {
  const raw = faker.location.zipCode("#####-###").replace("-", "");
  if (!formatted) return raw;
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export function generateFullAddress(): string {
  const street = generateStreet();
  const city = generateCity();
  const state = generateState();
  const cep = generateCep();
  return `${street} - ${city}/${state} - CEP: ${cep}`;
}
