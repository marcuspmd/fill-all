/**
 * TensorFlow.js-based field classifier
 *
 * Classification strategy (in order of priority):
 *  1. Hard keyword match  — exact substring on field signals (fast, high precision)
 *  2. TF.js soft match    — character n-gram cosine similarity via tf.matMul
 *                           handles fuzzy/partial/novel signal strings
 *  3. HTML input[type]    — last-resort fallback from the DOM attribute
 *
 * DEBUG: Set `window.__FILL_ALL_DEBUG__ = true` in the browser DevTools console
 * of the page being filled, then trigger a fill. You will see a collapsed log
 * group for every field with signals, keyword matches, TF.js score, and final type.
 */

import * as tf from "@tensorflow/tfjs";
import type { FormField, FieldType } from "@/types";
import { generate } from "@/lib/generators";
import type { LearnedEntry } from "@/lib/ai/learning-store";
import { storeLearnedEntry, getLearnedEntries } from "@/lib/ai/learning-store";

// Field type keywords mapping for classification
// ORDER MATTERS: longer/more-specific keywords score higher (score = keyword.length).
// Add new terms here to "teach" the classifier new fields.
const FIELD_TYPE_KEYWORDS: Record<FieldType, string[]> = {
  // ── Brazilian documents ──────────────────────────────────────────────────
  cpf: ["cpf", "cadastro-pessoa", "cadastro-de-pessoa"],
  cnpj: [
    "cnpj",
    "company-doc",
    "cadastro-nacional",
    "inscricao-federal",
    "inscrição-federal",
  ],
  rg: [
    "rg",
    "registro-geral",
    "identidade",
    "carteira-identidade",
    "numero-rg",
    "doc-rg",
  ],

  // ── Contact ──────────────────────────────────────────────────────────────
  email: [
    "email",
    "e-mail",
    "mail",
    "correo",
    "emailaddress",
    "e_mail",
    "contato-email",
  ],
  phone: [
    "phone",
    "telefone",
    "celular",
    "tel",
    "mobile",
    "fone",
    "whatsapp",
    "ddd",
    "numero-telefone",
    "numero-celular",
    "contato-tel",
    "phonenumber",
    "cell",
    "cellular",
  ],

  // ── Name variants ────────────────────────────────────────────────────────
  "full-name": [
    "fullname",
    "full-name",
    "nome-completo",
    "nomecompleto",
    "full_name",
  ],
  "first-name": [
    "first-name",
    "firstname",
    "primeiro-nome",
    "primeironome",
    "given-name",
    "first_name",
    "nome-proprio",
    "prenome",
  ],
  "last-name": [
    "last-name",
    "lastname",
    "sobrenome",
    "family-name",
    "last_name",
    "surname",
    "apelido-familia",
  ],
  name: ["name", "nome"],

  // ── Address ──────────────────────────────────────────────────────────────
  cep: ["cep", "codigo-postal", "codigopostal", "cod-postal", "postalcode"],
  "zip-code": [
    "zip",
    "zipcode",
    "zip-code",
    "zip_code",
    "postal",
    "postalcode",
  ],
  street: [
    "street",
    "rua",
    "avenida",
    "logradouro",
    "av.",
    "alameda",
    "travessa",
    "rodovia",
    "estrada",
    "streetaddress",
    "street-address",
    "street_address",
  ],
  address: [
    "address",
    "endereco",
    "endereço",
    "addr",
    "address1",
    "address2",
    "address_line",
    "billing-address",
    "shipping-address",
    "endereco-completo",
  ],
  city: [
    "city",
    "cidade",
    "municipio",
    "município",
    "localidade",
    "billing-city",
    "shipping-city",
  ],
  state: [
    "state",
    "estado",
    "uf",
    "unidade-federativa",
    "province",
    "billing-state",
    "shipping-state",
  ],

  // ── Date ─────────────────────────────────────────────────────────────────
  "birth-date": [
    "birth",
    "nascimento",
    "birthday",
    "dob",
    "data-nascimento",
    "datanascimento",
    "date-of-birth",
    "birth_date",
    "birthdate",
    "data_nascimento",
    "aniversario",
    "dt-nasc",
    "dt-nascimento",
  ],
  date: [
    "date",
    "data",
    "datainicio",
    "datafim",
    "data-inicio",
    "data-fim",
    "start-date",
    "end-date",
    "expiry",
    "expiration",
    "validade",
    "vigencia",
    "vencimento",
  ],

  // ── Auth ─────────────────────────────────────────────────────────────────
  password: [
    "password",
    "senha",
    "pass",
    "pwd",
    "passwd",
    "current-password",
    "new-password",
    "confirm-password",
    "nova-senha",
    "confirmar-senha",
    "repeat-password",
    "retype-password",
  ],
  username: [
    "username",
    "usuario",
    "user",
    "login",
    "user-name",
    "user_name",
    "handle",
    "nick",
    "apelido",
    "login-name",
  ],

  // ── Business ─────────────────────────────────────────────────────────────
  company: [
    "company",
    "empresa",
    "razao-social",
    "razão-social",
    "organization",
    "org",
    "organization-name",
    "nome-empresa",
    "nome-fantasia",
    "fantasy-name",
    "companyname",
  ],

  // ── Numeric / financial ──────────────────────────────────────────────────
  money: [
    "money",
    "valor",
    "preco",
    "preço",
    "price",
    "amount",
    "margem",
    "salario",
    "salário",
    "renda",
    "receita",
    "custo",
    "cost",
    "total",
    "subtotal",
    "desconto",
    "discount",
  ],
  number: [
    "number",
    "numero",
    "número",
    "quantidade",
    "qty",
    "num",
    "count",
    "age",
    "idade",
    "complemento",
  ],

  // ── Generic text ─────────────────────────────────────────────────────────
  text: [
    "text",
    "description",
    "descricao",
    "descrição",
    "obs",
    "observacao",
    "observação",
    "comentario",
    "comentário",
    "message",
    "mensagem",
    "nota",
    "note",
    "anotacao",
    "anotação",
    "bio",
    "about",
    "sobre",
    "informacoes",
    "informações",
    "details",
    "detalhe",
    // ── Brazilian financial / consignado ────────────────────────────────────
    "convenio",
    "convênio",
    "agreement",
    "agreement-id",
    "convenio-id",
    "matricula",
    "matrícula",
  ],

  // ── Element-type only (no keywords needed) ───────────────────────────────
  select: [],
  checkbox: [],
  radio: [],
  unknown: [],
};

