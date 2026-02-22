/**
 * Options page script
 */

import "./options.css";
import type {
  DetectionStrategyEntry,
  FieldDetectionCacheEntry,
  FieldRule,
  FieldType,
  SavedForm,
  Settings,
} from "@/types";
import { DEFAULT_DETECTION_PIPELINE } from "@/types";
import type { RetrainResult } from "@/lib/ai/learning-store";
import type { DatasetEntry } from "@/lib/dataset/runtime-dataset";
import type {
  TrainingProgress,
  TrainingResult,
  TrainingMeta,
} from "@/lib/ai/runtime-trainer";
import { trainModelFromDataset } from "@/lib/ai/runtime-trainer";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function initTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(".tab"));
  const contents = Array.from(
    document.querySelectorAll<HTMLElement>(".tab-content"),
  );

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const t of tabs) t.classList.remove("active");
      for (const c of contents) c.classList.remove("active");

      tab.classList.add("active");
      const tabId = tab.dataset.tab;
      if (!tabId) return;
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add("active");
    });
  }
}

// --- Settings ---

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

document
  .getElementById("btn-save-settings")
  ?.addEventListener("click", async () => {
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
      ).value as Settings["defaultStrategy"],
      locale: (document.getElementById("setting-locale") as HTMLSelectElement)
        .value as Settings["locale"],
      debugLog: (
        document.getElementById("setting-debug-log") as HTMLInputElement
      ).checked,
      logLevel: (
        document.getElementById("setting-log-level") as HTMLSelectElement
      ).value as Settings["logLevel"],
    };

    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: settings,
    });
    showToast("Configurações salvas!");
  });

// --- Field Icon Settings ---

document
  .getElementById("btn-save-field-icon")
  ?.addEventListener("click", async () => {
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
    showToast("Configurações do ícone salvas!");
  });

// --- Detection Strategies ---

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
    });

    list.appendChild(item);
  });
}

document
  .getElementById("btn-save-strategies")
  ?.addEventListener("click", async () => {
    const pipeline = getPipelineFromDOM();
    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: { detectionPipeline: pipeline } as Partial<Settings>,
    });
    showToast("Estratégias salvas!");
  });

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

// --- Rules ---

async function loadRules(): Promise<void> {
  const rules = (await chrome.runtime.sendMessage({
    type: "GET_RULES",
  })) as FieldRule[];
  const list = document.getElementById("rules-list");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(rules) || rules.length === 0) {
    list.innerHTML = '<div class="empty">Nenhuma regra cadastrada</div>';
    return;
  }

  for (const rule of rules) {
    const item = document.createElement("div");
    item.className = "rule-item";
    item.innerHTML = `
      <div class="rule-info">
        <strong>${escapeHtml(rule.urlPattern)}</strong>
        <span class="rule-selector">${escapeHtml(rule.fieldSelector)}</span>
        <span class="badge">${escapeHtml(rule.fieldType)}</span>
        ${rule.fixedValue ? `<span class="badge badge-fixed">Fixo: ${escapeHtml(rule.fixedValue)}</span>` : ""}
        <span class="rule-priority">Prioridade: ${rule.priority}</span>
      </div>
      <button class="btn btn-sm btn-delete" data-rule-id="${escapeHtml(rule.id)}">Excluir</button>
    `;

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DELETE_RULE",
        payload: rule.id,
      });
      await loadRules();
      showToast("Regra excluída");
    });

    list.appendChild(item);
  }
}

