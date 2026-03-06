/**
 * Confetti effect — bursts confetti particles from the target element's position.
 */

import type { ConfettiEffect } from "./effect.types";

const COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Spawns confetti particles near the target element. */
export function applyConfettiEffect(
  target: Element | null,
  config: ConfettiEffect,
): Promise<void> {
  return new Promise((resolve) => {
    const count = config.count ?? 60;

    // Determine origin point
    let originX = window.innerWidth / 2;
    let originY = window.innerHeight / 2;

    if (target) {
      const rect = target.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    }

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position: fixed;
        z-index: 2147483646;
        pointer-events: none;
        width: ${randomRange(6, 10)}px;
        height: ${randomRange(6, 10)}px;
        background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        left: ${originX}px;
        top: ${originY}px;
        opacity: 1;
        transition: none;
      `;
      document.body.appendChild(p);
      particles.push(p);
    }

    requestAnimationFrame(() => {
      particles.forEach((p) => {
        const angle = randomRange(0, Math.PI * 2);
        const speed = randomRange(80, 240);
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed - randomRange(60, 120);
        p.style.transform = `translate(${dx}px, ${dy}px) rotate(${randomRange(0, 720)}deg)`;
        p.style.transition = `transform ${randomRange(0.6, 1.2)}s ease-out, opacity 0.4s ease 0.6s`;
        p.style.opacity = "0";
      });

      setTimeout(() => {
        particles.forEach((p) => p.remove());
        resolve();
      }, 1400);
    });
  });
}
