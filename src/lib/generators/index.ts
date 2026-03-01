/**
 * Central generator registry — maps FieldType to a generator function.
 *
 * The generator map is built dynamically from FIELD_TYPE_DEFINITIONS at runtime.
 * Each definition references a generator key, and the key resolves to a factory
 * in GENERATOR_FACTORIES. Params (min/max, length, etc.) come from the definition.
 *
 * To add a new field type: add an entry in FIELD_TYPE_DEFINITIONS with an
 * existing generator key (or create a new factory here if needed).
 */

import type { FieldType, GeneratorParams } from "@/types";
import { FIELD_TYPE_DEFINITIONS } from "@/types";
import { generateCpf } from "./cpf";
import { generateCnpj } from "./cnpj";
import { generateEmail } from "./email";
import { generatePhone } from "./phone";
import {
  generateFirstName,
  generateLastName,
  generateFullName,
  generateCompanyName,
} from "./name";
import {
  generateStreet,
  generateHouseNumber,
  generateComplement,
  generateNeighborhood,
  generateCity,
  generateState,
  generateCountry,
  generateCep,
  generateFullAddress,
} from "./address";
import { generateDate, generateBirthDate, generateFutureDate } from "./date";
import { generateRg, generateCnh, generatePis } from "./rg";
import {
  generateCreditCardNumber,
  generateCreditCardExpiration,
  generateCreditCardCvv,
  generatePixKey,
} from "./finance";
import {
  generatePassword,
  generateUsername,
  generateNumber,
  generateText,
  generateDescription,
  generateNotes,
  generateMoney,
  generateWebsite,
  generateProductName,
  generateSku,
  generateCoupon,
  generateJobTitle,
  generateDepartment,
  generateCpfCnpj,
  generateEmployeeCount,
  generateOtp,
  generateVerificationCode,
  generatePassport,
  generateNationalId,
  generateTaxId,
  generateDocumentIssuer,
} from "./misc";

/** Function signature for synchronous data generators. */
export type GeneratorFn = () => string;

// ── Generator factory type ────────────────────────────────────────────────
type GeneratorFactory = (params?: GeneratorParams) => string;

/**
 * Registry of generator factories keyed by generator ID.
 * Each factory receives optional GeneratorParams and returns a string.
 * Multiple field types can share the same factory (e.g. money/price/amount → "money").
 */
const GENERATOR_FACTORIES: Record<string, GeneratorFactory> = {
  // ── Documentos ──────────────────────────────────────────────
  cpf: (p) => generateCpf(p?.formatted !== false),
  cnpj: (p) => generateCnpj(p?.formatted !== false),
  "cpf-cnpj": () => generateCpfCnpj(),
  rg: (p) => generateRg(p?.formatted !== false),
  passport: () => generatePassport(),
  cnh: () => generateCnh(),
  pis: () => generatePis(),
  "national-id": () => generateNationalId(),
  "tax-id": () => generateTaxId(),
  "document-issuer": () => generateDocumentIssuer(),

  // ── Nome / Pessoal ─────────────────────────────────────────
  "full-name": () => generateFullName(),
  "first-name": () => generateFirstName(),
  "last-name": () => generateLastName(),

  // ── Contato ─────────────────────────────────────────────────
  email: () => generateEmail(),
  phone: () => generatePhone(true, true),
  "mobile-phone": () => generatePhone(true, true),

  // ── Endereço ────────────────────────────────────────────────
  "full-address": () => generateFullAddress(),
  street: (p) => generateStreet(p?.onlyLetters === true),
  "house-number": () => generateHouseNumber(),
  complement: (p) => generateComplement(p?.onlyLetters === true),
  neighborhood: (p) => generateNeighborhood(p?.onlyLetters === true),
  city: () => generateCity(),
  state: () => generateState(),
  country: () => generateCountry(),
  cep: (p) => generateCep(p?.formatted !== false),

  // ── Datas ───────────────────────────────────────────────────
  "date-iso": (p) =>
    generateDate((p?.dateFormat as "iso" | "br" | "us") ?? "iso"),
  "birth-date": (p) =>
    generateBirthDate(
      p?.min ?? 18,
      p?.max ?? 65,
      (p?.dateFormat as "iso" | "br" | "us") ?? "iso",
    ),
  "future-date": (p) =>
    generateFutureDate(
      p?.max ?? 90,
      (p?.dateFormat as "iso" | "br" | "us") ?? "iso",
    ),

  // ── Financeiro ──────────────────────────────────────────────
  money: (p) => generateMoney(p?.min ?? 1, p?.max ?? 10_000),
  number: (p) => generateNumber(p?.min ?? 1, p?.max ?? 99_999),
  "credit-card-number": () => generateCreditCardNumber(),
  "credit-card-expiration": () => generateCreditCardExpiration(),
  "credit-card-cvv": () => generateCreditCardCvv(),
  "pix-key": () => generatePixKey(),

  // ── Empresa / Profissional ──────────────────────────────────
  company: () => generateCompanyName(),
  "job-title": () => generateJobTitle(),
  department: () => generateDepartment(),

  // ── Autenticação ────────────────────────────────────────────
  username: () => generateUsername(),
  password: (p) => generatePassword(p?.length ?? 12),
  otp: (p) => generateOtp(p?.length ?? 6),
  "verification-code": (p) => generateVerificationCode(p?.length ?? 6),

  // ── E-commerce ──────────────────────────────────────────────
  "product-name": () => generateProductName(),
  sku: () => generateSku(),
  coupon: () => generateCoupon(),

  // ── Genéricos ───────────────────────────────────────────────
  text: () => generateText(),
  "search-text": () => generateText(2),
  "fallback-text": () => generateText(3),
  description: () => generateDescription(),
  notes: () => generateNotes(),
  website: () => generateWebsite(),

  // ── Componentes ─────────────────────────────────────────────
  empty: () => "",
  boolean: () => "true",
};

