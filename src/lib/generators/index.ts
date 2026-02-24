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
  "date-iso": () => generateDate("iso"),
  "birth-date": (p) => generateBirthDate(p?.min ?? 18, p?.max ?? 65),
  "future-date": (p) => generateFutureDate(p?.max ?? 90),

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

export function generate(fieldType: FieldType): string {
  const fn = generatorMap.get(fieldType);
  return fn ? fn() : generateText(3);
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
