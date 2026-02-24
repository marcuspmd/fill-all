/**
 * Popup — field detection, classification rendering, and cache loading
 */

import type {
  DetectedFieldSummary,
  FieldDetectionCacheEntry,
  FieldRule,
  FieldType,
  IgnoredField,
} from "@/types";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";
import {
  sendToActiveTab,
  sendToBackground,
  getActivePageUrl,
  escapeHtml,
} from "./popup-messaging";
import { loadIgnoredFields } from "./popup-ignored";

type DetectFieldItem = DetectedFieldSummary;

interface DetectFieldsResponse {
  count: number;
  fields: DetectFieldItem[];
}

const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = (
  [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "E-mail" },
    { value: "phone", label: "Telefone" },
    { value: "full-name", label: "Nome Completo" },
    { value: "first-name", label: "Primeiro Nome" },
    { value: "last-name", label: "Sobrenome" },
    { value: "rg", label: "RG" },
    { value: "company", label: "Empresa" },
    { value: "cep", label: "CEP" },
    { value: "address", label: "Endereço" },
    { value: "city", label: "Cidade" },
    { value: "state", label: "Estado" },
    { value: "date", label: "Data" },
    { value: "birth-date", label: "Nascimento" },
    { value: "money", label: "Dinheiro" },
    { value: "number", label: "Número" },
    { value: "password", label: "Senha" },
    { value: "username", label: "Username" },
    { value: "text", label: "Texto" },
    { value: "select", label: "Select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio" },
    { value: "unknown", label: "Desconhecido" },
  ] as Array<{ value: FieldType; label: string }>
).sort((a, b) => b.label.localeCompare(a.label, "pt-BR"));

