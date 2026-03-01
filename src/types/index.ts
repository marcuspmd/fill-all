import { StructuredSignals } from "@/lib/dataset";
import { FIELD_TYPES_BY_CATEGORY_DERIVED } from "./field-type-definitions";

export type {
  GeneratorParams,
  FieldTypeDefinition,
} from "./field-type-definitions";

export {
  FIELD_TYPE_DEFINITIONS,
  getDefinition,
  getDefaultParams,
  getRange,
} from "./field-type-definitions";

export type {
  MessageHandler,
  StorageRepository,
  MutableStorageRepository,
  UrlFilterableRepository,
  UIModule,
  DisposableUIModule,
  FieldIconComponent,
} from "./interfaces";

/** How a field type was determined */
export type DetectionMethod =
  | "html-type"
  | "keyword"
  | "tensorflow"
  | "chrome-ai"
  | "html-fallback"
  | "custom-select"
  | "interactive"
  | "user-override";

/** Type of interactive/custom widget detected on the page */
export type InteractiveFieldType =
  | "date-picker"
  | "time-picker"
  | "rich-text"
  | "slider"
  | "toggle"
  | "rating"
  | "captcha"
  | "color-picker"
  | "autocomplete";

/** Broad category a field type belongs to (used for grouping and UI). */
export type FieldCategory =
  | "personal"
  | "contact"
  | "address"
  | "document"
  | "financial"
  | "authentication"
  | "professional"
  | "ecommerce"
  | "system"
  | "generic"
  | "unknown";

/** Fonte única dos tipos suportados pela extensão (UI, validações e classificadores). */
export const FIELD_TYPES = [
  // Identificação
  "cpf",
  "cnpj",
  "cpf-cnpj",
  "rg",
  "passport",
  "cnh",
  "pis",
  "national-id",
  "tax-id",
  "document-issuer",

  // Nome
  "name",
  "first-name",
  "last-name",
  "full-name",

  // Contato
  "email",
  "phone",
  "mobile",
  "whatsapp",

  // Endereço
  "address",
  "street",
  "house-number",
  "complement",
  "neighborhood",
  "city",
  "state",
  "country",
  "cep",
  "zip-code",

  // Datas
  "date",
  "birth-date",
  "start-date",
  "end-date",
  "due-date",

  // Financeiro
  "money",
  "price",
  "amount",
  "discount",
  "tax",
  "credit-card-number",
  "credit-card-expiration",
  "credit-card-cvv",
  "pix-key",

  // Empresa
  "company",
  "supplier",
  "employee-count",
  "job-title",
  "department",

  // Autenticação
  "username",
  "password",
  "confirm-password",
  "otp",
  "verification-code",

  // E-commerce
  "product",
  "product-name",
  "sku",
  "quantity",
  "coupon",

  // Genéricos
  "text",
  "description",
  "notes",
  "search",
  "website",
  "url",
  "number",

  // Componentes
  "select",
  "checkbox",
  "radio",
  "file",
  "unknown",
] as const;

/** Field types that the extension can detect and generate values for */
export type FieldType = (typeof FIELD_TYPES)[number];

/** Subconjunto de tipos treináveis no modelo de texto (TF.js). */
export const TRAINABLE_FIELD_TYPES = [
  ...FIELD_TYPES,
] as const satisfies readonly FieldType[];

/** Mapping of every field category to its member field types. */
export const FIELD_TYPES_BY_CATEGORY: Record<FieldCategory, FieldType[]> =
  FIELD_TYPES_BY_CATEGORY_DERIVED;

/** Source from which a signal was extracted (e.g. label, placeholder, aria). */
export type signalType =
  | "name"
  | "id"
  | "label"
  | "placeholder"
  | "autocomplete"
  | "aria-label"
  | "nearby-text"
  | "section-title"
  | "form-title"
  | "table-header";

/** A single extracted signal with its source and optional weight. */
export interface Signal {
  source: signalType;
  value: string;
  weight?: number;
}

