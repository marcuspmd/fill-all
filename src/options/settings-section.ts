/**
 * Settings tab — load/save settings, field icon config, detection pipeline, Chrome AI status.
 */

import type { DetectionStrategyEntry, Settings } from "@/types";
import { DEFAULT_DETECTION_PIPELINE } from "@/types";
import { t, initI18n, localizeHTML } from "@/lib/i18n";
import { escapeHtml, showToast } from "./shared";

// ── Detection Pipeline ────────────────────────────────────────────────────────

const STRATEGY_LABEL_KEYS: Record<string, string> = {
  "html-type": "strategyHtmlType",
  keyword: "strategyKeyword",
  tensorflow: "strategyTensorflow",
  "chrome-ai": "strategyChromeAi",
  "html-fallback": "strategyHtmlFallback",
};

const STRATEGY_DESC_KEYS: Record<string, string> = {
  "html-type": "strategyHtmlTypeDesc",
  keyword: "strategyKeywordDesc",
  tensorflow: "strategyTensorflowDesc",
  "chrome-ai": "strategyChromeAiDesc",
  "html-fallback": "strategyHtmlFallbackDesc",
};

let _dragSrcIdx: number | null = null;

// ── Debounce ─────────────────────────────────────────────────────────────────

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

// ── Auto-save helpers ─────────────────────────────────────────────────────────

async function saveGeneralSettings(): Promise<void> {
  const settings: Partial<Settings> = {
    highlightFilled: (
      document.getElementById("setting-highlight") as HTMLInputElement
    ).checked,
    cacheEnabled: (
      document.getElementById("setting-cache-enabled") as HTMLInputElement
    ).checked,
    defaultStrategy: (
      document.getElementById("setting-strategy") as HTMLSelectElement
    )?.value as Settings["defaultStrategy"],
    locale: (document.getElementById("setting-locale") as HTMLSelectElement)
      ?.value as Settings["locale"],
    fillEmptyOnly: (
      document.getElementById("setting-fill-empty-only") as HTMLInputElement
    ).checked,
    debugLog: (document.getElementById("setting-debug-log") as HTMLInputElement)
      .checked,
    logLevel: (
      document.getElementById("setting-log-level") as HTMLSelectElement
    ).value as Settings["logLevel"],
    logMaxEntries: Math.min(
      10000,
      Math.max(
        100,
        Number(
          (
            document.getElementById(
              "setting-log-max-entries",
            ) as HTMLInputElement
          ).value,
        ) || 1000,
      ),
    ),
  };
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: settings,
  });
  showToast(t("savedAuto"));
}

async function saveFieldIconSettings(): Promise<void> {
  const settings: Partial<Settings> = {
    showFieldIcon: (
      document.getElementById("setting-show-field-icon") as HTMLInputElement
    ).checked,
    fieldIconPosition: (
      document.getElementById(
        "setting-field-icon-position",
      ) as HTMLSelectElement
    ).value as Settings["fieldIconPosition"],
  };
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: settings,
  });
  showToast(t("savedAuto"));
}

async function saveWatcherSettings(): Promise<void> {
  const settings: Partial<Settings> = {
    watcherEnabled: (
      document.getElementById("setting-watcher-enabled") as HTMLInputElement
    ).checked,
    watcherAutoRefill: (
      document.getElementById("setting-watcher-auto-refill") as HTMLInputElement
    ).checked,
    watcherShadowDOM: (
      document.getElementById("setting-watcher-shadow-dom") as HTMLInputElement
    ).checked,
    watcherDebounceMs: Math.min(
      5000,
      Math.max(
        100,
        Number(
          (
            document.getElementById(
              "setting-watcher-debounce",
            ) as HTMLInputElement
          ).value,
        ) || 600,
      ),
    ),
  };
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: settings,
  });
  showToast(t("savedAuto"));
}

async function saveStrategiesSettings(): Promise<void> {
  const pipeline = getPipelineFromDOM();
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: { detectionPipeline: pipeline } as Partial<Settings>,
  });
  showToast(t("savedAuto"));
}

function getPipelineFromDOM(): DetectionStrategyEntry[] {
  const list = document.getElementById("strategy-list");
  if (!list) return [];
  return Array.from(list.querySelectorAll<HTMLElement>(".strategy-item")).map(
    (item) => {
      const toggle = item.querySelector<HTMLInputElement>(".strategy-toggle");
      return {
        name: toggle?.dataset.name ?? "",
        enabled: toggle?.checked ?? true,
      };
    },
  );
}