// ── Debug flag ───────────────────────────────────────────────────────────────
// Activate in the browser DevTools console of the page being filled:
//   window.__FILL_ALL_DEBUG__ = true
// Then trigger a fill to see detailed classifier logs for every field.
function isDebugEnabled(): boolean {
  return true;
  return !!(globalThis as Record<string, unknown>)["__FILL_ALL_DEBUG__"];
}

// ── Character n-gram helpers ─────────────────────────────────────────────────

const NGRAM_SIZE = 3;

// Minimum cosine similarity for TF.js prediction to be accepted.
// Increase to be more conservative; decrease to allow fuzzier matches.
const TF_THRESHOLD = 0.7;

// If TF.js cosine similarity is below this value, Chrome AI is consulted
// to refine (or confirm) the classification result.
const AI_ASSIST_THRESHOLD = 0.7;

function charNgrams(text: string): string[] {
  const padded = `_${text}_`;
  const result: string[] = [];
  for (let i = 0; i <= padded.length - NGRAM_SIZE; i++) {
    result.push(padded.slice(i, i + NGRAM_SIZE));
  }
  return result;
}

function buildVocab(texts: string[]): Map<string, number> {
  const vocab = new Map<string, number>();
  for (const t of texts) {
    for (const ng of charNgrams(t)) {
      if (!vocab.has(ng)) vocab.set(ng, vocab.size);
    }
  }
  return vocab;
}

