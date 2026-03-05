/**
 * Types for the Auto Demo Generator feature.
 *
 * A `FlowScript` is a portable, replayable representation of a user flow.
 * Each `FlowStep` describes a single action (navigate, fill, click, etc.)
 * and references a `FieldType` generator instead of hardcoded values — making
 * every replay produce fresh, valid data from a deterministic seed.
 */

import type { FieldType, GeneratorParams } from "@/types";
import type {
  SelectorStrategy,
  SmartSelector,
} from "@/lib/e2e-export/e2e-export.types";
import type { StepEffect, CaptionConfig } from "./effects";

// ── Speed profiles ────────────────────────────────────────────────────────

/** Pre-defined replay speed profiles */
export type ReplaySpeed = "instant" | "fast" | "normal" | "slow";

/** Configuration for replay timing and visual behaviour */
export interface ReplayConfig {
  /** Global speed multiplier preset */
  speed: ReplaySpeed;
  /** Milliseconds per character during typing simulation (default: 60) */
  typingDelay: number;
  /** Milliseconds between steps (default: 800) */
  stepDelay: number;
  /** Whether to use the original recorded timing deltas */
  useRecordedTimings: boolean;
  /** Milliseconds to highlight an element before interacting (default: 300) */
  highlightDuration: number;
  /** Whether to display a synthetic cursor overlay during replay (default: true) */
  showCursor: boolean;
}

/** Speed presets mapped to their default config values */
export const SPEED_PRESETS: Record<
  ReplaySpeed,
  Pick<ReplayConfig, "typingDelay" | "stepDelay" | "highlightDuration">
> = {
  instant: { typingDelay: 0, stepDelay: 0, highlightDuration: 0 },
  fast: { typingDelay: 20, stepDelay: 300, highlightDuration: 100 },
  normal: { typingDelay: 60, stepDelay: 800, highlightDuration: 300 },
  slow: { typingDelay: 120, stepDelay: 1500, highlightDuration: 500 },
};

/** Default replay configuration */
export const DEFAULT_REPLAY_CONFIG: ReplayConfig = {
  speed: "normal",
  ...SPEED_PRESETS.normal,
  useRecordedTimings: false,
  showCursor: true,
};

// ── Flow step types ───────────────────────────────────────────────────────

/** Actions a flow step can perform */
export type FlowActionType =
  | "navigate"
  | "fill"
  | "click"
  | "select"
  | "check"
  | "uncheck"
  | "clear"
  | "wait"
  | "scroll"
  | "press-key"
  | "assert"
  | "caption";

/** Assertion operators for `assert` steps */
export type AssertOperator =
  | "equals"
  | "contains"
  | "visible"
  | "hidden"
  | "url-equals"
  | "url-contains"
  | "exists";

/** Assertion configuration embedded in an assert step */
export interface FlowAssertion {
  operator: AssertOperator;
  /** Expected value for equals/contains operators */
  expected?: string;
}

/** How the value for a `fill` step is determined */
export type FlowValueSource =
  | { type: "generator"; fieldType: FieldType; params?: GeneratorParams }
  | { type: "fixed"; value: string };

/** A single step in a FlowScript */
export interface FlowStep {
  /** Step identifier — unique within the flow */
  id: string;
  /** Action to perform */
  action: FlowActionType;

  // ── Target element ────────────────────────────────────────────────────
  /** CSS selector for the target element (required for most actions) */
  selector?: string;
  /** Smart selectors ordered by priority (first = best) */
  smartSelectors?: SmartSelector[];
  /** Preferred selector strategy to try first */
  selectorStrategy?: SelectorStrategy;

  // ── Value / source ────────────────────────────────────────────────────
  /** How the fill value is determined — generator or fixed */
  valueSource?: FlowValueSource;

  // ── Navigate / URL ────────────────────────────────────────────────────
  /** Target URL for `navigate` steps */
  url?: string;

  // ── Select ────────────────────────────────────────────────────────────
  /** Index of the option to select (0-based) */
  selectIndex?: number;
  /** Text content of the option to select */
  selectText?: string;

  // ── Key press ─────────────────────────────────────────────────────────
  /** Key identifier for `press-key` (e.g. "Enter", "Tab") */
  key?: string;

  // ── Wait ──────────────────────────────────────────────────────────────
  /** Timeout in ms for `wait` steps (default: 10_000) */
  waitTimeout?: number;

  // ── Scroll ────────────────────────────────────────────────────────────
  /** Scroll coordinates for `scroll` steps */
  scrollPosition?: { x: number; y: number };

  // ── Assert ────────────────────────────────────────────────────────────
  /** Assertion config for `assert` steps */
  assertion?: FlowAssertion;

