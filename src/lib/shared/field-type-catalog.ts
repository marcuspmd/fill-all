import { FIELD_TYPES, type FieldType } from "@/types";

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

export interface FieldTypeOption {
  value: FieldType;
  label: string;
}

export function getFieldTypeLabel(type: FieldType): string {
  const override = FIELD_TYPE_LABEL_OVERRIDES[type];
  if (override) return override;

  return type
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function getFieldTypeOptions(
  types: readonly FieldType[] = FIELD_TYPES,
): FieldTypeOption[] {
  return [...types]
    .map((type) => ({ value: type, label: getFieldTypeLabel(type) }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}
