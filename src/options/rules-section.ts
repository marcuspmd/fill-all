/**
 * Rules tab — list, create and delete field rules.
 */

import type { FieldRule, FieldType, GeneratorParams } from "@/types";
import {
  escapeHtml,
  generateId,
  showToast,
  ruleTypeSelect,
  ruleGeneratorSelect,
  collectGeneratorParams,
  renderGeneratorParamFields,
} from "./shared";
import { t } from "@/lib/i18n";
import {
  getGeneratorKey,
  getGeneratorParamDefs,
  type GeneratorParamDef,
} from "@/types/field-type-definitions";

let currentEditingRuleId: string | null = null;

async function loadRules(): Promise<void> {
  const rules = (await chrome.runtime.sendMessage({
    type: "GET_RULES",
  })) as FieldRule[];
  const list = document.getElementById("rules-list");
  if (!list) return;

  list.innerHTML = "";

  if (!Array.isArray(rules) || rules.length === 0) {
    list.innerHTML = `<div class="empty">${t("noRules")}</div>`;
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
        ${rule.fixedValue ? `<span class="badge badge-fixed">${t("fixedLabel", [escapeHtml(rule.fixedValue)])}</span>` : ""}
        ${rule.generatorParams ? `<span class="badge badge-params">⚙ ${t("paramSectionTitle")}</span>` : ""}
        <span class="rule-priority">${t("rulePriority")} ${rule.priority}</span>
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
      showToast(t("toastRuleDeleted"));
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
  (document.getElementById("rule-ai-prompt") as HTMLInputElement).value =
    rule.aiPrompt || "";
  (document.getElementById("rule-priority") as HTMLInputElement).value = String(
    rule.priority,
  );

  // Setar os valores nos SearchableSelects
  ruleTypeSelect?.setValue(rule.fieldType);
  ruleGeneratorSelect?.setValue(rule.generator);
  setTimeout(() => {
    updateRuleParamsSection(rule.generatorParams);
  }, 0);

  // Scroll to form
  const form = document.querySelector(".card:last-of-type") as HTMLElement;
  if (form) form.scrollIntoView({ behavior: "smooth" });

  // Update button state
  const btn = document.getElementById("btn-save-rule");
  const cancelBtn = document.getElementById("btn-cancel-rule");
  if (btn) {
    btn.textContent = t("btnUpdateRule");
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
  (document.getElementById("rule-ai-prompt") as HTMLInputElement).value = "";
  (document.getElementById("rule-priority") as HTMLInputElement).value = "10";
  ruleTypeSelect?.setValue("");
  ruleGeneratorSelect?.setValue("");
  updateRuleParamsSection();

  // Reset button state
  const btn = document.getElementById("btn-save-rule");
  const cancelBtn = document.getElementById("btn-cancel-rule");
  if (btn) {
    btn.textContent = t("btnSaveRule");
    delete btn.dataset.editing;
  }
  if (cancelBtn) {
    cancelBtn.style.display = "none";
  }
}

function updateRuleParamsSection(existingParams?: GeneratorParams): void {
  const container = document.getElementById("rule-params-container");
  const fieldsDiv = document.getElementById("rule-params-fields");
  const aiPromptContainer = document.getElementById("rule-ai-prompt-container");
  if (!container || !fieldsDiv) return;

  const generatorValue = ruleGeneratorSelect?.getValue() ?? "";

  // Show AI prompt only when "ai" generator is selected
  if (aiPromptContainer) {
    aiPromptContainer.style.display =
      generatorValue === "ai" ? "block" : "none";
  }

  if (
    !generatorValue ||
    generatorValue === "auto" ||
    generatorValue === "ai" ||
    generatorValue === "tensorflow"
  ) {
    container.style.display = "none";
    fieldsDiv.innerHTML = "";
    return;
  }

  const generatorKey = getGeneratorKey(generatorValue as FieldType);
  const paramDefs = generatorKey ? getGeneratorParamDefs(generatorKey) : [];

  if (paramDefs.length === 0) {
    container.style.display = "none";
    fieldsDiv.innerHTML = "";
    return;
  }

  fieldsDiv.innerHTML = renderGeneratorParamFields(paramDefs, existingParams);
  container.style.display = "block";
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
        showToast(t("errorFillUrlAndSelector"), "error");
        return;
      }

      const fieldTypeValue = ruleTypeSelect?.getValue().trim() ?? "";
      if (!fieldTypeValue) {
        showToast(t("errorSelectFieldType"), "error");
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
        generator: (ruleGeneratorSelect?.getValue() ??
          "auto") as FieldRule["generator"],
        generatorParams: collectGeneratorParams(
          document.getElementById("rule-params-fields")!,
        ),
        fixedValue:
          (
            document.getElementById("rule-fixed") as HTMLInputElement
          ).value.trim() || undefined,
        aiPrompt:
          (
            document.getElementById("rule-ai-prompt") as HTMLInputElement
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
      showToast(isUpdating ? t("toastRuleUpdated") : t("toastRuleSaved"));
    });

  document.getElementById("btn-cancel-rule")?.addEventListener("click", () => {
    cancelEditRule();
    showToast(t("toastEditCancelled"));
  });

  ruleGeneratorSelect?.on("change", () => {
    updateRuleParamsSection();
  });
}

export function initRulesTab(): void {
  bindRulesEvents();
  void loadRules();
}
