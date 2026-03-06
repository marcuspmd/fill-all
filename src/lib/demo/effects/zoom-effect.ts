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

/**
 * Generation counter — incremented each time a new zoom starts.
 * Old cleanup callbacks check their captured generation against this value;
 * if it differs, they are superseded and must NOT touch the DOM.
 */
let zoomGeneration = 0;
let activeCancelFn: (() => void) | null = null;

/** Applies the zoom effect focused on the target element. */
export function applyZoomEffect(
  target: Element | null,
  config: ZoomEffect,
): Promise<void> {
  return new Promise((resolve) => {
    // ── Cancel any previous zoom BEFORE touching the DOM ─────────────────
    // We must cancel first so the old cleanup does NOT overwrite our new
    // transform values when its deferred setTimeout fires.
    if (activeCancelFn) {
      activeCancelFn();
      activeCancelFn = null;
    }

    // Capture this zoom's generation AFTER cancelling the previous one.
    const myGeneration = ++zoomGeneration;

    const scale = config.scale ?? 1.4;
    const duration = config.duration ?? 1200;
    const isIndefinite = duration === 0 || config.duration === Infinity;

    // ── Focal point: always anchor to the LEFT edge of the field ─────────
    // Using left edge (beginning of field) rather than center keeps the
    // cursor / typed text in view and avoids zooming to the page center.
    let vx: number;
    let vy: number;

    if (target) {
      const rect = target.getBoundingClientRect();
      // Left edge, vertical center — "start of the field"
      vx = rect.left;
      vy = rect.top + rect.height / 2;
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

    // ── Apply zoom to <html> ──────────────────────────────────────────────
    // Synchronously reset first (no transition) so previous residual state
    // doesn't bleed into this zoom.
    const root = document.documentElement as HTMLElement;
    root.style.transition = "none";
    root.style.transform = "";
    root.style.transformOrigin = "";
    void root.offsetHeight; // force reflow before re-applying

    root.style.transition =
      "transform 350ms cubic-bezier(0.4,0,0.2,1), transform-origin 0ms";
    root.style.transformOrigin = `${cx}px ${cy}px`;
    root.style.transform = `scale(${scale})`;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);

      // Guard: if a newer zoom has already started, do NOT touch the DOM.
      if (zoomGeneration !== myGeneration) {
        resolve();
        return;
      }

      root.style.transform = "";

      setTimeout(() => {
        // Double-check generation inside the deferred callback as well.
        if (zoomGeneration !== myGeneration) {
          resolve();
          return;
        }
        root.style.transition = "";
        root.style.transformOrigin = "";
        resolve();
      }, 380);
    };

    const cancel = () => {
      cleanup();
      activeCancelFn = null;
    };

    activeCancelFn = cancel;

    if (isIndefinite) {
      // Safety timeout of 60 s — normally cancelled externally when the
      // fill action completes.
      timer = setTimeout(cleanup, 60_000);
    } else {
      timer = setTimeout(cleanup, duration);
    }
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
