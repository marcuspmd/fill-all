/**
 * Options page script
 */

import "./options.css";
import type {
  FieldDetectionCacheEntry,
  FieldRule,
  FieldType,
  SavedForm,
  Settings,
} from "@/types";

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
  (document.getElementById("setting-chrome-ai") as HTMLInputElement).checked =
    settings.useChromeAI;
  (
    document.getElementById("setting-force-ai-first") as HTMLInputElement
  ).checked = settings.forceAIFirst ?? false;
  (document.getElementById("setting-highlight") as HTMLInputElement).checked =
    settings.highlightFilled;
  (document.getElementById("setting-strategy") as HTMLSelectElement).value =
    settings.defaultStrategy;
  (document.getElementById("setting-locale") as HTMLSelectElement).value =
    settings.locale;
}

document
  .getElementById("btn-save-settings")
  ?.addEventListener("click", async () => {
    const settings: Partial<Settings> = {
      autoFillOnLoad: (
        document.getElementById("setting-auto-fill") as HTMLInputElement
      ).checked,
      useChromeAI: (
        document.getElementById("setting-chrome-ai") as HTMLInputElement
      ).checked,
      forceAIFirst: (
        document.getElementById("setting-force-ai-first") as HTMLInputElement
      ).checked,
      highlightFilled: (
        document.getElementById("setting-highlight") as HTMLInputElement
      ).checked,
      defaultStrategy: (
        document.getElementById("setting-strategy") as HTMLSelectElement
      ).value as Settings["defaultStrategy"],
      locale: (document.getElementById("setting-locale") as HTMLSelectElement)
        .value as Settings["locale"],
    };

    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: settings,
    });
    showToast("Configurações salvas!");
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
    list.innerHTML = '<div class="empty">Nenhum cache de campos detectados</div>';
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

document.getElementById("btn-refresh-cache")?.addEventListener("click", async () => {
  await loadFieldCache();
  await loadLearnedEntries();
  showToast("Cache atualizado");
});

document.getElementById("btn-clear-cache")?.addEventListener("click", async () => {
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
  .getElementById("btn-retrain-learning")
  ?.addEventListener("click", async () => {
    const result = (await chrome.runtime.sendMessage({
      type: "RETRAIN_LEARNING_DATABASE",
    })) as { imported?: number; totalRules?: number } | null;
    await loadLearnedEntries();
    showToast(
      `Retreino concluído: ${result?.imported ?? 0}/${result?.totalRules ?? 0} regras`,
    );
  });

// --- Init ---
initTabs();
loadSettings();
loadRules();
loadSavedForms();
loadFieldCache();
loadLearnedEntries();
