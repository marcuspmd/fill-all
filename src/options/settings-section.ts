/**
 * Settings tab — load/save settings, field icon config, detection pipeline, Chrome AI status.
 */

import type { DetectionStrategyEntry, Settings } from "@/types";
import { DEFAULT_DETECTION_PIPELINE } from "@/types";
import { escapeHtml, showToast } from "./shared";

// ── Detection Pipeline ────────────────────────────────────────────────────────

const STRATEGY_LABELS: Record<string, string> = {
  "html-type": "Tipo HTML",
  keyword: "Palavras-chave",
  tensorflow: "TensorFlow.js (ML)",
  "chrome-ai": "Chrome AI (Gemini Nano)",
  "html-fallback": "Fallback HTML",
};

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  "html-type":
    "Detecção determinística por type/tag HTML (email, number, date…)",
  keyword: "Detecção por palavras-chave no nome/id/label (cpf, cnpj, nome…)",
  tensorflow: "Classificação por modelo de ML com n-gramas de caractere",
  "chrome-ai":
    "Geração via Gemini Nano embutido no Chrome (requer Chrome 131+)",
  "html-fallback":
    "Fallback final: mapeamento básico de input[type] → FieldType",
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
    autoFillOnLoad: (
      document.getElementById("setting-auto-fill") as HTMLInputElement
    ).checked,
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
    showPanel: (
      document.getElementById("setting-show-panel") as HTMLInputElement
    ).checked,
    debugLog: (document.getElementById("setting-debug-log") as HTMLInputElement)
      .checked,
    logLevel: (
      document.getElementById("setting-log-level") as HTMLSelectElement
    ).value as Settings["logLevel"],
  };
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: settings,
  });
  showToast("Salvo automaticamente");
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
  showToast("Salvo automaticamente");
}

async function saveStrategiesSettings(): Promise<void> {
  const pipeline = getPipelineFromDOM();
  await chrome.runtime.sendMessage({
    type: "SAVE_SETTINGS",
    payload: { detectionPipeline: pipeline } as Partial<Settings>,
  });
  showToast("Salvo automaticamente");
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
  if (!list) return;

  list.innerHTML = "";

  pipeline.forEach((entry, idx) => {
    const item = document.createElement("div");
    item.className = "strategy-item";
    item.draggable = true;
    item.dataset.idx = String(idx);

    item.innerHTML = `
      <span class="strategy-drag-handle" title="Arraste para reordenar">⠿</span>
      <div class="strategy-info">
        <span class="strategy-name">${escapeHtml(STRATEGY_LABELS[entry.name] ?? entry.name)}</span>
        <span class="strategy-desc">${escapeHtml(STRATEGY_DESCRIPTIONS[entry.name] ?? "")}</span>
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
  });
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
    statusText.innerHTML = `<strong style="color: var(--danger)">Chrome AI não disponível.</strong> Requer Chrome 131+ com a flag <code>#prompt-api-for-gemini-nano</code> ativada em <code>chrome://flags</code>.`;
    if (downloadBtn) downloadBtn.style.display = "none";
    return;
  }

  try {
    const result = await LanguageModel.availability?.({ outputLanguage: "en" });
    if (result === "available") {
      statusText.innerHTML = `<strong style="color: var(--success)">✅ Chrome AI disponível e pronto para uso.</strong>`;
      if (downloadBtn) downloadBtn.style.display = "none";
    } else if (result === "downloadable") {
      statusText.innerHTML = `<strong style="color: #f59e0b">⚠️ Chrome AI disponível mas o modelo precisa ser baixado.</strong>`;
      if (downloadBtn) downloadBtn.style.display = "";
    } else {
      statusText.innerHTML = `<strong style="color: var(--text-muted)">Chrome AI status: <code>${String(result ?? "desconhecido")}</code>.</strong>`;
      if (downloadBtn) downloadBtn.style.display = "none";
    }
  } catch {
    statusText.innerHTML = `<strong style="color: var(--danger)">Erro ao verificar Chrome AI.</strong>`;
    if (downloadBtn) downloadBtn.style.display = "none";
  }
}

// ── Settings Load / Save ──────────────────────────────────────────────────────

async function loadSettings(): Promise<void> {
  const settings = (await chrome.runtime.sendMessage({
    type: "GET_SETTINGS",
  })) as Settings;

  (document.getElementById("setting-auto-fill") as HTMLInputElement).checked =
    settings.autoFillOnLoad;
  (document.getElementById("setting-highlight") as HTMLInputElement).checked =
    settings.highlightFilled;
  (
    document.getElementById("setting-cache-enabled") as HTMLInputElement
  ).checked = settings.cacheEnabled ?? true;
  (document.getElementById("setting-strategy") as HTMLSelectElement).value =
    settings.defaultStrategy;
  (document.getElementById("setting-locale") as HTMLSelectElement).value =
    settings.locale;

  // Panel setting
  (document.getElementById("setting-show-panel") as HTMLInputElement).checked =
    settings.showPanel ?? false;

  // Debug logging settings
  (document.getElementById("setting-debug-log") as HTMLInputElement).checked =
    settings.debugLog ?? false;
  (document.getElementById("setting-log-level") as HTMLSelectElement).value =
    settings.logLevel ?? "warn";

  // Field icon settings
  (
    document.getElementById("setting-show-field-icon") as HTMLInputElement
  ).checked = settings.showFieldIcon ?? true;
  (
    document.getElementById("setting-field-icon-position") as HTMLSelectElement
  ).value = settings.fieldIconPosition ?? "inside";

  // Detection pipeline
  renderStrategyList(settings.detectionPipeline ?? DEFAULT_DETECTION_PIPELINE);
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
    "setting-debug-log",
    "setting-log-level",
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

  document
    .getElementById("btn-download-chrome-ai")
    ?.addEventListener("click", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const LanguageModel = (globalThis as any).LanguageModel as
        | { create?: () => Promise<unknown> }
        | undefined;
      if (!LanguageModel?.create) return;
      try {
        await LanguageModel.create();
        void checkChromeAiStatus();
        showToast("Download do modelo Chrome AI iniciado!");
      } catch (err) {
        showToast(
          `Erro ao iniciar download: ${err instanceof Error ? err.message : String(err)}`,
          "error",
        );
      }
    });
}

export function initSettingsTab(): void {
  bindSettingsEvents();
  void loadSettings();
}
