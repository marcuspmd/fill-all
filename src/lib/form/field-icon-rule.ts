/**
 * Field Icon — rule quick-save popup for field-specific rules
 *
 * Features:
 * - Auto-suggestion: detects field type via HTML attributes + keyword classifier
 * - Live preview: shows generated value (or fixed value) in real-time
 * - Keyboard shortcuts: Enter to save, Escape to cancel
 */

import type { FieldRule, FieldType, FormField, GeneratorParams } from "@/types";
import { RULE_POPUP_ID } from "./field-icon-styles";
import { getUniqueSelector, findLabel, buildSignals } from "./extractors";
import {
  getFieldTypeOptions,
  getFieldTypeGroupedOptions,
} from "@/lib/shared/field-type-catalog";
import { generate } from "@/lib/generators";
import { detectBasicType } from "./detectors/html-type-detector";
import { keywordClassifier } from "./detectors/strategies/keyword-classifier";
import {
  getGeneratorKey,
  getGeneratorParamDefs,
  type GeneratorParamDef,
} from "@/types/field-type-definitions";

let rulePopupElement: HTMLElement | null = null;
let currentOnDismiss: (() => void) | null = null;
let currentSuggestedType: FieldType | undefined;
let currentRuleField: {
  selector: string;
  label: string;
  name?: string;
  id?: string;
} | null = null;

export function handleRuleButtonClick(
  target: HTMLElement,
  onDismiss: () => void,
): void {
  const selector = getUniqueSelector(target);
  const label =
    findLabel(target) ||
    target.getAttribute("name") ||
    target.getAttribute("id") ||
    "campo";
  const name = (target as HTMLInputElement).name || undefined;
  const id = target.id || undefined;

  currentRuleField = { selector, label, name, id };
  currentSuggestedType = detectSuggestedType(target);
  showRulePopup(target, onDismiss);
}

/**
 * Attempts a fast synchronous detection of the field type using
 * HTML type attributes first, then keyword classifier as fallback.
 */
function detectSuggestedType(target: HTMLElement): FieldType | undefined {
  const el = target as
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;
  const isFormEl =
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement;
  if (!isFormEl) return undefined;

  const htmlResult = detectBasicType(el);
  if (htmlResult.type !== "unknown" && htmlResult.type !== "text") {
    return htmlResult.type;
  }

  const label = findLabel(target) || undefined;
  const minimalField: Partial<FormField> = {
    element: el,
    name: (el as HTMLInputElement).name || undefined,
    id: el.id || undefined,
    placeholder:
      ("placeholder" in el
        ? (el as HTMLInputElement).placeholder
        : undefined) || undefined,
    label,
  };
  minimalField.contextSignals = buildSignals(minimalField as FormField);

  const kwResult = keywordClassifier.detect(minimalField as FormField);
  if (kwResult?.type && kwResult.type !== "unknown") {
    return kwResult.type;
  }

  return undefined;
}

function showRulePopup(anchor: HTMLElement, onDismiss: () => void): void {
  currentOnDismiss = onDismiss;

  if (!rulePopupElement) {
    rulePopupElement = document.createElement("div");
    rulePopupElement.id = RULE_POPUP_ID;
    rulePopupElement.innerHTML = getRulePopupHTML();
    document.body.appendChild(rulePopupElement);
    setupPopupListeners();
  }

  const nameEl =
    rulePopupElement.querySelector<HTMLElement>("#fa-rp-field-name");
  if (nameEl) nameEl.textContent = currentRuleField?.label || "";

  const fixedInput =
    rulePopupElement.querySelector<HTMLInputElement>("#fa-rp-fixed");
  if (fixedInput) fixedInput.value = "";

  const genSelect =
    rulePopupElement.querySelector<HTMLSelectElement>("#fa-rp-generator");
  const suggestionEl =
    rulePopupElement.querySelector<HTMLElement>("#fa-rp-suggestion");
  const suggestionTypeEl = rulePopupElement.querySelector<HTMLElement>(
    "#fa-rp-suggestion-type",
  );
  const saveBtn =
    rulePopupElement.querySelector<HTMLButtonElement>("#fa-rp-save");

  if (saveBtn) {
    saveBtn.textContent = "💾 Salvar";
    saveBtn.disabled = false;
  }

  if (genSelect) {
    if (currentSuggestedType) {
      const hasOption = Array.from(genSelect.options).some(
        (o) => o.value === currentSuggestedType,
      );
      genSelect.value = hasOption ? currentSuggestedType : "auto";
    } else {
      genSelect.value = "auto";
    }
  }

  if (suggestionEl && suggestionTypeEl) {
    if (currentSuggestedType) {
      const label =
        getFieldTypeOptions().find((o) => o.value === currentSuggestedType)
          ?.label ?? currentSuggestedType;
      suggestionTypeEl.textContent = label;
      suggestionEl.style.display = "flex";
    } else {
      suggestionEl.style.display = "none";
    }
  }

  updateParamsSection();
  updatePreview();
  positionRulePopup(anchor);
  rulePopupElement.style.display = "block";
  fixedInput?.focus();
}

