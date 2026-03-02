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
// Order matters: more-specific / longer patterns must come BEFORE shorter ones
// to prevent a short token from swallowing a more specific compound match.
// E.g. "estado civil" MUST precede "estado", "cpf cnpj" before "cpf".

const KEYWORD_RULES: KeywordRule[] = [
  // ── Termos / newsletter (MUST precede email, cidade, etc.) ─────────────────
  // These labels contain words like "e-mail" or "cidade" but are checkboxes;
  // returning null lets the html-type detector classify them as checkbox.
  // We intentionally skip them by returning a non-interfering type OR we can
  // just not match them at all — the simplest approach is to detect them early
  // and return a "checkbox" type so the filler handles them correctly.
  {
    patterns: [
      "aceito os termos",
      "aceito o termos",
      "li e aceito",
      "concordo com os termos",
      "termos de uso",
      "termos e condicoes",
      "politica de privacidade",
      "aceito a politica",
      "terms of service",
      "terms and conditions",
      "privacy policy",
      "i agree",
      "i accept",
    ],
    type: "checkbox",
  },
  {
    patterns: [
      "desejo receber",
      "quero receber",
      "aceito receber",
      "newsletter",
      "novidades por e-mail",
      "novidades por email",
      "comunicacoes por e-mail",
      "comunicacoes de marketing",
      "opt in",
      "opt-in",
    ],
    type: "checkbox",
  },

  // ── Estado civil (MUST precede "estado" → state) ─────────────────────────
  // There is no "marital-status" FieldType; "select" delegates option picking
  // to the adapter (Phase 3 picks a random valid dropdown option).
  {
    patterns: [
      "estado civil",
      "estado-civil",
      "estado_civil",
      "marital status",
      "estado marital",
    ],
    type: "select",
  },

  // ── Gênero ────────────────────────────────────────────────────────────────
  {
    patterns: ["genero", "sexo", "gender", "sex"],
    type: "select",
  },

  // ── Escolaridade / nível de instrução ─────────────────────────────────────
  {
    patterns: [
      "escolaridade",
      "nivel de instrucao",
      "grau de instrucao",
      "nivel de escolaridade",
      "education level",
      "nivel educacional",
      "formacao academica",
    ],
    type: "select",
  },

  // ── Nacionalidade (MUST precede "pais" → country) ─────────────────────────
  {
    patterns: ["nationality", "nacionalidade"],
    type: "country",
  },

  // ── Confirmar senha (MUST precede "senha") ────────────────────────────────
  {
    patterns: [
      "confirmar senha",
      "confirme a senha",
      "confirme sua senha",
      "repetir senha",
      "redigite a senha",
      "confirmacao de senha",
      "confirmacao senha",
      "confirm password",
      "repeat password",
    ],
    type: "confirm-password",
  },

  // ── Nome composto (MUST precede "nome" alone) ─────────────────────────────
  {
    patterns: [
      "nome completo",
      "nome e sobrenome",
      "full name",
      "fullname",
      "full_name",
      "nome_completo",
    ],
    type: "full-name",
  },
  {
    patterns: [
      "primeiro nome",
      "nome proprio",
      "nome de batismo",
      "first name",
      "firstname",
      "first_name",
      "given name",
    ],
    type: "first-name",
  },
  {
    patterns: [
      "sobrenome",
      "ultimo nome",
      "apelido familiar",
      "last name",
      "lastname",
      "last_name",
      "surname",
      "family name",
    ],
    type: "last-name",
  },

  // ── CPF/CNPJ composto (MUST precede individual cpf / cnpj) ───────────────
  {
    patterns: ["cpf cnpj", "cpf/cnpj", "cpf ou cnpj", "cpfcnpj", "cpf_cnpj"],
    type: "cpf-cnpj",
  },

  // ── Documentos ───────────────────────────────────────────────────────────
  { patterns: ["cpf"], type: "cpf", wholeWord: true },
  { patterns: ["cnpj"], type: "cnpj", wholeWord: true },
  { patterns: ["rg"], type: "rg", wholeWord: true },
  { patterns: ["cnh"], type: "cnh", wholeWord: true },
  { patterns: ["pis"], type: "pis", wholeWord: true },
  { patterns: ["passaporte", "passport"], type: "passport" },

  // ── Datas compostas (MUST precede "data" alone) ───────────────────────────
  {
    patterns: [
      "data de nascimento",
      "data nascimento",
      "data_nascimento",
      "nascimento",
      "birth date",
      "birthdate",
      "birth_date",
      "data nasc",
    ],
    type: "birth-date",
  },
  {
    patterns: [
      "data de inicio",
      "data inicio",
      "data_inicio",
      "data de abertura",
      "start date",
      "start_date",
    ],
    type: "start-date",
  },
  {
    patterns: [
      "data de vencimento",
      "data vencimento",
      "data_vencimento",
      "data de expiracao",
      "data expiracao",
      "data fim",
      "data final",
      "data de termino",
      "data termino",
      "due date",
      "due_date",
      "end date",
      "end_date",
    ],
    type: "end-date",
  },
  {
    patterns: ["data", "date"],
    type: "date",
    wholeWord: true,
  },

  // ── Contato ───────────────────────────────────────────────────────────────
  {
    patterns: ["email", "e-mail", "e_mail", "correio eletronico", "e mail"],
    type: "email",
  },
  {
    patterns: ["celular", "whatsapp", "cel ", "cel_", "zap", "mobile"],
    type: "mobile",
  },
  {
    patterns: ["telefone", "fone", "phone"],
    type: "phone",
  },

  // ── Cartão de crédito (composto MUST precede "numero") ───────────────────
  {
    patterns: [
      "numero do cartao",
      "numero cartao",
      "cartao de credito",
      "card number",
      "numero do cartao de credito",
    ],
    type: "credit-card-number",
  },
  {
    patterns: [
      "validade do cartao",
      "validade cartao",
      "expiracao cartao",
      "card expir",
      "card valid",
    ],
    type: "credit-card-expiration",
  },
  {
    patterns: ["cvv", "cvc", "codigo de seguranca", "cod seguranca"],
    type: "credit-card-cvv",
    wholeWord: true,
  },

  // ── Endereço ─────────────────────────────────────────────────────────────
  {
    patterns: ["cep", "codigo postal", "zip code", "postal code"],
    type: "cep",
    wholeWord: true,
  },
  { patterns: ["cidade", "municipio", "city"], type: "city" },
  // "estado" AFTER "estado civil" — correctly maps to state abbreviation
  { patterns: ["estado", "uf", "unidade federativa", "state"], type: "state" },
  { patterns: ["pais", "country", "nacao"], type: "country", wholeWord: true },
  { patterns: ["bairro", "neighborhood", "district"], type: "neighborhood" },
  {
    patterns: ["logradouro", "endereco", "rua", "avenida", "alameda", "street"],
    type: "street",
  },
  {
    patterns: [
      "numero residencial",
      "numero da casa",
      "numero de endereco",
      "house number",
    ],
    type: "house-number",
  },
  {
    patterns: ["complemento", "complement", "apto", "apartamento"],
    type: "complement",
  },

  // ── Financeiro ────────────────────────────────────────────────────────────
  { patterns: ["pix"], type: "pix-key", wholeWord: true },
  { patterns: ["preco", "valor", "price", "amount", "custo"], type: "money" },
  { patterns: ["desconto", "discount"], type: "discount" },
  {
    patterns: ["quantidade", "qtd", "quantity"],
    type: "quantity",
    wholeWord: true,
  },

  // ── Genérico (textos livres) — ANTES de autenticação para evitar falsos positivos
  // Ex: "feedback do usuario" → text (não username)
  // Ex: "comentarios usuarios" → text (não username)
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

  // ── Autenticação ──────────────────────────────────────────────────────────
  { patterns: ["senha", "password"], type: "password" },
  {
    patterns: ["usuario", "login", "username", "user name", "user_name"],
    type: "username",
  },

  // ── Nome genérico (AFTER first/last/full-name rules) ─────────────────────
  {
    patterns: ["nome", "name"],
    type: "name",
    wholeWord: true,
  },

  // ── Empresa / Profissional ────────────────────────────────────────────────
  {
    patterns: [
      "empresa",
      "razao social",
      "company",
      "corporacao",
      "organizacao",
    ],
    type: "company",
  },
  {
    patterns: ["cargo", "funcao", "job title", "ocupacao", "profissao"],
    type: "job-title",
  },
  { patterns: ["departamento", "setor", "department"], type: "department" },
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
