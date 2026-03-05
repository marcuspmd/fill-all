/**
 * @module effects
 *
 * Modular effects system for Fill All demo replays.
 *
 * Step effects are independent animations/overlays attached to any FlowStep.
 * Caption is a dedicated step action type (not an effect) exported separately.
 */

export type {
  LabelEffect,
  GrowEffect,
  ZoomEffect,
  PinEffect,
  ShakeEffect,
  ConfettiEffect,
  SpotlightEffect,
  StepEffect,
  CaptionConfig,
  EffectKind,
  EffectTiming,
} from "./effect.types";

export { applyStepEffects } from "./effect-runner";
export { showCaption, destroyCaption } from "./caption-overlay";
export { DEFAULT_EFFECT_TIMING } from "./effect.types";
