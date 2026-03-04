/**
 * FormsTabView, EditFormScreen & FieldRowModal — Preact components for the Forms tab.
 *
 * FormsTabView: saved forms list with load / new / apply / edit / delete.
 *   When editing, renders EditFormScreen inline (replacing the list).
 * EditFormScreen: full inline editor for a saved form — shows compact field rows.
 *   Clicking edit on a row opens FieldRowModal (modal overlay for one field).
 * FieldRowModal: modal overlay for editing a single FormTemplateField,
 *   following the same visual pattern as FieldEditorModal (fields tab).
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
  onApply: (form: SavedForm) => void;
  onSave: (form: SavedForm, isNew: boolean) => Promise<void>;
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
  onApply,
  onSave,
  onSetDefault,
  onDelete,
}: FormsTabViewProps) {
  const [editingForm, setEditingForm] = useState<SavedForm | null>(null);
  const [isNew, setIsNew] = useState(false);

  function openNewForm() {
    setEditingForm({
      id: crypto.randomUUID(),
      name: t("newFormTitle"),
      urlPattern: "*",
      fields: {},
      templateFields: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsNew(true);
  }

  function openEditForm(form: SavedForm) {
    setEditingForm(form);
    setIsNew(false);
  }

  async function handleSave(updated: SavedForm) {
    await onSave(updated, isNew);
    setEditingForm(null);
  }

  if (editingForm) {
    return (
      <EditFormScreen
        form={editingForm}
        isNew={isNew}
        onSave={handleSave}
        onClose={() => setEditingForm(null)}
      />
    );
  }

  return (
    <div>
      <div class="fields-toolbar">
        <button class="btn" onClick={onLoad}>
          🔄 {t("btnLoadForms")}
        </button>
        <button class="btn btn-success" onClick={openNewForm}>
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
                  onClick={() => openEditForm(form)}
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

// ── helpers ───────────────────────────────────────────────────────────────────

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

function fieldRowLabel(field: FormTemplateField, index: number): string {
  return (field.matchByFieldType ?? field.key) || `field_${index + 1}`;
}

function fieldRowValue(field: FormTemplateField): string {
  if (field.mode === "fixed") return field.fixedValue ?? "";
  return field.generatorType ?? "auto";
}

// ── EditFormScreen ────────────────────────────────────────────────────────────

interface EditFormScreenProps {
  form: SavedForm;
  isNew?: boolean;
  onSave: (updated: SavedForm) => Promise<void>;
  onClose: () => void;
}

export function EditFormScreen({
  form,
  isNew = false,
  onSave,
  onClose,
}: EditFormScreenProps) {
  const [formName, setFormName] = useState(form.name);
  const [urlPattern, setUrlPattern] = useState(form.urlPattern);
  const [fields, setFields] = useState<FormTemplateField[]>(() =>
    normaliseFields(form),
  );
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  function handleAddField(): void {
    const next: FormTemplateField[] = [
      ...fields,
      { key: "", label: "", mode: "fixed" as FormFieldMode, fixedValue: "" },
    ];
    setFields(next);
    setEditingFieldIndex(next.length - 1);
  }

  function handleRemoveField(index: number): void {
    setFields((prev) => prev.filter((_, i) => i !== index));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
  }

  function handleFieldSave(index: number, updated: FormTemplateField): void {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
    setEditingFieldIndex(null);
  }

  function handleSave(): void {
    if (saving) return;
    setSaving(true);
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

    void onSave({
      ...form,
      name: formName.trim() || form.name,
      urlPattern: urlPattern.trim() || form.urlPattern,
      templateFields: updatedFields,
    }).finally(() => setSaving(false));
  }

  return (
    <div class="edit-form-screen">
      <div class="fields-toolbar">
        <button class="btn btn-secondary" onClick={onClose}>
          ← {t("btnCancel")}
        </button>
        <span class="modal-title" style={{ flex: 1, marginLeft: 8 }}>
          {isNew ? "➕" : "✏️"} {t(isNew ? "newFormTitle" : "editTemplate")}
        </span>
        <button class="btn btn-success" onClick={handleSave} disabled={saving}>
          💾 {saving ? "..." : t("btnSave")}
        </button>
      </div>

      <div class="edit-meta-grid" style={{ padding: "8px 0" }}>
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
        {fields.length === 0 && (
          <div class="empty" style={{ padding: "12px 0" }}>
            {t("noFieldsYet")}
          </div>
        )}
        {fields.map((field, i) => (
          <div key={i} class="field-row-compact">
            <span class="field-row-type">{fieldRowLabel(field, i)}</span>
            <span class="field-row-mode">{field.mode}</span>
            <span class="field-row-value">{fieldRowValue(field)}</span>
            <button
              class="btn btn-sm btn-warning"
              title={t("btnEdit")}
              onClick={() => setEditingFieldIndex(i)}
            >
              ✏️
            </button>
            <button
              class="btn btn-sm btn-danger"
              title={t("tooltipRemoveField")}
              onClick={() => handleRemoveField(i)}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 0" }}>
        <button class="btn btn-secondary" onClick={handleAddField}>
          + {t("btnAddField")}
        </button>
      </div>

      {editingFieldIndex !== null && fields[editingFieldIndex] && (
        <FieldRowModal
          field={fields[editingFieldIndex]}
          index={editingFieldIndex}
          onSave={handleFieldSave}
          onClose={() => setEditingFieldIndex(null)}
        />
      )}
    </div>
  );
}

// ── FieldRowModal ─────────────────────────────────────────────────────────────

interface FieldRowModalProps {
  field: FormTemplateField;
  index: number;
  onSave: (index: number, updated: FormTemplateField) => void;
  onClose: () => void;
}

function FieldRowModal({ field, index, onSave, onClose }: FieldRowModalProps) {
  const [draft, setDraft] = useState<FormTemplateField>({ ...field });
  const fieldTypeEntries = useMemo(() => buildFieldTypeSelectEntries(), []);
  const generatorEntries = useMemo(() => buildGeneratorSelectEntries(), []);

  function patch(partial: Partial<FormTemplateField>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div
        class="modal-box modal-box--field"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <span class="modal-title">✏️ {t("editField")}</span>
          <button class="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div class="modal-body">
          <div class="edit-input-group">
            <label class="edit-label">{t("tooltipMatchByFieldType")}</label>
            <SearchableSelectPreact
              entries={fieldTypeEntries}
              value={draft.matchByFieldType ?? ""}
              onChange={(v) =>
                patch({ matchByFieldType: v ? (v as FieldType) : undefined })
              }
              placeholder={t("tooltipMatchByFieldType")}
            />
          </div>

          <div class="edit-input-group" style={{ marginTop: 8 }}>
            <label class="edit-label">{t("fieldModeHeader")}</label>
            <select
              class="edit-select"
              value={draft.mode}
              onChange={(e) =>
                patch({
                  mode: (e.target as HTMLSelectElement).value as FormFieldMode,
                })
              }
            >
              <option value="fixed">{t("fixedValue")}</option>
              <option value="generator">{t("generatorMode")}</option>
            </select>
          </div>

          <div class="edit-input-group" style={{ marginTop: 8 }}>
            <label class="edit-label">
              {draft.mode === "fixed" ? t("fixedValue") : t("generatorMode")}
            </label>
            {draft.mode === "fixed" ? (
              <input
                type="text"
                class="edit-input"
                placeholder={t("placeholderFixedValue")}
                value={draft.fixedValue ?? ""}
                onInput={(e) =>
                  patch({ fixedValue: (e.target as HTMLInputElement).value })
                }
              />
            ) : (
              <SearchableSelectPreact
                entries={generatorEntries}
                value={draft.generatorType ?? "auto"}
                onChange={(v) => patch({ generatorType: v as FieldType })}
                placeholder={t("generatorMode")}
              />
            )}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" onClick={onClose}>
            ✕ {t("btnCancel")}
          </button>
          <button class="btn btn-success" onClick={() => onSave(index, draft)}>
            💾 {t("btnSave")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditFormModal (kept for external consumers) ───────────────────────────────

export interface EditFormModalProps {
  form: SavedForm;
  isNew?: boolean;
  onSave: (updated: SavedForm) => Promise<void>;
  onClose: () => void;
}

/** @deprecated Use EditFormScreen instead. */
export const EditFormModal = EditFormScreen;
