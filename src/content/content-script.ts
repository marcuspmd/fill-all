/**
 * Content script — runs on every page, listens for fill commands
 */

import type { ExtensionMessage, SavedForm } from "@/types";
import { fillAllFields, captureFormValues } from "@/lib/form/form-filler";
import { detectFormFields } from "@/lib/form/form-detector";
import { saveForm } from "@/lib/storage/storage";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Listen for messages from background / popup
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    handleContentMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: (err as Error).message }));
    return true;
  },
);

async function handleContentMessage(
  message: ExtensionMessage,
): Promise<unknown> {
  switch (message.type) {
    case "FILL_ALL_FIELDS": {
      const results = await fillAllFields();
      showNotification(`✓ ${results.length} campos preenchidos`);
      return { success: true, filled: results.length };
    }

    case "SAVE_FORM": {
      const values = captureFormValues();
      const formData: SavedForm = {
        id: generateId(),
        name: `Form - ${new URL(window.location.href).hostname} - ${new Date().toLocaleDateString("pt-BR")}`,
        urlPattern: `${window.location.origin}${window.location.pathname}*`,
        fields: values,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveForm(formData);
      showNotification(
        `✓ Formulário salvo com ${Object.keys(values).length} campos`,
      );
      return { success: true, form: formData };
    }

    case "LOAD_SAVED_FORM": {
      const form = message.payload as SavedForm;
      const fields = detectFormFields();

      let filled = 0;
      for (const field of fields) {
        const key = field.id || field.name || field.selector;
        const value = form.fields[key];
        if (value) {
          const nativeValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;

          if (field.element instanceof HTMLInputElement && nativeValueSetter) {
            nativeValueSetter.call(field.element, value);
          } else {
            field.element.value = value;
          }

          field.element.dispatchEvent(new Event("input", { bubbles: true }));
          field.element.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
        }
      }

      showNotification(`✓ ${filled} campos carregados do template`);
      return { success: true, filled };
    }

    case "GET_FORM_FIELDS": {
      const fields = detectFormFields();
      return fields.map((f) => ({
        selector: f.selector,
        fieldType: f.fieldType,
        label: f.label,
        name: f.name,
        id: f.id,
        placeholder: f.placeholder,
        required: f.required,
      }));
    }

    case "DETECT_FIELDS": {
      const detected = detectFormFields();
      return {
        count: detected.length,
        fields: detected.map((f) => ({
          selector: f.selector,
          fieldType: f.fieldType,
          label: f.label || f.name || f.id || "unknown",
        })),
      };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

function showNotification(text: string): void {
  const existing = document.getElementById("fill-all-notification");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = "fill-all-notification";
  el.textContent = text;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "12px 20px",
    background: "#4F46E5",
    color: "#fff",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "system-ui, sans-serif",
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "opacity 0.3s ease",
  });

  document.body.appendChild(el);

  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