/** Grouped signals for a field, split by priority tier. */
export interface FieldSignals {
  primary: Signal[];
  secondary: Signal[];
  structural: Signal[];
}

/** Origin of a training sample (synthetic, real-world, etc.). */
export type TrainingSampleSource =
  | "synthetic"
  | "real-world"
  | "augmented"
  | "learned";

/** Curriculum difficulty level for a training sample. */
export type TrainingDifficulty = "easy" | "medium" | "hard";

/** Language tag for multilingual training samples. */
export type TrainingLanguage = "pt" | "en" | "es";

/** Optional DOM-level hints attached to training samples. */
export interface DomFeatureHints {
  inputType?: string;
  maxLength?: number;
  pattern?: string;
}

/** Which signal tiers to extract for a training sample. */
export type DatasetExtractionStrategy =
  | "primary"
  | "secondary"
  | "structural"
  | "dom-features";

/** A single labelled training sample used by the TF.js classifier. */
export interface TrainingSample {
  signals: StructuredSignals;
  category: FieldCategory;
  type: FieldType;
  source: TrainingSampleSource;
  /** Optional: original URL domain (real-world samples) */
  domain?: string;
  /** Curriculum difficulty */
  difficulty: TrainingDifficulty;
  /** Optional language tag (helps multilingual training) */
  language?: TrainingLanguage;
  /** Optional DOM hints for advanced training */
  domFeatures?: DomFeatureHints;
}

/** Native form element types (input, select, textarea) */
export type NativeFormElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/** Type guard: narrows FormField.element to NativeFormElement */
export function isNativeFormElement(el: HTMLElement): el is NativeFormElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

/** Represents a detected form field on the page */
export interface FormField {
  element:
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | HTMLElement;
  selector: string;

  // Final result
  category: FieldCategory;
  fieldType: FieldType;
  contextualType?: FieldType;

  // Custom component adapter
  /** Name of the adapter that detected this field (undefined for native elements). */
  adapterName?: string;

  // Raw DOM metadata
  label?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  autocomplete?: string;
  inputType?: string;
  required: boolean;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  options?: Array<{ value: string; text: string }>; // for selects
  checkboxValue?: string; // for checkboxes/radios
  checkboxChecked?: boolean; // for checkboxes/radios

  // Interactive widgets
  isInteractive?: boolean;
  interactiveType?: InteractiveFieldType;

  // Structured signals
  signals?: FieldSignals;

  languageDetected?: "pt" | "en" | "es" | "unknown";

  /** Which method produced fieldType */
  detectionMethod?: DetectionMethod;
  /** Confidence score 0–1 from TF.js or AI (1.0 for keyword/html-type) */
  detectionConfidence?: number;
  /** Normalised signals string used for classification (name+id+label+placeholder) */
  contextSignals?: string;

  /** Time taken by the detection pipeline for this field (ms) */
  detectionDurationMs?: number;
  timings?: Array<{
    strategy: string;
    durationMs: number;
  }>;
  predictions?: Array<{
    type: FieldType;
    confidence: number;
  }>;
  decisionTrace?: string[];
}

/** Rule to define how a specific field should be filled on a specific site */
export interface FieldRule {
  id: string;
  /** URL pattern (supports wildcards like *.example.com) */
  urlPattern: string;
  /** CSS selector or field identifier */
  fieldSelector: string;
  /** Optional: field name/id for matching */
  fieldName?: string;
  /** The type of value to generate */
  fieldType: FieldType;
  /** Fixed value — if set, always use this */
  fixedValue?: string;
  /** Generator to use when no fixed value */
  generator: "auto" | "ai" | "tensorflow" | FieldType;
  /** Custom prompt for AI generation */
  aiPrompt?: string;

  /** Select option index: 0 = auto (random), 1 = first option, 2 = second, etc. */
  selectOptionIndex?: number;
  /** Priority (higher = takes precedence) */
  priority: number;
  /** When this rule was created */
  createdAt: number;
  /** When this rule was last updated */
  updatedAt: number;
}

