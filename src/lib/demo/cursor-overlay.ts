/**
 * Cursor Overlay — renders a synthetic cursor that glides between
 * target elements during demo replay.
 *
 * A single `<div>` is injected into the page and animated via CSS
 * `transform: translate()` for GPU-accelerated, jank-free movement.
 * The overlay cleans up when `destroy()` is called.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("CursorOverlay");

// ── Constants ─────────────────────────────────────────────────────────────

const CURSOR_ID = "fill-all-demo-cursor";
const CURSOR_SIZE = 20;

const CURSOR_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">',
  '  <path d="M2 2 L2 18 L7 13 L12 18 L14 16 L9 11 L16 11 Z"',
  '        fill="#1a73e8" stroke="#fff" stroke-width="1.2"/>',
  "</svg>",
].join("");

const CURSOR_STYLES = [
  `position: fixed`,
  `z-index: 2147483647`,
  `pointer-events: none`,
  `width: ${CURSOR_SIZE}px`,
  `height: ${CURSOR_SIZE}px`,
  `will-change: transform, opacity`,
  `transition-property: transform, opacity`,
  `transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)`,
  `opacity: 0`,
].join(";");

// ── State ─────────────────────────────────────────────────────────────────

let cursorEl: HTMLDivElement | null = null;
let currentX = 0;
let currentY = 0;
/** True after the first positioning — subsequent moves animate instead of teleport */
let isPositioned = false;

// ── Public API ────────────────────────────────────────────────────────────

/** Inject cursor element into the page (idempotent). */
export function initCursorOverlay(): void {
  if (cursorEl) return;

  cursorEl = document.createElement("div");
  cursorEl.id = CURSOR_ID;
  cursorEl.style.cssText = CURSOR_STYLES;
  cursorEl.innerHTML = CURSOR_SVG;
  document.body.appendChild(cursorEl);

  log.debug("Cursor overlay injected");
}

/** Remove cursor element from the page. */
export function destroyCursorOverlay(): void {
  if (!cursorEl) return;

  cursorEl.remove();
  cursorEl = null;
  isPositioned = false;
  log.debug("Cursor overlay destroyed");
}

/** Show the cursor (fade in). */
export function showCursor(): void {
  if (!cursorEl) return;
  cursorEl.style.opacity = "1";
}

/** Hide the cursor (fade out). */
export function hideCursor(): void {
  if (!cursorEl) return;
  cursorEl.style.opacity = "0";
}

/**
 * Animate the cursor to the centre of a DOM element.
 *
 * @param target   CSS selector or Element
 * @param durationMs  Animation duration in ms (default 400)
 * @returns Promise that resolves when the animation ends
 */
export function moveCursorTo(
  target: string | Element,
  durationMs = 400,
): Promise<void> {
  return new Promise((resolve) => {
    if (!cursorEl) {
      resolve();
      return;
    }

    const el =
      typeof target === "string" ? document.querySelector(target) : target;

    if (!el) {
      log.warn("Cursor target not found:", target);
      resolve();
      return;
    }

    const rect = el.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2 - CURSOR_SIZE / 2;
    const targetY = rect.top + rect.height / 2 - CURSOR_SIZE / 2;

    // First call: teleport instantly so cursor appears at the correct position
    // rather than animating from (0, 0) top-left corner.
    const moveDuration = isPositioned ? durationMs : 0;
    isPositioned = true;

    cursorEl.style.transitionDuration = `${moveDuration}ms`;
    cursorEl.style.transform = `translate(${targetX}px, ${targetY}px)`;

    currentX = targetX;
    currentY = targetY;

    // If teleporting (duration=0) resolve immediately after next frame;
    // otherwise wait for the CSS transition to finish.
    if (moveDuration === 0) {
      requestAnimationFrame(() => resolve());
      return;
    }

    const onEnd = () => {
      cursorEl?.removeEventListener("transitionend", onEnd);
      resolve();
    };
    cursorEl.addEventListener("transitionend", onEnd);

    // Safety timeout in case transitionend doesn't fire
    setTimeout(resolve, durationMs + 50);
  });
}

/**
 * Returns the current viewport centre of the synthetic cursor, or null if not injected.
 */
export function getCursorPosition(): { x: number; y: number } | null {
  if (!cursorEl) return null;
  return { x: currentX + CURSOR_SIZE / 2, y: currentY + CURSOR_SIZE / 2 };
}

/**
 * Teleport the cursor to (x, y) immediately (no animation).
 */
export function setCursorPosition(x: number, y: number): void {
  if (!cursorEl) return;

  currentX = x;
  currentY = y;
  cursorEl.style.transitionDuration = "0ms";
  cursorEl.style.transform = `translate(${x}px, ${y}px)`;
}

/**
 * Show a brief "click" ripple effect at the cursor's current position.
 */
export function clickEffect(): Promise<void> {
  return new Promise((resolve) => {
    if (!cursorEl) {
      resolve();
      return;
    }

    const ripple = document.createElement("div");
    ripple.style.cssText = [
      `position: fixed`,
      `z-index: 2147483646`,
      `pointer-events: none`,
      `width: 30px`,
      `height: 30px`,
      `border-radius: 50%`,
      `background: rgba(26, 115, 232, 0.3)`,
      `transform: translate(${currentX - 5}px, ${currentY - 5}px) scale(0)`,
      `transition: transform 0.3s ease-out, opacity 0.3s ease-out`,
    ].join(";");

    document.body.appendChild(ripple);

    // Start animation on next frame
    requestAnimationFrame(() => {
      ripple.style.transform = `translate(${currentX - 5}px, ${currentY - 5}px) scale(1.5)`;
      ripple.style.opacity = "0";
    });

    setTimeout(() => {
      ripple.remove();
      resolve();
    }, 350);
  });
}
