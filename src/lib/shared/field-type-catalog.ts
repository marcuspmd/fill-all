import { FIELD_TYPES, type FieldType } from "@/types";

/**
 * Human-readable label overrides for field types.
 * Falls back to title-cased hyphen-split names when not listed here.
 */
const FIELD_TYPE_LABEL_OVERRIDES: Partial<Record<FieldType, string>> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  "cpf-cnpj": "CPF/CNPJ",
  rg: "RG",
  cep: "CEP",
  "zip-code": "ZIP Code",
  "full-name": "Nome Completo",
  "first-name": "Primeiro Nome",
  "last-name": "Sobrenome",
  "birth-date": "Data de Nascimento",
  "start-date": "Data de Início",
  "end-date": "Data de Fim",
  "due-date": "Vencimento",
  "employee-count": "Nº Funcionários",
  "job-title": "Cargo",
  username: "Usuário",
  website: "Website",
  url: "URL",
  text: "Texto",
  number: "Número",
  money: "Valor Monetário",
  unknown: "Desconhecido",
};

/** A field type with its display label. */
export interface FieldTypeOption {
  value: FieldType;
  label: string;
}

/** Returns a human-readable label for the given field type. */
export function getFieldTypeLabel(type: FieldType): string {
  const override = FIELD_TYPE_LABEL_OVERRIDES[type];
  if (override) return override;

  return type
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

/**
 * Builds a sorted list of `{ value, label }` options from the given field types.
 * Defaults to all known `FIELD_TYPES` when none are provided.
 */
export function getFieldTypeOptions(
  types: readonly FieldType[] = FIELD_TYPES,
): FieldTypeOption[] {
  return [...types]
    .map((type) => ({ value: type, label: getFieldTypeLabel(type) }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}
