/**
 * Effect types for demo replay steps.
 *
 * Each effect is a visual enhancement that can be applied to a step.
 * Effects run inside the content script via `applyStepEffects()`.
 */

// ── Effect kinds ──────────────────────────────────────────────────────────

/** All supported visual effect kinds */
export type EffectKind =
  | "label"
  | "grow"
  | "zoom"
  | "pin"
  | "shake"
  | "confetti"
  | "spotlight";

// ── Per-effect config ─────────────────────────────────────────────────────

export interface LabelEffect {
  kind: "label";
  /** Text to display in the floating label */
  text: string;
  /** Duration in ms (default: 2000) */
  duration?: number;
  /** Position relative to element — default: "above" */
  position?: "above" | "below" | "left" | "right";
}

export interface GrowEffect {
  kind: "grow";
  /** Scale factor (default: 1.15) */
  scale?: number;
  /** Animation duration in ms (default: 400) */
  duration?: number;
}

export interface ZoomEffect {
  kind: "zoom";
  /** How much to zoom the viewport towards the element (default: 1.4) */
  scale?: number;
  /** Hold zoom for this many ms (default: 1200) */
  duration?: number;
}

export interface PinEffect {
  kind: "pin";
  /** Optional note to show near the pin marker */
  note?: string;
  /** Duration in ms; 0 = keep until end of step (default: 2000) */
  duration?: number;
}

export interface ShakeEffect {
  kind: "shake";
  /** Number of shake oscillations (default: 3) */
  intensity?: number;
  /** Animation duration in ms (default: 500) */
  duration?: number;
}

export interface ConfettiEffect {
  kind: "confetti";
  /** Number of confetti particles (default: 60) */
  count?: number;
}

export interface SpotlightEffect {
  kind: "spotlight";
  /** Spotlight overlay opacity 0-1 (default: 0.6) */
  opacity?: number;
  /** Duration in ms; 0 = keep until end of step (default: 2000) */
  duration?: number;
}

/** Union of all concrete effect configs */
export type StepEffect =
  | LabelEffect
  | GrowEffect
  | ZoomEffect
  | PinEffect
  | ShakeEffect
  | ConfettiEffect
  | SpotlightEffect;

// ── Caption config (for caption action type) ──────────────────────────────

/**
 * Configuration for the `caption` step action.
 * Caption is not an "effect" applied on a target element — it is its own step
 * type that shows a floating subtitle during replay.
 */
export interface CaptionConfig {
  /** Subtitle text to display */
  text: string;
  /** Screen position of the caption (default: "bottom") */
  position?: "top" | "middle" | "bottom";
  /** Display duration in ms (default: 3000) */
  duration?: number;
}
