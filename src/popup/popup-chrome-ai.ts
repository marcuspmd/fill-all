/**
 * Popup — Chrome AI status banner
 */

import { t } from "@/lib/i18n";

export async function initChromeAIStatus(): Promise<void> {
  const banner = document.getElementById("chrome-ai-banner");
  const iconEl = document.getElementById("chrome-ai-icon");
  const textEl = document.getElementById("chrome-ai-text");
  const actionsEl = document.getElementById("chrome-ai-actions");
  if (!banner || !iconEl || !textEl || !actionsEl) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newApi = (globalThis as any).LanguageModel as
    | LanguageModelStatic
    | undefined;

  const openSetupPage = (): void => {
    chrome.tabs.create({
      url: "https://developer.chrome.com/docs/ai/get-started",
    });
  };

  const makeLinkBtn = (label: string): HTMLButtonElement => {
    const btn = document.createElement("button");
    btn.className = "btn btn-ai-action btn-ai-link";
    btn.textContent = label;
    btn.addEventListener("click", openSetupPage);
    return btn;
  };

  if (!newApi) {
    banner.className = "chrome-ai-banner chrome-ai-banner--unavailable";
    iconEl.textContent = "🤖";
    textEl.textContent = t("chromeAiUnavailable");
    actionsEl.appendChild(makeLinkBtn(t("chromeAiSetupLink")));
    banner.style.display = "flex";
    return;
  }

  try {
    let availability: string;
    if (newApi) {
      availability = await newApi.availability({
        outputLanguage: "en",
      });
    } else {
      availability = "unavailable";
    }

    if (availability === "available") {
      banner.className = "chrome-ai-banner chrome-ai-banner--ready";
      iconEl.textContent = "🤖";
      textEl.textContent = t("chromeAiReady");
      banner.style.display = "flex";
    } else if (
      availability === "downloadable" ||
      availability === "downloading"
    ) {
      banner.className = "chrome-ai-banner chrome-ai-banner--download";
      iconEl.textContent = "🤖";
      textEl.textContent =
        availability === "downloading"
          ? t("chromeAiDownloading")
          : t("chromeAiDownloadable");

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "btn btn-ai-action btn-ai-download";
      downloadBtn.textContent = t("chromeAiDownloadNow");
      downloadBtn.addEventListener("click", async () => {
        downloadBtn.disabled = true;
        downloadBtn.textContent = t("chromeAiDownloadingBtn");
        try {
          const session = await newApi!.create({ outputLanguage: "en" });
          session.destroy();
          banner.className = "chrome-ai-banner chrome-ai-banner--ready";
          iconEl.textContent = "🤖";
          textEl.textContent = t("chromeAiDownloaded");
          actionsEl.innerHTML = "";
        } catch {
          downloadBtn.disabled = false;
          downloadBtn.textContent = t("chromeAiDownloadNow");
          textEl.textContent = t("chromeAiDownloadFailed");
          actionsEl.appendChild(makeLinkBtn(t("chromeAiSetupLink")));
        }
      });

      actionsEl.appendChild(downloadBtn);
      actionsEl.appendChild(makeLinkBtn(t("chromeAiSetupLink")));
      banner.style.display = "flex";
    } else {
      banner.className = "chrome-ai-banner chrome-ai-banner--unavailable";
      iconEl.textContent = "🤖";
      textEl.textContent = t("chromeAiNotSupported");
      actionsEl.appendChild(makeLinkBtn(t("chromeAiRequirementsLink")));
      banner.style.display = "flex";
    }
  } catch {
    // Silently skip if capabilities check fails
  }
}
