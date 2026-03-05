/**
 * Demo module — barrel exports.
 *
 * Provides the Auto Demo Generator feature:
 * deterministic form-filling flows, replay orchestration, and screen recording.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type {
  FlowStep,
  FlowMetadata,
  FlowScript,
  ReplayConfig,
  ReplayStatus,
  ReplayResult,
  RecordingState,
  ScreenRecordOptions,
  StepResult,
  StepCompletePayload,
  ExecuteStepPayload,
  ReplayProgress,
  FlowActionType,
  FlowValueSource,
  FlowAssertion,
  AssertOperator,
  ReplaySpeed,
  DemoMessageType,
} from "./demo.types";

export {
  DEFAULT_REPLAY_CONFIG,
  DEFAULT_SCREEN_RECORD_OPTIONS,
  SPEED_PRESETS,
} from "./demo.types";

// ── Schemas ───────────────────────────────────────────────────────────────

export {
  parseFlowScript,
  parseFlowStep,
  parseReplayConfig,
  flowScriptSchema,
} from "./demo.schemas";

// ── PRNG ──────────────────────────────────────────────────────────────────

export { createSeededRng } from "./seeded-prng";

// ── Value mapper ──────────────────────────────────────────────────────────

export { mapValueToSource, resolveValueSource } from "./value-mapper";

// ── Flow converter ────────────────────────────────────────────────────────

export { convertRecordingToFlow, convertSteps } from "./flow-converter";
export type { ConvertOptions } from "./flow-converter";

// ── Step executor ─────────────────────────────────────────────────────────

export { executeStep, highlightElement } from "./step-executor";

// ── Cursor overlay ────────────────────────────────────────────────────────

export {
  initCursorOverlay,
  destroyCursorOverlay,
  showCursor,
  hideCursor,
  moveCursorTo,
  setCursorPosition,
  clickEffect,
} from "./cursor-overlay";

// ── Navigation handler ────────────────────────────────────────────────────

export {
  navigateAndWait,
  waitForTabLoad,
  injectContentScript,
  waitForUrlPattern,
} from "./navigation-handler";

// ── Replay orchestrator ───────────────────────────────────────────────────

export type {
  ReplayOrchestrator,
  OrchestratorCallbacks,
} from "./replay-orchestrator";
export { createReplayOrchestrator } from "./replay-orchestrator";

// ── Screen recorder ───────────────────────────────────────────────────────

export type { ScreenRecorder } from "./screen-recorder";
export { createScreenRecorder } from "./screen-recorder";

// ── Storage ───────────────────────────────────────────────────────────────

export {
  getDemoFlows,
  getDemoFlowById,
  saveDemoFlow,
  deleteDemoFlow,
  clearDemoFlows,
} from "./demo-storage";
