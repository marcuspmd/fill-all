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

/** Extension settings */
export interface Settings {
  /** Whether to auto-fill on page load */
  autoFillOnLoad: boolean;
  /** Default generation strategy */
  defaultStrategy: "ai" | "tensorflow" | "random";
  /** Whether to use Chrome built-in AI when available */
  useChromeAI: boolean;
  /** Keyboard shortcut to trigger fill */
  shortcut: string;
  /** Locale for generated data */
  locale: "pt-BR" | "en-US";
  /** Whether to highlight filled fields */
  highlightFilled: boolean;
}

/** Message types for communication between extension parts */
export type MessageType =
  | "FILL_ALL_FIELDS"
  | "FILL_SINGLE_FIELD"
  | "SAVE_FORM"
  | "LOAD_SAVED_FORM"
  | "GET_FORM_FIELDS"
  | "GET_RULES"
  | "SAVE_RULE"
  | "DELETE_RULE"
  | "GET_SETTINGS"
  | "SAVE_SETTINGS"
  | "AI_GENERATE"
  | "DETECT_FIELDS";

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
  shortcut: "Alt+F",
  locale: "pt-BR",
  highlightFilled: true,
};
