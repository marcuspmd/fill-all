/**
 * Popup — quick generators, money/number config, clipboard
 */

import type { FieldType } from "@/types";
import { getRange } from "@/types";
import { generate, generateMoney, generateNumber } from "@/lib/generators";
import { generateWithConstraints } from "@/lib/generators/adaptive";

function getMoneyCfg(): { min: number; max: number } {
  const minEl = document.getElementById("money-min") as HTMLInputElement | null;
  const maxEl = document.getElementById("money-max") as HTMLInputElement | null;
  const defaults = getRange("money", 1, 10_000);
  return {
    min: minEl ? parseFloat(minEl.value) || defaults.min : defaults.min,
    max: maxEl ? parseFloat(maxEl.value) || defaults.max : defaults.max,
  };
}

function getNumberCfg(): { min: number; max: number } {
  const minEl = document.getElementById(
    "number-min",
  ) as HTMLInputElement | null;
  const maxEl = document.getElementById(
    "number-max",
  ) as HTMLInputElement | null;
  const defaults = getRange("number", 1, 99_999);
  return {
    min: minEl ? parseInt(minEl.value, 10) || defaults.min : defaults.min,
    max: maxEl ? parseInt(maxEl.value, 10) || defaults.max : defaults.max,
  };
}

export function initGeneratorConfigs(): void {
  const moneyRange = getRange("money", 1, 10_000);
  const numberRange = getRange("number", 1, 99_999);

  const moneyMin = document.getElementById("money-min") as HTMLInputElement;
  const moneyMax = document.getElementById("money-max") as HTMLInputElement;
  const numMin = document.getElementById("number-min") as HTMLInputElement;
  const numMax = document.getElementById("number-max") as HTMLInputElement;
  if (moneyMin) moneyMin.value = String(moneyRange.min);
  if (moneyMax) moneyMax.value = String(moneyRange.max);
  if (numMin) numMin.value = String(numberRange.min);
  if (numMax) numMax.value = String(numberRange.max);
}

export function bindGeneratorEvents(): void {
  document.querySelectorAll("[data-generator]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = (btn as HTMLElement).dataset.generator as FieldType;

      const moneyConfig = document.getElementById("money-config")!;
      const numberConfig = document.getElementById("number-config")!;
      moneyConfig.style.display = type === "money" ? "flex" : "none";
      numberConfig.style.display = type === "number" ? "flex" : "none";

      let value: string;
      if (type === "money") {
        const cfg = getMoneyCfg();
        value = generateWithConstraints(() => generateMoney(cfg.min, cfg.max), {
          requireValidity: true,
        });
      } else if (type === "number") {
        const cfg = getNumberCfg();
        value = generateWithConstraints(
          () => generateNumber(cfg.min, cfg.max),
          { requireValidity: true },
        );
      } else {
        value = generateWithConstraints(() => generate(type), {
          requireValidity: true,
        });
      }

      const container = document.getElementById("generated-value")!;
      const text = document.getElementById("generated-text")!;
      text.textContent = value;
      container.style.display = "flex";
    });
  });

  // Copy to clipboard
  document.getElementById("btn-copy")?.addEventListener("click", () => {
    const text = document.getElementById("generated-text")?.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById("btn-copy")!;
      btn.textContent = "✓";
      setTimeout(() => {
        btn.textContent = "📋";
      }, 1000);
    }
  });
}
