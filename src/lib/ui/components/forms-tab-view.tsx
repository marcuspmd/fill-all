/**
 * FormsTabView & EditFormScreen — Preact components for the Forms tab.
 *
 * FormsTabView: saved forms list with load / new / apply / edit / delete.
 * EditFormScreen: full editor for a saved form's template fields.
 */

import { h } from "preact";
import { useState, useMemo } from "preact/hooks";
import type {
  SavedForm,
  FormTemplateField,
  FormFieldMode,
  FieldType,
} from "@/types";
import { t } from "@/lib/i18n";
import { SearchableSelectPreact } from "@/lib/ui/searchable-select-preact";
import {
  buildFieldTypeSelectEntries,
  buildGeneratorSelectEntries,
} from "@/lib/ui/select-builders";

// ── FormsTabView ──────────────────────────────────────────────────────────────

export interface FormsTabViewCallbacks {
  onLoad: () => void;
  onNewForm: () => void;
  onApply: (form: SavedForm) => void;
  onEdit: (form: SavedForm) => void;
  onSetDefault: (form: SavedForm) => void;
  onDelete: (form: SavedForm) => void;
}

export interface FormsTabViewProps extends FormsTabViewCallbacks {
  savedForms: SavedForm[];
  formsLoaded: boolean;
}

