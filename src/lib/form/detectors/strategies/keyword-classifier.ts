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
  /** Compiled regex for matching all patterns in this rule */
  regex: RegExp;
  /** FieldType to assign when matched */
  type: FieldType;
  /**
   * When true, each pattern must appear as a complete word (not a substring
   * of another word). Use for short codes like "rg", "obs", "cep".
   */
  wholeWord?: boolean;
}

function matchesRule(normalized: string, rule: KeywordRule): boolean {
  return rule.regex.test(normalized);
}

function compileRule(rule: Omit<KeywordRule, "regex">): KeywordRule {
  const combinedPattern = rule.patterns.map(escapeRegex).join("|");
  const regex = rule.wholeWord
    ? new RegExp(`(?<![a-z0-9])(${combinedPattern})(?![a-z0-9])`)
    : new RegExp(combinedPattern);
  return { ...rule, regex };
}

const KEYWORD_RULES: KeywordRule[] = [
  // ── Termos / newsletter (MUST precede email, cidade, etc.) ─────────────────
  // These labels contain words like "e-mail" or "cidade" but are checkboxes;
  // returning null lets the html-type detector classify them as checkbox.
  // We intentionally skip them by returning a non-interfering type OR we can
  // just not match them at all — the simplest approach is to detect them early
  // and return a "checkbox" type so the filler handles them correctly.
  compileRule({
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
  }),

  // ── Text / description area patterns ───────────────────────────────────────
  // Substring match for long patterns (≥ 4 chars). These describe free-text
  // fields in Portuguese/English forms and should resolve to "text".
  compileRule({
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
  }),

  // ── "obs" short-code — whole-word only ─────────────────────────────────────
  // Must be a complete word so that "observar" (obs inside a longer word) is
  // NOT matched. The normalize() function converts "obs-campo" / "obs_campo"
  // to "obs campo" so the word-boundary check works correctly.
  compileRule({
    patterns: ["obs"],
    type: "text",
    wholeWord: true,
  }),
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