function vectorize(text: string, vocab: Map<string, number>): Float32Array {
  const v = new Float32Array(vocab.size);
  for (const ng of charNgrams(text)) {
    const i = vocab.get(ng);
    if (i !== undefined) v[i] += 1;
  }
  // L2 normalize so dot product == cosine similarity
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

// ── TF.js classifier singleton ───────────────────────────────────────────────
// Built lazily on first call to classifyField. Uses TF.js tensors for the
// matrix multiply (batch cosine similarity over all field-type prototypes).

interface TFClassifier {
  vocab: Map<string, number>;
  /** Shape: [numActiveTypes, vocabSize] — one L2-normalised prototype per type */
  prototypes: tf.Tensor2D;
  activeTypes: FieldType[];
}

let _classifier: TFClassifier | null = null;

// ── Continuous-learning cache ─────────────────────────────────────────────────
// Loaded asynchronously at content-script init; used synchronously inside
// getClassifier() to shift prototype vectors toward real-world patterns.
let _learnedEntries: LearnedEntry[] = [];

/**
 * Load AI-derived classifications from chrome.storage and incorporate them
 * into the TF.js prototype matrix on the next classify call.
 * Must be called once during content-script initialisation.
 */
export async function loadLearnedClassifications(): Promise<void> {
  _learnedEntries = await getLearnedEntries();
  _classifier = null; // force rebuild with updated data
  if (isDebugEnabled() && _learnedEntries.length > 0) {
    console.log(
      `[Fill All] Loaded ${_learnedEntries.length} learned classification(s) into TF.js classifier`,
    );
  }
}

/** Discard the cached classifier so it is rebuilt on the next call. */
export function invalidateClassifier(): void {
  _classifier = null;
}

function getClassifier(): TFClassifier {
  if (_classifier) return _classifier;

  // Only types that have at least one keyword get a prototype vector
  const activeEntries = (
    Object.entries(FIELD_TYPE_KEYWORDS) as [FieldType, string[]][]
  ).filter(([, kws]) => kws.length > 0);

  // Build a map: type → signals from the continuous-learning store
  const learnedByType = new Map<FieldType, string[]>();
  for (const entry of _learnedEntries) {
    if (!learnedByType.has(entry.type)) learnedByType.set(entry.type, []);
    learnedByType.get(entry.type)!.push(entry.signals);
  }

  // Vocab includes both static keywords and learned signals so new n-grams
  // observed in the wild are represented in the embedding space.
  const allKeywords = activeEntries.flatMap(([, kws]) => kws);
  const allLearnedSignals = _learnedEntries.map((e) => e.signals);
  const vocab = buildVocab([...allKeywords, ...allLearnedSignals]);

  const protoRows = activeEntries.map(([ft, keywords]) => {
    // Average of all keyword vectors for this type
    const avg = new Float32Array(vocab.size);
    for (const kw of keywords) {
      const v = vectorize(kw, vocab);
      for (let i = 0; i < avg.length; i++) avg[i] += v[i];
    }
    // Incorporate learned signals (continuous learning)
    for (const sig of learnedByType.get(ft) ?? []) {
      const v = vectorize(sig, vocab);
      for (let i = 0; i < avg.length; i++) avg[i] += v[i];
    }
    // L2 normalise the average
    let norm = 0;
    for (let i = 0; i < avg.length; i++) norm += avg[i] * avg[i];
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < avg.length; i++) avg[i] /= norm;
    return avg;
  });

  _classifier = {
    vocab,
    prototypes: tf.tensor2d(
      protoRows.flatMap((r) => Array.from(r)),
      [activeEntries.length, vocab.size],
    ),
    activeTypes: activeEntries.map(([ft]) => ft),
  };

  return _classifier;
}

/**
 * Classify field signals using TF.js cosine similarity.
 * Returns null if signals are empty or all similarities are below TF_THRESHOLD.
 */
function tfSoftClassify(
  signals: string,
): { type: FieldType; score: number } | null {
  if (!signals.trim()) return null;

  const clf = getClassifier();
  const inputVec = vectorize(signals, clf.vocab);
  if (!inputVec.some((v) => v > 0)) return null;

  // tf.tidy disposes all intermediate tensors automatically
  const { typeIdx, score } = tf.tidy(() => {
    // input: [vocabSize] → reshape to column [vocabSize, 1]
    const input = tf
      .tensor1d(inputVec)
      .reshape([clf.vocab.size, 1]) as tf.Tensor2D;

    // prototypes [T, V] × input [V, 1] → sims [T, 1]
    const sims = tf.matMul(clf.prototypes, input).squeeze() as tf.Tensor1D;

    const simsData = sims.dataSync();
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < simsData.length; i++) {
      if (simsData[i] > bestScore) {
        bestScore = simsData[i];
        bestIdx = i;
      }
    }
    return { typeIdx: bestIdx, score: bestScore };
  });

  if (score < TF_THRESHOLD) return null;
  return { type: clf.activeTypes[typeIdx], score };
}

// ── Chrome AI type classification ───────────────────────────────────────────

/**
 * Uses Chrome Built-in AI (Gemini Nano) to classify a field type.
 * Called only when TF.js and keyword matching both fail to identify the field.
 * Returns 'unknown' on any error or if Chrome AI is unavailable.
 */