function renderStrategyList(pipeline: DetectionStrategyEntry[]): void {
  const list = document.getElementById("strategy-list");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  pipeline.forEach((entry, idx) => {
    const item = document.createElement("div");
    item.className = "strategy-item";
    item.draggable = true;
    item.dataset.idx = String(idx);

    item.innerHTML = `
      <span class="strategy-drag-handle" title="${escapeHtml(t("dragToReorder"))}">⠿</span>
      <div class="strategy-info">
        <span class="strategy-name">${escapeHtml(t(STRATEGY_LABEL_KEYS[entry.name] ?? entry.name))}</span>
        <span class="strategy-desc">${escapeHtml(t(STRATEGY_DESC_KEYS[entry.name] ?? ""))}</span>
      </div>
      <label class="toggle" style="flex-shrink: 0;">
        <input type="checkbox" class="strategy-toggle" data-name="${escapeHtml(entry.name)}" ${entry.enabled ? "checked" : ""} />
        <span class="slider"></span>
      </label>
    `;

    item.addEventListener("dragstart", (e) => {
      _dragSrcIdx = idx;
      item.classList.add("dragging");
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      _dragSrcIdx = null;
      list
        .querySelectorAll(".strategy-item")
        .forEach((el) => el.classList.remove("drag-over"));
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      item.classList.add("drag-over");
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      if (_dragSrcIdx === null || _dragSrcIdx === idx) return;
      const current = getPipelineFromDOM();
      const [dragged] = current.splice(_dragSrcIdx, 1);
      current.splice(idx, 0, dragged);
      renderStrategyList(current);
      void saveStrategiesSettings();
    });

    const toggle = item.querySelector<HTMLInputElement>(".strategy-toggle");
    toggle?.addEventListener("change", () => {
      void saveStrategiesSettings();
    });

    list.appendChild(item);
    console.log(`[renderStrategyList] Item ${idx} adicionado ao DOM`);
  });
  console.log(
    `[renderStrategyList] Renderização completa! Total de itens: ${pipeline.length}`,
  );
}

// ── Chrome AI Status ──────────────────────────────────────────────────────────

async function checkChromeAiStatus(): Promise<void> {
  const block = document.getElementById("chrome-ai-status-block");
  const statusText = document.getElementById("chrome-ai-status-text");
  const downloadBtn = document.getElementById(
    "btn-download-chrome-ai",
  ) as HTMLButtonElement | null;

  if (!block || !statusText) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LanguageModel = (globalThis as any).LanguageModel as
    | {
        availability?: (opts?: unknown) => Promise<string>;
        create?: () => Promise<unknown>;
      }
    | undefined;

  block.style.display = "block";

  if (!LanguageModel) {
    statusText.innerHTML = `<strong style="color: var(--danger)">${t("chromeAiNotAvailableHtml")}</strong>`;
    if (downloadBtn) downloadBtn.style.display = "none";
    return;
  }

  try {
    const result = await LanguageModel.availability?.({ outputLanguage: "en" });
    if (result === "available") {
      statusText.innerHTML = `<strong style="color: var(--success)">✅ ${t("chromeAiReady")}</strong>`;
      if (downloadBtn) downloadBtn.style.display = "none";
    } else if (result === "downloadable") {
      statusText.innerHTML = `<strong style="color: #f59e0b">⚠️ ${t("chromeAiDownloadable")}</strong>`;
      if (downloadBtn) downloadBtn.style.display = "";
    } else {
      statusText.innerHTML = `<strong style="color: var(--text-muted)">${escapeHtml(t("chromeAiStatusHtml", [String(result ?? "desconhecido")]))}</strong>`;
      if (downloadBtn) downloadBtn.style.display = "none";
    }
  } catch {
    statusText.innerHTML = `<strong style="color: var(--danger)">${t("chromeAiCheckError")}</strong>`;
    if (downloadBtn) downloadBtn.style.display = "none";
  }
}

// ── Settings Load / Save ──────────────────────────────────────────────────────