document
  .getElementById("btn-save-rule")
  ?.addEventListener("click", async () => {
    const urlPattern = (
      document.getElementById("rule-url") as HTMLInputElement
    ).value.trim();
    const fieldSelector = (
      document.getElementById("rule-selector") as HTMLInputElement
    ).value.trim();

    if (!urlPattern || !fieldSelector) {
      showToast("Preencha o padrão de URL e o seletor do campo", "error");
      return;
    }

    const rule: FieldRule = {
      id: generateId(),
      urlPattern,
      fieldSelector,
      fieldName:
        (
          document.getElementById("rule-field-name") as HTMLInputElement
        ).value.trim() || undefined,
      fieldType: (document.getElementById("rule-type") as HTMLSelectElement)
        .value as FieldType,
      generator: (
        document.getElementById("rule-generator") as HTMLSelectElement
      ).value as FieldRule["generator"],
      fixedValue:
        (
          document.getElementById("rule-fixed") as HTMLInputElement
        ).value.trim() || undefined,
      priority:
        parseInt(
          (document.getElementById("rule-priority") as HTMLInputElement).value,
          10,
        ) || 10,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await chrome.runtime.sendMessage({ type: "SAVE_RULE", payload: rule });
    await loadRules();

    // Clear form
    (document.getElementById("rule-url") as HTMLInputElement).value = "";
    (document.getElementById("rule-selector") as HTMLInputElement).value = "";
    (document.getElementById("rule-field-name") as HTMLInputElement).value = "";
    (document.getElementById("rule-fixed") as HTMLInputElement).value = "";

    showToast("Regra salva!");
  });

// --- Saved Forms ---

async function loadSavedForms(): Promise<void> {
  const forms = (await chrome.runtime.sendMessage({
    type: "GET_SAVED_FORMS",
  })) as SavedForm[];
  const list = document.getElementById("saved-forms-list");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(forms) || forms.length === 0) {
    list.innerHTML = '<div class="empty">Nenhum formulário salvo</div>';
    return;
  }

  for (const form of forms) {
    const item = document.createElement("div");
    item.className = "rule-item";
    item.innerHTML = `
      <div class="rule-info">
        <strong>${escapeHtml(form.name)}</strong>
        <span class="rule-selector">${escapeHtml(form.urlPattern)}</span>
        <span class="badge">${Object.keys(form.fields || {}).length} campos</span>
      </div>
      <button class="btn btn-sm btn-delete" data-form-id="${escapeHtml(form.id)}">Excluir</button>
    `;

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DELETE_FORM",
        payload: form.id,
      });
      await loadSavedForms();
      showToast("Formulário excluído");
    });

    list.appendChild(item);
  }
}

function showToast(
  message: string,
  type: "success" | "error" = "success",
): void {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// --- Cache & Learning ---

interface LearnedEntryView {
  signals: string;
  type: FieldType;
  timestamp: number;
}

async function loadFieldCache(): Promise<void> {
  const cache = (await chrome.runtime.sendMessage({
    type: "GET_FIELD_CACHE",
  })) as FieldDetectionCacheEntry[] | null;

  const list = document.getElementById("cache-list");
  if (!list) return;
  list.innerHTML = "";

  if (!Array.isArray(cache) || cache.length === 0) {
    list.innerHTML =
      '<div class="empty">Nenhum cache de campos detectados</div>';
    return;
  }

  const sorted = [...cache].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const entry of sorted) {
    const item = document.createElement("div");
    item.className = "rule-item";
    item.innerHTML = `
      <div class="rule-info">
        <strong>${escapeHtml(entry.hostname || entry.origin || entry.url)}</strong>
        <span class="rule-selector">${escapeHtml(entry.path || entry.url)}</span>
        <span class="badge">${entry.count} campos</span>
        <span class="rule-priority">Atualizado: ${new Date(entry.updatedAt).toLocaleString("pt-BR")}</span>
      </div>
      <button class="btn btn-sm btn-delete" data-cache-url="${escapeHtml(entry.url)}">Excluir</button>
    `;

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "DELETE_FIELD_CACHE",
        payload: entry.url,
      });
      await loadFieldCache();
      showToast("Cache removido");
    });

    list.appendChild(item);
  }
}

