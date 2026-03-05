/**
 * Zoom effect — smoothly zooms the viewport towards the target element,
 * using CSS `transform: scale()` on `document.documentElement`.
 */

import type { ZoomEffect } from "./effect.types";

let zoomEl: HTMLDivElement | null = null;

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
    if (!target) {
      resolve();
      return;
    }

    injectStyles();

    const scale = config.scale ?? 1.4;
    const duration = config.duration ?? 1200;

    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

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

    const timer = setTimeout(() => {
      root.style.transform = prevTransform;

      setTimeout(() => {
        root.style.transition = prevTransition;
        root.style.transformOrigin = prevTransformOrigin;
        resolve();
      }, 380);
    }, duration);

    // Make cleanup accessible externally
    (applyZoomEffect as unknown as { cancel?: () => void }).cancel = () => {
      clearTimeout(timer);
      root.style.transform = prevTransform;
      root.style.transition = prevTransition;
      root.style.transformOrigin = prevTransformOrigin;
      resolve();
    };
  });
}
