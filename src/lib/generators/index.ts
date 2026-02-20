/**
 * Central generator registry — maps FieldType to a generator function
 */

import type { FieldType } from "@/types";
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
  generateCity,
  generateState,
  generateCep,
  generateFullAddress,
} from "./address";
import { generateDate, generateBirthDate } from "./date";
import { generateRg } from "./rg";
import {
  generatePassword,
  generateUsername,
  generateNumber,
  generateText,
  generateMoney,
} from "./misc";

export type GeneratorFn = () => string;

const generatorMap: Record<FieldType, GeneratorFn> = {
  cpf: () => generateCpf(true),
  cnpj: () => generateCnpj(true),
  email: generateEmail,
  phone: () => generatePhone(true, true),
  name: generateFullName,
  "first-name": generateFirstName,
  "last-name": generateLastName,
  "full-name": generateFullName,
  address: generateFullAddress,
  street: generateStreet,
  city: generateCity,
  state: generateState,
  "zip-code": () => generateCep(true),
  cep: () => generateCep(true),
  date: () => generateDate("iso"),
  "birth-date": () => generateBirthDate(),
  number: () => generateNumber(),
  password: () => generatePassword(),
  username: generateUsername,
  company: generateCompanyName,
  rg: () => generateRg(true),
  text: () => generateText(),
  money: () => generateMoney(),
  select: () => "",
  checkbox: () => "true",
  radio: () => "true",
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
  generateCity,
  generateState,
  generateCep,
  generateFullAddress,
  generateDate,
  generateBirthDate,
  generateRg,
  generatePassword,
  generateUsername,
  generateNumber,
  generateText,
  generateMoney,
};
