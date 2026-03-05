/**
 * Spotlight effect — dims the page and highlights the target element.
 */

import type { SpotlightEffect } from "./effect.types";

const OVERLAY_ID = "fill-all-spotlight-overlay";
const HOLE_ID = "fill-all-spotlight-hole";

function injectStyles(): void {
  if (document.getElementById("fill-all-effect-spotlight-styles")) return;
  const style = document.createElement("style");
  style.id = "fill-all-effect-spotlight-styles";
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483644;
      pointer-events: none;
      transition: opacity 300ms ease;
    }
    #${HOLE_ID} {
      position: fixed;
      z-index: 2147483645;
      pointer-events: none;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(255,255,255,0.6), 0 0 0 8px rgba(255,255,255,0.15);
      transition: all 300ms ease;
    }
  `;
  document.head.appendChild(style);
}

/** Dims the page and spotlights the target element for `duration` ms. */
export function applySpotlightEffect(
  target: Element | null,
  config: SpotlightEffect,
): Promise<void> {
  return new Promise((resolve) => {
    if (!target) {
      resolve();
      return;
    }

    injectStyles();

    const opacity = config.opacity ?? 0.6;
    const duration = config.duration ?? 2000;

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Dark overlay
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.backgroundColor = `rgba(0,0,0,${opacity})`;
    overlay.style.opacity = "0";
    document.body.appendChild(overlay);

    // Bright hole around the target
    const hole = document.createElement("div");
    hole.id = HOLE_ID;
    hole.style.top = `${rect.top - padding}px`;
    hole.style.left = `${rect.left - padding}px`;
    hole.style.width = `${rect.width + padding * 2}px`;
    hole.style.height = `${rect.height + padding * 2}px`;
    hole.style.background = "transparent";
    document.body.appendChild(hole);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    const cleanup = () => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        hole.remove();
        resolve();
      }, 320);
    };

    if (duration > 0) {
      setTimeout(cleanup, duration);
    } else {
      resolve();
    }
  });
}