async function classifyWithChromeAI(
  field: FormField,
  signals: string,
): Promise<{ type: FieldType; raw: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newApi = (globalThis as any).LanguageModel as
    | LanguageModelStatic
    | undefined;

  const hasAny = !!newApi;
  if (!hasAny) return null;

  try {
    // Check availability with new API first
    if (newApi) {
      const avail = await newApi.availability({
        model: "gemini-nano",
        outputLanguage: "en",
      });
      if (avail === "unavailable") return null;
    }

    const allTypes = (Object.keys(FIELD_TYPE_KEYWORDS) as FieldType[]).filter(
      (t) => t !== "unknown",
    );

    const context = [
      field.label && `Label: ${field.label}`,
      field.name && `Name: ${field.name}`,
      field.id && `ID: ${field.id}`,
      field.placeholder && `Placeholder: ${field.placeholder}`,
      field.autocomplete && `Autocomplete: ${field.autocomplete}`,
      `Input type attribute: ${field.element.type || "text"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are a form field type classifier. Given information about an HTML form field, respond with EXACTLY one type from this list: ${allTypes.join(", ")}. No explanations, no punctuation — just the type name.`;
    const userPrompt = `Classify this form field:\n${context}`;

    if (isDebugEnabled()) {
      console.groupCollapsed(`[Fill All] Chrome AI classify — prompt`);
      console.log("🔧 systemPrompt:", systemPrompt);
      console.log("💬 userPrompt:", userPrompt);
      console.groupEnd();
    }

    const aiSession = await newApi!.create({
      systemPrompt,
      outputLanguage: "en",
    });
    const raw = await aiSession.prompt(userPrompt);
    aiSession.destroy();

    if (isDebugEnabled()) {
      console.log(`[Fill All] Chrome AI classify — response: "${raw.trim()}"`);
    }

    const detected = raw.trim().toLowerCase().split(/\s/)[0];
    if ((allTypes as string[]).includes(detected))
      return { type: detected as FieldType, raw: raw.trim() };
    return null;
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Classifies a form field into a FieldType using TF.js-powered classification.
 *
 * To teach the classifier about new field types or signal words:
 *   → extend FIELD_TYPE_KEYWORDS above with more keywords.
 *   → the TF.js prototypes are rebuilt automatically on the next page load.
 */
export function classifyField(field: FormField): FieldType {
  const signals = [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  // ── Step 1: Hard keyword match ────────────────────────────────────────────
  let keywordMatch: FieldType = "unknown";
  let keywordScore = 0;
  let winnerKeyword = "";

  for (const [fieldType, keywords] of Object.entries(FIELD_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (signals.includes(keyword)) {
        const score = keyword.length;
        if (score > keywordScore) {
          keywordScore = score;
          keywordMatch = fieldType as FieldType;
          winnerKeyword = keyword;
        }
      }
    }
  }

  if (keywordMatch !== "unknown") {
    if (isDebugEnabled()) {
      console.groupCollapsed(
        `[Fill All] classify → %c${keywordMatch}%c  (keyword)  ${field.selector}`,
        "color: #22c55e; font-weight: bold",
        "color: inherit",
      );
      console.log("📡 signals:", signals || "(none)");
      console.log(`🏆 keyword: "${winnerKeyword}" (score ${keywordScore})`);
      console.log("🔖 field:", {
        label: field.label,
        name: field.name,
        id: field.id,
        placeholder: field.placeholder,
      });
      console.groupEnd();
    }
    return keywordMatch;
  }

  // ── Step 2: TF.js soft / fuzzy match ─────────────────────────────────────
  const tfResult = tfSoftClassify(signals);

  if (tfResult) {
    if (isDebugEnabled()) {
      console.groupCollapsed(
        `[Fill All] classify → %c${tfResult.type}%c  (tf.js cosine=${tfResult.score.toFixed(3)})  ${field.selector}`,
        "color: #6366f1; font-weight: bold",
        "color: inherit",
      );
      console.log("📡 signals:", signals || "(none)");
      console.log(
        `🤖 TF.js best match: "${tfResult.type}" (similarity ${tfResult.score.toFixed(3)}, threshold ${TF_THRESHOLD})`,
      );
      console.log("🔖 field:", {
        label: field.label,
        name: field.name,
        id: field.id,
        placeholder: field.placeholder,
      });
      console.groupEnd();
    }
    return tfResult.type;
  }

  // ── Step 3: HTML input[type] fallback ─────────────────────────────────────
  const inputType = field.element.type?.toLowerCase();
  const htmlTypeMap: Record<string, FieldType> = {
    email: "email",
    tel: "phone",
    password: "password",
    number: "number",
    date: "date",
    url: "text",
  };
  const htmlType: FieldType =
    (htmlTypeMap[inputType] as FieldType) ?? "unknown";

  if (isDebugEnabled()) {
    console.groupCollapsed(
      `[Fill All] classify → %c${htmlType}%c  (html-type / fallback)  ${field.selector}`,
      "color: #f59e0b; font-weight: bold",
      "color: inherit",
    );
    console.log("📡 signals:", signals || "(none)");
    console.log(
      `⚠️  no keyword or TF.js match — using input[type="${inputType}"]`,
    );
    console.log("🔖 field:", {
      label: field.label,
      name: field.name,
      id: field.id,
      placeholder: field.placeholder,
    });
    console.groupEnd();
  }

  return htmlType;
}

/**
 * Async variant of classifyField with two extra layers:
 *
 * 1. **Low-confidence AI refinement** — if TF.js matched but with cosine
 *    similarity < AI_ASSIST_THRESHOLD (70%), Chrome AI is consulted to
 *    confirm or override the result.
 * 2. **Continuous learning** — every AI-produced classification is stored
 *    in chrome.storage and incorporated into TF.js on next page load,
 *    shifting prototype vectors toward real-world field patterns.
 *
 * The sync `classifyField` is kept for non-fill / non-async contexts.
 */
export async function classifyFieldAsync(field: FormField): Promise<FieldType> {
  const signals = [
    field.label?.toLowerCase(),
    field.name?.toLowerCase(),
    field.id?.toLowerCase(),
    field.placeholder?.toLowerCase(),
    field.autocomplete?.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" ");

  // ── Steps 1–3: run the sync classifier (includes all debug logs) ──────────
  const syncResult = classifyField(field);

  if (syncResult !== "unknown") {
    // Determine whether the result came from a keyword match (100% confident)
    // or from the TF.js / HTML-type fallback paths.
    let isKeywordMatch = false;
    outer: for (const keywords of Object.values(FIELD_TYPE_KEYWORDS)) {
      for (const kw of keywords) {
        if (signals.includes(kw)) {
          isKeywordMatch = true;
          break outer;
        }
      }
    }

    if (isKeywordMatch) return syncResult; // 100% confident — no AI needed

    const tfResult = tfSoftClassify(signals);

    // HTML input[type] fallback (no TF.js match) — attribute is authoritative
    if (!tfResult) return syncResult;

    const confidencePct = (tfResult.score * 100).toFixed(1);

    if (tfResult.score >= AI_ASSIST_THRESHOLD) return syncResult; // ≥70% — trust TF.js

    // ── Low-confidence TF.js: consult Chrome AI to refine ─────────────────
    if (isDebugEnabled()) {
      console.log(
        `[Fill All] TF.js confidence ${confidencePct}% < ${AI_ASSIST_THRESHOLD * 100}% — consulting Chrome AI to refine "${syncResult}"`,
      );
    }

    const aiRefine = await classifyWithChromeAI(field, signals);
    if (aiRefine) {
      if (isDebugEnabled()) {
        const changed = aiRefine.type !== syncResult;
        console.log(
          `[Fill All] Chrome AI ${changed ? "overrode" : "confirmed"}: "${syncResult}" → "${aiRefine.type}"`,
        );
      }
      await storeLearnedEntry(signals, aiRefine.type);
      invalidateClassifier();
      return aiRefine.type;
    }

    return syncResult; // AI unavailable — accept low-confidence TF.js result
  }

  // ── Step 4: Chrome AI fallback for fully unknown fields ───────────────────
  const aiResult = await classifyWithChromeAI(field, signals);

  if (aiResult) {
    if (isDebugEnabled()) {
      console.groupCollapsed(
        `[Fill All] classify → %c${aiResult.type}%c  (chrome-ai)  ${field.selector}`,
        "color: #a855f7; font-weight: bold",
        "color: inherit",
      );
      console.log("📡 signals:", signals || "(none)");
      console.log(`🧠 Chrome AI raw response: "${aiResult.raw}"`);
      console.log("🔖 field:", {
        label: field.label,
        name: field.name,
        id: field.id,
        placeholder: field.placeholder,
      });
      console.groupEnd();
    }
    await storeLearnedEntry(signals, aiResult.type);
    invalidateClassifier();
    return aiResult.type;
  }

  if (isDebugEnabled()) {
    console.log(
      `[Fill All] classify → %cunknown%c  (all methods failed)  ${field.selector}`,
      "color: #ef4444; font-weight: bold",
      "color: inherit",
    );
  }

  return "unknown";
}

/**
 * Generate a value using TF.js classification + built-in generators.
 * Falls back to Chrome AI for field type detection when TF.js yields 'unknown'.
 */
export async function generateWithTensorFlow(
  field: FormField,
): Promise<string> {
  const detectedType = await classifyFieldAsync(field);
  return generate(detectedType);
}
