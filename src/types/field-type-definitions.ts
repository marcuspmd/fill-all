/**
 * Single source of truth for field type metadata, categories, and default generator params.
 *
 * - Derive `FIELD_TYPES_BY_CATEGORY` from this.
 * - Generator params (min/max, formatted, etc.) live HERE, not in Settings or FieldRule.
 */

import type { FieldType, FieldCategory } from "./index";

/** Extra parameters passed to a generator function (min/max, format, etc.). */
export interface GeneratorParams {
  readonly min?: number;
  readonly max?: number;
  readonly formatted?: boolean;
  readonly length?: number;
  readonly onlyNumbers?: boolean;
  readonly onlyLetters?: boolean;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly pattern?: string;
  readonly options?: string[]; // for select/radio
  readonly probability?: number; // for optional fields or boolean fields
  readonly dateFormat?: "iso" | "br" | "us";
  readonly [key: string]: unknown; // allow extra params without TS errors
}

/** Metadata entry describing a single field type with its category, generator, and params. */
export interface FieldTypeDefinition {
  readonly type: FieldType;
  readonly category: FieldCategory;
  readonly description: string;
  /**
   * Key referencing a generator factory in the generator registry.
   * Types that share a generator use the same key with different params
   * (e.g. money, price, amount → "money" with different min/max).
   * If omitted, `generate()` falls back to a generic text generator.
   */
  readonly generator?: string;
  readonly params?: GeneratorParams;
}