function setupPopupListeners(): void {
  if (!rulePopupElement) return;

  rulePopupElement
    .querySelector("#fa-rp-save")!
    .addEventListener("mousedown", (e) => {
      e.preventDefault();
      void saveFieldRule();
    });

  rulePopupElement
    .querySelector("#fa-rp-cancel")!
    .addEventListener("mousedown", (e) => {
      e.preventDefault();
      hideRulePopup();
      currentOnDismiss?.();
    });

  rulePopupElement
    .querySelector("#fa-rp-fixed")
    ?.addEventListener("input", () => {
      updatePreview();
    });

  rulePopupElement
    .querySelector("#fa-rp-generator")
    ?.addEventListener("change", () => {
      updateParamsSection();
      updatePreview();
    });

  rulePopupElement
    .querySelector("#fa-rp-preview-refresh")
    ?.addEventListener("mousedown", (e) => {
      e.preventDefault();
      updatePreview();
    });

  document.addEventListener("keydown", handlePopupKeyDown);
}

function handlePopupKeyDown(e: KeyboardEvent): void {
  if (!rulePopupElement || rulePopupElement.style.display !== "block") return;

  if (e.key === "Enter") {
    e.preventDefault();
    void saveFieldRule();
  } else if (e.key === "Escape") {
    e.preventDefault();
    hideRulePopup();
    currentOnDismiss?.();
  }
}

function updateParamsSection(): void {
  if (!rulePopupElement) return;
  const container =
    rulePopupElement.querySelector<HTMLElement>("#fa-rp-params");
  if (!container) return;

  const genSelect =
    rulePopupElement.querySelector<HTMLSelectElement>("#fa-rp-generator");
  const selectedType = genSelect?.value ?? "auto";

  if (
    selectedType === "auto" ||
    selectedType === "ai" ||
    selectedType === "tensorflow"
  ) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const generatorKey = getGeneratorKey(selectedType as FieldType);
  const paramDefs = generatorKey ? getGeneratorParamDefs(generatorKey) : [];

  if (paramDefs.length === 0) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.innerHTML = renderParamFields(paramDefs);
  container.style.display = "block";

  // Listen for param changes to update preview
  container.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => updatePreview());
    el.addEventListener("change", () => updatePreview());
  });
}

function renderParamFields(paramDefs: readonly GeneratorParamDef[]): string {
  const fields = paramDefs
    .map((def) => {
      const label = chrome.i18n?.getMessage(def.labelKey) ?? def.labelKey;
      if (def.type === "select" && def.selectOptions) {
        const options = def.selectOptions
          .map((opt) => {
            const optLabel =
              chrome.i18n?.getMessage(opt.labelKey) ?? opt.labelKey;
            const selected = opt.value === def.defaultValue ? "selected" : "";
            return `<option value="${opt.value}" ${selected}>${optLabel}</option>`;
          })
          .join("");
        return `
          <div class="fa-rp-param-field">
            <label class="fa-rp-param-label">${label}</label>
            <select data-param-key="${def.key}" class="fa-rp-input fa-rp-param-input">${options}</select>
          </div>`;
      }
      if (def.type === "boolean") {
        const checked = def.defaultValue ? "checked" : "";
        return `
          <label class="fa-rp-param-toggle">
            <input type="checkbox" data-param-key="${def.key}" ${checked} />
            <span>${label}</span>
          </label>`;
      }
      const min = def.min != null ? `min="${def.min}"` : "";
      const max = def.max != null ? `max="${def.max}"` : "";
      const step = def.step != null ? `step="${def.step}"` : "";
      return `
        <div class="fa-rp-param-field">
          <label class="fa-rp-param-label">${label}</label>
          <input type="number" data-param-key="${def.key}" value="${def.defaultValue}" ${min} ${max} ${step} class="fa-rp-input fa-rp-param-input" />
        </div>`;
    })
    .join("");

  const title =
    chrome.i18n?.getMessage("paramSectionTitle") ?? "Parâmetros do Gerador";
  return `<div class="fa-rp-param-title">${title}</div>${fields}`;
}

