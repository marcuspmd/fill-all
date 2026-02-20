/**
 * Options page script
 */

import "./options.css";
import type { FieldRule, FieldType, SavedForm, Settings } from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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

// --- Init ---
loadSettings();
loadRules();
loadSavedForms();
