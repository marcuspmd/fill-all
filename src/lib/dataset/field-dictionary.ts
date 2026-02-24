/**
 * Field Dictionary — Master definition of every field type the extension supports.
 *
 * Each entry describes:
 *   - Which generator(s) can populate it
 *   - UI behaviour (mask, format, element type)
 *   - Select-option semantics (for dropdowns/radios that represent the type)
 *   - Locale-aware formatting rules
 *   - Confidence thresholds and weight for classification
 *
 * ⚠️  When adding a new FieldType to `src/types/index.ts`, add a matching entry
 *     here so training data, generators and option lookup stay in sync.
 */

import type { FieldType } from "@/types";

// ── Option entry for <select> / radio / custom-select fields ────────────────

export interface SelectOption {
  /** Display text shown in the dropdown */
  label: string;
  /** Value attribute of the <option> */
  value: string;
}

// ── Generator descriptor ────────────────────────────────────────────────────

export type GeneratorStrategy =
  | "random" // pick from the built-in generator
  | "select-options" // pick from known options
  | "fixed" // always use fixedValue
  | "contextual" // depends on surrounding fields (e.g. state → city)
  | "ai"; // delegate to Chrome AI / TF.js

export interface GeneratorDescriptor {
  /** Which strategy to use by default */
  strategy: GeneratorStrategy;
  /** Name of the generator function in src/lib/generators */
  generatorFn: string;
  /** Fallback generator if primary fails */
  fallbackFn?: string;
  /** For money/number types — default range */
  range?: { min: number; max: number };
  /** For text types — default word count */
  wordCount?: number;
}

// ── Input characteristics ───────────────────────────────────────────────────

export type ElementKind =
  | "input-text"
  | "input-email"
  | "input-tel"
  | "input-password"
  | "input-number"
  | "input-date"
  | "input-checkbox"
  | "input-radio"
  | "input-range"
  | "select"
  | "textarea"
  | "custom-select"
  | "custom-widget";

export interface InputCharacteristics {
  /** Preferred HTML element/type */
  preferredElement: ElementKind;
  /** Alternative element types that may be used */
  alternativeElements?: ElementKind[];
  /** Input mask pattern (display only, not regex) e.g. "###.###.###-##" */
  mask?: string;
  /** Max length constraint (when known) */
  maxLength?: number;
  /** Min length constraint (when known) */
  minLength?: number;
  /** Whether the field typically appears as required */
  typicallyRequired?: boolean;
  /** Autocomplete attribute value (HTML spec) */
  autocompleteHint?: string;
}

// ── Locale-specific formatting ──────────────────────────────────────────────

export interface LocaleFormat {
  /** Locale tag */
  locale: string;
  /** Display format pattern */
  format: string;
  /** Example value */
  example: string;
}

// ── Context dependency ──────────────────────────────────────────────────────

export interface ContextDependency {
  /** Field type this one depends on */
  dependsOn: FieldType;
  /** How the dependency works */
  relationship: "lookup" | "derived" | "sibling";
  /** Description of the relationship */
  description: string;
}

// ── Main dictionary entry ───────────────────────────────────────────────────

export interface FieldDictionaryEntry {
  /** The field type key (matches FieldType) */
  type: FieldType;

  /** Human-readable category */
  category:
    | "document"
    | "contact"
    | "name"
    | "address"
    | "date"
    | "auth"
    | "business"
    | "numeric"
    | "text"
    | "element"
    | "unknown";

  /** Short description of what this field represents */
  description: string;

  /** Generator configuration */
  generator: GeneratorDescriptor;

  /** Input element characteristics */
  input: InputCharacteristics;

  /** Known select options for this type (used when the field is a <select>) */
  selectOptions?: SelectOption[];

  /** Whether this type typically appears as a <select> dropdown */
  canBeSelect?: boolean;

  /** Locale-specific formatting rules */
  localeFormats?: LocaleFormat[];

