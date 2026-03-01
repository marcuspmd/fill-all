/**
 * Types for the E2E script export feature.
 *
 * A `CapturedAction` represents a field fill action performed by the extension.
 * An `E2EGenerator` is a Strategy that converts captured actions into framework-specific code.
 */

/** Supported E2E frameworks for code generation */
export type E2EFramework = "playwright" | "cypress" | "pest";

/** The kind of interaction performed on a field */
export type ActionType =
  | "fill"
  | "check"
  | "uncheck"
  | "select"
  | "radio"
  | "clear"
  | "click"
  | "submit";

/** Strategy used to locate the element — ordered by resilience */
export type SelectorStrategy =
  | "data-testid"
  | "aria-label"
  | "role"
  | "name"
  | "id"
  | "placeholder"
  | "css";

/** A prioritised selector with metadata */
export interface SmartSelector {
  /** The selector string (CSS or Playwright-style locator) */
  value: string;
  /** Which strategy produced this selector */
  strategy: SelectorStrategy;
  /** Human-readable description for comments */
  description?: string;
}

/** What kind of assertion to generate */
export type AssertionType =
  | "url-changed"
  | "url-contains"
  | "visible-text"
  | "element-visible"
  | "element-hidden"
  | "toast-message"
  | "field-value"
  | "field-error"
  | "redirect";

/** A single assertion to include in the generated test */
export interface E2EAssertion {
  type: AssertionType;
  /** Selector for the target element (if applicable) */
  selector?: string;
  /** Expected value (text, URL fragment, etc.) */
  expected?: string;
  /** Human-readable comment */
  description?: string;
}

/** A single field-fill action captured during form filling */
export interface CapturedAction {
  /** Best CSS selector for the element (prioritised: #id → [data-testid] → [name] → fallback) */
  selector: string;
  /** Smart selectors ordered by priority (first = best) */
  smartSelectors?: SmartSelector[];
  /** The value that was applied */
  value: string;
  /** Interaction type */
  actionType: ActionType;
  /** Optional human-readable label for comments in generated code */
  label?: string;
  /** The detected field type (cpf, email, etc.) */
  fieldType?: string;
  /** Whether the field is required */
  required?: boolean;
}

/** Options passed to generator for controlling output */
export interface E2EGenerateOptions {
  /** Page URL for navigation */
  pageUrl?: string;
  /** Custom test name (defaults to "fill form") */
  testName?: string;
  /** Custom test description */
  testDescription?: string;
  /** Whether to include assertions after submit */
  includeAssertions?: boolean;
  /** Whether to generate a negative test (empty/invalid fields) */
  includeNegativeTest?: boolean;
  /** Whether to generate Page Object Model class */
  includePOM?: boolean;
  /** Assertions detected from the page */
  assertions?: E2EAssertion[];
  /** Use smart selectors (data-testid > aria > role > name > css) */
  useSmartSelectors?: boolean;
}

// ---------------------------------------------------------------------------
// Recording types — used by the record mode to capture real user interactions
// ---------------------------------------------------------------------------

/** Types of steps captured during a recording session */
export type RecordedStepType =
  | "navigate"
  | "fill"
  | "click"
  | "select"
  | "check"
  | "uncheck"
  | "clear"
  | "hover"
  | "press-key"
  | "submit"
  | "wait-for-element"
  | "wait-for-hidden"
  | "wait-for-url"
  | "wait-for-network-idle"
  | "scroll"
  | "assert";

/** A single step recorded during a user interaction session */
export interface RecordedStep {
  /** Step type */
  type: RecordedStepType;
  /** CSS selector for the target element */
  selector?: string;
  /** Smart selectors for the target (ordered by priority) */
  smartSelectors?: SmartSelector[];
  /** Value typed, selected, or expected */
  value?: string;
  /** Human-readable label (from field label or button text) */
  label?: string;
  /** Timestamp (ms) — used to calculate delays between steps */
  timestamp: number;
  /** Detected field type (cpf, email, etc.) */
  fieldType?: string;
  /** URL for navigate steps */
  url?: string;
  /** Key name for press-key steps */
  key?: string;
  /** Assertion for assert steps */
  assertion?: E2EAssertion;
  /** Timeout in ms for wait steps (default: 5000) */
  waitTimeout?: number;
  /** Scroll coordinates for scroll steps */
  scrollPosition?: { x: number; y: number };
}

/** State of an active recording session */
export type RecordingStatus = "recording" | "paused" | "stopped";

/** A full recording session with metadata */
export interface RecordingSession {
  /** Ordered list of recorded steps */
  steps: RecordedStep[];
  /** URL when recording started */
  startUrl: string;
  /** Timestamp when recording started */
  startTime: number;
  /** Current session state */
  status: RecordingStatus;
}

/** Options for generating code from a recording */
export interface RecordingGenerateOptions extends E2EGenerateOptions {
  /** Minimum delay (ms) between steps to insert an explicit wait (default: 1000) */
  minWaitThreshold?: number;
  /** Whether to include scroll steps in generated code */
  includeScrollSteps?: boolean;
  /** Whether to include hover steps in generated code */
  includeHoverSteps?: boolean;
}

// ---------------------------------------------------------------------------
// Generator contract
// ---------------------------------------------------------------------------

/** Contract for E2E code generators (Strategy pattern) */
export interface E2EGenerator {
  /** Framework identifier */
  readonly name: E2EFramework;
  /** Human-readable display name */
  readonly displayName: string;
  /** Generates a full test script from captured actions (auto-fill flow) */
  generate(actions: CapturedAction[], options?: E2EGenerateOptions): string;
  /** Generates a full test script from a recording session */
  generateFromRecording(
    steps: RecordedStep[],
    options?: RecordingGenerateOptions,
  ): string;
}