async function loadLearnedEntries(): Promise<void> {
  const learned = (await chrome.runtime.sendMessage({
    type: "GET_LEARNED_ENTRIES",
  })) as LearnedEntryView[] | null;

  const summary = document.getElementById("learning-summary");
  const list = document.getElementById("learned-list");
  if (!summary || !list) return;

  const items = Array.isArray(learned) ? learned : [];
  summary.textContent = `Entradas aprendidas: ${items.length}`;

  list.innerHTML = "";
  if (items.length === 0) {
    list.innerHTML = '<div class="empty">Nenhuma entrada aprendida</div>';
    return;
  }

  const preview = [...items]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);

  for (const entry of preview) {
    const item = document.createElement("div");
    item.className = "rule-item";
    item.innerHTML = `
      <div class="rule-info">
        <span class="badge">${escapeHtml(entry.type)}</span>
        <span class="rule-selector">${escapeHtml(entry.signals)}</span>
        <span class="rule-priority">${new Date(entry.timestamp).toLocaleString("pt-BR")}</span>
      </div>
    `;
    list.appendChild(item);
  }
}

document
  .getElementById("btn-refresh-cache")
  ?.addEventListener("click", async () => {
    await loadFieldCache();
    await loadLearnedEntries();
    showToast("Cache atualizado");
  });

document
  .getElementById("btn-clear-cache")
  ?.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "CLEAR_FIELD_CACHE" });
    await loadFieldCache();
    showToast("Cache limpo");
  });

document
  .getElementById("btn-clear-learning")
  ?.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "CLEAR_LEARNED_ENTRIES" });
    await loadLearnedEntries();
    showToast("Aprendizado limpo");
  });

