/**
 * Background service worker — handles messages and context menu
 */

import type { ExtensionMessage, FieldRule, SavedForm, Settings } from "@/types";
import {
  getRules,
  saveRule,
  deleteRule,
  getSavedForms,
  saveForm,
  deleteForm,
  getSettings,
  saveSettings,
} from "@/lib/storage/storage";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "fill-all-fields",
    title: "Fill All - Preencher todos os campos",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "fill-all-save-form",
    title: "Fill All - Salvar dados do formulário",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "fill-all-field-rule",
    title: "Fill All - Criar regra para este campo",
    contexts: ["editable"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case "fill-all-fields":
      chrome.tabs.sendMessage(tab.id, { type: "FILL_ALL_FIELDS" });
      break;
    case "fill-all-save-form":
      chrome.tabs.sendMessage(tab.id, { type: "SAVE_FORM" });
      break;
    case "fill-all-field-rule":
      chrome.tabs.sendMessage(tab.id, { type: "FILL_SINGLE_FIELD" });
      break;
  }
});

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: unknown) => void,
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // Keep message channel open for async
  },
);

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_RULES":
      return getRules();

    case "SAVE_RULE":
      await saveRule(message.payload as FieldRule);
      return { success: true };

    case "DELETE_RULE":
      await deleteRule(message.payload as string);
      return { success: true };

    case "LOAD_SAVED_FORM":
      return getSavedForms();

    case "SAVE_FORM": {
      await saveForm(message.payload as SavedForm);
      return { success: true };
    }

    case "GET_SETTINGS":
      return getSettings();

    case "SAVE_SETTINGS":
      await saveSettings(message.payload as Partial<Settings>);
      return { success: true };

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// Handle keyboard shortcut
chrome.commands?.onCommand?.addListener((command) => {
  if (command === "fill-all-fields") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "FILL_ALL_FIELDS" });
      }
    });
  }
});
