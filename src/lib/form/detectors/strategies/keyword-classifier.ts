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
