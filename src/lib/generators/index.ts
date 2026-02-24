/**
 * Central generator registry — maps FieldType to a generator function.
 * Default params (min/max, length, etc.) come from FIELD_TYPE_DEFINITIONS.
 */

import type { FieldType } from "@/types";
import { getRange, getDefaultParams } from "@/types";
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
} from "./misc";

export type GeneratorFn = () => string;

const generatorMap: Partial<Record<FieldType, GeneratorFn>> = {
  // ── Documentos ──────────────────────────────────────────────
  cpf: () => generateCpf(true),
  cnpj: () => generateCnpj(true),
  "cpf-cnpj": generateCpfCnpj,
  rg: () => generateRg(true),
  passport: generatePassport,
  cnh: generateCnh,
  pis: generatePis,
  "national-id": generateNationalId,
  "tax-id": generateTaxId,

  // ── Nome / Pessoal ─────────────────────────────────────────
  name: generateFullName,
  "first-name": generateFirstName,
  "last-name": generateLastName,
  "full-name": generateFullName,

  // ── Contato ─────────────────────────────────────────────────
  email: generateEmail,
  phone: () => generatePhone(true, false),
  mobile: () => generatePhone(true, true),
  whatsapp: () => generatePhone(true, true),

  // ── Endereço ────────────────────────────────────────────────
  address: generateFullAddress,
  street: generateStreet,
  "house-number": generateHouseNumber,
  complement: generateComplement,
  neighborhood: generateNeighborhood,
  city: generateCity,
  state: generateState,
  country: generateCountry,
  cep: () => generateCep(true),
  "zip-code": () => generateCep(true),

  // ── Datas ───────────────────────────────────────────────────
  date: () => generateDate("iso"),
  "birth-date": () => generateBirthDate(),
  "start-date": () => generateFutureDate(90),
  "end-date": () => generateFutureDate(365),
  "due-date": () => generateFutureDate(30),

  // ── Financeiro ──────────────────────────────────────────────
  money: () => {
    const r = getRange("money", 1, 10_000);
    return generateMoney(r.min, r.max);
  },
  price: () => {
    const r = getRange("price", 1, 10_000);
    return generateMoney(r.min, r.max);
  },
  amount: () => {
    const r = getRange("amount", 1, 10_000);
    return generateMoney(r.min, r.max);
  },
  discount: () => {
    const r = getRange("discount", 1, 100);
    return generateMoney(r.min, r.max);
  },
  tax: () => {
    const r = getRange("tax", 1, 100);
    return generateMoney(r.min, r.max);
  },
  number: () => {
    const r = getRange("number", 1, 99_999);
    return generateNumber(r.min, r.max);
  },
  "credit-card-number": generateCreditCardNumber,
  "credit-card-expiration": generateCreditCardExpiration,
  "credit-card-cvv": generateCreditCardCvv,
  "pix-key": generatePixKey,

  // ── Empresa / Profissional ──────────────────────────────────
  company: generateCompanyName,
  supplier: generateCompanyName,
  "employee-count": () => {
    const r = getRange("employee-count", 1, 10_000);
    return generateNumber(r.min, r.max);
  },
  "job-title": generateJobTitle,
  department: generateDepartment,

  // ── Autenticação ────────────────────────────────────────────
  username: generateUsername,
  password: () => generatePassword(getDefaultParams("password")?.length ?? 12),
  "confirm-password": () =>
    generatePassword(getDefaultParams("confirm-password")?.length ?? 12),
  otp: () => generateOtp(getDefaultParams("otp")?.length ?? 6),
  "verification-code": () =>
    generateVerificationCode(
      getDefaultParams("verification-code")?.length ?? 6,
    ),

  // ── E-commerce ──────────────────────────────────────────────
  product: generateProductName,
  "product-name": generateProductName,
  sku: generateSku,
  quantity: () => {
    const r = getRange("quantity", 1, 100);
    return generateNumber(r.min, r.max);
  },
  coupon: generateCoupon,

  // ── Genéricos ───────────────────────────────────────────────
  text: () => generateText(),
  description: generateDescription,
  notes: generateNotes,
  search: () => generateText(2),
  website: generateWebsite,
  url: generateWebsite,

  // ── Componentes ─────────────────────────────────────────────
  select: () => "",
  checkbox: () => "true",
  radio: () => "true",
  file: () => "",
  unknown: () => generateText(3),
};

export function generate(fieldType: FieldType): string {
  const fn = generatorMap[fieldType];
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
};