document
  .getElementById("btn-export-rules-dataset")
  ?.addEventListener("click", async () => {
    const rules = (await chrome.runtime.sendMessage({
      type: "GET_RULES",
    })) as FieldRule[];

    if (!Array.isArray(rules) || rules.length === 0) {
      showToast("Nenhuma regra para exportar", "error");
      return;
    }

    const json = JSON.stringify(rules, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fill-all-rules.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(
      `${rules.length} regra(s) exportada(s). Execute: npm run import:rules fill-all-rules.json`,
    );
  });

document
  .getElementById("btn-retrain-learning")
  ?.addEventListener("click", async () => {
    const btn = document.getElementById(
      "btn-retrain-learning",
    ) as HTMLButtonElement;
    const logBox = document.getElementById(
      "retrain-log-box",
    ) as HTMLElement | null;
    const logPre = document.getElementById(
      "retrain-log",
    ) as HTMLPreElement | null;

    btn.disabled = true;
    btn.textContent = "Retreinando...";

    if (logBox) logBox.style.display = "none";
    if (logPre) logPre.textContent = "";

    const t0 = performance.now();

    try {
      const result = (await chrome.runtime.sendMessage({
        type: "RETRAIN_LEARNING_DATABASE",
      })) as (RetrainResult & { success?: boolean }) | null;

      const elapsed = Math.round(performance.now() - t0);

      await loadLearnedEntries();

      if (result && logPre && logBox) {
        const lines: string[] = [];
        lines.push("═══════════════════════════════════════════");
        lines.push("  RETREINO DE VETORES — RESULTADO DETALHADO");
        lines.push("═══════════════════════════════════════════");
        lines.push("");
        lines.push(`  Total de regras encontradas : ${result.totalRules}`);
        lines.push(`  Importadas com sucesso      : ${result.imported}`);
        lines.push(`  Ignoradas (sem signals)     : ${result.skipped}`);
        lines.push(
          `  Duração total               : ${result.durationMs ?? elapsed}ms`,
        );
        lines.push("");
        lines.push("─── O QUE FOI FEITO ───────────────────────");
        lines.push(
          "  ✔ Entradas anteriores de regras foram removidas (entradas orgânicas preservadas).",
        );
        lines.push(
          "  ✔ Regras convertidas em sinais e salvas como LearnedEntry.",
        );
        lines.push("  ✔ Abas abertas notificadas (INVALIDATE_CLASSIFIER).");
        lines.push("  ✔ Próxima classificação usará os novos vetores.");
        lines.push("");
        lines.push("─── O QUE NÃO FOI FEITO ───────────────────");
        lines.push("  ✗ Os pesos da rede neural TF.js NÃO foram alterados.");
        lines.push(
          "  ✗ Os arquivos model.json / *.bin NÃO foram substituídos.",
        );
        lines.push("  → Para retreinar o modelo neural: npm run train:model");
        lines.push("");

        if (result.details && result.details.length > 0) {
          lines.push("─── DETALHES POR REGRA ────────────────────");
          for (const d of result.details) {
            const icon = d.status === "imported" ? "✔" : "✗";
            const sig = d.signals ? `"${d.signals.slice(0, 60)}"` : "(vazio)";
            lines.push(
              `  ${icon} [${d.type.padEnd(14)}] ${d.selector.slice(0, 40)}`,
            );
            lines.push(`       signals: ${sig}`);
          }
          lines.push("");
        }

        lines.push("═══════════════════════════════════════════");

        logPre.textContent = lines.join("\n");
        logBox.style.display = "block";
      }

      showToast(
        `✅ ${result?.imported ?? 0} vetores atualizados de ${result?.totalRules ?? 0} regras (${result?.durationMs ?? elapsed}ms)`,
      );
    } finally {
      btn.disabled = false;
      btn.textContent = "🧠 Retreinar Vetores (Browser)";
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// --- Dataset & Training ---
// ─────────────────────────────────────────────────────────────────────────────

let _allDatasetEntries: DatasetEntry[] = [];

async function loadModelStatus(): Promise<void> {
  const statusText = document.getElementById("model-status-text");
  const deleteBtn = document.getElementById(
    "btn-delete-model",
  ) as HTMLButtonElement | null;
  if (!statusText) return;

  const result = (await chrome.runtime.sendMessage({
    type: "GET_RUNTIME_MODEL_META",
  })) as { exists: boolean; meta: TrainingMeta | null } | null;

  if (!result?.exists || !result.meta) {
    statusText.innerHTML = `
      <strong style="color: var(--text-muted)">Nenhum modelo treinado em runtime.</strong><br>
      Usando o modelo padrão empacotado com a extensão.
      Adicione entradas ao dataset e clique em <strong>Treinar Modelo</strong> para gerar um modelo personalizado.
    `;
    if (deleteBtn) deleteBtn.style.display = "none";
    return;
  }

  const m = result.meta;
  const dateStr = new Date(m.trainedAt).toLocaleString("pt-BR");
  const acc = (m.finalAccuracy * 100).toFixed(1);
  statusText.innerHTML = `
    <span style="color:#4ade80; font-weight:600;">✅ Modelo treinado em runtime ativo</span><br>
    Treinado em: <strong>${dateStr}</strong> &nbsp;|&nbsp;
    Acurácia: <strong>${acc}%</strong> &nbsp;|&nbsp;
    Épocas: <strong>${m.epochs}</strong><br>
    Amostras usadas: <strong>${m.entriesUsed}</strong> &nbsp;|&nbsp;
    Vocab: <strong>${m.vocabSize}</strong> n-gramas &nbsp;|&nbsp;
    Classes: <strong>${m.numClasses}</strong> &nbsp;|&nbsp;
    Duração: <strong>${m.durationMs}ms</strong>
  `;
  if (deleteBtn) deleteBtn.style.display = "";
}

async function loadDatasetList(filter = ""): Promise<void> {
  const list = document.getElementById("dataset-list");
  const badge = document.getElementById("dataset-count-badge");
  if (!list) return;

  const entries = filter
    ? _allDatasetEntries.filter(
        (e) =>
          e.signals.includes(filter.toLowerCase()) ||
          e.type.includes(filter.toLowerCase()),
      )
    : _allDatasetEntries;

  if (badge) badge.textContent = `${_allDatasetEntries.length} entradas`;

  list.innerHTML = "";

  if (entries.length === 0) {
    list.innerHTML = '<div class="empty">Nenhuma entrada no dataset</div>';
    return;
  }

  // Render up to 200 at a time for performance
  const visible = entries.slice(0, 200);

  const sourceLabel: Record<string, string> = {
    manual: "Manual",
    auto: "Auto",
    imported: "Importado",
    builtin: "Padrão",
  };
  const diffLabel: Record<string, string> = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
  };

  for (const entry of visible) {
    const item = document.createElement("div");
    item.className = "rule-item";
    item.style.cssText = "gap: 8px; align-items: center;";
    item.innerHTML = `
      <div class="rule-info" style="flex: 1; min-width: 0;">
        <span class="badge">${escapeHtml(entry.type)}</span>
        <span class="rule-selector" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 480px;" title="${escapeHtml(entry.signals)}">${escapeHtml(entry.signals)}</span>
        <span class="rule-priority" style="white-space: nowrap;">${sourceLabel[entry.source] ?? entry.source} · ${diffLabel[entry.difficulty] ?? entry.difficulty}</span>
      </div>
      <button class="btn btn-sm btn-delete" data-entry-id="${escapeHtml(entry.id)}" title="Remover entrada">✕</button>
    `;

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "REMOVE_DATASET_ENTRY",
        payload: entry.id,
      });
      _allDatasetEntries = _allDatasetEntries.filter((e) => e.id !== entry.id);
      const filterInput = document.getElementById(
        "dataset-filter",
      ) as HTMLInputElement | null;
      await loadDatasetList(filterInput?.value ?? "");
      if (badge) badge.textContent = `${_allDatasetEntries.length} entradas`;
      showToast("Entrada removida");
    });

    list.appendChild(item);
  }

  if (entries.length > 200) {
    const note = document.createElement("div");
    note.className = "empty";
    note.style.padding = "8px 0";
    note.textContent = `… e mais ${entries.length - 200} entradas (use o filtro para refinar)`;
    list.appendChild(note);
  }
}