async function loadSettings(): Promise<void> {
  const settings = (await chrome.runtime.sendMessage({
    type: "GET_SETTINGS",
  })) as Settings;
  (document.getElementById("setting-highlight") as HTMLInputElement).checked =
    settings.highlightFilled;

  // Fill empty only
  (
    document.getElementById("setting-fill-empty-only") as HTMLInputElement
  ).checked = settings.fillEmptyOnly ?? false;

  // Debug logging settings
  (document.getElementById("setting-debug-log") as HTMLInputElement).checked =
    settings.debugLog ?? false;
  (document.getElementById("setting-log-level") as HTMLSelectElement).value =
    settings.logLevel ?? "warn";
  (
    document.getElementById("setting-log-max-entries") as HTMLInputElement
  ).value = String(settings.logMaxEntries ?? 1000);

  // Field icon settings
  (
    document.getElementById("setting-show-field-icon") as HTMLInputElement
  ).checked = settings.showFieldIcon ?? true;
  (
    document.getElementById("setting-field-icon-position") as HTMLSelectElement
  ).value = settings.fieldIconPosition ?? "inside";

  // Locale and UI language
  const localeEl = document.getElementById(
    "setting-locale",
  ) as HTMLSelectElement | null;
  if (localeEl) localeEl.value = settings.locale ?? "pt-BR";

  const uiLangEl = document.getElementById(
    "setting-ui-language",
  ) as HTMLSelectElement | null;
  if (uiLangEl) uiLangEl.value = settings.uiLanguage ?? "auto";

  // Watcher settings
  (
    document.getElementById("setting-watcher-enabled") as HTMLInputElement
  ).checked = settings.watcherEnabled ?? false;
  (
    document.getElementById("setting-watcher-auto-refill") as HTMLInputElement
  ).checked = settings.watcherAutoRefill ?? false;
  (
    document.getElementById("setting-watcher-shadow-dom") as HTMLInputElement
  ).checked = settings.watcherShadowDOM ?? false;
  (
    document.getElementById("setting-watcher-debounce") as HTMLInputElement
  ).value = String(settings.watcherDebounceMs ?? 600);

  // Detection pipeline
  renderStrategyList(settings.detectionPipeline ?? DEFAULT_DETECTION_PIPELINE);
  console.log("[loadSettings] Estratégias renderizadas");
  void checkChromeAiStatus();
}

function bindSettingsEvents(): void {
  const debouncedSaveGeneral = debounce(() => {
    void saveGeneralSettings();
  }, 300);
  const debouncedSaveFieldIcon = debounce(() => {
    void saveFieldIconSettings();
  }, 300);

  // General settings — auto-save on any change
  for (const id of [
    "setting-auto-fill",
    "setting-highlight",
    "setting-cache-enabled",
    "setting-show-panel",
    "setting-fill-empty-only",
    "setting-debug-log",
    "setting-log-level",
    "setting-log-max-entries",
    "setting-strategy",
    "setting-locale",
  ]) {
    document
      .getElementById(id)
      ?.addEventListener("change", debouncedSaveGeneral);
  }

  // Field icon — auto-save on any change
  document
    .getElementById("setting-show-field-icon")
    ?.addEventListener("change", debouncedSaveFieldIcon);
  document
    .getElementById("setting-field-icon-position")
    ?.addEventListener("change", debouncedSaveFieldIcon);

  // Watcher — auto-save on any change
  const debouncedSaveWatcher = debounce(() => {
    void saveWatcherSettings();
  }, 300);
  for (const id of [
    "setting-watcher-enabled",
    "setting-watcher-auto-refill",
    "setting-watcher-shadow-dom",
    "setting-watcher-debounce",
  ]) {
    const el = document.getElementById(id);
    el?.addEventListener("change", debouncedSaveWatcher);
    if (el?.tagName === "INPUT" && (el as HTMLInputElement).type === "number") {
      el.addEventListener("input", debouncedSaveWatcher);
    }
  }

  // UI language — dedicated handler that re-localises the page
  document
    .getElementById("setting-ui-language")
    ?.addEventListener("change", async (e) => {
      const lang = (e.target as HTMLSelectElement)
        .value as Settings["uiLanguage"];
      await chrome.runtime.sendMessage({
        type: "SAVE_SETTINGS",
        payload: { uiLanguage: lang } as Partial<Settings>,
      });
      await initI18n(lang);
      localizeHTML();
      void loadSettings(); // re-render strategy list and other dynamic content
      showToast(t("uiLanguageChanged"));
    });

  document
    .getElementById("btn-download-chrome-ai")
    ?.addEventListener("click", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const LanguageModel = (globalThis as any).LanguageModel as
        | { create?: (opts?: { outputLanguage?: string }) => Promise<unknown> }
        | undefined;
      if (!LanguageModel?.create) return;
      try {
        await LanguageModel.create({ outputLanguage: "en" });
        void checkChromeAiStatus();
        showToast(t("chromeAiDownloadStart"));
      } catch (err) {
        showToast(
          t("chromeAiDownloadError", [
            err instanceof Error ? err.message : String(err),
          ]),
          "error",
        );
      }
    });
}

export function initSettingsTab(): void {
  bindSettingsEvents();
  void loadSettings();
}
