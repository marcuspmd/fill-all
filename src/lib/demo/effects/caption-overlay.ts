/**
 * Caption overlay — renders a floating caption/subtitle on the page.
 *
 * Used by the `caption` FlowStep action type to display explanatory text
 * during demo replays without targeting a specific element.
 */

import { createLogger } from "@/lib/logger";
import type { CaptionConfig } from "./effect.types";

const log = createLogger("CaptionOverlay");
const CAPTION_ID = "fill-all-caption-overlay";

function injectStyles(): void {
  if (document.getElementById("fill-all-caption-styles")) return;
  const style = document.createElement("style");
  style.id = "fill-all-caption-styles";
  style.textContent = `
    #${CAPTION_ID} {
      position: fixed;
      z-index: 2147483647;
      left: 50%;
      transform: translateX(-50%) translateY(16px);
      max-width: 600px;
      width: max-content;
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.92);
      color: #f1f5f9;
      font-size: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      pointer-events: none;
      opacity: 0;
      transition: opacity 280ms ease, transform 280ms ease;
      text-align: center;
      line-height: 1.5;
    }
    #${CAPTION_ID}.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #${CAPTION_ID}[data-position="top"] {
      top: 24px;
      bottom: unset;
    }
    #${CAPTION_ID}[data-position="middle"] {
      top: 50%;
      transform: translateX(-50%) translateY(calc(-50% + 16px));
    }
    #${CAPTION_ID}[data-position="middle"].visible {
      transform: translateX(-50%) translateY(-50%);
    }
    #${CAPTION_ID}[data-position="bottom"] {
      bottom: 32px;
      top: unset;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Displays a caption overlay and resolves after the caption is dismissed.
 */
export function showCaption(config: CaptionConfig): Promise<void> {
  return new Promise((resolve) => {
    if (!config.text?.trim()) {
      resolve();
      return;
    }

    injectStyles();

    // Remove any existing caption
    document.getElementById(CAPTION_ID)?.remove();

    const position = config.position ?? "bottom";
    const duration = config.duration ?? 3000;

    const el = document.createElement("div");
    el.id = CAPTION_ID;
    el.setAttribute("data-position", position);
    el.textContent = config.text;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("visible"));
    });

    log.debug("Caption shown:", config.text);

    setTimeout(() => {
      el.classList.remove("visible");
      setTimeout(() => {
        el.remove();
        resolve();
      }, 300);
    }, duration);
  });
}

/** Immediately removes the caption overlay (for cleanup). */
export function destroyCaption(): void {
  document.getElementById(CAPTION_ID)?.remove();
}
