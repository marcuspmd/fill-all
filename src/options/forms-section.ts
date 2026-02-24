/**
 * Saved Forms tab — list, create, edit, and delete saved form templates.
 */

import type { SavedForm, FormTemplateField, FieldType } from "@/types";
import { FIELD_TYPES } from "@/types";
import { escapeHtml, showToast } from "./shared";

/** Labels mais legíveis para os tipos de campo */
const FIELD_TYPE_LABELS: Partial<Record<FieldType, string>> = {
  name: "Nome",
  "first-name": "Primeiro nome",
  "last-name": "Sobrenome",
  "full-name": "Nome completo",
  email: "E-mail",
  phone: "Telefone",
  mobile: "Celular",
  cpf: "CPF",
  cnpj: "CNPJ",
  "cpf-cnpj": "CPF / CNPJ",
  rg: "RG",
  "birth-date": "Data de nascimento",
  date: "Data",
  address: "Endereço",
  street: "Rua",
  "house-number": "Número",
  complement: "Complemento",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  country: "País",
  cep: "CEP",
  password: "Senha",
  "confirm-password": "Confirmar senha",
  username: "Usuário",
  company: "Empresa",
  "job-title": "Cargo",
  "credit-card-number": "Cartão de crédito",
  "credit-card-expiration": "Validade do cartão",
  "credit-card-cvv": "CVV",
  "pix-key": "Chave Pix",
  money: "Valor monetário",
  website: "Site",
  text: "Texto genérico",
  number: "Número",
};

function fieldTypeLabel(ft: FieldType): string {
  return FIELD_TYPE_LABELS[ft] ?? ft;
}

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

function buildFieldTypeOptions(selected?: string): string {
  return FIELD_TYPES.map(
    (ft) =>
      `<option value="${ft}"${ft === selected ? " selected" : ""}>${fieldTypeLabel(ft)} (${ft})</option>`,
  ).join("");
}

