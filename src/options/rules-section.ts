/**
 * Rules tab — list, create and delete field rules.
 */

import type { FieldRule, FieldType, GeneratorParams } from "@/types";
import {
  escapeHtml,
  generateId,
  showToast,
  syncFieldTypeOptionsInOptionsPage,
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
  (document.getElementById("rule-priority") as HTMLInputElement).value = "10";
  (document.getElementById("rule-type") as HTMLSelectElement).value = "";
  (document.getElementById("rule-generator") as HTMLSelectElement).value = "";
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
  if (!container || !fieldsDiv) return;

  const generatorValue = (
    document.getElementById("rule-generator") as HTMLSelectElement
  ).value;

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

  fieldsDiv.innerHTML = paramDefs
    .map((def) => renderOptionParamField(def, existingParams))
    .join("");
  container.style.display = "block";
}

function renderOptionParamField(
  def: GeneratorParamDef,
  existingParams?: GeneratorParams,
): string {
  const label = t(def.labelKey) || def.labelKey;
  const currentValue = existingParams?.[def.key] ?? def.defaultValue;

  if (def.type === "select" && def.selectOptions) {
    const options = def.selectOptions
      .map((opt) => {
        const optLabel = t(opt.labelKey) || opt.labelKey;
        const selected = opt.value === currentValue ? "selected" : "";
        return `<option value="${escapeHtml(opt.value)}" ${selected}>${escapeHtml(optLabel)}</option>`;
      })
      .join("");
    return `
      <div class="form-group" style="min-width:150px;">
        <label>${escapeHtml(label)}</label>
        <select data-param-key="${def.key}">${options}</select>
      </div>`;
  }

  if (def.type === "boolean") {
    const checked = currentValue ? "checked" : "";
    return `
      <div class="form-group" style="min-width:150px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
          <input type="checkbox" data-param-key="${def.key}" ${checked} />
          ${escapeHtml(label)}
        </label>
      </div>`;
  }

  const min = def.min != null ? `min="${def.min}"` : "";
  const max = def.max != null ? `max="${def.max}"` : "";
  const step = def.step != null ? `step="${def.step}"` : "";
  return `
    <div class="form-group" style="min-width:120px;">
      <label>${escapeHtml(label)}</label>
      <input type="number" data-param-key="${def.key}" value="${currentValue ?? ""}" ${min} ${max} ${step} />
    </div>`;
}

function collectRuleParams(): GeneratorParams | undefined {
  const fieldsDiv = document.getElementById("rule-params-fields");
  if (!fieldsDiv) return undefined;

  const inputs = fieldsDiv.querySelectorAll<HTMLInputElement>(
    "input[data-param-key]",
  );
  const selects = fieldsDiv.querySelectorAll<HTMLSelectElement>(
    "select[data-param-key]",
  );
  if (inputs.length === 0 && selects.length === 0) return undefined;

  const params: Record<string, unknown> = {};
  let hasAny = false;

  inputs.forEach((input) => {
    const key = input.dataset.paramKey!;
    if (input.type === "checkbox") {
      params[key] = input.checked;
      hasAny = true;
    } else if (input.type === "number") {
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        params[key] = val;
        hasAny = true;
      }
    }
  });

  selects.forEach((select) => {
    const key = select.dataset.paramKey!;
    if (select.value) {
      params[key] = select.value;
      hasAny = true;
    }
  });

  return hasAny ? (params as GeneratorParams) : undefined;
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

      const fieldTypeValue = (
        document.getElementById("rule-type") as HTMLSelectElement
      ).value.trim();
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
        generator: (
          document.getElementById("rule-generator") as HTMLSelectElement
        ).value as FieldRule["generator"],
        generatorParams: collectRuleParams(),
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
      showToast(isUpdating ? t("toastRuleUpdated") : t("toastRuleSaved"));
    });

  document.getElementById("btn-cancel-rule")?.addEventListener("click", () => {
    cancelEditRule();
    showToast(t("toastEditCancelled"));
  });

  document.getElementById("rule-generator")?.addEventListener("change", () => {
    updateRuleParamsSection();
  });
}

export function initRulesTab(): void {
  bindRulesEvents();
  void loadRules();
}