/** Complete registry of all field type definitions with their metadata and generator config. */
export const FIELD_TYPE_DEFINITIONS: readonly FieldTypeDefinition[] = [
  // ── Documentos ──────────────────────────────────────────────
  {
    type: "cpf",
    category: "document",
    description: "CPF — Cadastro de Pessoas Físicas",
    generator: "cpf",
    params: { formatted: true },
  },
  {
    type: "cnpj",
    category: "document",
    description: "CNPJ — Cadastro Nacional de Pessoa Jurídica",
    generator: "cnpj",
    params: { formatted: true },
  },
  {
    type: "cpf-cnpj",
    category: "document",
    description: "CPF ou CNPJ aleatório",
    generator: "cpf-cnpj",
    params: { formatted: true },
  },
  {
    type: "rg",
    category: "document",
    description: "RG — Registro Geral",
    generator: "rg",
    params: { formatted: true },
  },
  {
    type: "passport",
    category: "document",
    description: "Número de passaporte",
    generator: "passport",
  },
  {
    type: "cnh",
    category: "document",
    description: "CNH — Carteira Nacional de Habilitação",
    generator: "cnh",
  },
  {
    type: "pis",
    category: "document",
    description: "PIS/PASEP",
    generator: "pis",
  },
  {
    type: "national-id",
    category: "document",
    description: "Documento de identidade genérico",
    generator: "national-id",
  },
  {
    type: "tax-id",
    category: "document",
    description: "Identificação fiscal genérica",
    generator: "tax-id",
  },
  {
    type: "document-issuer",
    category: "document",
    description: "Órgão expedidor / emissor do documento",
    generator: "document-issuer",
  },

  // ── Nome ────────────────────────────────────────────────────
  {
    type: "name",
    category: "personal",
    description: "Nome completo",
    generator: "full-name",
  },
  {
    type: "first-name",
    category: "personal",
    description: "Primeiro nome",
    generator: "first-name",
  },
  {
    type: "last-name",
    category: "personal",
    description: "Sobrenome",
    generator: "last-name",
  },
  {
    type: "full-name",
    category: "personal",
    description: "Nome completo (sinônimo)",
    generator: "full-name",
  },

  // ── Contato ─────────────────────────────────────────────────
  {
    type: "email",
    category: "contact",
    description: "Endereço de e-mail",
    generator: "email",
  },
  {
    type: "phone",
    category: "contact",
    description: "Telefone fixo",
    generator: "phone",
  },
  {
    type: "mobile",
    category: "contact",
    description: "Telefone celular",
    generator: "mobile-phone",
  },
  {
    type: "whatsapp",
    category: "contact",
    description: "Número WhatsApp",
    generator: "mobile-phone",
  },

  // ── Endereço ────────────────────────────────────────────────
  {
    type: "address",
    category: "address",
    description: "Endereço completo",
    generator: "full-address",
  },
  {
    type: "street",
    category: "address",
    description: "Logradouro",
    generator: "street",
    params: {
      onlyLetters: true,
    },
  },
  {
    type: "house-number",
    category: "address",
    description: "Número da residência",
    generator: "number",
    params: { min: 1, max: 9999 },
  },
  {
    type: "complement",
    category: "address",
    description: "Complemento do endereço",
    generator: "complement",
    params: { onlyLetters: true },
  },
  {
    type: "neighborhood",
    category: "address",
    description: "Bairro",
    generator: "neighborhood",
    params: { onlyLetters: true },
  },
  {
    type: "city",
    category: "address",
    description: "Cidade",
    generator: "city",
    params: { onlyLetters: true },
  },
  {
    type: "state",
    category: "address",
    description: "Estado / UF",
    generator: "state",
    params: { onlyLetters: true },
  },
  {
    type: "country",
    category: "address",
    description: "País",
    generator: "country",
    params: { onlyLetters: true },
  },
  {
    type: "cep",
    category: "address",
    description: "CEP — Código de Endereçamento Postal",
    generator: "cep",
    params: { formatted: true },
  },
  {
    type: "zip-code",
    category: "address",
    description: "CEP / Zip Code",
    generator: "cep",
    params: { formatted: true },
  },

  // ── Datas ───────────────────────────────────────────────────
  {
    type: "date",
    category: "generic",
    description: "Data genérica (ISO)",
    generator: "date-iso",
  },
  {
    type: "birth-date",
    category: "personal",
    description: "Data de nascimento",
    generator: "birth-date",
    params: { min: 18, max: 65 },
  },
  {
    type: "start-date",
    category: "generic",
    description: "Data de início",
    generator: "future-date",
    params: { max: 90 },
  },
  {
    type: "end-date",
    category: "generic",
    description: "Data de término",
    generator: "future-date",
    params: { max: 365 },
  },
  {
    type: "due-date",
    category: "generic",
    description: "Data de vencimento",
    generator: "future-date",
    params: { max: 30 },
  },

  // ── Financeiro ──────────────────────────────────────────────
  {
    type: "money",
    category: "financial",
    description: "Valor monetário",
    generator: "money",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "price",
    category: "financial",
    description: "Preço",
    generator: "money",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "amount",
    category: "financial",
    description: "Valor / Quantia",
    generator: "money",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "discount",
    category: "financial",
    description: "Desconto percentual",
    generator: "money",
    params: { min: 1, max: 100 },
  },
  {
    type: "tax",
    category: "financial",
    description: "Imposto / Taxa percentual",
    generator: "money",
    params: { min: 1, max: 100 },
  },
  {
    type: "credit-card-number",
    category: "financial",
    description: "Número do cartão de crédito",
    generator: "credit-card-number",
  },
  {
    type: "credit-card-expiration",
    category: "financial",
    description: "Validade do cartão",
    generator: "credit-card-expiration",
  },
  {
    type: "credit-card-cvv",
    category: "financial",
    description: "CVV do cartão",
    generator: "credit-card-cvv",
  },
  {
    type: "pix-key",
    category: "financial",
    description: "Chave PIX",
    generator: "pix-key",
  },

  // ── Empresa / Profissional ──────────────────────────────────
  {
    type: "company",
    category: "ecommerce",
    description: "Nome da empresa",
    generator: "company",
  },
  {
    type: "supplier",
    category: "ecommerce",
    description: "Fornecedor",
    generator: "company",
  },
  {
    type: "employee-count",
    category: "professional",
    description: "Quantidade de funcionários",
    generator: "number",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "job-title",
    category: "professional",
    description: "Cargo / Função",
    generator: "job-title",
  },
  {
    type: "department",
    category: "professional",
    description: "Departamento",
    generator: "department",
  },

  // ── Autenticação ────────────────────────────────────────────
  {
    type: "username",
    category: "authentication",
    description: "Nome de usuário",
    generator: "username",
  },
  {
    type: "password",
    category: "authentication",
    description: "Senha",
    generator: "password",
    params: { length: 12 },
  },
  {
    type: "confirm-password",
    category: "authentication",
    description: "Confirmação de senha",
    generator: "password",
    params: { length: 12 },
  },
  {
    type: "otp",
    category: "authentication",
    description: "Código OTP",
    generator: "otp",
    params: { length: 6 },
  },
  {
    type: "verification-code",
    category: "authentication",
    description: "Código de verificação",
    generator: "verification-code",
    params: { length: 6 },
  },

  // ── E-commerce ──────────────────────────────────────────────
  {
    type: "product",
    category: "ecommerce",
    description: "Produto genérico",
    generator: "product-name",
  },
  {
    type: "product-name",
    category: "ecommerce",
    description: "Nome do produto",
    generator: "product-name",
  },
  {
    type: "sku",
    category: "ecommerce",
    description: "Código SKU",
    generator: "sku",
  },
  {
    type: "quantity",
    category: "ecommerce",
    description: "Quantidade",
    generator: "number",
    params: { min: 1, max: 100 },
  },
  {
    type: "coupon",
    category: "ecommerce",
    description: "Cupom de desconto",
    generator: "coupon",
  },

  // ── Genéricos ───────────────────────────────────────────────
  {
    type: "text",
    category: "generic",
    description: "Texto livre",
    generator: "text",
  },
  {
    type: "description",
    category: "generic",
    description: "Descrição",
    generator: "description",
  },
  {
    type: "notes",
    category: "generic",
    description: "Notas / Observações",
    generator: "notes",
  },
  {
    type: "search",
    category: "system",
    description: "Campo de busca",
    generator: "search-text",
  },
  {
    type: "website",
    category: "contact",
    description: "Website / URL",
    generator: "website",
  },
  {
    type: "url",
    category: "contact",
    description: "URL genérica",
    generator: "website",
  },
  {
    type: "number",
    category: "financial",
    description: "Número genérico",
    generator: "number",
    params: { min: 1, max: 99_999 },
  },

  // ── Componentes ─────────────────────────────────────────────
  {
    type: "select",
    category: "system",
    description: "Campo select",
    generator: "empty",
  },
  {
    type: "checkbox",
    category: "system",
    description: "Checkbox",
    generator: "boolean",
  },
  {
    type: "radio",
    category: "system",
    description: "Radio button",
    generator: "boolean",
  },
  {
    type: "file",
    category: "system",
    description: "Upload de arquivo",
    generator: "empty",
  },
  {
    type: "unknown",
    category: "unknown",
    description: "Tipo desconhecido",
    generator: "fallback-text",
  },
];