// ── Dynamic map (built once from FIELD_TYPE_DEFINITIONS) ──────────────────

function buildGeneratorMap(): Map<FieldType, GeneratorFn> {
  const map = new Map<FieldType, GeneratorFn>();

  for (const def of FIELD_TYPE_DEFINITIONS) {
    if (!def.generator) continue;
    const factory = GENERATOR_FACTORIES[def.generator];
    if (!factory) continue;

    const params = def.params;
    map.set(def.type, () => factory(params));
  }

  return map;
}

const generatorMap = buildGeneratorMap();

/**
 * Generates a value for the given field type using the appropriate generator.
 * Falls back to random text (3 words) when no specific generator is registered.
 * @param fieldType - The classified field type to generate data for
 * @param overrideParams - Optional params to override defaults from FIELD_TYPE_DEFINITIONS
 * @returns Generated string value
 */
export function generate(
  fieldType: FieldType,
  overrideParams?: GeneratorParams,
): string {
  if (!overrideParams) {
    const fn = generatorMap.get(fieldType);
    return fn ? fn() : generateText(3);
  }

  // Find the factory key for this field type
  const def = FIELD_TYPE_DEFINITIONS.find((d) => d.type === fieldType);
  if (!def?.generator) return generateText(3);

  const factory = GENERATOR_FACTORIES[def.generator];
  if (!factory) return generateText(3);

  // Merge default params with overrides
  const mergedParams: GeneratorParams = {
    ...def.params,
    ...overrideParams,
  };
  return factory(mergedParams);
}

export {
  generateCpf,
  generateCnpj,
  generateEmail,
  generatePhone,
  generateFirstName,
  generateLastName,
  generateFullName,
  generateCompanyName,
  generateStreet,
  generateHouseNumber,
  generateComplement,
  generateNeighborhood,
  generateCity,
  generateState,
  generateCountry,
  generateCep,
  generateFullAddress,
  generateDate,
  generateBirthDate,
  generateFutureDate,
  generateRg,
  generateCnh,
  generatePis,
  generateCreditCardNumber,
  generateCreditCardExpiration,
  generateCreditCardCvv,
  generatePixKey,
  generatePassword,
  generateUsername,
  generateNumber,
  generateText,
  generateDescription,
  generateNotes,
  generateMoney,
  generateWebsite,
  generateProductName,
  generateSku,
  generateCoupon,
  generateJobTitle,
  generateDepartment,
  generateCpfCnpj,
  generateEmployeeCount,
  generateOtp,
  generateVerificationCode,
  generatePassport,
  generateNationalId,
  generateTaxId,
  generateDocumentIssuer,
};
