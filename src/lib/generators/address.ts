/**
 * Brazilian address generator — powered by faker (pt_BR locale)
 */

import { fakerPT_BR as faker } from "@faker-js/faker";

/** Valid CEP ranges by Brazilian state (first 5 digits: start-end) */
const VALID_CEP_RANGES: Array<[string, number, number]> = [
  ["AC", 69900, 69999], // Acre
  ["AL", 82000, 82999], // Alagoas
  ["AP", 96000, 96999], // Amapá
  ["AM", 92000, 92999], // Amazonas (part 1)
  ["AM", 97000, 97999], // Amazonas (part 2)
  ["BA", 40000, 48999], // Bahia
  ["CE", 60000, 63999], // Ceará
  ["DF", 70000, 72799], // Distrito Federal
  ["ES", 29000, 29999], // Espírito Santo
  ["GO", 72800, 76799], // Goiás
  ["MA", 65000, 65099], // Maranhão (part 1)
  ["MA", 98000, 98999], // Maranhão (part 2)
  ["MT", 78000, 78899], // Mato Grosso
  ["MS", 79000, 79999], // Mato Grosso do Sul
  ["MG", 30000, 39999], // Minas Gerais
  ["PA", 66000, 68999], // Pará
  ["PB", 58000, 58999], // Paraíba
  ["PR", 80000, 87999], // Paraná
  ["PE", 50000, 56999], // Pernambuco
  ["PI", 64000, 64999], // Piauí
  ["RJ", 20000, 28999], // Rio de Janeiro
  ["RN", 59000, 59999], // Rio Grande do Norte
  ["RS", 90000, 99999], // Rio Grande do Sul
  ["RO", 76800, 76999], // Rondônia
  ["RR", 69300, 69399], // Roraima
  ["SC", 88000, 89999], // Santa Catarina
  ["SP", 1000, 19999], // São Paulo
  ["TO", 77000, 77999], // Tocantins
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
 * Generates a random valid Brazilian CEP (postal code).
 * Uses real CEP ranges by state to ensure validity.
 * @param formatted - Whether to format as `XXXXX-XXX` (default: `true`)
 * @returns A valid CEP string
 */
export function generateCep(formatted = true): string {
  // Pick a random valid CEP range
  const [, startPrefix, endPrefix] = randomItem(VALID_CEP_RANGES);

  // Generate a prefix within the valid range
  const prefix = randomInt(startPrefix, endPrefix);
  const prefixStr = String(prefix).padStart(5, "0");

  // Generate random suffix (3 digits)
  const suffix = String(randomInt(0, 999)).padStart(3, "0");

  const raw = prefixStr + suffix;

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