// ── Helpers ─────────────────────────────────────────────────────

const definitionIndex = new Map<FieldType, FieldTypeDefinition>(
  FIELD_TYPE_DEFINITIONS.map((d) => [d.type, d]),
);

/** Retorna a definição completa para o tipo informado. */
export function getDefinition(
  type: FieldType,
): FieldTypeDefinition | undefined {
  return definitionIndex.get(type);
}

/** Retorna os params default de um tipo (min/max, formatted etc.). */
export function getDefaultParams(type: FieldType): GeneratorParams | undefined {
  return definitionIndex.get(type)?.params;
}

/** Retorna min/max numéricos de um tipo, com fallbacks seguros. */
export function getRange(
  type: FieldType,
  fallbackMin = 1,
  fallbackMax = 99_999,
): { min: number; max: number } {
  const p = getDefaultParams(type);
  return {
    min: p?.min ?? fallbackMin,
    max: p?.max ?? fallbackMax,
  };
}

/**
 * Deriva FIELD_TYPES_BY_CATEGORY a partir de FIELD_TYPE_DEFINITIONS.
 * Resultado é estável (memoizado no módulo).
 */
export const FIELD_TYPES_BY_CATEGORY_DERIVED: Record<
  FieldCategory,
  FieldType[]
> = FIELD_TYPE_DEFINITIONS.reduce(
  (acc, def) => {
    if (!acc[def.category]) acc[def.category] = [];
    acc[def.category].push(def.type);
    return acc;
  },
  {} as Record<FieldCategory, FieldType[]>,
);

// ── Generator Parameter Definitions ──────────────────────────────────────

/** Describes a single customizable parameter for a generator factory. */
/** Option entry for select-type parameter controls. */
export interface SelectOption {
  readonly value: string;
  readonly labelKey: string;
}

export interface GeneratorParamDef {
  readonly key: keyof GeneratorParams;
  readonly type: "number" | "boolean" | "select";
  readonly labelKey: string;
  readonly defaultValue: number | boolean | string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Available options when type is "select". */
  readonly selectOptions?: readonly SelectOption[];
}

/**
 * Registry mapping generator factory keys to their customizable parameters.
 * Only generators that accept meaningful params are listed here.
 * The UI uses this to render param controls when creating/editing rules.
 */
export const GENERATOR_PARAM_DEFS: Readonly<
  Record<string, readonly GeneratorParamDef[]>