/** How a template field should be filled */
export type FormFieldMode = "fixed" | "generator";

/** Structured field config for form templates */
export interface FormTemplateField {
  /** Field identifier (selector, name, or id). Use a FieldType value for type-based matching. */
  key: string;
  /** Human-readable label */
  label: string;
  /** Fill mode: fixed uses fixedValue, generator uses generatorType */
  mode: FormFieldMode;
  /** Value to use when mode === 'fixed' */
  fixedValue?: string;
  /** Generator type to use when mode === 'generator' */
  generatorType?: FieldType;
  /**
   * When set, matches any detected field whose fieldType equals this value.
   * Takes precedence over selector-based key matching.
   * Allows templates to be site-agnostic (works on any form that has a field of this type).
   */
  matchByFieldType?: FieldType;
}

/** A saved form template with fixed data */
export interface SavedForm {
  id: string;
  name: string;
  /** URL pattern this form applies to (use '*' for global) */
  urlPattern: string;
  /** Map of field selector → fixed value (legacy format) */
  fields: Record<string, string>;
  /** Structured template fields with mode support */
  templateFields?: FormTemplateField[];
  /** When this template was created */
  createdAt: number;
  /** When this template was last updated */
  updatedAt: number;
}

/** A field that should be skipped during auto-fill */
export interface IgnoredField {
  id: string;
  /** URL pattern of the page where this field lives */
  urlPattern: string;
  /** CSS selector of the field */
  selector: string;
  /** Human-readable label */
  label: string;
  createdAt: number;
}

/** Lightweight field snapshot used for popup cache and diagnostics */
export interface DetectedFieldSummary {
  selector: string;
  fieldType: FieldType;
  label: string;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  contextualType?: FieldType;
  detectionMethod?: DetectionMethod;
  /** Confidence score 0–1 from the detection pipeline */
  detectionConfidence?: number;
  options?: Array<{ value: string; text: string }>;
  checkboxValue?: string;
  checkboxChecked?: boolean;
}

/** Per-page cache entry for detected fields */
export interface FieldDetectionCacheEntry {
  url: string;
  origin: string;
  hostname: string;
  path: string;
  count: number;
  fields: DetectedFieldSummary[];
  updatedAt: number;
}

/** A single detection strategy entry in the pipeline config */
export interface DetectionStrategyEntry {
  /** Classifier name (html-type | keyword | tensorflow | chrome-ai | html-fallback) */
  name: string;
  /** Whether this strategy is active */
  enabled: boolean;
}

/** Extension settings */
export interface Settings {
  /** Whether to auto-fill on page load */
  autoFillOnLoad: boolean;
  /** Default generation strategy */
  defaultStrategy: "ai" | "tensorflow" | "random";
  /** Whether to use Chrome built-in AI when available */
  useChromeAI: boolean;
  /** When true, AI is tried before saved forms, rules and generators */
  forceAIFirst: boolean;
  /** Keyboard shortcut to trigger fill */
  shortcut: string;
  /** Locale for generated data */
  locale: "pt-BR" | "en-US";
  /** Whether to highlight filled fields */
  highlightFilled: boolean;
  /** Whether to enable field detection cache */
  cacheEnabled: boolean;
  /** Whether to show the per-field fill/inspect icon */
  showFieldIcon: boolean;
  /** Position of the field icon relative to the input */
  fieldIconPosition: "above" | "inside" | "below";
  /** Ordered list of classification strategies */
  detectionPipeline: DetectionStrategyEntry[];

  /** Whether debug logging is enabled (all console output is suppressed when false) */
  debugLog: boolean;
  /** Minimum log level to output: debug < info < warn < error */
  logLevel: "debug" | "info" | "warn" | "error";
  /** Preferred UI language. "auto" follows the browser/Chrome locale. */
  uiLanguage: "auto" | "en" | "pt_BR" | "es";
  /** When true, only empty fields are filled — fields with an existing value are skipped */
  fillEmptyOnly: boolean;
}

