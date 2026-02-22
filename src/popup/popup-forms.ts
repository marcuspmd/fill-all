/**
 * Popup — saved forms section (load, delete, render)
 */

import type { SavedForm } from "@/types";
import {
  sendToActiveTab,
  sendToBackground,
  escapeHtml,
} from "./popup-messaging";

export async function loadSavedForms(): Promise<void> {
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
