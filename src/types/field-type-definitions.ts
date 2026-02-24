/**
 * Single source of truth for field type metadata, categories, and default generator params.
 *
 * - Derive `FIELD_TYPES_BY_CATEGORY` from this.
 * - Generator params (min/max, formatted, etc.) live HERE, not in Settings or FieldRule.
 */

import type { FieldType, FieldCategory } from "./index";

export interface GeneratorParams {
  readonly min?: number;
  readonly max?: number;
  readonly formatted?: boolean;
  readonly length?: number;
}

export interface FieldTypeDefinition {
  readonly type: FieldType;
  readonly category: FieldCategory;
  readonly description: string;
  readonly params?: GeneratorParams;
}

export const FIELD_TYPE_DEFINITIONS: readonly FieldTypeDefinition[] = [
  // ── Documentos ──────────────────────────────────────────────
  {
    type: "cpf",
    category: "document",
    description: "CPF — Cadastro de Pessoas Físicas",
    params: { formatted: true },
  },
  {
    type: "cnpj",
    category: "document",
    description: "CNPJ — Cadastro Nacional de Pessoa Jurídica",
    params: { formatted: true },
  },
  {
    type: "cpf-cnpj",
    category: "document",
    description: "CPF ou CNPJ aleatório",
    params: { formatted: true },
  },
  {
    type: "rg",
    category: "document",
    description: "RG — Registro Geral",
    params: { formatted: true },
  },
  {
    type: "passport",
    category: "document",
    description: "Número de passaporte",
  },
  {
    type: "cnh",
    category: "document",
    description: "CNH — Carteira Nacional de Habilitação",
  },
  { type: "pis", category: "document", description: "PIS/PASEP" },
  {
    type: "national-id",
    category: "document",
    description: "Documento de identidade genérico",
  },
  {
    type: "tax-id",
    category: "document",
    description: "Identificação fiscal genérica",
  },

  // ── Nome ────────────────────────────────────────────────────
  { type: "name", category: "personal", description: "Nome completo" },
  { type: "first-name", category: "personal", description: "Primeiro nome" },
  { type: "last-name", category: "personal", description: "Sobrenome" },
  {
    type: "full-name",
    category: "personal",
    description: "Nome completo (sinônimo)",
  },

  // ── Contato ─────────────────────────────────────────────────
  { type: "email", category: "contact", description: "Endereço de e-mail" },
  { type: "phone", category: "contact", description: "Telefone fixo" },
  { type: "mobile", category: "contact", description: "Telefone celular" },
  { type: "whatsapp", category: "contact", description: "Número WhatsApp" },

  // ── Endereço ────────────────────────────────────────────────
  { type: "address", category: "address", description: "Endereço completo" },
  { type: "street", category: "address", description: "Logradouro" },
  {
    type: "house-number",
    category: "address",
    description: "Número da residência",
    params: { min: 1, max: 9999 },
  },
  {
    type: "complement",
    category: "address",
    description: "Complemento do endereço",
  },
  { type: "neighborhood", category: "address", description: "Bairro" },
  { type: "city", category: "address", description: "Cidade" },
  { type: "state", category: "address", description: "Estado / UF" },
  { type: "country", category: "address", description: "País" },
  {
    type: "cep",
    category: "address",
    description: "CEP — Código de Endereçamento Postal",
    params: { formatted: true },
  },
  {
    type: "zip-code",
    category: "address",
    description: "CEP / Zip Code",
    params: { formatted: true },
  },

  // ── Datas ───────────────────────────────────────────────────
  { type: "date", category: "generic", description: "Data genérica (ISO)" },
  {
    type: "birth-date",
    category: "personal",
    description: "Data de nascimento",
  },
  { type: "start-date", category: "generic", description: "Data de início" },
  { type: "end-date", category: "generic", description: "Data de término" },
  { type: "due-date", category: "generic", description: "Data de vencimento" },

  // ── Financeiro ──────────────────────────────────────────────
  {
    type: "money",
    category: "financial",
    description: "Valor monetário",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "price",
    category: "financial",
    description: "Preço",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "amount",
    category: "financial",
    description: "Valor / Quantia",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "discount",
    category: "financial",
    description: "Desconto percentual",
    params: { min: 1, max: 100 },
  },
  {
    type: "tax",
    category: "financial",
    description: "Imposto / Taxa percentual",
    params: { min: 1, max: 100 },
  },
  {
    type: "credit-card-number",
    category: "financial",
    description: "Número do cartão de crédito",
  },
  {
    type: "credit-card-expiration",
    category: "financial",
    description: "Validade do cartão",
  },
  {
    type: "credit-card-cvv",
    category: "financial",
    description: "CVV do cartão",
  },
  { type: "pix-key", category: "financial", description: "Chave PIX" },

  // ── Empresa / Profissional ──────────────────────────────────
  { type: "company", category: "ecommerce", description: "Nome da empresa" },
  { type: "supplier", category: "ecommerce", description: "Fornecedor" },
  {
    type: "employee-count",
    category: "professional",
    description: "Quantidade de funcionários",
    params: { min: 1, max: 10_000 },
  },
  {
    type: "job-title",
    category: "professional",
    description: "Cargo / Função",
  },
  { type: "department", category: "professional", description: "Departamento" },

  // ── Autenticação ────────────────────────────────────────────
  {
    type: "username",
    category: "authentication",
    description: "Nome de usuário",
  },
  {
    type: "password",
    category: "authentication",
    description: "Senha",
    params: { length: 12 },
  },
  {
    type: "confirm-password",
    category: "authentication",
    description: "Confirmação de senha",
    params: { length: 12 },
  },
  {
    type: "otp",
    category: "authentication",
    description: "Código OTP",
    params: { length: 6 },
  },
  {
    type: "verification-code",
    category: "authentication",
    description: "Código de verificação",
    params: { length: 6 },
  },

  // ── E-commerce ──────────────────────────────────────────────
  { type: "product", category: "ecommerce", description: "Produto genérico" },
  {
    type: "product-name",
    category: "ecommerce",
    description: "Nome do produto",
  },
  { type: "sku", category: "ecommerce", description: "Código SKU" },
  {
    type: "quantity",
    category: "ecommerce",
    description: "Quantidade",
    params: { min: 1, max: 100 },
  },
  { type: "coupon", category: "ecommerce", description: "Cupom de desconto" },

  // ── Genéricos ───────────────────────────────────────────────
  { type: "text", category: "generic", description: "Texto livre" },
  { type: "description", category: "generic", description: "Descrição" },
  { type: "notes", category: "generic", description: "Notas / Observações" },
  { type: "search", category: "system", description: "Campo de busca" },
  { type: "website", category: "contact", description: "Website / URL" },
  { type: "url", category: "contact", description: "URL genérica" },
  {
    type: "number",
    category: "financial",
    description: "Número genérico",
    params: { min: 1, max: 99_999 },
  },

  // ── Componentes ─────────────────────────────────────────────
  { type: "select", category: "system", description: "Campo select" },
  { type: "checkbox", category: "system", description: "Checkbox" },
  { type: "radio", category: "system", description: "Radio button" },
  { type: "file", category: "system", description: "Upload de arquivo" },
  { type: "unknown", category: "unknown", description: "Tipo desconhecido" },
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
