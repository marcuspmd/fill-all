/**
 * Shake effect — rapidly shakes the target element to signal attention or error.
 */

import type { ShakeEffect } from "./effect.types";

/** Applies the shake effect to `target` and resolves when animation ends. */
export function applyShakeEffect(
  target: Element | null,
  config: ShakeEffect,
): Promise<void> {
  return new Promise((resolve) => {
    if (!target || !(target instanceof HTMLElement)) {
      resolve();
      return;
    }

    const intensity = config.intensity ?? 3;
    const duration = config.duration ?? 500;
    const stepDuration = duration / (intensity * 2);

    const prevTransition = target.style.transition;
    target.style.transition = `transform ${stepDuration}ms ease`;

    let step = 0;
    const totalSteps = intensity * 2;
    const amplitude = 8;

    const tick = () => {
      if (step >= totalSteps) {
        target.style.transform = "";
        target.style.transition = prevTransition;
        resolve();
        return;
      }
      const dir = step % 2 === 0 ? amplitude : -amplitude;
      target.style.transform = `translateX(${dir}px)`;
      step++;
      setTimeout(tick, stepDuration);
    };

    tick();
  });
}
