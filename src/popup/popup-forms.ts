/**
 * Popup — saved forms section (apply template, edit, delete, render)
 */

import type { SavedForm, FormTemplateField, FieldType } from "@/types";
import { FIELD_TYPES } from "@/types";
import {
  sendToActiveTab,
  sendToBackground,
  escapeHtml,
} from "./popup-messaging";
import { t } from "@/lib/i18n";

function fieldCount(form: SavedForm): number {
  if (form.templateFields && form.templateFields.length > 0) {
    return form.templateFields.length;
  }
  return Object.keys(form.fields || {}).length;
}

function fieldSummary(form: SavedForm): string {
  if (form.templateFields && form.templateFields.length > 0) {
    const fixed = form.templateFields.filter((f) => f.mode === "fixed").length;
    const gen = form.templateFields.filter(
      (f) => f.mode === "generator",
    ).length;
    const parts: string[] = [];
    if (fixed > 0) parts.push(t("summaryFixed", [String(fixed)]));
    if (gen > 0) parts.push(t("summaryGenerator", [String(gen)]));
    return parts.join(", ");
  }
  return t("summaryFields", [String(Object.keys(form.fields || {}).length)]);
}

export async function loadSavedForms(): Promise<void> {
  const forms = (await sendToBackground({ type: "GET_SAVED_FORMS" })) as
    | SavedForm[]
    | null;
  const list = document.getElementById("saved-forms-list");
  if (!list) return;

  list.innerHTML = "";
  if (!Array.isArray(forms) || forms.length === 0) {
    list.innerHTML = `<div class="empty">${t("noSavedForms")}</div>`;
    return;
  }

  for (const form of forms) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-info">
        <span class="form-name">${escapeHtml(form.name)}</span>
        <span class="form-url">${escapeHtml(form.urlPattern)}</span>
        <span class="form-fields">${escapeHtml(fieldSummary(form))}</span>
      </div>
      <div class="form-actions">
        <button class="btn btn-sm btn-apply" data-form-id="${escapeHtml(form.id)}" title="${t("tooltipApply")}">${t("btnApply")}</button>
        <button class="btn btn-sm btn-edit" data-form-id="${escapeHtml(form.id)}" title="${t("tooltipEdit")}">${t("btnEdit")}</button>
        <button class="btn btn-sm btn-delete" data-form-id="${escapeHtml(form.id)}" title="${t("btnDelete")}">✕</button>
      </div>
    `;

    item.querySelector(".btn-apply")?.addEventListener("click", async () => {
      await sendToActiveTab({ type: "APPLY_TEMPLATE", payload: form });
    });

    item.querySelector(".btn-edit")?.addEventListener("click", () => {
      openEditModal(form);
    });

    item.querySelector(".btn-delete")?.addEventListener("click", async () => {
      await sendToBackground({ type: "DELETE_FORM", payload: form.id });
      await loadSavedForms();
    });

    list.appendChild(item);
  }
}

function getOrCreateModal(): HTMLElement {
  let modal = document.getElementById("edit-form-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "edit-form-modal";
  modal.className = "modal-overlay";
  document.body.appendChild(modal);
  return modal;
}

function buildGeneratorOptions(selected?: string): string {
  return FIELD_TYPES.map(
    (ft) =>
      `<option value="${ft}"${ft === selected ? " selected" : ""}>${ft}</option>`,
  ).join("");
}

function buildFieldRow(field: FormTemplateField): string {
  const isFixed = field.mode === "fixed";
  return `
    <div class="template-field-row" data-key="${escapeHtml(field.key)}">
      <div class="field-row-label">${escapeHtml(field.label || field.key)}</div>
      <div class="field-row-controls">
        <select class="field-mode-select">
          <option value="fixed"${isFixed ? " selected" : ""}>${t("fixedValue")}</option>
          <option value="generator"${!isFixed ? " selected" : ""}>${t("generatorMode")}</option>
        </select>
        <input
          type="text"
          class="field-fixed-value"
          placeholder="${t("fixedValue")}"
          value="${escapeHtml(field.fixedValue ?? "")}"
          style="display:${isFixed ? "inline-block" : "none"}"
        />
        <select
          class="field-generator-select"
          style="display:${isFixed ? "none" : "inline-block"}"
        >
          ${buildGeneratorOptions(field.generatorType)}
        </select>
      </div>
    </div>
  `;
}

function legacyFieldsToTemplate(
  fields: Record<string, string>,
): FormTemplateField[] {
  return Object.entries(fields).map(([key, value]) => ({
    key,
    label: key,
    mode: "fixed" as const,
    fixedValue: value,
  }));
}

function openEditModal(form: SavedForm): void {
  const modal = getOrCreateModal();
  const templateFields =
    form.templateFields && form.templateFields.length > 0
      ? form.templateFields
      : legacyFieldsToTemplate(form.fields);

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${t("editTemplate")}</h3>
        <button class="modal-close" title="${t("fpClose")}">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>${t("formName")}</label>
          <input type="text" id="edit-form-name" value="${escapeHtml(form.name)}" />
        </div>
        <div class="form-group">
          <label>${t("formUrl")}</label>
          <input type="text" id="edit-form-url" value="${escapeHtml(form.urlPattern)}" />
        </div>
        <div class="template-fields-list">
          ${templateFields.map(buildFieldRow).join("")}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="edit-form-save">${t("btnSave")}</button>
        <button class="btn btn-secondary" id="edit-form-cancel">${t("btnCancel")}</button>
      </div>
    </div>
  `;
  modal.style.display = "flex";

  // Toggle between fixed/generator inputs
  modal.querySelectorAll(".field-mode-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const row = target.closest(".template-field-row")!;
      const isFixed = target.value === "fixed";
      (row.querySelector(".field-fixed-value") as HTMLElement).style.display =
        isFixed ? "inline-block" : "none";
      (
        row.querySelector(".field-generator-select") as HTMLElement
      ).style.display = isFixed ? "none" : "inline-block";
    });
  });

  modal.querySelector(".modal-close")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.querySelector("#edit-form-cancel")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal
    .querySelector("#edit-form-save")
    ?.addEventListener("click", async () => {
      const nameInput = modal.querySelector(
        "#edit-form-name",
      ) as HTMLInputElement;
      const urlInput = modal.querySelector(
        "#edit-form-url",
      ) as HTMLInputElement;

      const updatedFields: FormTemplateField[] = [];
      modal.querySelectorAll(".template-field-row").forEach((row) => {
        const key = (row as HTMLElement).dataset.key ?? "";
        const label =
          row.querySelector(".field-row-label")?.textContent?.trim() ?? key;
        const mode = (
          row.querySelector(".field-mode-select") as HTMLSelectElement
        ).value as "fixed" | "generator";
        const fixedValue = (
          row.querySelector(".field-fixed-value") as HTMLInputElement
        ).value;
        const generatorType = (
          row.querySelector(".field-generator-select") as HTMLSelectElement
        ).value as FieldType;

        updatedFields.push({
          key,
          label,
          mode,
          fixedValue: mode === "fixed" ? fixedValue : undefined,
          generatorType: mode === "generator" ? generatorType : undefined,
        });
      });

      const updatedForm: SavedForm = {
        ...form,
        name: nameInput.value || form.name,
        urlPattern: urlInput.value || form.urlPattern,
        templateFields: updatedFields,
        updatedAt: Date.now(),
      };

      await sendToBackground({ type: "UPDATE_FORM", payload: updatedForm });
      modal.style.display = "none";
      await loadSavedForms();
    });
}
