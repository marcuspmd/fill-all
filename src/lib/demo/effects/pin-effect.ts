/**
 * Pin effect — places a pulsing pin/marker on top of the target element,
 * optionally with a small note.
 */

import type { PinEffect } from "./effect.types";

const PIN_CLASS = "fill-all-effect-pin";

function injectStyles(): void {
  if (document.getElementById("fill-all-effect-pin-styles")) return;
  const style = document.createElement("style");
  style.id = "fill-all-effect-pin-styles";
  style.textContent = `
    .${PIN_CLASS} {
      position: fixed;
      z-index: 2147483646;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .${PIN_CLASS}__dot {
      width: 14px;
      height: 14px;
      background: #e53e3e;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(229,62,62,0.5);
      animation: fill-all-pin-pulse 1.2s ease infinite;
    }
    .${PIN_CLASS}__note {
      margin-top: 4px;
      padding: 3px 8px;
      background: #e53e3e;
      color: #fff;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      border-radius: 4px;
      white-space: nowrap;
    }
    @keyframes fill-all-pin-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(229,62,62,0.5); }
      70%  { box-shadow: 0 0 0 10px rgba(229,62,62,0); }
      100% { box-shadow: 0 0 0 0 rgba(229,62,62,0); }
    }
  `;
  document.head.appendChild(style);
}

/** Places a pin marker on the target and removes it after `duration` ms. */
export function applyPinEffect(
  target: Element | null,
  config: PinEffect,
): Promise<void> {
  return new Promise((resolve) => {
    if (!target) {
      resolve();
      return;
    }

    injectStyles();

    const duration = config.duration ?? 2000;
    const note = config.note;

    const rect = target.getBoundingClientRect();

    const pin = document.createElement("div");
    pin.className = PIN_CLASS;
    pin.style.top = `${rect.top - 7}px`;
    pin.style.left = `${rect.left + rect.width / 2 - 7}px`;

    const dot = document.createElement("div");
    dot.className = `${PIN_CLASS}__dot`;
    pin.appendChild(dot);

    if (note) {
      const noteEl = document.createElement("div");
      noteEl.className = `${PIN_CLASS}__note`;
      noteEl.textContent = note;
      pin.appendChild(noteEl);
    }

    document.body.appendChild(pin);

    const cleanup = () => {
      pin.remove();
      resolve();
    };

    if (duration > 0) {
      setTimeout(cleanup, duration);
    } else {
      // Keep until resolved externally (caller controls)
      resolve();
    }
  });
}
