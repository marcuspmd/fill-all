/**
 * TensorFlow.js Field Classifier — Configuration & Messages
 *
 * Centralises all tuneable parameters, model paths and structured log messages
 * so that the classifier logic stays free of magic numbers and inline strings.
 *
 * `TF_CONFIG`    — JSON-structured configuration (thresholds, paths, fallback map).
 * `TF_MESSAGES`  — Typed message templates used in log output.
 */

import type { FieldType } from "@/types";

// ── Configuration ─────────────────────────────────────────────────────────────

export const TF_CONFIG = {
  /**
   * Score thresholds — tune these to balance precision ↔ recall.
   * Lower values increase recall at the cost of precision.
   */
  thresholds: {
    /** Minimum TF.js softmax score to accept a prediction. */
    model: 0.2,
    /** Minimum cosine similarity for a learned-vector hit (user data, higher trust). */
    learned: 0.5,
  },

  /** Paths relative to the Chrome extension runtime base URL (`chrome.runtime.getURL`). */
  model: {
    json: "model/model.json",
    vocab: "model/vocab.json",
    labels: "model/labels.json",
  },

  /**
   * Last-resort mapping from HTML `input[type]` → `FieldType`.
   * Applied only when no classifier returns a confident result.
   */
  htmlTypeFallback: {
    email: "email",
    tel: "phone",
    password: "password",
    number: "number",
    date: "date",
    url: "text",
  } satisfies Record<string, FieldType>,
} as const;

// ── Structured log messages ───────────────────────────────────────────────────

export const TF_MESSAGES = {
  modelLoaded: {
    runtime: (labels: number, vocab: number, vectors: number) =>
      `✅ Runtime-trained model loaded from storage — ${labels} classes, vocab ${vocab} n-grams, ${vectors} learned vectors`,
    bundled: (labels: number, vocab: number, vectors: number) =>
      `Pre-trained model loaded (bundled) — ${labels} classes, vocab ${vocab} n-grams, ${vectors} learned vectors`,
  },

  modelLoadFailed: {
    error: "❌ Falha ao carregar modelo pré-treinado:",
    fallback: "⚠️  Classificação usará apenas HTML input[type] como fallback.",
  },

  learnedVectors: {
    summary: (total: number, loaded: number) =>
      `loadLearnedVectors: ${total} entradas no storage, ${loaded} vetores carregados (vetores nulos descartados).`,
    failed: "Não foi possível carregar vetores aprendidos:",
  },

  invalidate: {
    dropped: (count: number) =>
      `invalidateClassifier: ${count} vetores descarregados. Recarregando do storage...`,
    notLoaded:
      "Modelo pré-treinado ainda não carregado. Os vetores serão carregados na próxima classificação.",
    reloadError: "Erro ao recarregar vetores:",
  },

  reload: "reloadClassifier: classificador recarregado com novo modelo.",

  classify: {
    notLoaded: (signals: string) =>
      `⚠️  Modelo não carregado ainda — usando html-fallback. Sinais: ${signals}`,
    learnedMatch: (
      type: string,
      cosine: string,
      threshold: number,
      text: string,
    ) =>
      `🎓 Learned match: "${type}" (cosine=${cosine}, threshold=${threshold}) para "${text}"`,
    lowScore: (score: string, threshold: number, text: string, hint: string) =>
      `⚠️  TF.js score baixo (${score} < threshold ${threshold}) para sinais: "${text}" — melhor palpite: "${hint}"`,
    tfMatch: (type: string, similarity: string, threshold: number) =>
      `🤖 TF.js best match: "${type}" (similarity ${similarity}, threshold ${threshold})`,
    groupLabel: (type: string, score: string, selector: string) =>
      `classify → ${type}  (tf.js cosine=${score})  ${selector}`,
    groupLabelFallback: (type: string, selector: string) =>
      `classify → ${type}  (html-type / fallback)  ${selector}`,
    featureText: "📡 featureText:",
    field: "🔖 field:",
    noMatch: (inputType: string) =>
      `⚠️  no keyword or TF.js match — using input[type="${inputType}"]`,
  },
} as const;

// ── Convenience re-export ─────────────────────────────────────────────────────

/** Minimum TF.js softmax score — convenience alias for `TF_CONFIG.thresholds.model`. */
export const TF_THRESHOLD = TF_CONFIG.thresholds.model;
