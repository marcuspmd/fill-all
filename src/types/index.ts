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

/** Field types that the extension can detect and generate values for */
export type FieldType =
  | "cpf"
  | "cnpj"
  | "email"
  | "phone"
  | "name"
  | "first-name"
  | "last-name"
  | "full-name"
  | "address"
  | "street"
  | "city"
  | "state"
  | "zip-code"
  | "cep"
  | "date"
  | "birth-date"
  | "number"
  | "password"
  | "username"
  | "company"
  | "rg"
  | "text"
  | "money"
  | "select"
  | "checkbox"
  | "radio"
  | "unknown";

/** Represents a detected form field on the page */
export interface FormField {
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  selector: string;
  fieldType: FieldType;
  label?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  autocomplete?: string;
  required: boolean;
  /** Which method produced fieldType */
  detectionMethod?: DetectionMethod;
  /** Confidence score 0–1 from TF.js or AI (1.0 for keyword/html-type) */
  detectionConfidence?: number;
  /** True when the field is a non-native interactive widget */
  isInteractive?: boolean;
  /** Sub-type for interactive widgets */
  interactiveType?: InteractiveFieldType;
  /** Normalised signals string used for classification (name+id+label+placeholder) */
  contextSignals?: string;
  /** Refined semantic type for <select>/<textarea> without changing fieldType */
  contextualType?: FieldType;
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
  /** Money range (used when fieldType is "money") */
  moneyMin?: number;
  moneyMax?: number;
  /** Number range (used when fieldType is "number") */
  numberMin?: number;
  numberMax?: number;
  /** Select option index: 0 = auto (random), 1 = first option, 2 = second, etc. */
  selectOptionIndex?: number;
  /** Priority (higher = takes precedence) */
  priority: number;
  /** When this rule was created */
  createdAt: number;
  /** When this rule was last updated */
  updatedAt: number;
}

/** A saved form template with fixed data */
export interface SavedForm {
  id: string;
  name: string;
  /** URL pattern this form applies to */
  urlPattern: string;
  /** Map of field selector → fixed value */
  fields: Record<string, string>;
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
  /** Money generator range */
  moneyMin: number;
  moneyMax: number;
  /** Number generator range */
  numberMin: number;
  numberMax: number;
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
  | "DETECT_FIELDS"
  | "START_WATCHING"
  | "STOP_WATCHING"
  | "GET_WATCHER_STATUS"
  | "TOGGLE_PANEL"
  | "SHOW_PANEL"
  | "HIDE_PANEL"
  | "FILL_FIELD_BY_SELECTOR"
  | "GET_IGNORED_FIELDS"
  | "ADD_IGNORED_FIELD"
  | "REMOVE_IGNORED_FIELD";

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

export const DEFAULT_SETTINGS: Settings = {
  autoFillOnLoad: false,
  defaultStrategy: "ai",
  useChromeAI: true,
  forceAIFirst: false,
  shortcut: "Alt+F",
  locale: "pt-BR",
  highlightFilled: true,
  moneyMin: 1,
  moneyMax: 10000,
  numberMin: 1,
  numberMax: 99999,
};
