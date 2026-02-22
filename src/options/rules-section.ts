/**
 * Rules tab — list, create and delete field rules.
 */

import type { FieldRule, FieldType } from "@/types";
import { escapeHtml, generateId, showToast } from "./shared";

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
            (document.getElementById("rule-priority") as HTMLInputElement)
              .value,
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
      (document.getElementById("rule-field-name") as HTMLInputElement).value =
        "";
      (document.getElementById("rule-fixed") as HTMLInputElement).value = "";

      showToast("Regra salva!");
    });
}

export function initRulesTab(): void {
  bindRulesEvents();
  void loadRules();
}
