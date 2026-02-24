/**
 * Brazilian address generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

/**
 * Generates a random Brazilian street name.
 * @param onlyLetters - Strip numeric characters from the result (default: `false`)
 */
export function generateStreet(onlyLetters = false): string {
  const street = faker.location.street();
  if (onlyLetters) {
    return street.replace(/[0-9]/g, "").trim();
  }
  return street;
}

/** Generates a random house/building number (1–9999). */
export function generateHouseNumber(): string {
  return String(faker.number.int({ min: 1, max: 9999 }));
}

/**
 * Generates a random secondary address (apartment, suite, etc.).
 * @param onlyLetters - Strip numeric characters from the result (default: `false`)
 */
export function generateComplement(onlyLetters = false): string {
  const value = faker.location.secondaryAddress();
  if (onlyLetters) {
    return value.replace(/[0-9]/g, "").trim();
  }
  return value;
}

/**
 * Generates a random Brazilian neighborhood name.
 * @param onlyLetters - Strip numeric characters from the result (default: `false`)
 */
export function generateNeighborhood(onlyLetters = false): string {
  const value = faker.location.county();
  if (onlyLetters) {
    return value.replace(/[0-9]/g, "").trim();
  }
  return value;
}

/** Generates a random Brazilian city name. */
export function generateCity(): string {
  return faker.location.city();
}

/** Generates a random Brazilian state abbreviation (e.g. `SP`, `RJ`). */
export function generateState(): string {
  return faker.location.state({ abbreviated: true });
}

/** Generates a random Brazilian state full name (e.g. `São Paulo`). */
export function generateStateName(): string {
  return faker.location.state();
}

/** Generates a random country name. */
export function generateCountry(): string {
  return faker.location.country();
}

/**
 * Generates a random Brazilian CEP (postal code).
 * @param formatted - Whether to format as `XXXXX-XXX` (default: `true`)
 */
export function generateCep(formatted = true): string {
  const raw = faker.location.zipCode("#####-###").replace("-", "");
  if (!formatted) return raw;
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

/** Generates a complete Brazilian address string (street, city, state, CEP). */
export function generateFullAddress(): string {
  const street = generateStreet();
  const city = generateCity();
  const state = generateState();
  const cep = generateCep();
  return `${street} - ${city}/${state} - CEP: ${cep}`;
}
