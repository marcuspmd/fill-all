/**
 * Popup script — handles UI interactions
 */

import "./popup.css";
import type {
  DetectedFieldSummary,
  ExtensionMessage,
  FieldDetectionCacheEntry,
  FieldRule,
  FieldType,
  IgnoredField,
  SavedForm,
} from "@/types";
import { generate, generateMoney, generateNumber } from "@/lib/generators";
import { generateWithConstraints } from "@/lib/generators/adaptive";
import { matchUrlPattern } from "@/lib/url/match-url-pattern";
import { sendToActiveTab as sendMessageToActiveTab } from "@/lib/chrome/active-tab-messaging";

type DetectFieldItem = DetectedFieldSummary;

interface DetectFieldsResponse {
  count: number;
  fields: DetectFieldItem[];
}

async function sendToActiveTab(message: ExtensionMessage): Promise<unknown> {
  const result = await sendMessageToActiveTab(message, {
    injectIfNeeded: true,
  });
  if (result && typeof result === "object" && "error" in result) {
    return null;
  }
  return result;
}

async function sendToBackground(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

async function getActivePageUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

// --- Fill All ---
document.getElementById("btn-fill-all")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-fill-all") as HTMLButtonElement;
  const result = await sendToActiveTab({ type: "FILL_ALL_FIELDS" });
  if (result === null) {
    btn.textContent = "⚠️ Não disponível aqui";
  } else {
    const res = result as { filled?: number } | null;
    btn.textContent = `✓ ${res?.filled ?? 0} campos preenchidos`;
  }
  setTimeout(() => {
    btn.textContent = "⚡ Preencher Todos os Campos";
  }, 2000);
});

// --- Save Form ---
document
  .getElementById("btn-save-form")
  ?.addEventListener("click", async () => {
    await sendToActiveTab({ type: "SAVE_FORM" });
    await loadSavedForms();
  });

// --- Detect Fields ---
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