function buildGeneratorOptions(selected?: string): string {
  return FIELD_TYPES.map(
    (ft) =>
      `<option value="${ft}"${ft === selected ? " selected" : ""}>${fieldTypeLabel(ft)} (${ft})</option>`,
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

/** Cria uma linha de campo para o painel de criação/edição de template por tipo */
function buildTemplateFieldRow(field?: Partial<FormTemplateField>): string {
  const matchType = field?.matchByFieldType ?? "name";
  const mode = field?.mode ?? "fixed";
  const fixedValue = field?.fixedValue ?? "";
  const generatorType = field?.generatorType ?? "name";
  return `
    <tr class="template-field-row">
      <td>
        <select class="field-type-match-select">
          ${buildFieldTypeOptions(matchType)}
        </select>
      </td>
      <td>
        <select class="field-mode-select">
          <option value="fixed"${mode === "fixed" ? " selected" : ""}>Valor fixo</option>
          <option value="generator"${mode === "generator" ? " selected" : ""}>Gerador</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          class="field-fixed-value"
          placeholder="Valor..."
          value="${escapeHtml(fixedValue)}"
          style="display:${mode === "fixed" ? "inline-block" : "none"}"
        />
        <select
          class="field-generator-select"
          style="display:${mode === "generator" ? "inline-block" : "none"}"
        >
          ${buildGeneratorOptions(generatorType)}
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-delete btn-remove-row" title="Remover campo">✕</button>
      </td>
    </tr>
  `;
}

/** Abre o painel de criação de template (em branco) */
function openCreatePanel(): void {
  const existing = document.getElementById("form-create-panel");
  if (existing) {
    existing.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const panel = document.createElement("div");
  panel.id = "form-create-panel";
  panel.className = "edit-panel";
  panel.innerHTML = `
    <h3>Criar Template</h3>
    <div class="form-group">
      <label>Nome do template</label>
      <input type="text" id="create-form-name" placeholder="Ex: Cadastro padrão" />
    </div>
    <div class="form-group">
      <label>URL / Padrão</label>
      <input type="text" id="create-form-url" placeholder="* = qualquer site  |  Ex: *.linkedin.com/*" />
      <div class="description" style="margin-top:4px;font-size:11px;color:var(--text-muted);">
        Deixe vazio ou use <code>*</code> para funcionar em qualquer site.
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <strong style="font-size:13px;">Campos</strong>
      <div class="description" style="font-size:11px;color:var(--text-muted);margin-top:2px;">
        Defina o tipo do campo detectado e o valor que será preenchido.
      </div>
    </div>
    <table class="template-fields-table" id="create-fields-table">
      <thead>
        <tr>
          <th>Tipo do campo detectado</th>
          <th>Modo</th>
          <th>Valor / Gerador</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="create-fields-tbody">
        ${buildTemplateFieldRow({ matchByFieldType: "name", mode: "fixed", fixedValue: "" })}
      </tbody>
    </table>
    <div style="margin-bottom:12px;">
      <button class="btn btn-secondary btn-sm" id="create-add-field-row">+ Adicionar campo</button>
    </div>
    <div class="edit-panel-actions">
      <button class="btn btn-primary" id="create-panel-save">Salvar template</button>
      <button class="btn btn-secondary" id="create-panel-cancel">Cancelar</button>
    </div>
  `;

  document.getElementById("saved-forms-list")?.before(panel);
  bindCreatePanelEvents(panel);
  panel.scrollIntoView({ behavior: "smooth" });
}

function bindCreatePanelEvents(panel: HTMLElement): void {
  // Toggle fixed/generator on mode change
  panel.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    if (!target.classList.contains("field-mode-select")) return;
    const row = target.closest("tr")!;
    const isFixed = target.value === "fixed";
    (row.querySelector(".field-fixed-value") as HTMLElement).style.display =
      isFixed ? "inline-block" : "none";
    (
      row.querySelector(".field-generator-select") as HTMLElement
    ).style.display = isFixed ? "none" : "inline-block";
  });

  // Remove field row
  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("btn-remove-row")) return;
    target.closest("tr")?.remove();
  });

  // Add field row
  panel
    .querySelector("#create-add-field-row")
    ?.addEventListener("click", () => {
      const tbody = panel.querySelector("#create-fields-tbody");
      if (!tbody) return;
      const tr = document.createElement("tr");
      tr.className = "template-field-row";
      tr.innerHTML = buildTemplateFieldRow()
        .replace(/^<tr[^>]*>/, "")
        .replace(/<\/tr>$/, "");
      // Actually insert the full row via innerHTML on a wrapper
      const wrapper = document.createElement("tbody");
      wrapper.innerHTML = buildTemplateFieldRow();
      const newRow = wrapper.querySelector("tr");
      if (newRow) tbody.appendChild(newRow);
    });

  panel.querySelector("#create-panel-cancel")?.addEventListener("click", () => {
    panel.remove();
  });

  panel
    .querySelector("#create-panel-save")
    ?.addEventListener("click", async () => {
      const nameInput = panel.querySelector(
        "#create-form-name",
      ) as HTMLInputElement;
      const urlInput = panel.querySelector(
        "#create-form-url",
      ) as HTMLInputElement;

      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        showToast("Informe o nome do template");
        return;
      }

      const urlPattern = urlInput.value.trim() || "*";
      const templateFields: FormTemplateField[] = [];

      panel.querySelectorAll("tr.template-field-row").forEach((row) => {
        const matchType = (
          row.querySelector(".field-type-match-select") as HTMLSelectElement
        ).value as FieldType;
        const mode = (
          row.querySelector(".field-mode-select") as HTMLSelectElement
        ).value as "fixed" | "generator";
        const fixedValue = (
          row.querySelector(".field-fixed-value") as HTMLInputElement
        ).value;
        const generatorType = (
          row.querySelector(".field-generator-select") as HTMLSelectElement
        ).value as FieldType;

        templateFields.push({
          key: matchType,
          label: fieldTypeLabel(matchType),
          mode,
          matchByFieldType: matchType,
          fixedValue: mode === "fixed" ? fixedValue : undefined,
          generatorType: mode === "generator" ? generatorType : undefined,
        });
      });

      const newForm: SavedForm = {
        id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        urlPattern,
        fields: {},
        templateFields,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await chrome.runtime.sendMessage({
        type: "UPDATE_FORM",
        payload: newForm,
      });
      panel.remove();
      await loadSavedForms();
      showToast(`Template "${name}" criado com sucesso`);
    });
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

  // Determina se este template usa match por tipo (type-based) ou por seletor
  const isTypeBased = templateFields.some((f) => f.matchByFieldType);

  panel.innerHTML = `
    <h3>Editar Template: ${escapeHtml(form.name)}</h3>
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="edit-form-name" value="${escapeHtml(form.name)}" />
    </div>
    <div class="form-group">
      <label>URL / Padrão</label>
      <input type="text" id="edit-form-url" value="${escapeHtml(form.urlPattern)}" />
      <div class="description" style="margin-top:4px;font-size:11px;color:var(--text-muted);">
        Use <code>*</code> para funcionar em qualquer site.
      </div>
    </div>
    <div style="margin-bottom:8px;">
      <strong style="font-size:13px;">Campos</strong>
    </div>
    <table class="template-fields-table">
      <thead>
        <tr>
          <th>${isTypeBased ? "Tipo do campo detectado" : "Campo"}</th>
          <th>Modo</th>
          <th>Valor / Gerador</th>
          ${isTypeBased ? "<th></th>" : ""}
        </tr>
      </thead>
      <tbody id="edit-fields-tbody">
        ${templateFields
          .map((field) =>
            isTypeBased
              ? buildTemplateFieldRow(field)
              : `
          <tr data-key="${escapeHtml(field.key)}" class="template-field-row">
            <td class="field-label-cell">${escapeHtml(field.label || field.key)}</td>
            <td>
              <select class="field-mode-select">
                <option value="fixed"${field.mode === "fixed" ? " selected" : ""}>Valor fixo</option>
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
    ${isTypeBased ? `<div style="margin-bottom:12px;"><button class="btn btn-secondary btn-sm" id="edit-add-field-row">+ Adicionar campo</button></div>` : ""}
    <div class="edit-panel-actions">
      <button class="btn btn-primary" id="edit-panel-save">Salvar</button>
      <button class="btn btn-secondary" id="edit-panel-cancel">Cancelar</button>
    </div>
  `;

  // Toggle fixed/generator visibility on change
  panel.addEventListener("change", (e) => {
    const target = e.target as HTMLSelectElement;
    if (!target.classList.contains("field-mode-select")) return;
    const row = target.closest("tr")!;
    const isFixed = target.value === "fixed";
    (row.querySelector(".field-fixed-value") as HTMLElement).style.display =
      isFixed ? "inline-block" : "none";
    (
      row.querySelector(".field-generator-select") as HTMLElement
    ).style.display = isFixed ? "none" : "inline-block";
  });

  // Remove row (type-based only)
  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("btn-remove-row")) return;
    target.closest("tr")?.remove();
  });

  // Add field row (type-based only)
  panel.querySelector("#edit-add-field-row")?.addEventListener("click", () => {
    const tbody = panel!.querySelector("#edit-fields-tbody");
    if (!tbody) return;
    const wrapper = document.createElement("tbody");
    wrapper.innerHTML = buildTemplateFieldRow();
    const newRow = wrapper.querySelector("tr");
    if (newRow) tbody.appendChild(newRow);
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
      panel!.querySelectorAll("tr.template-field-row").forEach((row) => {
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

        if (isTypeBased) {
          const matchType = (
            row.querySelector(".field-type-match-select") as HTMLSelectElement
          ).value as FieldType;
          updatedFields.push({
            key: matchType,
            label: fieldTypeLabel(matchType),
            mode,
            matchByFieldType: matchType,
            fixedValue: mode === "fixed" ? fixedValue : undefined,
            generatorType: mode === "generator" ? generatorType : undefined,
          });
        } else {
          updatedFields.push({
            key,
            label,
            mode,
            fixedValue: mode === "fixed" ? fixedValue : undefined,
            generatorType: mode === "generator" ? generatorType : undefined,
          });
        }
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

async function exportForms(): Promise<void> {
  const forms = (await chrome.runtime.sendMessage({
    type: "GET_SAVED_FORMS",
  })) as SavedForm[];

  if (!Array.isArray(forms) || forms.length === 0) {
    showToast("Nenhum formulário para exportar");
    return;
  }

  const payload = JSON.stringify({ version: 1, forms }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `fill-all-forms-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(
    `${forms.length} formulário${forms.length > 1 ? "s" : ""} exportado${forms.length > 1 ? "s" : ""}`,
  );
}

