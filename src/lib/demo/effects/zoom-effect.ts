/**
 * Zoom effect — smoothly zooms the viewport towards the target element
 * (or the synthetic cursor position as fallback), using CSS `transform:
 * scale()` on `document.documentElement`.
 *
 * `transform-origin` is set in **document coordinates** (viewport + scroll
 * offset) because that is the coordinate system of `<html>`.
 *
 * **Dinamic Zoom for Typing:**
 * When used during fill actions with typing, the zoom starts at the top-left
 * of the field and remains active until cancelled. The focal point stays
 * locked to the field's top-left to keep the input area in view as the user
 * types.
 */

import type { ZoomEffect } from "./effect.types";
import { getCursorPosition } from "../cursor-overlay";

let zoomEl: HTMLDivElement | null = null;
let activeCancelFn: (() => void) | null = null;

function injectStyles(): void {
  if (document.getElementById("fill-all-effect-zoom-styles")) return;
  const style = document.createElement("style");
  style.id = "fill-all-effect-zoom-styles";
  style.textContent = `
    .fill-all-zoom-lens {
      position: fixed;
      inset: 0;
      z-index: 2147483640;
      pointer-events: none;
      background: transparent;
      transform-origin: center center;
      transition: transform 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  document.head.appendChild(style);
}

/** Applies the zoom effect focused on the target element. */
export function applyZoomEffect(
  target: Element | null,
  config: ZoomEffect,
): Promise<void> {
  return new Promise((resolve) => {
    injectStyles();

    const scale = config.scale ?? 1.4;
    const duration = config.duration ?? 1200;
    const isIndefinite = duration === 0 || config.duration === Infinity;

    // ── Focal point in viewport coordinates ──────────────────────────────
    // For typing actions (indefinite zoom):
    //   - Use TOP-LEFT corner of target element (beginning of the field)
    // For other actions:
    //   - Use center of target element
    let vx: number;
    let vy: number;

    if (target) {
      const rect = target.getBoundingClientRect();
      if (isIndefinite) {
        // Top-left corner for typing actions
        vx = rect.left;
        vy = rect.top;
      } else {
        // Center for brief zoom actions
        vx = rect.left + rect.width / 2;
        vy = rect.top + rect.height / 2;
      }
    } else {
      const cursor = getCursorPosition();
      if (!cursor) {
        resolve();
        return;
      }
      vx = cursor.x;
      vy = cursor.y;
    }

    // transform-origin on <html> uses document coordinates
    // (viewport position + scroll offset).
    const cx = vx + window.scrollX;
    const cy = vy + window.scrollY;

    // Use CSS zoom on the html element (works well for demo replay)
    const root = document.documentElement as HTMLElement;
    const prevTransition = root.style.transition;
    const prevTransform = root.style.transform;
    const prevTransformOrigin = root.style.transformOrigin;

    root.style.transition =
      "transform 350ms cubic-bezier(0.4,0,0.2,1), transform-origin 0ms";
    root.style.transformOrigin = `${cx}px ${cy}px`;
    root.style.transform = `scale(${scale})`;

    // Cleanup zoom element ref
    if (zoomEl) {
      zoomEl.remove();
      zoomEl = null;
    }

    // Cancel any active zoom
    if (activeCancelFn) {
      activeCancelFn();
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      root.style.transform = prevTransform;

      setTimeout(() => {
        root.style.transition = prevTransition;
        root.style.transformOrigin = prevTransformOrigin;
        resolve();
      }, 380);
    };

    const cancel = () => {
      cleanup();
      activeCancelFn = null;
    };

    activeCancelFn = cancel;

    if (isIndefinite) {
      // For indefinite zoom (typing), set a very long timeout as safety
      // but the zoom will typically be cancelled externally
      timer = setTimeout(cleanup, 60_000); // 60 second safety timeout
    } else {
      // For fixed-duration zoom, use the config duration
      timer = setTimeout(cleanup, duration);
    }

    // Make cancel accessible externally (used by effect-runner)
    (applyZoomEffect as unknown as { cancel?: () => void }).cancel = cancel;
  });
}

/**
 * Cancels any active zoom effect immediately.
 * Called when the to-be-zoomed step completes.
 */
export function cancelActiveZoom(): void {
  if (activeCancelFn) {
    activeCancelFn();
    activeCancelFn = null;
  }
}