export function FormsTabView({
  savedForms,
  formsLoaded,
  onLoad,
  onNewForm,
  onApply,
  onEdit,
  onSetDefault,
  onDelete,
}: FormsTabViewProps) {
  return (
    <div>
      <div class="fields-toolbar">
        <button class="btn" onClick={onLoad}>
          🔄 {t("btnLoadForms")}
        </button>
        <button class="btn btn-success" onClick={onNewForm}>
          + {t("btnNewForm")}
        </button>
        <span class="fields-count">
          {savedForms.length} {t("formCount")}
        </span>
      </div>
      <div class="forms-list">
        {!formsLoaded ? (
          <div class="empty">⏳ {t("logLoadingForms")}</div>
        ) : savedForms.length === 0 ? (
          <div class="empty">{t("loadFormsDesc")}</div>
        ) : (
          savedForms.map((form) => (
            <div key={form.id} class="form-card">
              <div class="form-info">
                <span class="form-name">
                  {form.name}
                  {form.isDefault && (
                    <span class="badge-default">{t("badgeDefault")}</span>
                  )}
                </span>
                <span class="form-meta">
                  {form.templateFields?.length ??
                    Object.keys(form.fields).length}{" "}
                  {t("fieldCount")} ·{" "}
                  {new Date(form.updatedAt).toLocaleDateString()}
                </span>
                <span class="form-url">{form.urlPattern}</span>
              </div>
              <div class="form-actions">
                <button class="btn btn-sm" onClick={() => onApply(form)}>
                  ▶️ {t("btnApply")}
                </button>
                <button
                  class="btn btn-sm btn-warning"
                  onClick={() => onEdit(form)}
                >
                  ✏️ {t("btnEdit")}
                </button>
                <button
                  class="btn btn-sm btn-secondary"
                  title={t("btnSetDefault")}
                  onClick={() => onSetDefault(form)}
                >
                  ⭐
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  title={t("msgConfirmDeleteForm")}
                  onClick={() => onDelete(form)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── EditFormScreen ────────────────────────────────────────────────────────────

export interface EditFormScreenProps {
  form: SavedForm;
  isNew?: boolean;
  onSave: (updated: SavedForm) => void;
  onCancel: () => void;
}

function normaliseFields(form: SavedForm): FormTemplateField[] {
  if (form.templateFields && form.templateFields.length > 0) {
    return form.templateFields.map((f) => ({ ...f }));
  }
  return Object.entries(form.fields).map(([key, value]) => ({
    key,
    label: key,
    mode: "fixed" as FormFieldMode,
    fixedValue: value,
  }));
}

interface FieldRowEditorProps {
  field: FormTemplateField;
  index: number;
  onChange: (index: number, updated: Partial<FormTemplateField>) => void;
  onRemove: (index: number) => void;
}

function FieldRowEditor({
  field,
  index,
  onChange,
  onRemove,
}: FieldRowEditorProps) {
  const fieldTypeEntries = useMemo(() => buildFieldTypeSelectEntries(), []);
  const generatorEntries = useMemo(() => buildGeneratorSelectEntries(), []);

  return (
    <div class="edit-field-row" data-field-index={index}>
      <div class="edit-field-match-wrap">
        <SearchableSelectPreact
          entries={fieldTypeEntries}
          value={field.matchByFieldType ?? ""}
          onChange={(v) =>
            onChange(index, {
              matchByFieldType: v ? (v as FieldType) : undefined,
            })
          }
          placeholder={t("tooltipMatchByFieldType")}
        />
      </div>
      <div class="edit-field-controls">
        <select
          class="edit-select"
          value={field.mode}
          onChange={(e) =>
            onChange(index, {
              mode: (e.target as HTMLSelectElement).value as FormFieldMode,
            })
          }
        >
          <option value="fixed">{t("fixedValue")}</option>
          <option value="generator">{t("generatorMode")}</option>
        </select>
        {field.mode === "fixed" ? (
          <input
            type="text"
            class="edit-field-value"
            placeholder={t("placeholderFixedValue")}
            value={field.fixedValue ?? ""}
            onInput={(e) =>
              onChange(index, {
                fixedValue: (e.target as HTMLInputElement).value,
              })
            }
          />
        ) : (
          <SearchableSelectPreact
            entries={generatorEntries}
            value={field.generatorType ?? "auto"}
            onChange={(v) => onChange(index, { generatorType: v as FieldType })}
            placeholder={t("generatorMode")}
            className="edit-field-value"
          />
        )}
      </div>
      <button
        class="btn btn-sm btn-danger edit-remove-field"
        title={t("tooltipRemoveField")}
        onClick={() => onRemove(index)}
      >
        🗑
      </button>
    </div>
  );
}

export function EditFormScreen({
  form,
  isNew = false,
  onSave,
  onCancel,
}: EditFormScreenProps) {
  const [formName, setFormName] = useState(form.name);
  const [urlPattern, setUrlPattern] = useState(form.urlPattern);
  const [fields, setFields] = useState<FormTemplateField[]>(() =>
    normaliseFields(form),
  );

  function handleFieldChange(
    index: number,
    patch: Partial<FormTemplateField>,
  ): void {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function handleRemoveField(index: number): void {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddField(): void {
    setFields((prev) => [
      ...prev,
      {
        key: "",
        label: "",
        mode: "fixed" as FormFieldMode,
        fixedValue: "",
      },
    ]);
  }

  function handleSave(): void {
    const updatedFields: FormTemplateField[] = fields.map((f, i) => {
      const resolvedKey = (f.matchByFieldType ?? f.key) || `field_${i + 1}`;
      return {
        key: resolvedKey,
        label: resolvedKey,
        mode: f.mode,
        matchByFieldType: f.matchByFieldType,
        fixedValue: f.mode === "fixed" ? f.fixedValue : undefined,
        generatorType: f.mode === "generator" ? f.generatorType : undefined,
      };
    });

    onSave({
      ...form,
      name: formName.trim() || form.name,
      urlPattern: urlPattern.trim() || form.urlPattern,
      templateFields: updatedFields,
    });
  }

  return (
    <div class="edit-form-screen">
      <div class="edit-form-title">
        {isNew ? "➕" : "✏️"} {t(isNew ? "newFormTitle" : "editTemplate")}
      </div>
      <div class="edit-meta-grid">
        <div class="edit-input-group">
          <label class="edit-label">{t("formName")}</label>
          <input
            class="edit-input"
            type="text"
            value={formName}
            onInput={(e) => setFormName((e.target as HTMLInputElement).value)}
          />
        </div>
        <div class="edit-input-group">
          <label class="edit-label">{t("formUrl")}</label>
          <input
            class="edit-input"
            type="text"
            value={urlPattern}
            onInput={(e) => setUrlPattern((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>
      <div class="edit-section-header">{t("editFieldsHeader")}</div>
      <div class="edit-fields-list">
        {fields.map((field, i) => (
          <FieldRowEditor
            key={i}
            field={field}
            index={i}
            onChange={handleFieldChange}
            onRemove={handleRemoveField}
          />
        ))}
      </div>
      <div class="edit-form-footer">
        <button class="btn" onClick={onCancel}>
          ✕ {t("btnCancel")}
        </button>
        <button class="btn btn-secondary" onClick={handleAddField}>
          + {t("btnAddField")}
        </button>
        <button class="btn btn-success" onClick={handleSave}>
          💾 {t("btnSave")}
        </button>
      </div>
    </div>
  );
}