> = {
  // ── Documentos ──────────────────────────────────────────────
  cpf: [
    {
      key: "formatted",
      type: "boolean",
      labelKey: "paramFormatted",
      defaultValue: true,
    },
  ],
  cnpj: [
    {
      key: "formatted",
      type: "boolean",
      labelKey: "paramFormatted",
      defaultValue: true,
    },
  ],
  "cpf-cnpj": [
    {
      key: "formatted",
      type: "boolean",
      labelKey: "paramFormatted",
      defaultValue: true,
    },
  ],
  rg: [
    {
      key: "formatted",
      type: "boolean",
      labelKey: "paramFormatted",
      defaultValue: true,
    },
  ],
  cep: [
    {
      key: "formatted",
      type: "boolean",
      labelKey: "paramFormatted",
      defaultValue: true,
    },
  ],

  // ── Endereço ────────────────────────────────────────────────
  street: [
    {
      key: "onlyLetters",
      type: "boolean",
      labelKey: "paramOnlyLetters",
      defaultValue: false,
    },
  ],
  complement: [
    {
      key: "onlyLetters",
      type: "boolean",
      labelKey: "paramOnlyLetters",
      defaultValue: false,
    },
  ],
  neighborhood: [
    {
      key: "onlyLetters",
      type: "boolean",
      labelKey: "paramOnlyLetters",
      defaultValue: false,
    },
  ],

  // ── Datas ───────────────────────────────────────────────────
  "date-iso": [
    {
      key: "dateFormat",
      type: "select",
      labelKey: "paramDateFormat",
      defaultValue: "iso",
      selectOptions: [
        { value: "iso", labelKey: "dateFormatIso" },
        { value: "br", labelKey: "dateFormatBr" },
        { value: "us", labelKey: "dateFormatUs" },
      ],
    },
  ],
  "birth-date": [
    {
      key: "dateFormat",
      type: "select",
      labelKey: "paramDateFormat",
      defaultValue: "iso",
      selectOptions: [
        { value: "iso", labelKey: "dateFormatIso" },
        { value: "br", labelKey: "dateFormatBr" },
        { value: "us", labelKey: "dateFormatUs" },
      ],
    },
    {
      key: "min",
      type: "number",
      labelKey: "paramMinAge",
      defaultValue: 18,
      min: 0,
      max: 120,
      step: 1,
    },
    {
      key: "max",
      type: "number",
      labelKey: "paramMaxAge",
      defaultValue: 65,
      min: 1,
      max: 120,
      step: 1,
    },
  ],
  "future-date": [
    {
      key: "dateFormat",
      type: "select",
      labelKey: "paramDateFormat",
      defaultValue: "iso",
      selectOptions: [
        { value: "iso", labelKey: "dateFormatIso" },
        { value: "br", labelKey: "dateFormatBr" },
        { value: "us", labelKey: "dateFormatUs" },
      ],
    },
    {
      key: "max",
      type: "number",
      labelKey: "paramMaxDays",
      defaultValue: 90,
      min: 1,
      max: 3650,
      step: 1,
    },
  ],

  // ── Financeiro ──────────────────────────────────────────────
  money: [
    {
      key: "min",
      type: "number",
      labelKey: "paramMinValue",
      defaultValue: 1,
      min: 0,
      max: 999_999,
      step: 1,
    },
    {
      key: "max",
      type: "number",
      labelKey: "paramMaxValue",
      defaultValue: 10_000,
      min: 1,
      max: 999_999,
      step: 1,
    },
  ],
  number: [
    {
      key: "min",
      type: "number",
      labelKey: "paramMinValue",
      defaultValue: 1,
      min: 0,
      max: 999_999,
      step: 1,
    },
    {
      key: "max",
      type: "number",
      labelKey: "paramMaxValue",
      defaultValue: 99_999,
      min: 1,
      max: 999_999,
      step: 1,
    },
  ],

  // ── Autenticação ────────────────────────────────────────────
  password: [
    {
      key: "length",
      type: "number",
      labelKey: "paramLength",
      defaultValue: 12,
      min: 4,
      max: 64,
      step: 1,
    },
  ],
  otp: [
    {
      key: "length",
      type: "number",
      labelKey: "paramLength",
      defaultValue: 6,
      min: 4,
      max: 10,
      step: 1,
    },
  ],
  "verification-code": [
    {
      key: "length",
      type: "number",
      labelKey: "paramLength",
      defaultValue: 6,
      min: 4,
      max: 10,
      step: 1,
    },
  ],
};

/**
 * Returns the parameter definitions for a given generator key.
 * Returns empty array if the generator has no customizable params.
 */
export function getGeneratorParamDefs(
  generatorKey: string,
): readonly GeneratorParamDef[] {
  return GENERATOR_PARAM_DEFS[generatorKey] ?? [];
}

/**
 * Returns the generator key for a given field type, or null if none.
 */
export function getGeneratorKey(type: FieldType): string | null {
  return definitionIndex.get(type)?.generator ?? null;
}
