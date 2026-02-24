/**
 * Cache & Learning tab — field detection cache, learned entries, retrain vectors.
 */

import type { FieldDetectionCacheEntry, FieldRule, FieldType } from "@/types";
import type { RetrainResult } from "@/lib/ai/learning-store";
import { escapeHtml, showToast } from "./shared";

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

function bindCacheEvents(): void {
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
}

export function initCacheTab(): void {
  bindCacheEvents();
  void loadFieldCache();
  void loadLearnedEntries();
}
