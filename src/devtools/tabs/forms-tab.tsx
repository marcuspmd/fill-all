/**
 * Forms Tab — Saved forms management (list, view, edit, create, apply, delete).
 *
 * Responsibilities:
 * - Load and display saved forms
 * - Edit and create form field entries
 * - Apply a saved form to the inspected page
 * - Set default form / delete form
 */

import { h } from "preact";
import type { SavedForm } from "@/types";
import { t } from "@/lib/i18n";
import { panelState } from "../panel-state";
import { sendToPage, sendToBackground } from "../panel-messaging";
import { addLog } from "../panel-utils";
import { renderTo } from "../components";
import { FormsTabView, EditFormScreen } from "@/lib/ui/components";

// ── Load ──────────────────────────────────────────────────────────────────────

export async function loadForms(): Promise<void> {
  addLog(t("logLoadingForms"));
  try {
    const result = (await sendToBackground({
      type: "GET_SAVED_FORMS",
    })) as SavedForm[] | { error?: string };
    if (Array.isArray(result)) {
      panelState.savedForms = result;
      addLog(`${result.length} ${t("formCount")}`, "success");
    } else {
      panelState.savedForms = [];
      addLog(t("logNoFormsSaved"), "warn");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
    panelState.savedForms = [];
  }
  panelState.formsLoaded = true;
  if (panelState.activeTab === "forms") renderFormsTab();
}

// ── Apply ─────────────────────────────────────────────────────────────────────

export async function applySavedForm(form: SavedForm): Promise<void> {
  addLog(t("logApplyingTemplate") + ": " + form.name);
  try {
    const result = (await sendToPage({
      type: "APPLY_TEMPLATE",
      payload: form,
    })) as { filled?: number };
    addLog(`${result?.filled ?? 0} ${t("filled")}`, "success");
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

// ── Save Current ──────────────────────────────────────────────────────────────

export async function saveCurrentForm(): Promise<void> {
  addLog(t("logSavingForm"));
  try {
    const result = (await sendToPage({ type: "SAVE_FORM" })) as {
      success?: boolean;
      form?: SavedForm;
    };
    if (result?.success) {
      addLog(`${t("logFormSaved")}: ${result.form?.name ?? ""}`, "success");
    } else {
      addLog(t("logErrorSavingForm"), "error");
    }
  } catch (err) {
    addLog(`Erro: ${err}`, "error");
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteFormById(formId: string): Promise<void> {
  try {
    await sendToBackground({ type: "DELETE_FORM", payload: formId });
    panelState.savedForms = panelState.savedForms.filter(
      (f) => f.id !== formId,
    );
    addLog(t("logFormRemoved"), "info");
    renderFormsTab();
  } catch (err) {
    addLog(`Erro ao remover: ${err}`, "error");
  }
}

// ── Set Default ───────────────────────────────────────────────────────────────

export async function setFormAsDefault(formId: string): Promise<void> {
  try {
    await sendToBackground({ type: "SET_DEFAULT_FORM", payload: formId });
    panelState.savedForms = panelState.savedForms.map((f) => ({
      ...f,
      isDefault: f.id === formId ? true : undefined,
    }));
    addLog(t("logFormSetDefault"), "success");
    renderFormsTab();
  } catch (err) {
    addLog(`Erro ao definir padrão: ${err}`, "error");
  }
}

// ── New Form Screen ────────────────────────────────────────────────────────────

export function showNewFormScreen(): void {
  const blankForm: SavedForm = {
    id: crypto.randomUUID(),
    name: t("newFormTitle"),
    urlPattern: "*",
    fields: {},
    templateFields: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  showEditFormScreen(blankForm, true);
}

// ── Edit Form Screen ──────────────────────────────────────────────────────────

export function showEditFormScreen(form: SavedForm, isNew = false): void {
  const content = document.getElementById("content");
  renderTo(
    content,
    <EditFormScreen
      form={form}
      isNew={isNew}
      onCancel={() => renderFormsTab()}
      onSave={(updated) => {
        void (async () => {
          await sendToBackground({ type: "UPDATE_FORM", payload: updated });
          if (isNew) {
            panelState.savedForms = [...panelState.savedForms, updated];
            addLog(`${t("logFormSaved")}: ${updated.name}`, "success");
          } else {
            const idx = panelState.savedForms.findIndex(
              (f) => f.id === form.id,
            );
            if (idx >= 0) panelState.savedForms[idx] = updated;
            addLog(`${t("logTemplateUpdated")}: ${updated.name}`, "success");
          }
          renderFormsTab();
        })();
      }}
    />,
  );
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderFormsTab(): void {
  const content = document.getElementById("content");
  renderTo(
    content,
    <FormsTabView
      savedForms={panelState.savedForms}
      formsLoaded={panelState.formsLoaded}
      onLoad={() => void loadForms()}
      onNewForm={() => showNewFormScreen()}
      onApply={(form) => void applySavedForm(form)}
      onEdit={(form) => showEditFormScreen(form)}
      onSetDefault={(form) => void setFormAsDefault(form.id)}
      onDelete={(form) => {
        if (window.confirm(t("msgConfirmDeleteForm"))) {
          void deleteFormById(form.id);
        }
      }}
    />,
  );
}