export function bindDetectEvents(): void {
  document.getElementById("btn-detect")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-detect") as HTMLButtonElement;
    const originalText = btn.textContent ?? "🔍 Detectar Campos";
    btn.disabled = true;
    btn.textContent = "⏳ Detectando...";

    try {
      const pageUrl = await getActivePageUrl();
      const result = (await sendToActiveTab({
        type: "DETECT_FIELDS",
      })) as DetectFieldsResponse | null;

      if (!result || !Array.isArray(result.fields)) {
        await loadDetectedFieldsFromCache();
        return;
      }

      await sendToBackground({
        type: "SAVE_FIELD_CACHE",
        payload: { url: pageUrl, fields: result.fields },
      });

      await renderDetectedFields(result, pageUrl, {
        source: "live",
        updatedAt: Date.now(),
      });
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

async function renderDetectedFields(
  result: DetectFieldsResponse,
  pageUrl: string,
  meta?: { source?: "live" | "cache"; updatedAt?: number },
): Promise<void> {
  const list = document.getElementById("fields-list");
  if (!list) return;

  const [ignoredList, rulesList] = (await Promise.all([
    sendToBackground({ type: "GET_IGNORED_FIELDS" }),
    sendToBackground({ type: "GET_RULES" }),
  ])) as [IgnoredField[] | null, FieldRule[] | null];

  const ignoredSelectors = new Set(
    (ignoredList ?? [])
      .filter((f) => matchUrlPattern(pageUrl, f.urlPattern))
      .map((f) => f.selector),
  );

  const pageRules = (rulesList ?? []).filter((r) =>
    matchUrlPattern(pageUrl, r.urlPattern),
  );

  list.innerHTML = "";

  if (meta?.source === "cache") {
    const updatedAtText = meta.updatedAt
      ? new Date(meta.updatedAt).toLocaleString("pt-BR")
      : "";
    const info = document.createElement("div");
    info.className = "empty";
    info.textContent = updatedAtText
      ? `Mostrando cache (${updatedAtText})`
      : "Mostrando cache";
    list.appendChild(info);
  }

  if (!result || !Array.isArray(result.fields) || result.count === 0) {
    list.innerHTML = '<div class="empty">Nenhum campo encontrado</div>';
    return;
  }

  for (const field of result.fields) {
    const item = buildFieldItem(field, pageUrl, ignoredSelectors, pageRules);
    list.appendChild(item);
  }
}

function buildFieldItem(
  field: DetectFieldItem,
  pageUrl: string,
  ignoredSelectors: Set<string>,
  pageRules: FieldRule[],
): HTMLDivElement {
  const isIgnored = ignoredSelectors.has(field.selector);
  const existingRule = pageRules.find(
    (r) => r.fieldSelector === field.selector,
  );
  const effectiveType = (existingRule?.fieldType ??
    field.fieldType) as FieldType;

  const item = document.createElement("div");
  item.className = "list-item field-detect-item";
  if (existingRule?.id) item.dataset.ruleId = existingRule.id;

  const typeOptions = FIELD_TYPE_OPTIONS.map(
    (opt) =>
      `<option value="${escapeHtml(opt.value)}"${
        opt.value === effectiveType ? " selected" : ""
      }>${escapeHtml(opt.label)}</option>`,
  ).join("");

  const isMoney = effectiveType === "money";
  const isNumber = effectiveType === "number";
  const isSelect = effectiveType === "select";

  const selectOptPickerOptions = (field.options ?? [])
    .map(
      (opt, i) =>
        `<option value="${i + 1}"${
          existingRule?.selectOptionIndex === i + 1 ? " selected" : ""
        }>${i + 1}ª: ${escapeHtml(opt.text)}</option>`,
    )
    .join("");

  const hasSelectOptions = (field.options ?? []).length > 0;

  const MAX_OPTS_PREVIEW = 4;
  const filteredOpts = (field.options ?? []).filter((o) => o.value);
  const optionPills = filteredOpts
    .slice(0, MAX_OPTS_PREVIEW)
    .map(
      (o) =>
        `<span class="field-option-pill"><code>${escapeHtml(o.value)}</code><span class="field-option-arrow"> → </span><span class="field-option-pill-text">${escapeHtml(o.text)}</span></span>`,
    )
    .join("");
  const extraCount = Math.max(0, filteredOpts.length - MAX_OPTS_PREVIEW);
  const optionsPreviewHtml = hasSelectOptions
    ? `<div class="field-options-preview">${optionPills}${extraCount > 0 ? `<span class="field-option-more">+${extraCount}</span>` : ""}</div>`
    : "";

  const isCheckboxOrRadio =
    field.fieldType === "checkbox" || field.fieldType === "radio";
  const cbLabel =
    field.label && field.label !== "unknown" ? field.label : undefined;
  const checkboxPreviewHtml = isCheckboxOrRadio
    ? `<div class="field-options-preview"><span class="field-option-pill"><code>${escapeHtml(field.checkboxValue ?? "on")}</code>${cbLabel ? `<span class="field-option-arrow"> → </span><span class="field-option-pill-text">${escapeHtml(cbLabel)}</span>` : ""}</span><span class="field-option-pill ${field.checkboxChecked ? "field-option-checked" : "field-option-unchecked"}">${field.checkboxChecked ? "✓ marcado" : "☐ desmarcado"}</span></div>`
    : "";

  item.innerHTML = `
    <div class="field-header">
      <span class="field-label">${escapeHtml(field.label)}</span>
      <select class="field-type-select" title="Tipo do campo">${typeOptions}</select>
      <div class="field-actions">
        <button class="btn btn-sm btn-fill-field" title="Preencher" ${
          isIgnored ? "disabled" : ""
        }>▶</button>
        <button class="btn btn-sm ${
          isIgnored ? "btn-ignored-active" : "btn-ignore-field"
        }"
          title="${isIgnored ? "Remover dos ignorados" : "Ignorar campo"}"
          data-selector="${escapeHtml(field.selector)}"
          data-label="${escapeHtml(field.label)}"
          data-ignored="${isIgnored}">
          ${isIgnored ? "✓" : "🚫"}
        </button>
        <button class="btn btn-sm btn-rules-toggle" title="Configurar regra">⚙️</button>
      </div>
    </div>
    ${optionsPreviewHtml}${checkboxPreviewHtml}
    <div class="field-rules-panel" style="display:none">
      <input type="text" class="rule-fixed-value"
        placeholder="Valor fixo (vazio = gerar automaticamente)"
        value="${escapeHtml(existingRule?.fixedValue ?? "")}">
      <div class="rule-range-row rule-money-range" style="display:${
        isMoney ? "flex" : "none"
      }">
        <span class="rule-range-label">R$</span>
        <input type="number" class="rule-money-min" placeholder="Mín" min="0" step="0.01"
          value="">
        <span class="rule-range-sep">–</span>
        <input type="number" class="rule-money-max" placeholder="Máx" min="0" step="0.01"
          value="">
      </div>
      <div class="rule-range-row rule-number-range" style="display:${
        isNumber ? "flex" : "none"
      }">
        <span class="rule-range-label">#</span>
        <input type="number" class="rule-number-min" placeholder="Mín" min="0" step="1"
          value="">
        <span class="rule-range-sep">–</span>
        <input type="number" class="rule-number-max" placeholder="Máx" min="0" step="1"
          value="">
      </div>
      ${
        hasSelectOptions
          ? `
      <div class="rule-range-row rule-select-option-row" style="display:${
        isSelect ? "flex" : "none"
      }">
        <span class="rule-range-label">Opção:</span>
        <select class="rule-select-option-idx">
          <option value="0"${
            !existingRule?.selectOptionIndex ? " selected" : ""
          }>Automático (aleatório)</option>
          ${selectOptPickerOptions}
        </select>
      </div>`
          : ""
      }
      <div class="rule-footer">
        <button class="btn btn-sm btn-save-rule">💾 Salvar Regra</button>
        <span class="rule-saved-msg hidden">✓ Salvo!</span>
        ${
          existingRule
            ? `<button class="btn btn-sm btn-delete btn-delete-rule" title="Excluir regra">✕ Regra</button>`
            : ""
        }
      </div>
    </div>
  `;

  bindFieldItemEvents(item, field, pageUrl, existingRule);
  return item;
}

function bindFieldItemEvents(
  item: HTMLDivElement,
  field: DetectFieldItem,
  pageUrl: string,
  existingRule: FieldRule | undefined,
): void {
  const typeSelect =
    item.querySelector<HTMLSelectElement>(".field-type-select");

  const saveFieldRule = async (silent = false): Promise<void> => {
    const selectedType = (typeSelect?.value ?? field.fieldType) as FieldType;
    const fixedValue =
      item.querySelector<HTMLInputElement>(".rule-fixed-value")?.value.trim() ||
      undefined;
    const selectOptIdxVal = item.querySelector<HTMLSelectElement>(
      ".rule-select-option-idx",
    )?.value;

    const origin = new URL(pageUrl).origin;
    const pathname = new URL(pageUrl).pathname;
    const urlPattern = `${origin}${pathname}*`;

    const rule: FieldRule = {
      id:
        item.dataset.ruleId ??
        `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      urlPattern,
      fieldSelector: field.selector,
      fieldType: selectedType,
      fixedValue,
      generator: fixedValue ? "auto" : selectedType,
      priority: 10,
      createdAt: existingRule?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    if (selectedType === "select" && selectOptIdxVal !== undefined) {
      rule.selectOptionIndex = parseInt(selectOptIdxVal, 10);
    }

    await sendToBackground({ type: "SAVE_RULE", payload: rule });
    item.dataset.ruleId = rule.id;

    if (!silent) {
      const savedMsg = item.querySelector<HTMLElement>(".rule-saved-msg");
      if (savedMsg) {
        savedMsg.classList.remove("hidden");
        setTimeout(() => savedMsg.classList.add("hidden"), 2000);
      }
    }

    if (!item.querySelector(".btn-delete-rule")) {
      const footer = item.querySelector<HTMLElement>(".rule-footer");
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-sm btn-delete btn-delete-rule";
      deleteBtn.title = "Excluir regra";
      deleteBtn.textContent = "✕ Regra";
      deleteBtn.addEventListener("click", handleDeleteRule);
      footer?.appendChild(deleteBtn);
    }
  };

  typeSelect?.addEventListener("change", () => {
    const t = typeSelect.value;
    const moneyRange = item.querySelector<HTMLElement>(".rule-money-range");
    const numberRange = item.querySelector<HTMLElement>(".rule-number-range");
    const selectOptionRow = item.querySelector<HTMLElement>(
      ".rule-select-option-row",
    );
    if (moneyRange) moneyRange.style.display = t === "money" ? "flex" : "none";
    if (numberRange)
      numberRange.style.display = t === "number" ? "flex" : "none";
    if (selectOptionRow)
      selectOptionRow.style.display = t === "select" ? "flex" : "none";
    saveFieldRule(true);
  });

  item.querySelector(".btn-fill-field")?.addEventListener("click", async () => {
    await sendToActiveTab({
      type: "FILL_FIELD_BY_SELECTOR",
      payload: field.selector,
    });
  });

  const ignoreBtn = item.querySelector<HTMLButtonElement>("[data-selector]");
  ignoreBtn?.addEventListener("click", async () => {
    const isCurrentlyIgnored = ignoreBtn.dataset.ignored === "true";

    if (isCurrentlyIgnored) {
      const current = (await sendToBackground({
        type: "GET_IGNORED_FIELDS",
      })) as IgnoredField[] | null;
      const entry = (current ?? []).find(
        (f) =>
          f.selector === field.selector &&
          matchUrlPattern(pageUrl, f.urlPattern),
      );
      if (entry) {
        await sendToBackground({
          type: "REMOVE_IGNORED_FIELD",
          payload: entry.id,
        });
      }
      ignoreBtn.textContent = "🚫";
      ignoreBtn.className = "btn btn-sm btn-ignore-field";
      ignoreBtn.dataset.ignored = "false";
      ignoreBtn.title = "Ignorar campo";
      const fillBtn = item.querySelector<HTMLButtonElement>(".btn-fill-field");
      if (fillBtn) fillBtn.disabled = false;
    } else {
      const origin = new URL(pageUrl).origin;
      const pathname = new URL(pageUrl).pathname;
      const urlPattern = `${origin}${pathname}*`;
      await sendToBackground({
        type: "ADD_IGNORED_FIELD",
        payload: {
          urlPattern,
          selector: field.selector,
          label: field.label,
        },
      });
      ignoreBtn.textContent = "✓";
      ignoreBtn.className = "btn btn-sm btn-ignored-active";
      ignoreBtn.dataset.ignored = "true";
      ignoreBtn.title = "Remover dos ignorados";
      const fillBtn = item.querySelector<HTMLButtonElement>(".btn-fill-field");
      if (fillBtn) fillBtn.disabled = true;
    }

    await loadIgnoredFields();
  });

  item.querySelector(".btn-rules-toggle")?.addEventListener("click", () => {
    const panel = item.querySelector<HTMLElement>(".field-rules-panel");
    if (panel) {
      panel.style.display = panel.style.display === "none" ? "flex" : "none";
    }
  });

  item
    .querySelector(".btn-save-rule")
    ?.addEventListener("click", () => saveFieldRule(false));

  const handleDeleteRule = (): void => {
    const ruleId = item.dataset.ruleId;
    if (ruleId) {
      sendToBackground({ type: "DELETE_RULE", payload: ruleId });
      item.removeAttribute("data-rule-id");
      item.querySelector(".btn-delete-rule")?.remove();
      if (typeSelect) typeSelect.value = field.fieldType;
    }
  };

  item
    .querySelector(".btn-delete-rule")
    ?.addEventListener("click", handleDeleteRule);
}

export async function loadDetectedFieldsFromCache(): Promise<void> {
  const pageUrl = await getActivePageUrl();
  if (!pageUrl.startsWith("http://") && !pageUrl.startsWith("https://")) return;

  const cache = (await sendToBackground({
    type: "GET_FIELD_CACHE",
    payload: { url: pageUrl },
  })) as FieldDetectionCacheEntry | null;

  if (!cache || !Array.isArray(cache.fields)) return;

  await renderDetectedFields(
    { count: cache.count ?? cache.fields.length, fields: cache.fields },
    pageUrl,
    { source: "cache", updatedAt: cache.updatedAt },
  );
}
