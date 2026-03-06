/**
 * Effect runner — dispatches step effects to their respective implementations.
 *
 * Run all effects configured for a step in parallel (they are independent).
 * Use `applyStepEffects()` from step-executor.ts.
 */

import { createLogger } from "@/lib/logger";
import type { StepEffect } from "./effect.types";
import { applyLabelEffect } from "./label-effect";
import { applyGrowEffect } from "./grow-effect";
import { applyZoomEffect } from "./zoom-effect";
import { applyPinEffect } from "./pin-effect";
import { applyShakeEffect } from "./shake-effect";
import { applyConfettiEffect } from "./confetti-effect";
import { applySpotlightEffect } from "./spotlight-effect";

const log = createLogger("Effects");

/**
 * Resolves the CSS selector to an element (or null).
 */
function resolveTarget(selector: string | undefined): Element | null {
  if (!selector) return null;
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Applies a single effect, resolving after it completes.
 * Never throws — logs warnings on failure.
 */
async function applyEffect(
  effect: StepEffect,
  selector: string | undefined,
): Promise<void> {
  const target = resolveTarget(selector);

  try {
    switch (effect.kind) {
      case "label":
        await applyLabelEffect(target, effect);
        break;
      case "grow":
        await applyGrowEffect(target, effect);
        break;
      case "zoom":
        await applyZoomEffect(target, effect);
        break;
      case "pin":
        await applyPinEffect(target, effect);
        break;
      case "shake":
        await applyShakeEffect(target, effect);
        break;
      case "confetti":
        await applyConfettiEffect(target, effect);
        break;
      case "spotlight":
        await applySpotlightEffect(target, effect);
        break;
      default: {
        const _exhaust: never = effect;
        log.warn("Unknown effect kind:", (_exhaust as StepEffect).kind);
      }
    }
  } catch (err) {
    log.warn(`Effect "${effect.kind}" failed:`, err);
  }
}

/**
 * Runs all effects for a step in parallel.
 * The step's CSS `selector` is used to resolve the target element.
 *
 * @param effects - List of effects to apply (may be empty).
 * @param selector - CSS selector for the step's target element.
 */
export async function applyStepEffects(
  effects: StepEffect[] | undefined,
  selector: string | undefined,
): Promise<void> {
  if (!effects || effects.length === 0) return;

  await Promise.all(effects.map((e) => applyEffect(e, selector)));
}
