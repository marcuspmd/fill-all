/**
 * Saved Forms tab — list, edit, and delete saved forms.
 */

import type { SavedForm, FormTemplateField, FieldType } from "@/types";
import { FIELD_TYPES } from "@/types";
import { escapeHtml, showToast } from "./shared";

function fieldSummary(form: SavedForm): string {
  if (form.templateFields && form.templateFields.length > 0) {
    const fixed = form.templateFields.filter((f) => f.mode === "fixed").length;
    const gen = form.templateFields.filter(
      (f) => f.mode === "generator",
    ).length;
    const parts: string[] = [];
    if (fixed > 0) parts.push(`${fixed} fixo${fixed > 1 ? "s" : ""}`);
    if (gen > 0) parts.push(`${gen} gerador${gen > 1 ? "es" : ""}`);
    return parts.join(", ");
  }
  return `${Object.keys(form.fields || {}).length} campos`;
}

function buildGeneratorOptions(selected?: string): string {
  return FIELD_TYPES.map(
    (ft) =>
      `<option value="${ft}"${ft === selected ? " selected" : ""}>${ft}</option>`,
  ).join("");
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
        <span class="badge">${escapeHtml(fieldSummary(form))}</span>
      </div>
      <div class="rule-actions">
        <button class="btn btn-sm btn-edit" data-form-id="${escapeHtml(form.id)}">Editar</button>
        <button class="btn btn-sm btn-delete" data-form-id="${escapeHtml(form.id)}">Excluir</button>
      </div>
    `;

    item.querySelector(".btn-edit")?.addEventListener("click", () => {
      openEditPanel(form);
    });

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

function openEditPanel(form: SavedForm): void {
  let panel = document.getElementById("form-edit-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "form-edit-panel";
    panel.className = "edit-panel";
    document.getElementById("saved-forms-list")?.after(panel);
  }

  const templateFields =
    form.templateFields && form.templateFields.length > 0
      ? form.templateFields
      : legacyFieldsToTemplate(form.fields);

  panel.innerHTML = `
    <h3>Editar Template: ${escapeHtml(form.name)}</h3>
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="edit-form-name" value="${escapeHtml(form.name)}" />
    </div>
    <div class="form-group">
      <label>URL Pattern</label>
      <input type="text" id="edit-form-url" value="${escapeHtml(form.urlPattern)}" />
    </div>
    <table class="template-fields-table">
      <thead>
        <tr>
          <th>Campo</th>
          <th>Modo</th>
          <th>Valor / Gerador</th>
        </tr>
      </thead>
      <tbody>
        ${templateFields
          .map(
            (field) => `
          <tr data-key="${escapeHtml(field.key)}">
            <td class="field-label-cell">${escapeHtml(field.label || field.key)}</td>
            <td>
              <select class="field-mode-select">
                <option value="fixed"${field.mode === "fixed" ? " selected" : ""}>Fixo</option>
                <option value="generator"${field.mode === "generator" ? " selected" : ""}>Gerador</option>
              </select>
            </td>
            <td>
              <input
                type="text"
                class="field-fixed-value"
                value="${escapeHtml(field.fixedValue ?? "")}"
                style="display:${field.mode === "fixed" ? "inline-block" : "none"}"
              />
              <select
                class="field-generator-select"
                style="display:${field.mode === "generator" ? "inline-block" : "none"}"
              >
                ${buildGeneratorOptions(field.generatorType)}
              </select>
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
    <div class="edit-panel-actions">
      <button class="btn btn-primary" id="edit-panel-save">Salvar</button>
      <button class="btn btn-secondary" id="edit-panel-cancel">Cancelar</button>
    </div>
  `;

  panel.querySelectorAll(".field-mode-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const target = e.target as HTMLSelectElement;
      const row = target.closest("tr")!;
      const isFixed = target.value === "fixed";
      (row.querySelector(".field-fixed-value") as HTMLElement).style.display =
        isFixed ? "inline-block" : "none";
      (
        row.querySelector(".field-generator-select") as HTMLElement
      ).style.display = isFixed ? "none" : "inline-block";
    });
  });

  panel.querySelector("#edit-panel-cancel")?.addEventListener("click", () => {
    panel!.remove();
  });

  panel
    .querySelector("#edit-panel-save")
    ?.addEventListener("click", async () => {
      const nameInput = panel!.querySelector(
        "#edit-form-name",
      ) as HTMLInputElement;
      const urlInput = panel!.querySelector(
        "#edit-form-url",
      ) as HTMLInputElement;

      const updatedFields: FormTemplateField[] = [];
      panel!.querySelectorAll("tr[data-key]").forEach((row) => {
        const key = (row as HTMLElement).dataset.key ?? "";
        const label =
          row.querySelector(".field-label-cell")?.textContent?.trim() ?? key;
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

      await chrome.runtime.sendMessage({
        type: "UPDATE_FORM",
        payload: updatedForm,
      });
      panel!.remove();
      await loadSavedForms();
      showToast("Template atualizado");
    });
}

export function initFormsTab(): void {
  void loadSavedForms();
}