async function renderDetectedFields(
  result: DetectFieldsResponse,
  pageUrl: string,
  meta?: { source?: "live" | "cache"; updatedAt?: number },
): Promise<void> {
  const list = document.getElementById("fields-list");
  if (!list) return;

  // Load ignored fields and existing rules in parallel
  const [ignoredList, rulesList] = (await Promise.all([
    sendToBackground({ type: "GET_IGNORED_FIELDS" }),
    sendToBackground({ type: "GET_RULES" }),
  ])) as [IgnoredField[] | null, FieldRule[] | null];

  const ignoredSelectors = new Set(
    (ignoredList ?? [])
      .filter((f) => matchUrlPattern(pageUrl, f.urlPattern))
      .map((f) => f.selector),
  );

  // Rules that apply to this page
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

    // Build select option picker (only if this field is actually a <select>)
    const selectOptPickerOptions = (field.options ?? [])
      .map(
        (opt, i) =>
          `<option value="${i + 1}"${
            existingRule?.selectOptionIndex === i + 1 ? " selected" : ""
          }>${i + 1}ª: ${escapeHtml(opt.text)}</option>`,
      )
      .join("");

    const hasSelectOptions = (field.options ?? []).length > 0;

    // Preview: select options (value → label pills) and checkbox value + state
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
            value="${existingRule?.moneyMin ?? ""}">
          <span class="rule-range-sep">–</span>
          <input type="number" class="rule-money-max" placeholder="Máx" min="0" step="0.01"
            value="${existingRule?.moneyMax ?? ""}">
        </div>
        <div class="rule-range-row rule-number-range" style="display:${
          isNumber ? "flex" : "none"
        }">
          <span class="rule-range-label">#</span>
          <input type="number" class="rule-number-min" placeholder="Mín" min="0" step="1"
            value="${existingRule?.numberMin ?? ""}">
          <span class="rule-range-sep">–</span>
          <input type="number" class="rule-number-max" placeholder="Máx" min="0" step="1"
            value="${existingRule?.numberMax ?? ""}">
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

    const typeSelect =
      item.querySelector<HTMLSelectElement>(".field-type-select");

    // Helper: build and persist the rule with the current panel state
    const saveFieldRule = async (silent = false): Promise<void> => {
      const selectedType = (typeSelect?.value ?? field.fieldType) as FieldType;
      const fixedValue =
        item
          .querySelector<HTMLInputElement>(".rule-fixed-value")
          ?.value.trim() || undefined;
      const moneyMinVal =
        item.querySelector<HTMLInputElement>(".rule-money-min")?.value;
      const moneyMaxVal =
        item.querySelector<HTMLInputElement>(".rule-money-max")?.value;
      const numberMinVal =
        item.querySelector<HTMLInputElement>(".rule-number-min")?.value;
      const numberMaxVal =
        item.querySelector<HTMLInputElement>(".rule-number-max")?.value;
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

      if (selectedType === "money") {
        const mn = parseFloat(moneyMinVal ?? "");
        const mx = parseFloat(moneyMaxVal ?? "");
        if (!isNaN(mn)) rule.moneyMin = mn;
        if (!isNaN(mx)) rule.moneyMax = mx;
      }
      if (selectedType === "number") {
        const mn = parseInt(numberMinVal ?? "", 10);
        const mx = parseInt(numberMaxVal ?? "", 10);
        if (!isNaN(mn)) rule.numberMin = mn;
        if (!isNaN(mx)) rule.numberMax = mx;
      }
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

      // Add delete button if this was a new rule
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

    // Show/hide range inputs when type changes, and auto-save the new type
    typeSelect?.addEventListener("change", () => {
      const t = typeSelect.value;
      const moneyRange = item.querySelector<HTMLElement>(".rule-money-range");
      const numberRange = item.querySelector<HTMLElement>(".rule-number-range");
      const selectOptionRow = item.querySelector<HTMLElement>(
        ".rule-select-option-row",
      );
      if (moneyRange)
        moneyRange.style.display = t === "money" ? "flex" : "none";
      if (numberRange)
        numberRange.style.display = t === "number" ? "flex" : "none";
      if (selectOptionRow)
        selectOptionRow.style.display = t === "select" ? "flex" : "none";
      // Auto-save the type change immediately
      saveFieldRule(true);
    });

    // Fill button
    item
      .querySelector(".btn-fill-field")
      ?.addEventListener("click", async () => {
        await sendToActiveTab({
          type: "FILL_FIELD_BY_SELECTOR",
          payload: field.selector,
        });
      });

    // Ignore/unignore button
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
        const fillBtn =
          item.querySelector<HTMLButtonElement>(".btn-fill-field");
        if (fillBtn) fillBtn.disabled = false;
      } else {
        const origin = new URL(pageUrl).origin;
        const pathname = new URL(pageUrl).pathname;
        const urlPattern = `${origin}${pathname}*`;
        await sendToBackground({
          type: "ADD_IGNORED_FIELD",
          payload: { urlPattern, selector: field.selector, label: field.label },
        });
        ignoreBtn.textContent = "✓";
        ignoreBtn.className = "btn btn-sm btn-ignored-active";
        ignoreBtn.dataset.ignored = "true";
        ignoreBtn.title = "Remover dos ignorados";
        const fillBtn =
          item.querySelector<HTMLButtonElement>(".btn-fill-field");
        if (fillBtn) fillBtn.disabled = true;
      }

      await loadIgnoredFields();
    });

    // Toggle rules panel
    item.querySelector(".btn-rules-toggle")?.addEventListener("click", () => {
      const panel = item.querySelector<HTMLElement>(".field-rules-panel");
      if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
      }
    });

    // Save rule button
    item
      .querySelector(".btn-save-rule")
      ?.addEventListener("click", () => saveFieldRule(false));

    // Delete rule
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

    list.appendChild(item);
  }
}

async function loadDetectedFieldsFromCache(): Promise<void> {
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

// --- Quick Generators ---

async function getMoneyCfg(): Promise<{ min: number; max: number }> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as {
    moneyMin?: number;
    moneyMax?: number;
  } | null;
  return {
    min: settings?.moneyMin ?? 1,
    max: settings?.moneyMax ?? 10000,
  };
}

