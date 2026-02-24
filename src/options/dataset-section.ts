/**
 * Dataset & Training tab — manage dataset entries, train TF.js model in-browser.
 */

import type { FieldType } from "@/types";
import type { DatasetEntry } from "@/lib/dataset/runtime-dataset";
import type {
  TrainingProgress,
  TrainingResult,
  TrainingMeta,
} from "@/lib/ai/runtime-trainer";
import { trainModelFromDataset } from "@/lib/ai/runtime-trainer";
import { escapeHtml, showToast } from "./shared";

let _allDatasetEntries: DatasetEntry[] = [];

// ── Model Status ──────────────────────────────────────────────────────────────

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

// ── Dataset List ──────────────────────────────────────────────────────────────

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

// ── Seed Built-in ─────────────────────────────────────────────────────────────

async function seedBuiltinDataset(): Promise<{
  success: boolean;
  added: number;
}> {
  const { TRAINING_SAMPLES } = await import("@/lib/dataset/training-data");
  const { buildFeatureText } = await import("@/lib/shared/structured-signals");
  const seeds = TRAINING_SAMPLES.map((sample) => ({
    signals: buildFeatureText(sample.signals, {
      category: sample.category,
      language: sample.language,
      domFeatures: sample.domFeatures,
    }),
    type: sample.type,
    source: "builtin" as const,
    difficulty: sample.difficulty,
  }));
  const result = (await chrome.runtime.sendMessage({
    type: "IMPORT_DATASET",
    payload: seeds,
  })) as { success: boolean; added: number };
  return result;
}

// ── Tab Load ──────────────────────────────────────────────────────────────────

async function loadDatasetTab(): Promise<void> {
  const badge = document.getElementById("dataset-count-badge");

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

// ── Event Bindings ────────────────────────────────────────────────────────────

function bindDatasetEvents(): void {
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
      const type = (
        document.getElementById("dataset-type") as HTMLSelectElement
      ).value as FieldType;
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

      const existingIdx = _allDatasetEntries.findIndex(
        (e) => e.id === entry.id,
      );
      if (existingIdx >= 0) {
        _allDatasetEntries[existingIdx] = entry;
      } else {
        _allDatasetEntries.unshift(entry);
      }

      await loadDatasetList();
      (document.getElementById("dataset-signals") as HTMLInputElement).value =
        "";
      showToast("Entrada adicionada!");
    });

  // Seed built-in
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
  document
    .getElementById("btn-import-dataset")
    ?.addEventListener("click", () => {
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

        if (!result.success)
          throw new Error(result.error ?? "Erro desconhecido");

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
          if (progressLabel)
            progressLabel.textContent = "Treinamento concluído!";
          if (trainingLog) {
            trainingLog.textContent += `\n✅ Concluído em ${result.durationMs}ms\n`;
            trainingLog.textContent += `   Épocas: ${result.epochs} | Acurácia: ${(result.finalAccuracy * 100).toFixed(2)}% | Vocab: ${result.vocabSize}\n`;
            trainingLog.textContent += `   Modelo salvo no storage — ativo na próxima página preenchida.\n`;
          }
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
}

export function initDatasetTab(): void {
  bindDatasetEvents();
  void loadDatasetTab();
}
