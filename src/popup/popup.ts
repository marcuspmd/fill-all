/**
 * Popup script — handles UI interactions
 */

import "./popup.css";
import type { ExtensionMessage, FieldType, SavedForm } from "@/types";
import { generate } from "@/lib/generators";

async function sendToActiveTab(message: ExtensionMessage): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  return chrome.tabs.sendMessage(tab.id, message);
}

async function sendToBackground(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

// --- Fill All ---
document.getElementById("btn-fill-all")?.addEventListener("click", async () => {
  const result = await sendToActiveTab({ type: "FILL_ALL_FIELDS" });
  const btn = document.getElementById("btn-fill-all") as HTMLButtonElement;
  const res = result as { filled?: number } | null;
  btn.textContent = `✓ ${res?.filled ?? 0} campos preenchidos`;
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
document.getElementById("btn-detect")?.addEventListener("click", async () => {
  const result = (await sendToActiveTab({ type: "DETECT_FIELDS" })) as {
    count: number;
    fields: Array<{ selector: string; fieldType: string; label: string }>;
  } | null;

  const list = document.getElementById("fields-list");
  if (!list || !result) return;

  list.innerHTML = "";
  if (result.count === 0) {
    list.innerHTML = '<div class="empty">Nenhum campo encontrado</div>';
    return;
  }

  for (const field of result.fields) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <span class="field-label">${escapeHtml(field.label)}</span>
      <span class="field-type badge">${escapeHtml(field.fieldType)}</span>
    `;
    list.appendChild(item);
  }
});

// --- Quick Generators ---
document.querySelectorAll("[data-generator]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = (btn as HTMLElement).dataset.generator as FieldType;
    const value = generate(type);

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
  const forms = (await sendToBackground({ type: "LOAD_SAVED_FORM" })) as
    | SavedForm[]
    | null;
  const list = document.getElementById("saved-forms-list");
  if (!list) return;

  list.innerHTML = "";
  if (!forms || forms.length === 0) {
    list.innerHTML = '<div class="empty">Nenhum formulário salvo</div>';
    return;
  }

  for (const form of forms) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.innerHTML = `
      <div class="form-info">
        <span class="form-name">${escapeHtml(form.name)}</span>
        <span class="form-fields">${Object.keys(form.fields).length} campos</span>
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
      await sendToBackground({ type: "SAVE_RULE", payload: form.id }); // Delete via background
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

// --- Init ---
loadSavedForms();

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
