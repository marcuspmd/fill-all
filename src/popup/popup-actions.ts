/**
 * Popup — main action buttons (fill, save, watch, panel, options)
 */

import { sendToActiveTab } from "./popup-messaging";
import { loadSavedForms } from "./popup-forms";
import { t } from "@/lib/i18n";

export function bindFillAllAction(): void {
  document
    .getElementById("btn-fill-all")
    ?.addEventListener("click", async () => {
      const btn = document.getElementById("btn-fill-all") as HTMLButtonElement;
      const result = await sendToActiveTab({ type: "FILL_ALL_FIELDS" });
      if (result === null) {
        btn.textContent = t("notAvailableHere");
      } else {
        const res = result as { filled?: number } | null;
        btn.textContent = `✓ ${res?.filled ?? 0} ${t("filled")}`;
      }
      setTimeout(() => {
        btn.textContent = `⚡ ${t("fillAll")}`;
      }, 2000);
    });
}

export function bindSaveFormAction(): void {
  document
    .getElementById("btn-save-form")
    ?.addEventListener("click", async () => {
      await sendToActiveTab({ type: "SAVE_FORM" });
      await loadSavedForms();
    });
}

export function bindOptionsAction(): void {
  document.getElementById("btn-options")?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

export function bindToggleWatchAction(): void {
  document
    .getElementById("btn-toggle-watch")
    ?.addEventListener("click", async () => {
      const btn = document.getElementById(
        "btn-toggle-watch",
      ) as HTMLButtonElement;
      const status = (await sendToActiveTab({
        type: "GET_WATCHER_STATUS",
      })) as { watching: boolean } | null;

      if (status?.watching) {
        await sendToActiveTab({ type: "STOP_WATCHING" });
        btn.textContent = `👁️ ${t("watch")}`;
        btn.classList.remove("btn-active");
      } else {
        await sendToActiveTab({
          type: "START_WATCHING",
          payload: { autoRefill: true },
        });
        btn.textContent = `👁️ ${t("panelActive")}`;
        btn.classList.add("btn-active");
      }
    });
}

export async function initWatcherStatus(): Promise<void> {
  try {
    const status = (await sendToActiveTab({ type: "GET_WATCHER_STATUS" })) as {
      watching: boolean;
    } | null;
    const btn = document.getElementById(
      "btn-toggle-watch",
    ) as HTMLButtonElement;
    if (btn && status?.watching) {
      btn.textContent = "👁️ Ativo";
      btn.classList.add("btn-active");
    }
  } catch {
    // Content script may not be loaded yet
  }
}
