import type { GeneratorParams } from "@/types";
import type { GeneratorParamDef } from "@/types/field-type-definitions";
import { t } from "@/lib/i18n";
import { escapeHtml } from "./html-utils";

/**
 * Collects generator parameters from input and select elements within a container.
 * Elements must have a `data-param-key` attribute.
 */
export function collectGeneratorParams(
  container: HTMLElement,
): GeneratorParams | undefined {
  if (!container) return undefined;

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
    } else if (input.type === "text") {
      if (input.value !== "") {
        params[key] = input.value;
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

/**
 * Renders a single generator parameter field as an HTML string.
 */
export function renderGeneratorParamField(
  def: GeneratorParamDef,
  currentValue: unknown,
  options: { prefix?: string } = {},
): string {
  const p = options.prefix ?? "";
  const label = t(def.labelKey) || def.labelKey;
  const value = currentValue ?? def.defaultValue;

  if (def.type === "select" && def.selectOptions) {
    const selectOptionsHtml = def.selectOptions
      .map((opt) => {
        const optLabel = t(opt.labelKey) || opt.labelKey;
        const selected = opt.value === value ? "selected" : "";
        return `<option value="${escapeHtml(opt.value)}" ${selected}>${escapeHtml(optLabel)}</option>`;
      })
      .join("");
    return `
      <div class="${p}form-group ${p}param-field">
        <label class="${p}param-label">${escapeHtml(label)}</label>
        <select data-param-key="${def.key}" class="${p}input ${p}param-input">${selectOptionsHtml}</select>
      </div>`;
  }

  if (def.type === "boolean") {
    const checked = value ? "checked" : "";
    return `
      <div class="${p}form-group ${p}param-field">
        <label class="${p}param-toggle">
          <input type="checkbox" data-param-key="${def.key}" ${checked} />
          <span>${escapeHtml(label)}</span>
        </label>
      </div>`;
  }

  if (def.type === "text") {
    const placeholder = def.placeholder ? t(def.placeholder) : "";
    return `
      <div class="${p}form-group ${p}param-field">
        <label class="${p}param-label">${escapeHtml(label)}</label>
        <input type="text" data-param-key="${def.key}" value="${escapeHtml(String(value))}" placeholder="${escapeHtml(placeholder)}" class="${p}input ${p}param-input" />
      </div>`;
  }

  const min = def.min != null ? `min="${def.min}"` : "";
  const max = def.max != null ? `max="${def.max}"` : "";
  const step = def.step != null ? `step="${def.step}"` : "";
  return `
    <div class="${p}form-group ${p}param-field">
      <label class="${p}param-label">${escapeHtml(label)}</label>
      <input type="number" data-param-key="${def.key}" value="${value ?? ""}" ${min} ${max} ${step} class="${p}input ${p}param-input" />
    </div>`;
}

/**
 * Renders multiple generator parameter fields as an HTML string.
 */
export function renderGeneratorParamFields(
  paramDefs: readonly GeneratorParamDef[],
  existingParams?: GeneratorParams,
  options: { prefix?: string; includeTitle?: boolean } = {},
): string {
  const fieldsHtml = paramDefs
    .map((def) => {
      const currentValue = existingParams?.[def.key];
      return renderGeneratorParamField(def, currentValue, options);
    })
    .join("");

  if (options.includeTitle) {
    const title = t("paramSectionTitle") || "Parâmetros do Gerador";
    const p = options.prefix ?? "";
    return `<div class="${p}param-title">${escapeHtml(title)}</div>${fieldsHtml}`;
  }

  return fieldsHtml;
}