async function getNumberCfg(): Promise<{ min: number; max: number }> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as {
    numberMin?: number;
    numberMax?: number;
  } | null;
  return {
    min: settings?.numberMin ?? 1,
    max: settings?.numberMax ?? 99999,
  };
}

// Init money/number config inputs from stored settings
async function initGeneratorConfigs(): Promise<void> {
  const settings = (await sendToBackground({ type: "GET_SETTINGS" })) as Record<
    string,
    number
  > | null;
  const moneyMin = document.getElementById("money-min") as HTMLInputElement;
  const moneyMax = document.getElementById("money-max") as HTMLInputElement;
  const numMin = document.getElementById("number-min") as HTMLInputElement;
  const numMax = document.getElementById("number-max") as HTMLInputElement;
  if (moneyMin) moneyMin.value = String(settings?.moneyMin ?? 1);
  if (moneyMax) moneyMax.value = String(settings?.moneyMax ?? 10000);
  if (numMin) numMin.value = String(settings?.numberMin ?? 1);
  if (numMax) numMax.value = String(settings?.numberMax ?? 99999);
}

function saveMoneyCfg(): void {
  const min = parseFloat(
    (document.getElementById("money-min") as HTMLInputElement)?.value,
  );
  const max = parseFloat(
    (document.getElementById("money-max") as HTMLInputElement)?.value,
  );
  if (!isNaN(min) && !isNaN(max)) {
    sendToBackground({
      type: "SAVE_SETTINGS",
      payload: { moneyMin: min, moneyMax: max },
    });
  }
}

function saveNumberCfg(): void {
  const min = parseInt(
    (document.getElementById("number-min") as HTMLInputElement)?.value,
    10,
  );
  const max = parseInt(
    (document.getElementById("number-max") as HTMLInputElement)?.value,
    10,
  );
  if (!isNaN(min) && !isNaN(max)) {
    sendToBackground({
      type: "SAVE_SETTINGS",
      payload: { numberMin: min, numberMax: max },
    });
  }
}

document.getElementById("money-min")?.addEventListener("change", saveMoneyCfg);
document.getElementById("money-max")?.addEventListener("change", saveMoneyCfg);
document
  .getElementById("number-min")
  ?.addEventListener("change", saveNumberCfg);
document
  .getElementById("number-max")
  ?.addEventListener("change", saveNumberCfg);

document.querySelectorAll("[data-generator]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const type = (btn as HTMLElement).dataset.generator as FieldType;

    const moneyConfig = document.getElementById("money-config")!;
    const numberConfig = document.getElementById("number-config")!;
    moneyConfig.style.display = type === "money" ? "flex" : "none";
    numberConfig.style.display = type === "number" ? "flex" : "none";

    let value: string;
    if (type === "money") {
      const cfg = await getMoneyCfg();
      const min = parseFloat(
        (document.getElementById("money-min") as HTMLInputElement)?.value,
      );
      const max = parseFloat(
        (document.getElementById("money-max") as HTMLInputElement)?.value,
      );
      value = generateWithConstraints(
        () =>
          generateMoney(isNaN(min) ? cfg.min : min, isNaN(max) ? cfg.max : max),
        { requireValidity: true },
      );
    } else if (type === "number") {
      const cfg = await getNumberCfg();
      const min = parseInt(
        (document.getElementById("number-min") as HTMLInputElement)?.value,
        10,
      );
      const max = parseInt(
        (document.getElementById("number-max") as HTMLInputElement)?.value,
        10,
      );
      value = generateWithConstraints(
        () =>
          generateNumber(
            isNaN(min) ? cfg.min : min,
            isNaN(max) ? cfg.max : max,
          ),
        { requireValidity: true },
      );
    } else {
      value = generateWithConstraints(() => generate(type), {
        requireValidity: true,
      });
    }

    const container = document.getElementById("generated-value")!;
    const text = document.getElementById("generated-text")!;
    text.textContent = value;
    container.style.display = "flex";
  });
});

// --- Copy to Clipboard ---
document.getElementById("btn-copy")?.addEventListener("click", () => {
  const text = document.getElementById("generated-text")?.textContent;
  if (text) {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById("btn-copy")!;
    btn.textContent = "✓";
    setTimeout(() => {
      btn.textContent = "📋";
    }, 1000);
  }
});