function collectParamsFromUI(): GeneratorParams | undefined {
  if (!rulePopupElement) return undefined;
  const container =
    rulePopupElement.querySelector<HTMLElement>("#fa-rp-params");
  if (!container || container.style.display === "none") return undefined;

  const inputs = container.querySelectorAll<HTMLInputElement>(
    "input[data-param-key]",
  );
  const selects = container.querySelectorAll<HTMLSelectElement>(
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

function updatePreview(): void {
  if (!rulePopupElement) return;

  const fixedInput =
    rulePopupElement.querySelector<HTMLInputElement>("#fa-rp-fixed");
  const genSelect =
    rulePopupElement.querySelector<HTMLSelectElement>("#fa-rp-generator");
  const previewValueEl = rulePopupElement.querySelector<HTMLElement>(
    "#fa-rp-preview-value",
  );
  const refreshBtn = rulePopupElement.querySelector<HTMLElement>(
    "#fa-rp-preview-refresh",
  );

  if (!fixedInput || !genSelect || !previewValueEl) return;

  const fixedVal = fixedInput.value.trim();

  if (fixedVal) {
    previewValueEl.textContent = fixedVal;
    previewValueEl.className = "fa-rp-preview-fixed";
    if (refreshBtn) refreshBtn.style.display = "none";
  } else {
    const selectedType = genSelect.value;
    const typeToGenerate: FieldType =
      selectedType === "auto"
        ? (currentSuggestedType ?? "text")
        : (selectedType as FieldType);

    try {
      const overrideParams = collectParamsFromUI();
      previewValueEl.textContent = generate(typeToGenerate, overrideParams);
    } catch {
      previewValueEl.textContent = "—";
    }

    previewValueEl.className = "fa-rp-preview-generated";
    if (refreshBtn) refreshBtn.style.display = "flex";
  }
}

export function hideRulePopup(): void {
  if (rulePopupElement) {
    rulePopupElement.style.display = "none";
    currentRuleField = null;
  }
}

export function destroyRulePopup(): void {
  document.removeEventListener("keydown", handlePopupKeyDown);
  rulePopupElement?.remove();
  rulePopupElement = null;
  currentRuleField = null;
  currentOnDismiss = null;
  currentSuggestedType = undefined;
}

function positionRulePopup(anchor: HTMLElement): void {
  if (!rulePopupElement) return;

  const rect = anchor.getBoundingClientRect();
  const popupWidth = 280;
  const popupHeight = 280;

  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;

  if (left + popupWidth > window.innerWidth + window.scrollX - 8) {
    left = window.innerWidth + window.scrollX - popupWidth - 8;
  }
  left = Math.max(window.scrollX + 8, left);

  if (top + popupHeight > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - popupHeight - 4;
  }

  rulePopupElement.style.top = `${top}px`;
  rulePopupElement.style.left = `${left}px`;
}

function getRulePopupHTML(): string {
  const groups = getFieldTypeGroupedOptions();
  const generatorTypeOptions = groups
    .map(
      (group) =>
        `<optgroup label="${group.label}">${group.options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}</optgroup>`,
    )
    .join("");

  return `
    <div class="fa-rp-header">📌 Regra — <span id="fa-rp-field-name"></span></div>
    <div class="fa-rp-body">
      <div class="fa-rp-suggestion" id="fa-rp-suggestion" style="display:none">
        ✨ Sugerido: <span id="fa-rp-suggestion-type"></span>
      </div>
      <div class="fa-rp-group">
        <label class="fa-rp-label">Valor fixo</label>
        <input type="text" id="fa-rp-fixed" class="fa-rp-input" placeholder="Deixe vazio para usar gerador" />
      </div>
      <div class="fa-rp-group">
        <label class="fa-rp-label">Gerador automático</label>
        <select id="fa-rp-generator" class="fa-rp-select">
          <option value="auto">Auto (detectar)</option>
          ${generatorTypeOptions}
        </select>
      </div>
      <div id="fa-rp-params" class="fa-rp-params" style="display:none"></div>
      <div class="fa-rp-preview">
        <span class="fa-rp-preview-label">Preview</span>
        <span id="fa-rp-preview-value" class="fa-rp-preview-generated">—</span>
        <button id="fa-rp-preview-refresh" type="button" title="Gerar novo valor" style="display:none">↻</button>
      </div>
      <div class="fa-rp-actions">
        <button id="fa-rp-save" class="fa-rp-btn-primary" type="button">💾 Salvar</button>
        <button id="fa-rp-cancel" class="fa-rp-btn-cancel" type="button">Cancelar</button>
      </div>
      <div class="fa-rp-hint">Enter para salvar · Esc para cancelar</div>
    </div>
  `;
}

async function saveFieldRule(): Promise<void> {
  if (!currentRuleField) return;

  const fixedInput =
    rulePopupElement?.querySelector<HTMLInputElement>("#fa-rp-fixed");
  const genSelect =
    rulePopupElement?.querySelector<HTMLSelectElement>("#fa-rp-generator");
  const fixedValue = fixedInput?.value.trim() || undefined;
  const generator = (genSelect?.value || "auto") as FieldRule["generator"];

  const rule: FieldRule = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    urlPattern: `${window.location.origin}${window.location.pathname}*`,
    fieldSelector: currentRuleField.selector,
    fieldName: currentRuleField.name || currentRuleField.id || undefined,
    fieldType: currentSuggestedType ?? "unknown",
    fixedValue,
    generator: fixedValue ? "auto" : generator,
    generatorParams: fixedValue ? undefined : collectParamsFromUI(),
    priority: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await chrome.runtime.sendMessage({ type: "SAVE_RULE", payload: rule });

  const saveBtn =
    rulePopupElement?.querySelector<HTMLButtonElement>("#fa-rp-save");
  if (saveBtn) {
    saveBtn.textContent = "✓ Salvo!";
    saveBtn.disabled = true;
    setTimeout(() => {
      hideRulePopup();
      currentOnDismiss?.();
    }, 800);
  }
}
