/**
 * E2E Export — barrel exports and generator registry.
 */

export type {
  ActionType,
  AssertionType,
  CapturedAction,
  E2EAssertion,
  E2EFramework,
  E2EGenerateOptions,
  E2EGenerator,
  RecordedStep,
  RecordedStepType,
  RecordingGenerateOptions,
  RecordingSession,
  RecordingStatus,
  SelectorStrategy,
  SmartSelector,
} from "./e2e-export.types";

export { playwrightGenerator } from "./framework/playwright-generator";
export { cypressGenerator } from "./framework/cypress-generator";
export { pestGenerator } from "./framework/pest-generator";

export {
  E2E_GENERATORS,
  getE2EGenerator,
  generateE2EScript,
  generateE2EFromRecording,
} from "./e2e-generator-registry";

export { buildCapturedActions, detectSubmitActions } from "./action-capture";
export { extractSmartSelectors, pickBestSelector } from "./smart-selector";
export {
  detectAssertions,
  detectNegativeAssertions,
} from "./assertion-generator";
export {
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getRecordingSession,
  getRecordingStatus,
  addManualStep,
  getCapturedResponses,
  setOnStepAdded,
  setOnStepUpdated,
  removeStep,
  updateStep,
  clearSession,
  tryRestoreRecordingSession,
} from "./action-recorder";

export type { CapturedHttpResponse } from "./action-recorder";
