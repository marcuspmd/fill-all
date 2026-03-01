import {
  FIELD_TYPES,
  FIELD_TYPES_BY_CATEGORY,
  type FieldCategory,
  type FieldType,
} from "@/types";

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

/** A named group of field type options, used to render `<optgroup>` elements. */
export interface FieldTypeGroup {
  category: FieldCategory;
  label: string;
  options: FieldTypeOption[];
}

/** Portuguese labels for each field category. */
const FIELD_CATEGORY_LABELS: Record<FieldCategory, string> = {
  personal: "Pessoal",
  contact: "Contato",
  address: "Endereço",
  document: "Documentos",
  financial: "Financeiro",
  authentication: "Autenticação",
  professional: "Profissional",
  ecommerce: "E-commerce",
  system: "Sistema",
  generic: "Genérico",
  unknown: "Desconhecido",
};

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

/**
 * Returns field type options grouped by category, sorted alphabetically within
 * each group and with groups themselves sorted alphabetically by their label.
 * Groups with no matching types are omitted.
 */
export function getFieldTypeGroupedOptions(
  types: readonly FieldType[] = FIELD_TYPES,
): FieldTypeGroup[] {
  const typeSet = new Set(types);

  return (
    Object.entries(FIELD_TYPES_BY_CATEGORY) as [FieldCategory, FieldType[]][]
  )
    .map(([category, categoryTypes]) => ({
      category,
      label: FIELD_CATEGORY_LABELS[category],
      options: categoryTypes
        .filter((t) => typeSet.has(t))
        .map((type) => ({ value: type, label: getFieldTypeLabel(type) }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    }))
    .filter((group) => group.options.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}
