/**
 * Popup script — minimal UI with 4 actions.
 *
 * Actions: Fill All, Fill with AI, Fill Only Empties, Settings.
 */

import "./popup.css";

import {
  generateCep,
  generateCnpj,
  generateCpf,
  generateFullName,
  generatePhone,
} from "@/lib/generators";
import { initI18n, t } from "@/lib/i18n";
import { createLogger, initLogger } from "@/lib/logger";
import { getSettings, saveSettings } from "@/lib/storage/storage";
import { openAIContextModal } from "./popup-ai-context-modal";
import { sendToActiveTab } from "./popup-messaging";

const log = createLogger("Popup");

// ── State ────────────────────────────────────────────────────────────────────

let pageUrl = "";

// ── Render ───────────────────────────────────────────────────────────────────

function render(isActive: boolean): void {
  const shortUrl = pageUrl
    ? pageUrl
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .slice(0, 35)
    : "—";

  document.body.innerHTML = `
    <div class="popup-container">

      <header class="popup-header">
        <div class="brand-wrap">
          <div class="brand-logo" aria-hidden="true">
            <span class="material-icons-round">auto_awesome</span>
          </div>
          <div class="brand-info">
            <span class="popup-logo">Fill All</span>
            <span class="brand-url" title="${pageUrl}">${shortUrl}</span>
          </div>
        </div>

        <div class="header-controls">
          <div class="toggle-wrap" title="${t("showFieldIcon")}">
            <span id="toggle-label" class="toggle-label${isActive ? " is-on" : ""}">${isActive ? "ON" : "OFF"}</span>
            <label class="toggle" for="toggle-popup-active" aria-label="${t("showFieldIcon")}">
              <input id="toggle-popup-active" type="checkbox" ${isActive ? "checked" : ""} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button id="btn-close-popup" class="icon-btn" title="${t("fpClose")}" aria-label="${t("fpClose")}">
            <span class="material-icons-round">close</span>
          </button>
        </div>
      </header>

      <div id="status" class="status" style="display:none"></div>

      <div class="popup-body">

        <button id="btn-fill-all" class="btn-fill-primary">
          <span class="material-icons-round" aria-hidden="true">dynamic_form</span>
          ${t("fillAll")}
        </button>

        <div class="actions-row">
          <button id="btn-fill-empty" class="action-tile">
            <span class="material-icons-round" aria-hidden="true">filter_alt</span>
            ${t("fillOnlyEmpty")}
          </button>
          <button id="btn-fill-ai" class="action-tile">
            <span class="material-icons-round" aria-hidden="true">smart_toy</span>
            ${t("fillContextualAI")}
          </button>
        </div>

        <section class="quick-section" aria-labelledby="quick-title">
          <div id="quick-title" class="section-label">${t("quickShortcuts")}</div>
          <div class="quick-grid">
            <button class="quick-btn" data-quick="cpf">
              <span class="material-icons-round" aria-hidden="true">badge</span>
              ${t("quickFieldCpf")}
            </button>
            <button class="quick-btn" data-quick="cnpj">
              <span class="material-icons-round" aria-hidden="true">business</span>
              ${t("quickFieldCnpj")}
            </button>
            <button class="quick-btn" data-quick="nome">
              <span class="material-icons-round" aria-hidden="true">person</span>
              ${t("quickFieldName")}
            </button>
            <button class="quick-btn" data-quick="telefone">
              <span class="material-icons-round" aria-hidden="true">phone</span>
              ${t("quickFieldPhone")}
            </button>
            <button class="quick-btn" data-quick="cep">
              <span class="material-icons-round" aria-hidden="true">location_on</span>
              ${t("quickFieldCep")}
            </button>
          </div>
        </section>

        <div class="devtools-hint">
          <span class="material-icons-round devtools-hint__icon" aria-hidden="true">code</span>
          <div class="devtools-hint__text">
            ${t("devtoolsHint")}
          </div>
          <button id="btn-open-devtools" class="devtools-hint__btn">
            <span class="material-icons-round" aria-hidden="true">terminal</span>
            ${t("devtoolsOpen")}
            <kbd>F12</kbd>
          </button>
        </div>

      </div>

      <footer class="popup-footer">
        <button id="btn-learn-more" class="footer-btn footer-btn--ghost">
          <span class="material-icons-round" aria-hidden="true">info</span>
          ${t("btnAbout")}
        </button>
        <button id="btn-settings" class="footer-btn" title="${t("btnSettings")}" aria-label="${t("btnSettings")}">
          <span class="material-icons-round" aria-hidden="true">settings</span>
          ${t("btnSettings")}
        </button>
      </footer>

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

function setButtonLoading(btn: HTMLButtonElement, loading: boolean): void {
  btn.disabled = loading;
  btn.classList.toggle("is-loading", loading);
}

async function doSend(
  message: import("@/types").ExtensionMessage,
  btn: HTMLButtonElement,
): Promise<void> {
  setButtonLoading(btn, true);
  try {
    await sendToActiveTab(message);
  } catch (err) {
    log.warn("Failed to send message:", err);
  } finally {
    setButtonLoading(btn, false);
  }
}

async function getFieldIconState(): Promise<boolean> {
  try {
    const settings = await getSettings();
    return settings.showFieldIcon !== false;
  } catch (err) {
    log.warn("Falha ao ler showFieldIcon:", err);
    return true;
  }
}

async function saveFieldIconState(enabled: boolean): Promise<void> {
  try {
    await saveSettings({ showFieldIcon: enabled });
    await sendToActiveTab({ type: "TOGGLE_FIELD_ICON", payload: enabled });
  } catch (err) {
    log.warn("Falha ao salvar showFieldIcon:", err);
  }
}

function updateToggleLabel(isActive: boolean): void {
  const label = document.getElementById("toggle-label");
  if (label) {
    label.textContent = isActive ? "ON" : "OFF";
    label.classList.toggle("is-on", isActive);
  }
}

async function copyTextToClipboard(value: string): Promise<boolean> {
  if (!value) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "true");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      const copied = document.execCommand("copy");
      temp.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function getQuickValue(kind: string): string | null {
  switch (kind) {
    case "cpf":
      return generateCpf(true);
    case "cnpj":
      return generateCnpj(true);
    case "nome":
      return generateFullName();
    case "telefone":
      return generatePhone(true, true);
    case "cep":
      return generateCep(true);
    default:
      return null;
  }
}

function bindHandlers(initialActive: boolean): void {
  const toggle = document.getElementById(
    "toggle-popup-active",
  ) as HTMLInputElement | null;
  toggle?.addEventListener("change", () => {
    const enabled = toggle.checked;
    updateToggleLabel(enabled);
    void saveFieldIconState(enabled);
  });

  document
    .getElementById("btn-close-popup")
    ?.addEventListener("click", () => window.close());

  const btnFillAll = document.getElementById(
    "btn-fill-all",
  ) as HTMLButtonElement | null;
  btnFillAll?.addEventListener("click", async () => {
    await doSend({ type: "FILL_ALL_FIELDS" }, btnFillAll);
  });

  const btnFillAi = document.getElementById(
    "btn-fill-ai",
  ) as HTMLButtonElement | null;
  btnFillAi?.addEventListener("click", async () => {
    const context = await openAIContextModal();
    if (context === null) return;
    await doSend({ type: "FILL_CONTEXTUAL_AI", payload: context }, btnFillAi);
  });

  const btnFillEmpty = document.getElementById(
    "btn-fill-empty",
  ) as HTMLButtonElement | null;
  btnFillEmpty?.addEventListener("click", async () => {
    await doSend(
      { type: "FILL_ALL_FIELDS", payload: { fillEmptyOnly: true } },
      btnFillEmpty,
    );
  });

  document
    .getElementById("btn-open-devtools")
    ?.addEventListener("click", () => {
      void chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => {
          if (tab?.windowId != null) {
            void chrome.windows.update(tab.windowId, { focused: true });
          }
        })
        .finally(() => window.close());
    });

  document.getElementById("btn-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById("btn-learn-more")?.addEventListener("click", () => {
    void chrome.tabs.create({
      url: "https://github.com/marcuspmd/fill-all/blob/master/README.md",
    });
  });

  document
    .querySelectorAll<HTMLButtonElement>(".quick-btn[data-quick]")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const quickKind = btn.dataset.quick;
        if (!quickKind) return;

        const generated = getQuickValue(quickKind);
        if (!generated) {
          showStatus(t("quickShortcutNotAvailable"), true);
          return;
        }

        const ok = await copyTextToClipboard(generated);
        if (!ok) {
          showStatus(t("quickShortcutCopyFailed"), true);
          return;
        }

        showStatus(`${generated} — ${t("quickShortcutCopied")}`);
      });
    });
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await initLogger();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  pageUrl = tab?.url ?? "";

  const settings = await getSettings().catch(() => null);
  await initI18n(settings?.uiLanguage ?? "auto");
  const showIcon = settings?.showFieldIcon !== false;

  render(showIcon);
  bindHandlers(showIcon);

  log.debug("Popup init, url:", pageUrl);
}

void init();