// --- Saved Forms ---
async function loadSavedForms(): Promise<void> {
  const forms = (await sendToBackground({ type: "GET_SAVED_FORMS" })) as
    | SavedForm[]
    | null;
  const list = document.getElementById("saved-forms-list");
  if (!list) return;

  list.innerHTML = "";
  if (!Array.isArray(forms) || forms.length === 0) {
    list.innerHTML = '<div class="empty">Nenhum formulário salvo</div>';
    return;
  }

  for (const form of forms) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-info">
        <span class="form-name">${escapeHtml(form.name)}</span>
        <span class="form-fields">${Object.keys(form.fields || {}).length} campos</span>
      </div>
      <div class="form-actions">
        <button class="btn btn-sm btn-load" data-form-id="${escapeHtml(form.id)}">Carregar</button>
        <button class="btn btn-sm btn-delete" data-form-id="${escapeHtml(form.id)}">✕</button>
      </div>
    `;

    item.querySelector(".btn-load")?.addEventListener("click", async () => {
      await sendToActiveTab({ type: "LOAD_SAVED_FORM", payload: form });
    });

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await sendToBackground({ type: "DELETE_FORM", payload: form.id });
      await loadSavedForms();
    });

    list.appendChild(item);
  }
}

// --- Options link ---
document.getElementById("btn-options")?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// --- Toggle Floating Panel ---
document
  .getElementById("btn-toggle-panel")
  ?.addEventListener("click", async () => {
    await sendToActiveTab({ type: "TOGGLE_PANEL" });
  });

// --- Toggle Watch ---
document
  .getElementById("btn-toggle-watch")
  ?.addEventListener("click", async () => {
    const btn = document.getElementById(
      "btn-toggle-watch",
    ) as HTMLButtonElement;
    const status = (await sendToActiveTab({ type: "GET_WATCHER_STATUS" })) as {
      watching: boolean;
    } | null;

    if (status?.watching) {
      await sendToActiveTab({ type: "STOP_WATCHING" });
      btn.textContent = "👁️ Watch";
      btn.classList.remove("btn-active");
    } else {
      await sendToActiveTab({
        type: "START_WATCHING",
        payload: { autoRefill: true },
      });
      btn.textContent = "👁️ Ativo";
      btn.classList.add("btn-active");
    }
  });

// --- Init Watcher Status ---
async function initWatcherStatus(): Promise<void> {
  try {
    const status = (await sendToActiveTab({ type: "GET_WATCHER_STATUS" })) as {
      watching: boolean;
    } | null;
    const btn = document.getElementById(
      "btn-toggle-watch",
    ) as HTMLButtonElement;
    if (btn && status?.watching) {
      btn.textContent = "👁️ Ativo";
      btn.classList.add("btn-active");
    }
  } catch {
    // Content script may not be loaded yet
  }
}

// --- Ignored Fields ---
async function loadIgnoredFields(): Promise<void> {
  const ignored = (await sendToBackground({ type: "GET_IGNORED_FIELDS" })) as
    | IgnoredField[]
    | null;
  const list = document.getElementById("ignored-fields-list");
  const section = document.getElementById("section-ignored");
  if (!list || !section) return;

  list.innerHTML = "";
  if (!Array.isArray(ignored) || ignored.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "";

  for (const field of ignored) {
    const item = document.createElement("div");
    item.className = "list-item";

    // Show hostname + selector
    let displayUrl = field.urlPattern;
    try {
      displayUrl = new URL(field.urlPattern).hostname;
    } catch {
      // keep original
    }

    item.innerHTML = `
      <div class="field-info">
        <span class="field-label">${escapeHtml(field.label)}</span>
        <span class="ignored-url">${escapeHtml(displayUrl)}</span>
      </div>
      <button class="btn btn-sm btn-delete" title="Parar de ignorar">✕</button>
    `;

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await sendToBackground({
        type: "REMOVE_IGNORED_FIELD",
        payload: field.id,
      });
      await loadIgnoredFields();
    });

    list.appendChild(item);
  }
}

// --- Chrome AI Status ---
async function initChromeAIStatus(): Promise<void> {
  const banner = document.getElementById("chrome-ai-banner");
  const iconEl = document.getElementById("chrome-ai-icon");
  const textEl = document.getElementById("chrome-ai-text");
  const actionsEl = document.getElementById("chrome-ai-actions");
  if (!banner || !iconEl || !textEl || !actionsEl) return;

  // New Prompt API (Chrome 131+): LanguageModel global
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newApi = (globalThis as any).LanguageModel as
    | LanguageModelStatic
    | undefined;

  const openSetupPage = (): void => {
    chrome.tabs.create({
      url: "https://developer.chrome.com/docs/ai/get-started",
    });
  };

  const makeLinkBtn = (label: string): HTMLButtonElement => {
    const btn = document.createElement("button");
    btn.className = "btn btn-ai-action btn-ai-link";
    btn.textContent = label;
    btn.addEventListener("click", openSetupPage);
    return btn;
  };

  if (!newApi) {
    banner.className = "chrome-ai-banner chrome-ai-banner--unavailable";
    iconEl.textContent = "🤖";
    textEl.textContent = "Chrome AI não disponível neste navegador.";
    actionsEl.appendChild(makeLinkBtn("Como configurar →"));
    banner.style.display = "flex";
    return;
  }

  try {
    // Resolve availability using whichever API is present
    let availability: string;
    if (newApi) {
      availability = await newApi.availability({
        outputLanguage: "en",
      });
      // new API: "available" | "downloadable" | "downloading" | "unavailable"
    } else {
      availability = "unavailable";
    }

    if (availability === "available") {
      banner.className = "chrome-ai-banner chrome-ai-banner--ready";
      iconEl.textContent = "🤖";
      textEl.textContent = "Chrome AI ativo e pronto.";
      banner.style.display = "flex";
      setTimeout(() => {
        banner.style.display = "none";
      }, 3000);
    } else if (
      availability === "downloadable" ||
      availability === "downloading"
    ) {
      banner.className = "chrome-ai-banner chrome-ai-banner--download";
      iconEl.textContent = "🤖";
      textEl.textContent =
        availability === "downloading"
          ? "Chrome AI está sendo baixado…"
          : "Chrome AI disponível, mas o modelo precisa ser baixado.";

      const downloadBtn = document.createElement("button");
      downloadBtn.className = "btn btn-ai-action btn-ai-download";
      downloadBtn.textContent = "⬇️ Baixar agora";
      downloadBtn.addEventListener("click", async () => {
        downloadBtn.disabled = true;
        downloadBtn.textContent = "⏳ Baixando…";
        try {
          // Creating a session triggers the model download
          const session = await newApi!.create({ outputLanguage: "en" });
          session.destroy();
          banner.className = "chrome-ai-banner chrome-ai-banner--ready";
          iconEl.textContent = "🤖";
          textEl.textContent = "Chrome AI baixado com sucesso!";
          actionsEl.innerHTML = "";
          setTimeout(() => {
            banner.style.display = "none";
          }, 3000);
        } catch {
          downloadBtn.disabled = false;
          downloadBtn.textContent = "⬇️ Baixar agora";
          textEl.textContent = "Falha ao iniciar download. Tente manualmente.";
          actionsEl.appendChild(makeLinkBtn("Como configurar →"));
        }
      });

      actionsEl.appendChild(downloadBtn);
      actionsEl.appendChild(makeLinkBtn("Como configurar →"));
      banner.style.display = "flex";
    } else {
      // "unavailable" — not supported on this device/channel
      banner.className = "chrome-ai-banner chrome-ai-banner--unavailable";
      iconEl.textContent = "🤖";
      textEl.textContent =
        "Chrome AI não suportado neste dispositivo ou canal.";
      actionsEl.appendChild(makeLinkBtn("Ver requisitos →"));
      banner.style.display = "flex";
    }
  } catch {
    // Silently skip if capabilities check fails
  }
}

// --- Init ---
loadSavedForms();
loadIgnoredFields();
loadDetectedFieldsFromCache();
initWatcherStatus();
initGeneratorConfigs();
initChromeAIStatus();

function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
