/**
 * Rules tab — list, create and delete field rules.
 */

import type { FieldRule, FieldType } from "@/types";
import {
  escapeHtml,
  generateId,
  showToast,
  syncFieldTypeOptionsInOptionsPage,
} from "./shared";

let currentEditingRuleId: string | null = null;

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
      <div class="rule-actions">
        <button class="btn btn-sm btn-edit" data-rule-id="${escapeHtml(rule.id)}">Editar</button>
        <button class="btn btn-sm btn-delete" data-rule-id="${escapeHtml(rule.id)}">Excluir</button>
      </div>
    `;

    item.querySelector(".btn-edit")?.addEventListener("click", () => {
      editRule(rule);
    });

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

function editRule(rule: FieldRule): void {
  currentEditingRuleId = rule.id;

  (document.getElementById("rule-url") as HTMLInputElement).value =
    rule.urlPattern;
  (document.getElementById("rule-selector") as HTMLInputElement).value =
    rule.fieldSelector;
  (document.getElementById("rule-field-name") as HTMLInputElement).value =
    rule.fieldName || "";
  (document.getElementById("rule-fixed") as HTMLInputElement).value =
    rule.fixedValue || "";
  (document.getElementById("rule-priority") as HTMLInputElement).value = String(
    rule.priority,
  );

  // Sincronizar dropdowns e depois setar valores
  syncFieldTypeOptionsInOptionsPage();

  setTimeout(() => {
    (document.getElementById("rule-type") as HTMLSelectElement).value =
      rule.fieldType;
    (document.getElementById("rule-generator") as HTMLSelectElement).value =
      rule.generator;
  }, 0);

  // Scroll to form
  const form = document.querySelector(".card:last-of-type") as HTMLElement;
  if (form) form.scrollIntoView({ behavior: "smooth" });

  // Update button state
  const btn = document.getElementById("btn-save-rule");
  const cancelBtn = document.getElementById("btn-cancel-rule");
  if (btn) {
    btn.textContent = "✏️ Atualizar Regra";
    btn.dataset.editing = "true";
  }
  if (cancelBtn) {
    cancelBtn.style.display = "block";
  }
}

function cancelEditRule(): void {
  currentEditingRuleId = null;

  // Clear form
  (document.getElementById("rule-url") as HTMLInputElement).value = "";
  (document.getElementById("rule-selector") as HTMLInputElement).value = "";
  (document.getElementById("rule-field-name") as HTMLInputElement).value = "";
  (document.getElementById("rule-fixed") as HTMLInputElement).value = "";
  (document.getElementById("rule-priority") as HTMLInputElement).value = "10";
  (document.getElementById("rule-type") as HTMLSelectElement).value = "";
  (document.getElementById("rule-generator") as HTMLSelectElement).value = "";

  // Reset button state
  const btn = document.getElementById("btn-save-rule");
  const cancelBtn = document.getElementById("btn-cancel-rule");
  if (btn) {
    btn.textContent = "Salvar Regra";
    delete btn.dataset.editing;
  }
  if (cancelBtn) {
    cancelBtn.style.display = "none";
  }
}

function bindRulesEvents(): void {
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

      const fieldTypeValue = (
        document.getElementById("rule-type") as HTMLSelectElement
      ).value.trim();
      if (!fieldTypeValue) {
        showToast("Selecione um tipo de campo", "error");
        return;
      }

      const isUpdating = !!currentEditingRuleId;
      const rule: FieldRule = {
        id: currentEditingRuleId || generateId(),
        urlPattern,
        fieldSelector,
        fieldName:
          (
            document.getElementById("rule-field-name") as HTMLInputElement
          ).value.trim() || undefined,
        fieldType: fieldTypeValue as FieldType,
        generator: (
          document.getElementById("rule-generator") as HTMLSelectElement
        ).value as FieldRule["generator"],
        fixedValue:
          (
            document.getElementById("rule-fixed") as HTMLInputElement
          ).value.trim() || undefined,
        priority:
          parseInt(
            (document.getElementById("rule-priority") as HTMLInputElement)
              .value,
            10,
          ) || 10,
        createdAt: isUpdating
          ? (
              (await chrome.runtime.sendMessage({
                type: "GET_RULES",
              })) as FieldRule[]
            ).find((r) => r.id === currentEditingRuleId)?.createdAt ||
            Date.now()
          : Date.now(),
        updatedAt: Date.now(),
      };

      await chrome.runtime.sendMessage({ type: "SAVE_RULE", payload: rule });
      await loadRules();

      cancelEditRule();
      showToast(isUpdating ? "Regra atualizada!" : "Regra salva!");
    });

  document.getElementById("btn-cancel-rule")?.addEventListener("click", () => {
    cancelEditRule();
    showToast("Edição cancelada");
  });
}

export function initRulesTab(): void {
  bindRulesEvents();
  void loadRules();
}