  /** Fields that this type contextually depends on or relates to */
  contextDependencies?: ContextDependency[];

  /**
   * Base weight for this type during classification.
   * Higher weight = more likely to win ties. Default = 1.0
   */
  classificationWeight: number;

  /**
   * Minimum confidence score (0–1) required for this type.
   * Below this threshold the classifier falls through to the next strategy.
   */
  minConfidence: number;

  /** Tags for grouping and filtering */
  tags: string[];
}

// ── Brazilian states (used by state & city select options) ──────────────────

const BRAZILIAN_STATES: SelectOption[] = [
  { label: "Acre", value: "AC" },
  { label: "Alagoas", value: "AL" },
  { label: "Amapá", value: "AP" },
  { label: "Amazonas", value: "AM" },
  { label: "Bahia", value: "BA" },
  { label: "Ceará", value: "CE" },
  { label: "Distrito Federal", value: "DF" },
  { label: "Espírito Santo", value: "ES" },
  { label: "Goiás", value: "GO" },
  { label: "Maranhão", value: "MA" },
  { label: "Mato Grosso", value: "MT" },
  { label: "Mato Grosso do Sul", value: "MS" },
  { label: "Minas Gerais", value: "MG" },
  { label: "Pará", value: "PA" },
  { label: "Paraíba", value: "PB" },
  { label: "Paraná", value: "PR" },
  { label: "Pernambuco", value: "PE" },
  { label: "Piauí", value: "PI" },
  { label: "Rio de Janeiro", value: "RJ" },
  { label: "Rio Grande do Norte", value: "RN" },
  { label: "Rio Grande do Sul", value: "RS" },
  { label: "Rondônia", value: "RO" },
  { label: "Roraima", value: "RR" },
  { label: "Santa Catarina", value: "SC" },
  { label: "São Paulo", value: "SP" },
  { label: "Sergipe", value: "SE" },
  { label: "Tocantins", value: "TO" },
];

const GENDER_OPTIONS: SelectOption[] = [
  { label: "Masculino", value: "M" },
  { label: "Feminino", value: "F" },
  { label: "Outro", value: "O" },
  { label: "Prefiro não informar", value: "N" },
];

const MARITAL_STATUS_OPTIONS: SelectOption[] = [
  { label: "Solteiro(a)", value: "solteiro" },
  { label: "Casado(a)", value: "casado" },
  { label: "Divorciado(a)", value: "divorciado" },
  { label: "Viúvo(a)", value: "viuvo" },
  { label: "União Estável", value: "uniao_estavel" },
];

const NATIONALITY_OPTIONS: SelectOption[] = [
  { label: "Brasileiro(a)", value: "brasileiro" },
  { label: "Estrangeiro(a)", value: "estrangeiro" },
  { label: "Naturalizado(a)", value: "naturalizado" },
];

// ── The Dictionary ──────────────────────────────────────────────────────────