/**
 * Imports built-in training samples directly from the options page context.
 * Avoids the unreliable dynamic import inside the service worker.
 */
async function seedBuiltinDataset(): Promise<{
  success: boolean;
  added: number;
}> {
  const { TRAINING_SAMPLES } = await import("@/lib/dataset/training-data");
  const seeds = TRAINING_SAMPLES.map((s) => ({
    signals: s.signals,
    type: s.type,
    source: "builtin" as const,
    difficulty: s.difficulty,
  }));
  const result = (await chrome.runtime.sendMessage({
    type: "IMPORT_DATASET",
    payload: seeds,
  })) as { success: boolean; added: number };
  return result;
}

async function loadDatasetTab(): Promise<void> {
  const badge = document.getElementById("dataset-count-badge");

  // Always merge built-in samples first (importDatasetEntries deduplicates by signals+type)
  // This ensures new built-in samples added in future versions are absorbed automatically.
  if (badge) badge.textContent = "Sincronizando dataset padrão…";
  const seedResult = await seedBuiltinDataset();

  const entries = (await chrome.runtime.sendMessage({
    type: "GET_DATASET",
  })) as DatasetEntry[];
  _allDatasetEntries = Array.isArray(entries) ? entries : [];

  if (seedResult.success && seedResult.added > 0) {
    showToast(
      `✅ ${seedResult.added} novas entradas do dataset padrão adicionadas`,
    );
  }

  await Promise.all([loadModelStatus(), loadDatasetList()]);
}

// Filter
document.getElementById("dataset-filter")?.addEventListener("input", (e) => {
  const val = (e.target as HTMLInputElement).value.trim();
  void loadDatasetList(val);
});

