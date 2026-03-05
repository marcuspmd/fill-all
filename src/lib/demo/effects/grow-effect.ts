/**
 * Grow effect — briefly scales up the target element to draw attention.
 */

import type { GrowEffect } from "./effect.types";

/** Applies the grow effect on `target` and resolves after it finishes. */
export function applyGrowEffect(
  target: Element | null,
  config: GrowEffect,
): Promise<void> {
  return new Promise((resolve) => {
    if (!target || !(target instanceof HTMLElement)) {
      resolve();
      return;
    }

    const scale = config.scale ?? 1.15;
    const duration = config.duration ?? 400;

    const prevTransition = target.style.transition;
    const prevTransform = target.style.transform;
    const prevZIndex = target.style.zIndex;

    target.style.transition = `transform ${duration / 2}ms ease`;
    target.style.zIndex = "9999";
    target.style.transform = `${prevTransform} scale(${scale})`;

    setTimeout(() => {
      target.style.transform = prevTransform;

      setTimeout(
        () => {
          target.style.transition = prevTransition;
          target.style.zIndex = prevZIndex;
          resolve();
        },
        duration / 2 + 20,
      );
    }, duration / 2);
  });
}
