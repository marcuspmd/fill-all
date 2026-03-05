/**
 * Label effect — shows a floating text tooltip near the target element.
 */

import type { LabelEffect } from "./effect.types";

const LABEL_CLASS = "fill-all-effect-label";

/**
 * Applies the label effect inline CSS styles once (idempotent).
 */
function injectStyles(): void {
  if (document.getElementById("fill-all-effect-label-styles")) return;
  const style = document.createElement("style");
  style.id = "fill-all-effect-label-styles";
  style.textContent = `
    .${LABEL_CLASS} {
      position: fixed;
      z-index: 2147483646;
      padding: 5px 10px;
      background: #1a1a2e;
      color: #e2e8f0;
      font-size: 13px;
      font-family: system-ui, sans-serif;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      pointer-events: none;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 220ms ease, transform 220ms ease;
    }
    .${LABEL_CLASS}.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .${LABEL_CLASS}::after {
      content: "";
      position: absolute;
      border: 5px solid transparent;
    }
    .${LABEL_CLASS}[data-pos="above"]::after {
      top: 100%; left: 50%;
      transform: translateX(-50%);
      border-top-color: #1a1a2e;
    }
    .${LABEL_CLASS}[data-pos="below"]::after {
      bottom: 100%; left: 50%;
      transform: translateX(-50%);
      border-bottom-color: #1a1a2e;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Positions the label relative to the target element.
 */
function position(
  el: HTMLElement,
  rect: DOMRect,
  pos: LabelEffect["position"] = "above",
): void {
  const gap = 8;
  const elRect = el.getBoundingClientRect();

  if (pos === "above") {
    el.style.top = `${rect.top - elRect.height - gap}px`;
    el.style.left = `${rect.left + rect.width / 2 - elRect.width / 2}px`;
  } else if (pos === "below") {
    el.style.top = `${rect.bottom + gap}px`;
    el.style.left = `${rect.left + rect.width / 2 - elRect.width / 2}px`;
  } else if (pos === "left") {
    el.style.top = `${rect.top + rect.height / 2 - elRect.height / 2}px`;
    el.style.left = `${rect.left - elRect.width - gap}px`;
  } else {
    el.style.top = `${rect.top + rect.height / 2 - elRect.height / 2}px`;
    el.style.left = `${rect.right + gap}px`;
  }
}

/** Applies the label effect on `target` and resolves after it's done. */
export function applyLabelEffect(
  target: Element | null,
  config: LabelEffect,
): Promise<void> {
  return new Promise((resolve) => {
    if (!target || !config.text?.trim()) {
      resolve();
      return;
    }

    injectStyles();

    const duration = config.duration ?? 2000;
    const pos = config.position ?? "above";
    const rect = target.getBoundingClientRect();

    const label = document.createElement("div");
    label.className = LABEL_CLASS;
    label.setAttribute("data-pos", pos);
    label.textContent = config.text;
    document.body.appendChild(label);

    // Position after paint so getBoundingClientRect works
    requestAnimationFrame(() => {
      position(label, rect, pos);
      requestAnimationFrame(() => label.classList.add("visible"));
    });

    setTimeout(() => {
      label.classList.remove("visible");
      setTimeout(() => {
        label.remove();
        resolve();
      }, 240);
    }, duration);
  });
}