/** Message types for communication between extension parts */
export type MessageType =
  | "FILL_ALL_FIELDS"
  | "FILL_SINGLE_FIELD"
  | "SAVE_FORM"
  | "LOAD_SAVED_FORM"
  | "GET_SAVED_FORMS"
  | "DELETE_FORM"
  | "GET_FORM_FIELDS"
  | "GET_RULES"
  | "SAVE_RULE"
  | "DELETE_RULE"
  | "GET_SETTINGS"
  | "SAVE_SETTINGS"
  | "AI_GENERATE"
  | "AI_CHECK_AVAILABLE"
  | "AI_CLASSIFY_FIELD"
  | "AI_OPTIMIZE_SCRIPT"
  | "DETECT_FIELDS"
  | "START_WATCHING"
  | "STOP_WATCHING"
  | "GET_WATCHER_STATUS"
  | "FILL_FIELD_BY_SELECTOR"
  | "GET_IGNORED_FIELDS"
  | "ADD_IGNORED_FIELD"
  | "REMOVE_IGNORED_FIELD"
  | "GET_FIELD_CACHE"
  | "SAVE_FIELD_CACHE"
  | "DELETE_FIELD_CACHE"
  | "CLEAR_FIELD_CACHE"
  | "GET_LEARNED_ENTRIES"
  | "CLEAR_LEARNED_ENTRIES"
  | "RETRAIN_LEARNING_DATABASE"
  | "INVALIDATE_CLASSIFIER"
  | "RELOAD_CLASSIFIER"
  | "GET_DATASET"
  | "ADD_DATASET_ENTRY"
  | "REMOVE_DATASET_ENTRY"
  | "CLEAR_DATASET"
  | "IMPORT_DATASET"
  | "SEED_DATASET"
  | "EXPORT_DATASET"
  | "GET_RUNTIME_MODEL_META"
  | "DELETE_RUNTIME_MODEL"
  | "APPLY_TEMPLATE"
  | "UPDATE_FORM"
  | "EXPORT_E2E"
  | "START_RECORDING"
  | "STOP_RECORDING"
  | "PAUSE_RECORDING"
  | "RESUME_RECORDING"
  | "GET_RECORDING_STATUS"
  | "GET_RECORDING_STEPS"
  | "EXPORT_RECORDING"
  | "REMOVE_RECORDING_STEP"
  | "UPDATE_RECORDING_STEP"
  | "CLEAR_RECORDING"
  | "RECORDING_STEP_ADDED"
  | "RECORDING_STEP_UPDATED"
  | "DEVTOOLS_RELAY";

/** Payload for any message exchanged between extension contexts. */
export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

/** Result of a generation operation */
export interface GenerationResult {
  fieldSelector: string;
  value: string;
  source: "fixed" | "rule" | "ai" | "tensorflow" | "generator";
}

/** Default ordered detection pipeline used when the user hasn't customised it. */
export const DEFAULT_DETECTION_PIPELINE: DetectionStrategyEntry[] = [
  { name: "html-type", enabled: true },
  { name: "keyword", enabled: true },
  { name: "tensorflow", enabled: true },
  { name: "chrome-ai", enabled: true },
  { name: "html-fallback", enabled: true },
];

const IS_MAC_PLATFORM =
  typeof navigator !== "undefined" && navigator.platform?.startsWith("Mac");

/** Default extension settings applied on first install. */
export const DEFAULT_SETTINGS: Settings = {
  autoFillOnLoad: false,
  defaultStrategy: "ai",
  useChromeAI: true,
  forceAIFirst: false,
  shortcut: IS_MAC_PLATFORM ? "Command+Shift+F" : "Alt+Shift+F",
  locale: "pt-BR",
  highlightFilled: true,
  cacheEnabled: true,
  showFieldIcon: true,
  fieldIconPosition: "inside",
  detectionPipeline: DEFAULT_DETECTION_PIPELINE,

  debugLog: false,
  logLevel: "warn",
  uiLanguage: "auto",
  fillEmptyOnly: false,
};