  // ── Timing ────────────────────────────────────────────────────────────
  /** Delay before executing this step (ms) — recorded from original timing */
  delayBefore?: number;
  /** Delay after executing this step (ms) */
  delayAfter?: number;

  // ── Caption ───────────────────────────────────────────────────────────
  /** Caption configuration for `caption` steps */
  caption?: CaptionConfig;

  // ── Effects ───────────────────────────────────────────────────────────
  /** Visual effects applied to the target element during this step */
  effects?: StepEffect[];

  // ── Metadata ──────────────────────────────────────────────────────────
  /** Human-readable label for display */
  label?: string;
  /** Whether this step is optional (skip on failure instead of abort) */
  optional?: boolean;
}

// ── Flow metadata ─────────────────────────────────────────────────────────

/** Metadata describing a FlowScript */
export interface FlowMetadata {
  /** Human-readable name */
  name: string;
  /** Optional description */
  description?: string;
  /** Base URL where the flow was recorded */
  baseUrl: string;
  /** Seed string for deterministic PRNG */
  seed: string;
  /** When the flow was created (epoch ms) */
  createdAt: number;
  /** When the flow was last updated (epoch ms) */
  updatedAt: number;
  /** Schema version for forward-compatibility */
  version: number;
  /** Tags for categorisation */
  tags?: string[];
}

/** The complete flow script — portable, replayable, shareable */
export interface FlowScript {
  /** Unique flow identifier */
  id: string;
  /** Flow metadata */
  metadata: FlowMetadata;
  /** Default replay configuration */
  replayConfig: ReplayConfig;
  /** Ordered list of steps to execute */
  steps: FlowStep[];
}

// ── Replay state ──────────────────────────────────────────────────────────

/** Replay orchestrator state machine */
export type ReplayStatus =
  | "idle"
  | "preparing"
  | "running"
  | "paused"
  | "completed"
  | "failed";

/** Per-step execution result reported back from the content script */
export type StepResult =
  | { status: "success" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }
  | { status: "timeout" };

/** Progress update emitted by the orchestrator */
export interface ReplayProgress {
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  total: number;
  /** Label of the current step action */
  currentAction: FlowActionType;
  /** Current orchestrator status */
  status: ReplayStatus;
  /** ID of the current step */
  stepId: string;
}

/** Result reported after full replay completion */
export interface ReplayResult {
  /** Final status */
  status: "completed" | "failed";
  /** Total number of steps attempted */
  totalSteps: number;
  /** Number of successful steps */
  successCount: number;
  /** Number of skipped steps */
  skippedCount: number;
  /** Number of failed steps */
  failedCount: number;
  /** Total replay duration (ms) */
  durationMs: number;
  /** Per-step results */
  stepResults: Array<{ stepId: string; result: StepResult }>;
}

// ── Messages ──────────────────────────────────────────────────────────────

/** Message types specific to the demo/replay feature */
export type DemoMessageType =
  | "DEMO_EXECUTE_STEP"
  | "DEMO_STEP_COMPLETE"
  | "DEMO_REPLAY_START"
  | "DEMO_REPLAY_PAUSE"
  | "DEMO_REPLAY_RESUME"
  | "DEMO_REPLAY_STOP"
  | "DEMO_REPLAY_PROGRESS"
  | "DEMO_REPLAY_COMPLETE"
  | "DEMO_RECORD_START"
  | "DEMO_RECORD_STOP"
  | "DEMO_CURSOR_MOVE"
  | "DEMO_CURSOR_CLICK"
  | "DEMO_HIGHLIGHT_ELEMENT";

/** Payload for DEMO_EXECUTE_STEP sent to content script */
export interface ExecuteStepPayload {
  step: FlowStep;
  /** Pre-resolved value (generated by orchestrator from seed) */
  resolvedValue?: string;
  /** Active replay configuration */
  replayConfig: ReplayConfig;
}

/** Payload for DEMO_STEP_COMPLETE sent back from content script */
export interface StepCompletePayload {
  stepId: string;
  result: StepResult;
}

// ── Screen recording ──────────────────────────────────────────────────────

/** Screen recording state */
export type RecordingState = "inactive" | "recording" | "stopping";

/** Options for screen recording */
export interface ScreenRecordOptions {
  /** Include tab audio (default: false) */
  includeAudio: boolean;
  /** Preferred video codec (default: 'vp9') */
  codec: "vp8" | "vp9";
  /** Video bitrate in bps (default: 2_500_000) */
  videoBitrate: number;
}

/** Default screen recording configuration */
export const DEFAULT_SCREEN_RECORD_OPTIONS: ScreenRecordOptions = {
  includeAudio: false,
  codec: "vp9",
  videoBitrate: 2_500_000,
};

// ── Flow Script schema version ────────────────────────────────────────────

/** Current schema version — bump when FlowScript shape changes */
export const FLOW_SCRIPT_VERSION = 1;
