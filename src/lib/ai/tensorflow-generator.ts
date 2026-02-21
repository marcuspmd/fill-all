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

// ── Pre-trained model (loaded from public/model/) ───────────────────────────
// When available, this is preferred over the runtime prototype-vector approach.
// Trained offline with `npm run train:model` using the labelled dataset.

interface PretrainedState {
  model: tf.LayersModel;
  vocab: Map<string, number>;
  labels: FieldType[];
}

let _pretrained: PretrainedState | null = null;
let _pretrainedLoadPromise: Promise<void> | null = null;

/**
 * Loads the offline-trained TF.js model from the extension's model/ directory.
 * Must be called once during content-script initialisation (non-blocking).
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function loadPretrainedModel(): Promise<void> {
  if (_pretrained) return;
  if (_pretrainedLoadPromise) return _pretrainedLoadPromise;

  _pretrainedLoadPromise = (async () => {
    try {
      const base = chrome.runtime.getURL("model/");
      const [model, vocabRaw, labelsRaw] = await Promise.all([
        tf.loadLayersModel(`${base}model.json`),
        fetch(`${base}vocab.json`).then(
          (r) => r.json() as Promise<Record<string, number>>,
        ),
        fetch(`${base}labels.json`).then((r) => r.json() as Promise<string[]>),
      ]);
      _pretrained = {
        model,
        vocab: new Map(Object.entries(vocabRaw)),
        labels: labelsRaw as FieldType[],
      };
      if (isDebugEnabled()) {
        console.log(
          `[Fill All] Pre-trained model loaded — ${labelsRaw.length} classes, vocab ${_pretrained.vocab.size} n-grams`,
        );
      }
    } catch {
      // Model artefacts not yet generated — runtime classifier is used instead.
      // Run `npm run train:model` to generate public/model/.
    }
  })();

  return _pretrainedLoadPromise;
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

function getClassifier(): TFClassifier {
  if (_classifier) return _classifier;

  // Only types that have at least one keyword get a prototype vector
  const activeEntries = (
    Object.entries(FIELD_TYPE_KEYWORDS) as [FieldType, string[]][]
  ).filter(([, kws]) => kws.length > 0);

  const allKeywords = activeEntries.flatMap(([, kws]) => kws);
  const vocab = buildVocab(allKeywords);

  const protoRows = activeEntries.map(([ft, keywords]) => {
    // Average of all keyword vectors for this type
    const avg = new Float32Array(vocab.size);
    for (const kw of keywords) {
      const v = vectorize(kw, vocab);
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

/** Discard the cached classifier so it is rebuilt on the next call. */
export function invalidateClassifier(): void {
  _classifier = null;
}

/**
 * Classify field signals using TF.js.
 *
 * Priority:
 *   1. Pre-trained neural network (if model artefacts were generated).
 *   2. Runtime prototype-vector classifier built from FIELD_TYPE_KEYWORDS.
 *
 * Returns null if signals are empty or confidence is below TF_THRESHOLD.
 */
function tfSoftClassify(
  signals: string,
): { type: FieldType; score: number } | null {
  if (!signals.trim()) return null;

  // ── Path A: pre-trained model ─────────────────────────────────────────────
  if (_pretrained) {
    const inputVec = vectorize(signals, _pretrained.vocab);
    if (!inputVec.some((v) => v > 0)) return null;

    const { bestIdx, bestScore } = tf.tidy(() => {
      const input = tf.tensor2d([Array.from(inputVec)]);
      const probs = (_pretrained!.model.predict(input) as tf.Tensor).dataSync();
      let idx = 0;
      let score = -1;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] > score) {
          score = probs[i];
          idx = i;
        }
      }
      return { bestIdx: idx, bestScore: score };
    });

    if (bestScore < TF_THRESHOLD) return null;
    return { type: _pretrained.labels[bestIdx], score: bestScore };
  }

  // ── Path B: runtime prototype-vector classifier (keyword-derived) ─────────
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

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Step 1: Hard keyword match over a normalised signals string.
 * Returns the best matching FieldType, or null if nothing matches.
 */
export function classifyByKeyword(signals: string): FieldType | null {
  if (!signals.trim()) return null;

  let best: FieldType = "unknown";
  let bestScore = 0;

  for (const [fieldType, keywords] of Object.entries(FIELD_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (signals.includes(keyword)) {
        const score = keyword.length;
        if (score > bestScore) {
          bestScore = score;
          best = fieldType as FieldType;
        }
      }
    }
  }

  return best !== "unknown" ? best : null;
}

/**
 * Step 2: TF.js cosine-similarity soft match over a normalised signals string.
 * Returns the best matching FieldType + confidence score, or null if below threshold.
 */
export function classifyByTfSoft(
  signals: string,
): { type: FieldType; score: number } | null {
  return tfSoftClassify(signals);
}

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
  const kwType = classifyByKeyword(signals);
  if (kwType !== null) {
    if (isDebugEnabled()) {
      console.groupCollapsed(
        `[Fill All] classify → %c${kwType}%c  (keyword)  ${field.selector}`,
        "color: #22c55e; font-weight: bold",
        "color: inherit",
      );
      console.log("📡 signals:", signals || "(none)");
      console.log("🔖 field:", {
        label: field.label,
        name: field.name,
        id: field.id,
        placeholder: field.placeholder,
      });
      console.groupEnd();
    }
    return kwType;
  }

  // ── Step 2: TF.js soft / fuzzy match ─────────────────────────────────────
  const tfResult = classifyByTfSoft(signals);
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
 * Generate a value using TF.js classification + built-in generators.
 */
export async function generateWithTensorFlow(
  field: FormField,
): Promise<string> {
  const detectedType = classifyField(field);
  return generate(detectedType);
}