export const FIELD_DICTIONARY: FieldDictionaryEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  //  DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "cpf",
    category: "document",
    description:
      "Cadastro de Pessoa Física — 11-digit Brazilian individual tax ID",
    generator: {
      strategy: "random",
      generatorFn: "generateCpf",
    },
    input: {
      preferredElement: "input-text",
      mask: "###.###.###-##",
      maxLength: 14,
      minLength: 11,
      typicallyRequired: true,
      autocompleteHint: "off",
    },
    localeFormats: [
      { locale: "pt-BR", format: "###.###.###-##", example: "123.456.789-09" },
      { locale: "en-US", format: "###########", example: "12345678909" },
    ],
    classificationWeight: 1.2,
    minConfidence: 0.6,
    tags: ["document", "brazilian", "personal", "tax-id"],
  },
  {
    type: "cnpj",
    category: "document",
    description:
      "Cadastro Nacional de Pessoa Jurídica — 14-digit Brazilian company tax ID",
    generator: {
      strategy: "random",
      generatorFn: "generateCnpj",
    },
    input: {
      preferredElement: "input-text",
      mask: "##.###.###/####-##",
      maxLength: 18,
      minLength: 14,
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    localeFormats: [
      {
        locale: "pt-BR",
        format: "##.###.###/####-##",
        example: "12.345.678/0001-95",
      },
    ],
    classificationWeight: 1.2,
    minConfidence: 0.6,
    tags: ["document", "brazilian", "business", "tax-id"],
  },
  {
    type: "rg",
    category: "document",
    description: "Registro Geral — Brazilian identity card number",
    generator: {
      strategy: "random",
      generatorFn: "generateRg",
    },
    input: {
      preferredElement: "input-text",
      mask: "##.###.###-#",
      maxLength: 12,
      minLength: 7,
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    localeFormats: [
      { locale: "pt-BR", format: "##.###.###-#", example: "12.345.678-9" },
    ],
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["document", "brazilian", "personal", "identity"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONTACT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "email",
    category: "contact",
    description: "Email address",
    generator: {
      strategy: "random",
      generatorFn: "generateEmail",
    },
    input: {
      preferredElement: "input-email",
      maxLength: 254,
      minLength: 5,
      typicallyRequired: true,
      autocompleteHint: "email",
    },
    localeFormats: [
      {
        locale: "pt-BR",
        format: "user@domain.com",
        example: "joao.silva@email.com",
      },
      {
        locale: "en-US",
        format: "user@domain.com",
        example: "john.doe@email.com",
      },
    ],
    classificationWeight: 1.0,
    minConfidence: 0.5,
    tags: ["contact", "universal"],
  },
  {
    type: "phone",
    category: "contact",
    description: "Phone number (Brazilian format by default)",
    generator: {
      strategy: "random",
      generatorFn: "generatePhone",
    },
    input: {
      preferredElement: "input-tel",
      mask: "(##) #####-####",
      maxLength: 15,
      minLength: 10,
      typicallyRequired: false,
      autocompleteHint: "tel",
    },
    localeFormats: [
      {
        locale: "pt-BR",
        format: "(##) #####-####",
        example: "(11) 99876-5432",
      },
      { locale: "en-US", format: "(###) ###-####", example: "(555) 123-4567" },
    ],
    classificationWeight: 1.0,
    minConfidence: 0.5,
    tags: ["contact", "communication"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  NAMES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "name",
    category: "name",
    description: "Generic name field (defaults to full name)",
    generator: {
      strategy: "random",
      generatorFn: "generateFullName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 100,
      minLength: 2,
      typicallyRequired: true,
      autocompleteHint: "name",
    },
    classificationWeight: 0.8,
    minConfidence: 0.5,
    tags: ["name", "personal"],
  },
  {
    type: "first-name",
    category: "name",
    description: "First/given name",
    generator: {
      strategy: "random",
      generatorFn: "generateFirstName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 50,
      minLength: 2,
      typicallyRequired: true,
      autocompleteHint: "given-name",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["name", "personal"],
  },
  {
    type: "last-name",
    category: "name",
    description: "Last/family name / surname",
    generator: {
      strategy: "random",
      generatorFn: "generateLastName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 50,
      minLength: 2,
      typicallyRequired: true,
      autocompleteHint: "family-name",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["name", "personal"],
  },
  {
    type: "full-name",
    category: "name",
    description: "Full name (first + last, optionally middle)",
    generator: {
      strategy: "random",
      generatorFn: "generateFullName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 150,
      minLength: 5,
      typicallyRequired: true,
      autocompleteHint: "name",
    },
    classificationWeight: 1.1,
    minConfidence: 0.6,
    tags: ["name", "personal"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ADDRESS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "address",
    category: "address",
    description:
      "Full address (street + number + complement + city + state + zip)",
    generator: {
      strategy: "random",
      generatorFn: "generateFullAddress",
    },
    input: {
      preferredElement: "input-text",
      alternativeElements: ["textarea"],
      maxLength: 200,
      typicallyRequired: false,
      autocompleteHint: "street-address",
    },
    classificationWeight: 1.0,
    minConfidence: 0.5,
    tags: ["address", "location"],
  },
  {
    type: "street",
    category: "address",
    description: "Street name with number",
    generator: {
      strategy: "random",
      generatorFn: "generateStreet",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 150,
      typicallyRequired: false,
      autocompleteHint: "address-line1",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["address", "location"],
  },
  {
    type: "city",
    category: "address",
    description: "City / municipality name",
    generator: {
      strategy: "random",
      generatorFn: "generateCity",
    },
    input: {
      preferredElement: "input-text",
      alternativeElements: ["select", "custom-select"],
      maxLength: 80,
      typicallyRequired: false,
      autocompleteHint: "address-level2",
    },
    canBeSelect: true,
    contextDependencies: [
      {
        dependsOn: "state",
        relationship: "lookup",
        description: "City list depends on selected state",
      },
    ],
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["address", "location"],
  },
  {
    type: "state",
    category: "address",
    description: "State / province / UF",
    generator: {
      strategy: "random",
      generatorFn: "generateState",
    },
    input: {
      preferredElement: "select",
      alternativeElements: ["input-text", "custom-select"],
      maxLength: 2,
      typicallyRequired: false,
      autocompleteHint: "address-level1",
    },
    canBeSelect: true,
    selectOptions: BRAZILIAN_STATES,
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["address", "location", "brazilian"],
  },
  {
    type: "zip-code",
    category: "address",
    description: "ZIP code / postal code (international)",
    generator: {
      strategy: "random",
      generatorFn: "generateCep",
    },
    input: {
      preferredElement: "input-text",
      mask: "#####-###",
      maxLength: 10,
      minLength: 5,
      typicallyRequired: false,
      autocompleteHint: "postal-code",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["address", "location"],
  },
  {
    type: "cep",
    category: "address",
    description: "CEP — Brazilian postal code (8 digits, formatted #####-###)",
    generator: {
      strategy: "random",
      generatorFn: "generateCep",
    },
    input: {
      preferredElement: "input-text",
      mask: "#####-###",
      maxLength: 9,
      minLength: 8,
      typicallyRequired: false,
      autocompleteHint: "postal-code",
    },
    localeFormats: [
      { locale: "pt-BR", format: "#####-###", example: "01310-100" },
    ],
    contextDependencies: [
      {
        dependsOn: "city",
        relationship: "derived",
        description: "CEP prefix derives from the city/state",
      },
    ],
    classificationWeight: 1.1,
    minConfidence: 0.6,
    tags: ["address", "location", "brazilian"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  DATES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "date",
    category: "date",
    description: "Generic date field (start/end/expiry/etc.)",
    generator: {
      strategy: "random",
      generatorFn: "generateDate",
    },
    input: {
      preferredElement: "input-date",
      alternativeElements: ["input-text", "custom-widget"],
      mask: "DD/MM/YYYY",
      maxLength: 10,
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    localeFormats: [
      { locale: "pt-BR", format: "DD/MM/YYYY", example: "15/03/2025" },
      { locale: "en-US", format: "MM/DD/YYYY", example: "03/15/2025" },
    ],
    classificationWeight: 0.9,
    minConfidence: 0.5,
    tags: ["date", "temporal"],
  },
  {
    type: "birth-date",
    category: "date",
    description: "Date of birth (generates a valid age 18–65 date)",
    generator: {
      strategy: "random",
      generatorFn: "generateBirthDate",
    },
    input: {
      preferredElement: "input-date",
      alternativeElements: ["input-text", "custom-widget"],
      mask: "DD/MM/YYYY",
      maxLength: 10,
      typicallyRequired: false,
      autocompleteHint: "bday",
    },
    localeFormats: [
      { locale: "pt-BR", format: "DD/MM/YYYY", example: "25/12/1990" },
      { locale: "en-US", format: "MM/DD/YYYY", example: "12/25/1990" },
    ],
    classificationWeight: 1.1,
    minConfidence: 0.6,
    tags: ["date", "temporal", "personal"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "password",
    category: "auth",
    description: "Password field",
    generator: {
      strategy: "random",
      generatorFn: "generatePassword",
    },
    input: {
      preferredElement: "input-password",
      maxLength: 64,
      minLength: 8,
      typicallyRequired: true,
      autocompleteHint: "new-password",
    },
    classificationWeight: 1.0,
    minConfidence: 0.5,
    tags: ["auth", "security"],
  },
  {
    type: "username",
    category: "auth",
    description: "Username / login / handle",
    generator: {
      strategy: "random",
      generatorFn: "generateUsername",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 30,
      minLength: 3,
      typicallyRequired: true,
      autocompleteHint: "username",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["auth", "identity"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  BUSINESS (continued)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "company",
    category: "business",
    description: "Company / organization name (razão social, nome fantasia)",
    generator: {
      strategy: "random",
      generatorFn: "generateCompanyName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 150,
      minLength: 2,
      typicallyRequired: false,
      autocompleteHint: "organization",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["business", "organization"],
  },
  {
    type: "supplier",
    category: "business",
    description:
      "Supplier / vendor / partner company name (fornecedor, parceiro)",
    generator: {
      strategy: "random",
      generatorFn: "generateCompanyName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 150,
      minLength: 2,
      typicallyRequired: false,
      autocompleteHint: "organization",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["business", "supplier", "vendor"],
  },
  {
    type: "product",
    category: "business",
    description: "Product name / item / SKU description",
    generator: {
      strategy: "random",
      generatorFn: "generateProductName",
    },
    input: {
      preferredElement: "input-text",
      maxLength: 200,
      minLength: 2,
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["business", "product", "inventory"],
  },
  {
    type: "employee-count",
    category: "numeric",
    description: "Number of employees / headcount / workforce size",
    generator: {
      strategy: "random",
      generatorFn: "generateEmployeeCount",
      range: { min: 1, max: 100000 },
    },
    input: {
      preferredElement: "input-number",
      alternativeElements: ["input-text", "select", "custom-select"],
      maxLength: 10,
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    canBeSelect: true,
    selectOptions: [
      { label: "1 a 10", value: "1-10" },
      { label: "11 a 50", value: "11-50" },
      { label: "51 a 100", value: "51-100" },
      { label: "101 a 500", value: "101-500" },
      { label: "501 a 1000", value: "501-1000" },
      { label: "Mais de 1000", value: "1000+" },
    ],
    classificationWeight: 1.1,
    minConfidence: 0.6,
    tags: ["business", "numeric", "headcount"],
  },
  {
    type: "website",
    category: "contact",
    description: "Website URL / homepage / social media profile URL",
    generator: {
      strategy: "random",
      generatorFn: "generateWebsite",
    },
    input: {
      preferredElement: "input-text",
      alternativeElements: ["input-email"],
      maxLength: 255,
      minLength: 4,
      typicallyRequired: false,
      autocompleteHint: "url",
    },
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["contact", "web", "url"],
  },
  {
    type: "job-title",
    category: "business",
    description: "Job title / position / occupation / role / cargo",
    generator: {
      strategy: "random",
      generatorFn: "generateJobTitle",
    },
    input: {
      preferredElement: "input-text",
      alternativeElements: ["select", "custom-select"],
      maxLength: 100,
      minLength: 2,
      typicallyRequired: false,
      autocompleteHint: "organization-title",
    },
    canBeSelect: true,
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["business", "occupation", "hr"],
  },
  {
    type: "cpf-cnpj",
    category: "document",
    description:
      "Hybrid field that accepts both CPF (individual) or CNPJ (company) — very common in Brazilian forms",
    generator: {
      strategy: "random",
      generatorFn: "generateCpfCnpj",
    },
    input: {
      preferredElement: "input-text",
      mask: "CPF: ###.###.###-## / CNPJ: ##.###.###/####-##",
      maxLength: 18,
      minLength: 11,
      typicallyRequired: true,
      autocompleteHint: "off",
    },
    localeFormats: [
      {
        locale: "pt-BR",
        format: "###.###.###-## ou ##.###.###/####-##",
        example: "123.456.789-09",
      },
    ],
    classificationWeight: 1.3,
    minConfidence: 0.6,
    tags: ["document", "brazilian", "cpf", "cnpj", "tax-id"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  NUMERIC / FINANCIAL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "money",
    category: "numeric",
    description: "Monetary value (R$, US$, etc.)",
    generator: {
      strategy: "random",
      generatorFn: "generateMoney",
      range: { min: 1, max: 10000 },
    },
    input: {
      preferredElement: "input-text",
      alternativeElements: ["input-number"],
      mask: "R$ #.###,##",
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    localeFormats: [
      { locale: "pt-BR", format: "R$ #.###,##", example: "R$ 1.234,56" },
      { locale: "en-US", format: "$#,###.##", example: "$1,234.56" },
    ],
    classificationWeight: 1.0,
    minConfidence: 0.6,
    tags: ["numeric", "financial"],
  },
  {
    type: "number",
    category: "numeric",
    description: "Generic numeric field (age, quantity, count, etc.)",
    generator: {
      strategy: "random",
      generatorFn: "generateNumber",
      range: { min: 1, max: 99999 },
    },
    input: {
      preferredElement: "input-number",
      alternativeElements: ["input-text", "input-range"],
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    classificationWeight: 0.8,
    minConfidence: 0.5,
    tags: ["numeric", "generic"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEXT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "text",
    category: "text",
    description: "Generic text / description / textarea content",
    generator: {
      strategy: "random",
      generatorFn: "generateText",
      wordCount: 5,
    },
    input: {
      preferredElement: "input-text",
      alternativeElements: ["textarea"],
      typicallyRequired: false,
      autocompleteHint: "off",
    },
    classificationWeight: 0.5,
    minConfidence: 0.3,
    tags: ["text", "generic"],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  ELEMENT TYPES (no generator — special handling)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    type: "select",
    category: "element",
    description:
      "Dropdown select element — picks a random valid option or uses contextual type",
    generator: {
      strategy: "select-options",
      generatorFn: "",
    },
    input: {
      preferredElement: "select",
      alternativeElements: ["custom-select"],
      typicallyRequired: false,
    },
    canBeSelect: true,
    classificationWeight: 1.0,
    minConfidence: 1.0,
    tags: ["element", "interactive"],
  },
  {
    type: "checkbox",
    category: "element",
    description: "Checkbox — toggled to checked state",
    generator: {
      strategy: "fixed",
      generatorFn: "",
    },
    input: {
      preferredElement: "input-checkbox",
      typicallyRequired: false,
    },
    classificationWeight: 1.0,
    minConfidence: 1.0,
    tags: ["element", "interactive"],
  },
  {
    type: "radio",
    category: "element",
    description: "Radio button — picks a random option from the group",
    generator: {
      strategy: "select-options",
      generatorFn: "",
    },
    input: {
      preferredElement: "input-radio",
      typicallyRequired: false,
    },
    classificationWeight: 1.0,
    minConfidence: 1.0,
    tags: ["element", "interactive"],
  },
  {
    type: "unknown",
    category: "unknown",
    description: "Unclassified field — falls back to generic text generator",
    generator: {
      strategy: "random",
      generatorFn: "generateText",
      fallbackFn: "generateText",
      wordCount: 3,
    },
    input: {
      preferredElement: "input-text",
      typicallyRequired: false,
    },
    classificationWeight: 0.1,
    minConfidence: 0.0,
    tags: ["unknown", "fallback"],
  },
];

// ── Select context patterns ─────────────────────────────────────────────────
// When a <select> is detected, we try to infer WHAT kind of select it is
// based on its label/name/id/options to pick the right option set.

export interface SelectContextPattern {
  /** What the select semantically represents */
  semanticType: string;
  /** Signals that indicate this select context (matched against label+name+id) */
  signals: string[];
  /** Known options to match against or pick from */
  options: SelectOption[];
  /** Strategy for picking: random, first, specific */
  pickStrategy: "random" | "first" | "match-label";
}

export const SELECT_CONTEXT_PATTERNS: SelectContextPattern[] = [
  {
    semanticType: "gender",
    signals: ["genero", "gênero", "gender", "sexo", "sex"],
    options: GENDER_OPTIONS,
    pickStrategy: "random",
  },
  {
    semanticType: "state",
    signals: ["estado", "state", "uf", "unidade-federativa", "province"],
    options: BRAZILIAN_STATES,
    pickStrategy: "random",
  },
  {
    semanticType: "marital-status",
    signals: [
      "estado-civil",
      "estadocivil",
      "marital",
      "marital-status",
      "situacao-conjugal",
      "situação-conjugal",
    ],
    options: MARITAL_STATUS_OPTIONS,
    pickStrategy: "random",
  },
  {
    semanticType: "nationality",
    signals: ["nacionalidade", "nationality", "naturalidade"],
    options: NATIONALITY_OPTIONS,
    pickStrategy: "random",
  },
  {
    semanticType: "boolean-yes-no",
    signals: [
      "sim-nao",
      "sim-ou-nao",
      "yes-no",
      "ativo",
      "active",
      "habilitado",
    ],
    options: [
      { label: "Sim", value: "sim" },
      { label: "Não", value: "nao" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "document-type",
    signals: [
      "tipo-documento",
      "tipodocumento",
      "document-type",
      "doc-type",
      "tipo-doc",
    ],
    options: [
      { label: "CPF", value: "cpf" },
      { label: "CNPJ", value: "cnpj" },
      { label: "RG", value: "rg" },
      { label: "Passaporte", value: "passaporte" },
      { label: "CNH", value: "cnh" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "payment-method",
    signals: [
      "forma-pagamento",
      "formapagamento",
      "payment",
      "payment-method",
      "meio-pagamento",
      "metodo-pagamento",
    ],
    options: [
      { label: "Cartão de Crédito", value: "credito" },
      { label: "Cartão de Débito", value: "debito" },
      { label: "Boleto", value: "boleto" },
      { label: "PIX", value: "pix" },
      { label: "Transferência", value: "transferencia" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "bank",
    signals: [
      "banco",
      "bank",
      "instituicao-financeira",
      "instituição-financeira",
    ],
    options: [
      { label: "Banco do Brasil", value: "001" },
      { label: "Bradesco", value: "237" },
      { label: "Itaú", value: "341" },
      { label: "Caixa Econômica", value: "104" },
      { label: "Santander", value: "033" },
      { label: "Nubank", value: "260" },
      { label: "Inter", value: "077" },
      { label: "C6 Bank", value: "336" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "account-type",
    signals: ["tipo-conta", "tipoconta", "account-type", "tipo-de-conta"],
    options: [
      { label: "Conta Corrente", value: "corrente" },
      { label: "Conta Poupança", value: "poupanca" },
      { label: "Conta Salário", value: "salario" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "education",
    signals: [
      "escolaridade",
      "education",
      "grau-instrucao",
      "grau-instrução",
      "nivel-escolar",
      "formacao",
      "formação",
    ],
    options: [
      { label: "Ensino Fundamental", value: "fundamental" },
      { label: "Ensino Médio", value: "medio" },
      { label: "Superior Completo", value: "superior" },
      { label: "Pós-Graduação", value: "pos_graduacao" },
      { label: "Mestrado", value: "mestrado" },
      { label: "Doutorado", value: "doutorado" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "occupation",
    signals: [
      "profissao",
      "profissão",
      "occupation",
      "cargo",
      "funcao",
      "função",
      "atividade",
      "job",
      "job-title",
      "jobtitle",
      "position",
      "role",
      "departamento",
      "department",
      "setor",
      "area",
      "especialidade",
    ],
    options: [
      { label: "Desenvolvedor", value: "desenvolvedor" },
      { label: "Analista", value: "analista" },
      { label: "Gerente", value: "gerente" },
      { label: "Diretor", value: "diretor" },
      { label: "Consultor", value: "consultor" },
      { label: "Professor", value: "professor" },
      { label: "Engenheiro", value: "engenheiro" },
      { label: "Médico", value: "medico" },
      { label: "Advogado", value: "advogado" },
      { label: "Autônomo", value: "autonomo" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "employee-range",
    signals: [
      "funcionarios",
      "colaboradores",
      "headcount",
      "employee-count",
      "num-funcionarios",
      "qtd-funcionarios",
      "porte",
      "tamanho-empresa",
      "workforce",
    ],
    options: [
      { label: "1 a 10", value: "1-10" },
      { label: "11 a 50", value: "11-50" },
      { label: "51 a 100", value: "51-100" },
      { label: "101 a 500", value: "101-500" },
      { label: "501 a 1000", value: "501-1000" },
      { label: "Mais de 1000", value: "1000+" },
    ],
    pickStrategy: "random",
  },
  {
    semanticType: "industry",
    signals: [
      "segmento",
      "ramo",
      "setor",
      "industria",
      "industria",
      "industry",
      "sector",
      "business-type",
      "tipo-negocio",
      "area-atuacao",
    ],
    options: [
      { label: "Tecnologia", value: "tech" },
      { label: "Varejo", value: "retail" },
      { label: "Saúde", value: "health" },
      { label: "Educação", value: "education" },
      { label: "Financeiro", value: "finance" },
      { label: "Indústria", value: "industry" },
      { label: "Serviços", value: "services" },
      { label: "Agronegócio", value: "agro" },
    ],
    pickStrategy: "random",
  },
];

// ── Lookup helpers ──────────────────────────────────────────────────────────

const _dictByType = new Map<FieldType, FieldDictionaryEntry>();
for (const entry of FIELD_DICTIONARY) {
  _dictByType.set(entry.type, entry);
}

/** Get the dictionary entry for a given field type */
export function getDictionaryEntry(
  type: FieldType,
): FieldDictionaryEntry | undefined {
  return _dictByType.get(type);
}

/** Get all dictionary entries for a given category */
export function getEntriesByCategory(
  category: FieldDictionaryEntry["category"],
): FieldDictionaryEntry[] {
  return FIELD_DICTIONARY.filter((e) => e.category === category);
}

/** Get all dictionary entries that have a specific tag */
export function getEntriesByTag(tag: string): FieldDictionaryEntry[] {
  return FIELD_DICTIONARY.filter((e) => e.tags.includes(tag));
}

/**
 * Try to match a <select>'s context (label/name/id) to known option patterns.
 * Returns the matched pattern or undefined.
 */
export function matchSelectContext(
  signals: string,
): SelectContextPattern | undefined {
  const normalised = signals.toLowerCase();
  for (const pattern of SELECT_CONTEXT_PATTERNS) {
    for (const signal of pattern.signals) {
      if (normalised.includes(signal)) return pattern;
    }
  }
  return undefined;
}

/**
 * Get all field types that can meaningfully appear as <select> elements.
 */
export function getSelectableTypes(): FieldType[] {
  return FIELD_DICTIONARY.filter((e) => e.canBeSelect).map((e) => e.type);
}
