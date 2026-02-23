/**
 * Popup — main action buttons (fill, save, watch, panel, options)
 */

import { sendToActiveTab } from "./popup-messaging";
import { loadSavedForms } from "./popup-forms";

export function bindFillAllAction(): void {
  document
    .getElementById("btn-fill-all")
    ?.addEventListener("click", async () => {
      const btn = document.getElementById("btn-fill-all") as HTMLButtonElement;
      const result = await sendToActiveTab({ type: "FILL_ALL_FIELDS" });
      if (result === null) {
        btn.textContent = "⚠️ Não disponível aqui";
      } else {
        const res = result as { filled?: number } | null;
        btn.textContent = `✓ ${res?.filled ?? 0} campos preenchidos`;
      }
      setTimeout(() => {
        btn.textContent = "⚡ Preencher Todos os Campos";
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

export function bindTogglePanelAction(): void {
  document
    .getElementById("btn-toggle-panel")
    ?.addEventListener("click", async () => {
      const btn = document.getElementById(
        "btn-toggle-panel",
      ) as HTMLButtonElement;
      const settings = (await chrome.runtime.sendMessage({
        type: "GET_SETTINGS",
      })) as { showPanel?: boolean } | null;
      const isActive = settings?.showPanel ?? false;
      const newValue = !isActive;

      await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        payload: { showPanel: newValue },
      });

      if (newValue) {
        await sendToActiveTab({ type: "SHOW_PANEL" });
      } else {
        await sendToActiveTab({ type: "HIDE_PANEL" });
      }

      updatePanelButton(btn, newValue);
    });
}

function updatePanelButton(btn: HTMLButtonElement, active: boolean): void {
  btn.textContent = active ? "📌 Painel Ativo" : "📌 Painel Flutuante";
  btn.classList.toggle("btn-active", active);
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
        btn.textContent = "👁️ Watch";
        btn.classList.remove("btn-active");
      } else {
        await sendToActiveTab({
          type: "START_WATCHING",
          payload: { autoRefill: true },
        });
        btn.textContent = "👁️ Ativo";
        btn.classList.add("btn-active");
      }
    });
}

export async function initPanelStatus(): Promise<void> {
  try {
    const settings = (await chrome.runtime.sendMessage({
      type: "GET_SETTINGS",
    })) as { showPanel?: boolean } | null;
    const btn = document.getElementById(
      "btn-toggle-panel",
    ) as HTMLButtonElement;
    if (btn && settings?.showPanel) {
      updatePanelButton(btn, true);
    }
  } catch {
    // Content script may not be loaded yet
  }
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
