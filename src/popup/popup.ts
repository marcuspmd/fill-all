/**
 * Popup script — minimal UI with 4 actions.
 *
 * Actions: Fill All, Fill with AI, Fill Only Empties, Settings.
 */

import "./popup.css";

import { initI18n, t } from "@/lib/i18n";
import { createLogger, initLogger } from "@/lib/logger";
import { openAIContextModal } from "./popup-ai-context-modal";
import { sendToActiveTab } from "./popup-messaging";

const log = createLogger("Popup");

// ── State ────────────────────────────────────────────────────────────────────

let pageUrl = "";

// ── Render ───────────────────────────────────────────────────────────────────

function render(): void {
  document.body.innerHTML = `
    <div class="popup-container">
      <div class="popup-header">
        <span class="popup-logo">Fill All</span>
      </div>
      <div class="popup-body">
        <div id="status" class="status" style="display:none"></div>
        <button id="btn-fill-all" class="action-btn primary">
          ⚡ ${t("fillAll")}
        </button>
        <button id="btn-fill-ai" class="action-btn">
          🤖 ${t("fillWithAI")}
        </button>
        <button id="btn-fill-empty" class="action-btn">
          🔍 ${t("fillOnlyEmpty")}
        </button>
        <button id="btn-settings" class="action-btn secondary">
          ⚙️ ${t("settings")}
        </button>
      </div>
    </div>
  `;
}

// ── Status ───────────────────────────────────────────────────────────────────

function showStatus(msg: string, isError = false): void {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? "status error" : "status success";
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 2000);
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function doSend(
  message: import("@/types").ExtensionMessage,
  btn: HTMLButtonElement,
  originalText: string,
): Promise<void> {
  btn.disabled = true;
  try {
    const result = await sendToActiveTab(message);
    const res = result as { filled?: number } | null;
    const count = res?.filled ?? 0;
    showStatus(`✓ ${count} ${t("filled")}`);
  } catch (err) {
    log.warn("Failed to send message:", err);
    showStatus(t("error"), true);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function bindHandlers(): void {
  const btnFillAll = document.getElementById(
    "btn-fill-all",
  ) as HTMLButtonElement | null;
  btnFillAll?.addEventListener("click", async () => {
    const orig = btnFillAll.textContent ?? "";
    btnFillAll.textContent = "…";
    await doSend({ type: "FILL_ALL_FIELDS" }, btnFillAll, orig);
  });

  const btnFillAi = document.getElementById(
    "btn-fill-ai",
  ) as HTMLButtonElement | null;
  btnFillAi?.addEventListener("click", async () => {
    const context = await openAIContextModal();
    if (context === null) return;
    const orig = btnFillAi.textContent ?? "";
    btnFillAi.textContent = "…";
    await doSend(
      { type: "FILL_CONTEXTUAL_AI", payload: context },
      btnFillAi,
      orig,
    );
  });

  const btnFillEmpty = document.getElementById(
    "btn-fill-empty",
  ) as HTMLButtonElement | null;
  btnFillEmpty?.addEventListener("click", async () => {
    const orig = btnFillEmpty.textContent ?? "";
    btnFillEmpty.textContent = "…";
    await doSend(
      { type: "FILL_ALL_FIELDS", payload: { fillEmptyOnly: true } },
      btnFillEmpty,
      orig,
    );
  });

  document.getElementById("btn-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await initLogger();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pageUrl = tab?.url ?? "";

  await initI18n("auto");

  render();
  bindHandlers();

  log.debug("Popup init, url:", pageUrl);
}

void init();