// Add entry
document
  .getElementById("btn-add-dataset-entry")
  ?.addEventListener("click", async () => {
    const signals = (
      document.getElementById("dataset-signals") as HTMLInputElement
    ).value.trim();
    const type = (document.getElementById("dataset-type") as HTMLSelectElement)
      .value as FieldType;
    const difficulty = (
      document.getElementById("dataset-difficulty") as HTMLSelectElement
    ).value as "easy" | "medium" | "hard";

    if (!signals) {
      showToast("Preencha os sinais do campo", "error");
      return;
    }

    const entry = (await chrome.runtime.sendMessage({
      type: "ADD_DATASET_ENTRY",
      payload: { signals, type, source: "manual", difficulty },
    })) as DatasetEntry | { error: string };

    if ("error" in entry) {
      showToast(entry.error, "error");
      return;
    }

    // Update local cache
    const existingIdx = _allDatasetEntries.findIndex((e) => e.id === entry.id);
    if (existingIdx >= 0) {
      _allDatasetEntries[existingIdx] = entry;
    } else {
      _allDatasetEntries.unshift(entry);
    }

    await loadDatasetList();
    (document.getElementById("dataset-signals") as HTMLInputElement).value = "";
    showToast("Entrada adicionada!");
  });

// Seed from built-in dataset
document
  .getElementById("btn-seed-dataset")
  ?.addEventListener("click", async () => {
    const btn = document.getElementById(
      "btn-seed-dataset",
    ) as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Importando...";
    try {
      const result = await seedBuiltinDataset();
      const fresh = (await chrome.runtime.sendMessage({
        type: "GET_DATASET",
      })) as DatasetEntry[];
      _allDatasetEntries = Array.isArray(fresh) ? fresh : [];
      await loadDatasetList();
      if (result.added > 0) {
        showToast(
          `✅ ${result.added} novas entradas adicionadas do dataset padrão`,
        );
      } else {
        showToast(
          "Dataset padrão já está totalmente importado (sem duplicatas)",
        );
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "🌱 Importar Dataset Padrão";
    }
  });

// Export JSON
document
  .getElementById("btn-export-dataset")
  ?.addEventListener("click", async () => {
    const entries = (await chrome.runtime.sendMessage({
      type: "EXPORT_DATASET",
    })) as DatasetEntry[];
    const json = JSON.stringify(entries, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fill-all-dataset.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${entries.length} entradas exportadas`);
  });

// Import JSON (file picker)
document.getElementById("btn-import-dataset")?.addEventListener("click", () => {
  document.getElementById("dataset-import-file")?.click();
});

document
  .getElementById("dataset-import-file")
  ?.addEventListener("change", async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed))
        throw new Error("O arquivo deve ser um array JSON");

      const result = (await chrome.runtime.sendMessage({
        type: "IMPORT_DATASET",
        payload: parsed,
      })) as { success: boolean; added: number; error?: string };

      if (!result.success) throw new Error(result.error ?? "Erro desconhecido");

      const fresh = (await chrome.runtime.sendMessage({
        type: "GET_DATASET",
      })) as DatasetEntry[];
      _allDatasetEntries = Array.isArray(fresh) ? fresh : [];
      await loadDatasetList();
      showToast(`✅ ${result.added} novas entradas importadas`);
    } catch (err) {
      showToast(
        `Erro ao importar: ${err instanceof Error ? err.message : String(err)}`,
        "error",
      );
    }

    input.value = "";
  });

// Clear dataset
document
  .getElementById("btn-clear-dataset")
  ?.addEventListener("click", async () => {
    if (
      !confirm(
        "Tem certeza que deseja limpar todo o dataset? Esta ação não pode ser desfeita.",
      )
    )
      return;
    await chrome.runtime.sendMessage({ type: "CLEAR_DATASET" });
    _allDatasetEntries = [];
    await loadDatasetList();
    showToast("Dataset limpo");
  });

// Delete runtime model
document
  .getElementById("btn-delete-model")
  ?.addEventListener("click", async () => {
    if (
      !confirm(
        "Remover o modelo treinado? A extensão voltará a usar o modelo padrão.",
      )
    )
      return;
    await chrome.runtime.sendMessage({ type: "DELETE_RUNTIME_MODEL" });
    await loadModelStatus();
    showToast("Modelo removido. Usando modelo padrão.");
  });

// Train model
document
  .getElementById("btn-train-model")
  ?.addEventListener("click", async () => {
    const trainBtn = document.getElementById(
      "btn-train-model",
    ) as HTMLButtonElement;
    const progressBlock = document.getElementById("training-progress-block");
    const progressBar = document.getElementById("training-progress-bar");
    const progressLabel = document.getElementById("training-progress-label");
    const trainingLog = document.getElementById(
      "training-log",
    ) as HTMLPreElement | null;

    // Fetch current dataset
    const entries = (await chrome.runtime.sendMessage({
      type: "GET_DATASET",
    })) as DatasetEntry[];
    if (!Array.isArray(entries) || entries.length < 10) {
      showToast(
        `Dataset muito pequeno (${entries.length} entradas). Mínimo: 10. Clique em "Importar Dataset Padrão" para começar.`,
        "error",
      );
      return;
    }
    const distinctTypes = new Set(entries.map((e) => e.type)).size;
    if (distinctTypes < 2) {
      showToast(
        `O dataset precisa ter pelo menos 2 tipos diferentes. Atual: ${distinctTypes}. Importe o dataset padrão para ter cobertura completa.`,
        "error",
      );
      return;
    }

    trainBtn.disabled = true;
    trainBtn.textContent = "Treinando...";
    if (progressBlock) progressBlock.style.display = "block";
    if (progressBar) progressBar.style.width = "0%";
    if (progressLabel) progressLabel.textContent = "Iniciando...";
    if (trainingLog)
      trainingLog.textContent = `Iniciando treinamento com ${entries.length} amostras...\n`;

    const onProgress = (p: TrainingProgress) => {
      const pct = Math.round((p.epoch / p.totalEpochs) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressLabel) {
        progressLabel.textContent = `Epoch ${p.epoch} / ${p.totalEpochs} — Loss: ${p.loss.toFixed(4)} — Accuracy: ${(p.accuracy * 100).toFixed(1)}%`;
      }
      if (trainingLog) {
        trainingLog.textContent += `Epoch ${String(p.epoch).padStart(3)} | loss: ${p.loss.toFixed(4)} | acc: ${(p.accuracy * 100).toFixed(2)}%\n`;
        trainingLog.scrollTop = trainingLog.scrollHeight;
      }
    };

    try {
      const result: TrainingResult = await trainModelFromDataset(
        entries,
        onProgress,
      );

      if (result.success) {
        if (progressBar) progressBar.style.width = "100%";
        if (progressLabel) progressLabel.textContent = "Treinamento concluído!";
        if (trainingLog) {
          trainingLog.textContent += `\n✅ Concluído em ${result.durationMs}ms\n`;
          trainingLog.textContent += `   Épocas: ${result.epochs} | Acurácia: ${(result.finalAccuracy * 100).toFixed(2)}% | Vocab: ${result.vocabSize}\n`;
          trainingLog.textContent += `   Modelo salvo no storage — ativo na próxima página preenchida.\n`;
        }
        // Model was already saved by trainModelFromDataset. Broadcast reload to all tabs.
        const tabs = await chrome.tabs.query({});
        await Promise.allSettled(
          tabs.map((t) =>
            t.id
              ? chrome.tabs
                  .sendMessage(t.id, { type: "RELOAD_CLASSIFIER" })
                  .catch(() => {})
              : Promise.resolve(),
          ),
        );
        await loadModelStatus();
        showToast(
          `✅ Modelo treinado! Acurácia: ${(result.finalAccuracy * 100).toFixed(1)}%`,
        );
      } else {
        if (trainingLog)
          trainingLog.textContent += `\n❌ Erro: ${result.error}\n`;
        showToast(`Erro no treinamento: ${result.error}`, "error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (trainingLog) trainingLog.textContent += `\n❌ Exceção: ${msg}\n`;
      showToast(`Erro: ${msg}`, "error");
    } finally {
      trainBtn.disabled = false;
      trainBtn.textContent = "🧠 Treinar Modelo";
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// --- Init ---
// ─────────────────────────────────────────────────────────────────────────────
initTabs();
loadSettings();
loadRules();
loadSavedForms();
loadFieldCache();
loadLearnedEntries();
loadDatasetTab();
