/**
 * Keyword-based field classifier for Brazilian/Portuguese forms.
 *
 * Runs BEFORE the TensorFlow classifier to handle common Portuguese patterns
 * that the ML model may under-score due to language/training-data bias.
 *
 * Rules are evaluated in order — more specific rules must come first to
 * avoid short patterns (e.g. "cpf") shadowing compound ones ("cpfcnpj").
 *
 * Accuracy note: substring matching is used for long patterns (≥4 chars) and
 * whole-word matching for short codes ("rg", "obs", "cep", "tel", "cpf").
 */

import type { FormField, FieldType } from "@/types";
import type { FieldClassifier, ClassifierResult } from "../pipeline";

// ── Normalisation ─────────────────────────────────────────────────────────────

/**
 * Normalises a signals string for keyword matching:
 *   - lowercases
 *   - strips diacritics (ã → a, é → e, etc.)
 *   - replaces common separators (*, -, _, ., /) with spaces
 *   - collapses runs of whitespace
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[*\-_./\\|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Rule types ────────────────────────────────────────────────────────────────

interface KeywordRule {
  /** Normalized substrings (or whole-word tokens) to look for */
  patterns: string[];
  /** FieldType to assign when matched */
  type: FieldType;
  /**
   * When true, each pattern must appear as a complete word (not a substring
   * of another word). Use for short codes like "rg", "obs", "cep".
   */
  wholeWord?: boolean;
}

function matchesRule(normalized: string, rule: KeywordRule): boolean {
  for (const pattern of rule.patterns) {
    if (rule.wholeWord) {
      const re = new RegExp(`(?<![a-z0-9])${escapeRegex(pattern)}(?![a-z0-9])`);
      if (re.test(normalized)) return true;
    } else {
      if (normalized.includes(pattern)) return true;
    }
  }
  return false;
}

// ── Keyword rules ─────────────────────────────────────────────────────────────
// Order matters: more-specific / longer patterns must come before shorter ones.

