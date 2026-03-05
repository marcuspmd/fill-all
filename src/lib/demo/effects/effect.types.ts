/**
 * Effect types for demo replay steps.
 *
 * Each effect is a visual enhancement that can be applied to a step.
 * Effects run inside the content script via `applyStepEffects()`.
 */

// ── Effect timing ─────────────────────────────────────────────────────────

/**
 * Controls *when* an effect runs relative to the step action:
 *
 * - `"before"` — effect runs and **completes** before the action starts.
 *               Good for: grow (expand element, then fill it).
 * - `"during"` — effect **starts** at the same time as the action and
 *               runs concurrently (fire-and-start). Good for: zoom, spotlight,
 *               label, pin (visible while the action is happening).
 * - `"after"`  — effect runs **after** the action completes successfully.
 *               Good for: confetti, shake (react to the completed action).
 */
export type EffectTiming = "before" | "during" | "after";

/** Default timing per effect kind (used when `timing` is not set). */
export const DEFAULT_EFFECT_TIMING: Record<EffectKind, EffectTiming> = {
  grow: "before",
  zoom: "during",
  spotlight: "during",
  label: "during",
  pin: "during",
  shake: "after",
  confetti: "after",
};

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
  /** When to run relative to the action (default: "during") */
  timing?: EffectTiming;
}

export interface GrowEffect {
  kind: "grow";
  /** Scale factor (default: 1.15) */
  scale?: number;
  /** Animation duration in ms (default: 400) */
  duration?: number;
  /** When to run relative to the action (default: "before") */
  timing?: EffectTiming;
}

export interface ZoomEffect {
  kind: "zoom";
  /** How much to zoom the viewport towards the element (default: 1.4) */
  scale?: number;
  /** Hold zoom for this many ms. Use 0 or Infinity for indefinite zoom (e.g., during typing).
   * (default: 1200)
   */
  duration?: number;
  /** When to run relative to the action (default: "during") */
  timing?: EffectTiming;
}

export interface PinEffect {
  kind: "pin";
  /** Optional note to show near the pin marker */
  note?: string;
  /** Duration in ms; 0 = keep until end of step (default: 2000) */
  duration?: number;
  /** When to run relative to the action (default: "during") */
  timing?: EffectTiming;
}

export interface ShakeEffect {
  kind: "shake";
  /** Number of shake oscillations (default: 3) */
  intensity?: number;
  /** Animation duration in ms (default: 500) */
  duration?: number;
  /** When to run relative to the action (default: "after") */
  timing?: EffectTiming;
}

export interface ConfettiEffect {
  kind: "confetti";
  /** Number of confetti particles (default: 60) */
  count?: number;
  /** When to run relative to the action (default: "after") */
  timing?: EffectTiming;
}

export interface SpotlightEffect {
  kind: "spotlight";
  /** Spotlight overlay opacity 0-1 (default: 0.6) */
  opacity?: number;
  /** Duration in ms; 0 = keep until end of step (default: 2000) */
  duration?: number;
  /** When to run relative to the action (default: "during") */
  timing?: EffectTiming;
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
