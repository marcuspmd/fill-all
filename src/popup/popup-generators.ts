/**
 * Popup — quick generators, money/number config, clipboard
 */

import type { FieldType } from "@/types";
import { generate, generateMoney, generateNumber } from "@/lib/generators";
import { generateWithConstraints } from "@/lib/generators/adaptive";
import { sendToBackground } from "./popup-messaging";

async function getMoneyCfg(): Promise<{ min: number; max: number }> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as {
    moneyMin?: number;
    moneyMax?: number;
  } | null;
  return {
    min: settings?.moneyMin ?? 1,
    max: settings?.moneyMax ?? 10000,
  };
}

async function getNumberCfg(): Promise<{ min: number; max: number }> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as {
    numberMin?: number;
    numberMax?: number;
  } | null;
  return {
    min: settings?.numberMin ?? 1,
    max: settings?.numberMax ?? 99999,
  };
}

export async function initGeneratorConfigs(): Promise<void> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as Record<
    string,
    number
  > | null;
  const moneyMin = document.getElementById("money-min") as HTMLInputElement;
  const moneyMax = document.getElementById("money-max") as HTMLInputElement;
  const numMin = document.getElementById("number-min") as HTMLInputElement;
  const numMax = document.getElementById("number-max") as HTMLInputElement;
  if (moneyMin) moneyMin.value = String(settings?.moneyMin ?? 1);
  if (moneyMax) moneyMax.value = String(settings?.moneyMax ?? 10000);
  if (numMin) numMin.value = String(settings?.numberMin ?? 1);
  if (numMax) numMax.value = String(settings?.numberMax ?? 99999);
}

function saveMoneyCfg(): void {
  const min = parseFloat(
    (document.getElementById("money-min") as HTMLInputElement)?.value,
  );
  const max = parseFloat(
    (document.getElementById("money-max") as HTMLInputElement)?.value,
  );
  if (!isNaN(min) && !isNaN(max)) {
    sendToBackground({
      type: "SAVE_SETTINGS",
      payload: { moneyMin: min, moneyMax: max },
    });
  }
}

function saveNumberCfg(): void {
  const min = parseInt(
    (document.getElementById("number-min") as HTMLInputElement)?.value,
    10,
  );
  const max = parseInt(
    (document.getElementById("number-max") as HTMLInputElement)?.value,
    10,
  );
  if (!isNaN(min) && !isNaN(max)) {
    sendToBackground({
      type: "SAVE_SETTINGS",
      payload: { numberMin: min, numberMax: max },
    });
  }
}

export function bindGeneratorEvents(): void {
  document
    .getElementById("money-min")
    ?.addEventListener("change", saveMoneyCfg);
  document
    .getElementById("money-max")
    ?.addEventListener("change", saveMoneyCfg);
  document
    .getElementById("number-min")
    ?.addEventListener("change", saveNumberCfg);
  document
    .getElementById("number-max")
    ?.addEventListener("change", saveNumberCfg);

  document.querySelectorAll("[data-generator]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const type = (btn as HTMLElement).dataset.generator as FieldType;

      const moneyConfig = document.getElementById("money-config")!;
      const numberConfig = document.getElementById("number-config")!;
      moneyConfig.style.display = type === "money" ? "flex" : "none";
      numberConfig.style.display = type === "number" ? "flex" : "none";

      let value: string;
      if (type === "money") {
        const cfg = await getMoneyCfg();
        const min = parseFloat(
          (document.getElementById("money-min") as HTMLInputElement)?.value,
        );
        const max = parseFloat(
          (document.getElementById("money-max") as HTMLInputElement)?.value,
        );
        value = generateWithConstraints(
          () =>
            generateMoney(
              isNaN(min) ? cfg.min : min,
              isNaN(max) ? cfg.max : max,
            ),
          { requireValidity: true },
        );
      } else if (type === "number") {
        const cfg = await getNumberCfg();
        const min = parseInt(
          (document.getElementById("number-min") as HTMLInputElement)?.value,
          10,
        );
        const max = parseInt(
          (document.getElementById("number-max") as HTMLInputElement)?.value,
          10,
        );
        value = generateWithConstraints(
          () =>
            generateNumber(
              isNaN(min) ? cfg.min : min,
              isNaN(max) ? cfg.max : max,
            ),
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