async function importForms(file: File): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    showToast("Arquivo inválido: não é um JSON válido");
    return;
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).forms)
  ) {
    showToast("Arquivo inválido: formato não reconhecido");
    return;
  }

  const forms = (parsed as { forms: unknown[] }).forms;
  let count = 0;

  for (const form of forms) {
    if (
      typeof form !== "object" ||
      form === null ||
      typeof (form as Record<string, unknown>).id !== "string" ||
      typeof (form as Record<string, unknown>).name !== "string"
    ) {
      continue;
    }

    await chrome.runtime.sendMessage({
      type: "UPDATE_FORM",
      payload: form,
    });
    count++;
  }

  await loadSavedForms();
  showToast(
    count > 0
      ? `${count} formulário${count > 1 ? "s" : ""} importado${count > 1 ? "s" : ""} com sucesso`
      : "Nenhum formulário válido encontrado no arquivo",
  );
}

export function initFormsTab(): void {
  void loadSavedForms();

  document
    .getElementById("btn-create-template")
    ?.addEventListener("click", () => {
      openCreatePanel();
    });

  document.getElementById("btn-export-forms")?.addEventListener("click", () => {
    void exportForms();
  });

  const fileInput = document.getElementById(
    "import-forms-file",
  ) as HTMLInputElement | null;

  document.getElementById("btn-import-forms")?.addEventListener("click", () => {
    fileInput?.click();
  });

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    void importForms(file);
    fileInput.value = "";
  });
}
