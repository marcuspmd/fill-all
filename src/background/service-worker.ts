/**
 * Background service worker — handles messages and context menu
 */

import type { ExtensionMessage, FieldRule, SavedForm, Settings } from "@/types";
import type { IgnoredField } from "@/types";
import {
  getRules,
  saveRule,
  deleteRule,
  getSavedForms,
  saveForm,
  deleteForm,
  getSettings,
  saveSettings,
  getIgnoredFields,
  addIgnoredField,
  removeIgnoredField,
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

  chrome.contextMenus.create({
    id: "fill-all-toggle-panel",
    title: "Fill All - Abrir/fechar painel flutuante",
    contexts: ["page"],
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
    case "fill-all-toggle-panel":
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
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

/** Messages that must be forwarded to the active tab's content script */
const CONTENT_SCRIPT_MESSAGES = new Set([
  "FILL_ALL_FIELDS",
  "FILL_SINGLE_FIELD",
  "SAVE_FORM",
  "LOAD_SAVED_FORM",
  "DETECT_FIELDS",
  "GET_FORM_FIELDS",
  "START_WATCHING",
  "STOP_WATCHING",
  "GET_WATCHER_STATUS",
  "TOGGLE_PANEL",
  "SHOW_PANEL",
  "HIDE_PANEL",
]);

async function forwardToActiveTab(message: ExtensionMessage): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { error: "No active tab" };

  const url = tab.url ?? "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { error: "Content script not available on this page" };
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    return { error: "Content script not responding", details: String(err) };
  }
}

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  // Forward content-script-bound messages to the active tab
  if (CONTENT_SCRIPT_MESSAGES.has(message.type)) {
    return forwardToActiveTab(message);
  }

  switch (message.type) {
    case "GET_RULES":
      return getRules();

    case "SAVE_RULE":
      await saveRule(message.payload as FieldRule);
      return { success: true };

    case "DELETE_RULE":
      await deleteRule(message.payload as string);
      return { success: true };

    case "GET_SETTINGS":
      return getSettings();

    case "SAVE_SETTINGS":
      await saveSettings(message.payload as Partial<Settings>);
      return { success: true };

    case "GET_SAVED_FORMS":
      return getSavedForms();

    case "DELETE_FORM":
      await deleteForm(message.payload as string);
      return { success: true };

    case "GET_IGNORED_FIELDS":
      return getIgnoredFields();

    case "ADD_IGNORED_FIELD":
      return addIgnoredField(
        message.payload as Omit<IgnoredField, "id" | "createdAt">,
      );

    case "REMOVE_IGNORED_FIELD":
      await removeIgnoredField(message.payload as string);
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