const KEYWORD_RULES: KeywordRule[] = [
  // ── Documents ──────────────────────────────────────────────────────────────
  {
    patterns: ["cpfcnpj", "cpf cnpj", "cpf/cnpj", "cpf ou cnpj"],
    type: "cpf-cnpj",
  },
  { patterns: ["cnpj"], type: "cnpj" },
  { patterns: ["cpf"], type: "cpf", wholeWord: true },
  {
    patterns: ["identidade", "carteira de identidade", "doc identidade"],
    type: "rg",
  },
  { patterns: ["rg"], type: "rg", wholeWord: true },

  // ── Company / Business name ───────────────────────────────────────────────
  {
    patterns: [
      "razaosocial",
      "razao social",
      "nomefantasia",
      "nome fantasia",
      "nomeempresa",
      "nome empresa",
      "nome da empresa",
      "nome comercial",
      "nomecomercial",
    ],
    type: "company",
  },
  { patterns: ["empresa", "organizacao", "organization"], type: "company" },

  // ── Names (most specific first) ───────────────────────────────────────────
  {
    patterns: [
      "nomecontato",
      "nome do contato",
      "nome contato",
      "nomeresponsavel",
      "nome responsavel",
      "nome do responsavel",
      "responsavel",
    ],
    type: "full-name",
  },
  {
    patterns: ["nomecompleto", "nome completo", "fullname", "full name"],
    type: "full-name",
  },
  {
    patterns: [
      "primeironome",
      "primeiro nome",
      "firstname",
      "first name",
      "given name",
    ],
    type: "first-name",
  },
  {
    patterns: [
      "sobrenome",
      "ultimonome",
      "ultimo nome",
      "lastname",
      "last name",
      "surname",
      "apelido",
    ],
    type: "last-name",
  },
  { patterns: ["nome"], type: "name", wholeWord: true },

  // // ── Email ─────────────────────────────────────────────────────────────────
  // {
  //   patterns: ["email", "e-mail", "e_mail", "emailaddress", "email address"],
  //   type: "email",
  // },

  // ── Phone / communication ─────────────────────────────────────────────────
  { patterns: ["whatsapp", "zap"], type: "phone" },
  {
    patterns: ["celular", "telefone", "telefonecelular", "fonecelular"],
    type: "phone",
  },
  { patterns: ["fone"], type: "phone" }, // matches "telefone" too — intentional
  { patterns: ["tel"], type: "phone", wholeWord: true },

  // ── Address ───────────────────────────────────────────────────────────────
  {
    patterns: [
      "codigopostal",
      "codigo postal",
      "postalcode",
      "zipcode",
      "zip code",
    ],
    type: "cep",
  },
  { patterns: ["cep", "zip"], type: "cep", wholeWord: true },
  { patterns: ["logradouro"], type: "street" },
  {
    patterns: [
      "endereco",
      "enderecocomercial",
      "endereco comercial",
      "enderecocompleto",
      "endereco completo",
    ],
    type: "address",
  },
  // ── State / Province ──────────────────────────────────────────────────────
  {
    patterns: ["estado", "provincia", "unidade federativa"],
    type: "state",
    wholeWord: true,
  },
  { patterns: ["uf"], type: "state", wholeWord: true },

  {
    patterns: ["cidade", "municipio", "localidade", "municipalidade"],
    type: "city",
  },
  { patterns: ["bairro", "distrito"], type: "address" },
  // ── Address complement ────────────────────────────────────────────────────
  { patterns: ["complemento"], type: "text" },

  // ── Website / URL ─────────────────────────────────────────────────────────
  {
    patterns: [
      "website",
      "homepage",
      "linkedin",
      "instagram",
      "facebook",
      "twitter",
      "url do site",
      "urlsite",
    ],
    type: "website",
  },
  { patterns: ["site"], type: "website", wholeWord: true },

  // ── Bank / Account fields ─────────────────────────────────────────────────
  {
    patterns: [
      "bank_agency",
      "bank agency",
      "agencia bancaria",
      "agencia banco",
    ],
    type: "number",
  },
  { patterns: ["agencia"], type: "number", wholeWord: true },
  {
    patterns: [
      "bank_account",
      "bank account",
      "conta bancaria",
      "conta banco",
      "numero conta",
    ],
    type: "number",
  },

  // ── Money / Financial ─────────────────────────────────────────────────────
  {
    // Compound patterns first (most specific)
    patterns: [
      "valor da margem",
      "marginvalue",
      "margin value",
      "valor total",
      "valortotal",
      "valor credito",
      "limitecredito",
      "limite credito",
      "taxa de juros",
      "taxajuros",
      "valor parcela",
      "valorparcela",
      "valor mensalidade",
      "valor do contrato",
      "valorcontrato",
    ],
    type: "money",
  },
  {
    patterns: [
      "margem",
      "faturamento",
      "receita",
      "mensalidade",
      "anuidade",
      "parcela",
      "comissao",
    ],
    type: "money",
  },
  { patterns: ["salario", "salary", "rendimento", "renda"], type: "money" },
  {
    patterns: [
      "preco",
      "price",
      "custo",
      "cost",
      "desconto",
      "discount",
      "juros",
    ],
    type: "money",
  },
  { patterns: ["margin"], type: "money" },
  { patterns: ["valor"], type: "money" },

  // ── Supplier / Business fields ────────────────────────────────────────────
  {
    patterns: [
      "produtosfornecidos",
      "produtos fornecidos",
      "produto fornecido",
      "produtosfornecido",
    ],
    type: "product",
  },
  {
    patterns: ["fornecedor", "fornecimento", "vendor", "supplier", "parceiro"],
    type: "supplier",
  },
  {
    patterns: [
      "funcionarios",
      "colaboradores",
      "headcount",
      "qtdfuncionarios",
      "numfuncionarios",
      "numero de funcionarios",
    ],
    type: "employee-count",
  },
  {
    patterns: ["jobtitle", "job title", "cargo", "funcao", "ocupacao"],
    type: "job-title",
  },

  // ── Numeric ───────────────────────────────────────────────────────────────
  { patterns: ["quantidade", "qtdade"], type: "number" },
  { patterns: ["qtd", "qtde"], type: "number", wholeWord: true },
  {
    // Portuguese and English patterns for benefit, account and registration numbers
    // (English IDs like "client_benefit_number" → normalised → "client benefit number")
    patterns: [
      "numero beneficio",
      "numero do beneficio",
      "beneficio",
      "benefit number",
      "account number",
      "policy number",
      "order number",
      "registration number",
      "contract number",
      "invoice number",
    ],
    type: "number",
  },
  { patterns: ["numero"], type: "number", wholeWord: true },
  { patterns: ["codigo"], type: "number", wholeWord: true },

  // ── Dates ─────────────────────────────────────────────────────────────────
  {
    patterns: [
      "datanascimento",
      "data de nascimento",
      "data nascimento",
      "datadenadscimento",
      "dtnascimento",
      "nascimento",
    ],
    type: "birth-date",
  },

  // ── Generic text / observations ───────────────────────────────────────────
  {
    patterns: [
      "observacao",
      "observacoes",
      "descricao",
      "mensagem",
      "message",
      "comentario",
      "comentarios",
      "anotacao",
      "anotacoes",
      "notas",
      "sugestao",
      "sugestoes",
      "feedback",
      "detalhe",
      "detalhes",
      "historico",
    ],
    type: "text",
  },
  { patterns: ["obs"], type: "text", wholeWord: true },
];

// ── Classifier ────────────────────────────────────────────────────────────────

/**
 * Keyword-based field classifier.
 * Returns a result with confidence=1.0 when a known Portuguese/Brazilian pattern
 * is matched, otherwise returns null to let the next classifier try.
 */
export const keywordClassifier: FieldClassifier = {
  name: "keyword",

  detect(field: FormField): ClassifierResult | null {
    const raw = field.contextSignals ?? "";
    if (!raw.trim()) return null;

    const normalized = normalize(raw);

    for (const rule of KEYWORD_RULES) {
      if (matchesRule(normalized, rule)) {
        return { type: rule.type, confidence: 1.0 };
      }
    }

    return null;
  },
};
