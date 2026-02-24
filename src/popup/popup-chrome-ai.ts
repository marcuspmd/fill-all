/**
 * Popup — Chrome AI status banner
 */

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
    textEl.textContent = "Chrome AI não disponível neste navegador.";
    actionsEl.appendChild(makeLinkBtn("Como configurar →"));
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
      textEl.textContent = "Chrome AI ativo e pronto.";
      banner.style.display = "flex";
    } else if (
      availability === "downloadable" ||
      availability === "downloading"
    ) {
      banner.className = "chrome-ai-banner chrome-ai-banner--download";
      iconEl.textContent = "🤖";
      textEl.textContent =
        availability === "downloading"
          ? "Chrome AI está sendo baixado…"
          : "Chrome AI disponível, mas o modelo precisa ser baixado.";

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "btn btn-ai-action btn-ai-download";
      downloadBtn.textContent = "⬇️ Baixar agora";
      downloadBtn.addEventListener("click", async () => {
        downloadBtn.disabled = true;
        downloadBtn.textContent = "⏳ Baixando…";
        try {
          const session = await newApi!.create({ outputLanguage: "en" });
          session.destroy();
          banner.className = "chrome-ai-banner chrome-ai-banner--ready";
          iconEl.textContent = "🤖";
          textEl.textContent = "Chrome AI baixado com sucesso!";
          actionsEl.innerHTML = "";
        } catch {
          downloadBtn.disabled = false;
          downloadBtn.textContent = "⬇️ Baixar agora";
          textEl.textContent = "Falha ao iniciar download. Tente manualmente.";
          actionsEl.appendChild(makeLinkBtn("Como configurar →"));
        }
      });

      actionsEl.appendChild(downloadBtn);
      actionsEl.appendChild(makeLinkBtn("Como configurar →"));
      banner.style.display = "flex";
    } else {
      banner.className = "chrome-ai-banner chrome-ai-banner--unavailable";
      iconEl.textContent = "🤖";
      textEl.textContent =
        "Chrome AI não suportado neste dispositivo ou canal.";
      actionsEl.appendChild(makeLinkBtn("Ver requisitos →"));
      banner.style.display = "flex";
    }
  } catch {
    // Silently skip if capabilities check fails
  }
}
