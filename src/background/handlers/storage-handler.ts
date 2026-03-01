/**
 * Storage message handler — Forms, Settings, and Ignored Fields CRUD.
 */

import type { MessageHandler } from "@/types/interfaces";
import type { ExtensionMessage, MessageType } from "@/types";
import {
  getSavedForms,
  saveForm,
  deleteForm,
  setDefaultForm,
} from "@/lib/storage/forms-storage";
import { getSettings, saveSettings } from "@/lib/storage/settings-storage";
import {
  getIgnoredFields,
  addIgnoredField,
  removeIgnoredField,
} from "@/lib/storage/ignored-storage";
import {
  parseIgnoredFieldPayload,
  parseSavedFormPayload,
  parseSettingsPayload,
  parseStringPayload,
} from "@/lib/messaging/validators";

const SUPPORTED: ReadonlyArray<MessageType> = [
  "GET_SAVED_FORMS",
  "DELETE_FORM",
  "UPDATE_FORM",
  "SET_DEFAULT_FORM",
  "GET_SETTINGS",
  "SAVE_SETTINGS",
  "GET_IGNORED_FIELDS",
  "ADD_IGNORED_FIELD",
  "REMOVE_IGNORED_FIELD",
];

async function handle(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case "GET_SAVED_FORMS":
      return getSavedForms();

    case "DELETE_FORM": {
      const formId = parseStringPayload(message.payload);
      if (!formId) return { error: "Invalid payload for DELETE_FORM" };
      await deleteForm(formId);
      return { success: true };
    }

    case "UPDATE_FORM": {
      const form = parseSavedFormPayload(message.payload);
      if (!form) return { error: "Invalid payload for UPDATE_FORM" };
      await saveForm(form);
      return { success: true };
    }

    case "SET_DEFAULT_FORM": {
      const formId = parseStringPayload(message.payload);
      if (!formId) return { error: "Invalid payload for SET_DEFAULT_FORM" };
      await setDefaultForm(formId);
      return { success: true };
    }

    case "GET_SETTINGS":
      return getSettings();

    case "SAVE_SETTINGS": {
      const settings = parseSettingsPayload(message.payload);
      if (!settings) return { error: "Invalid payload for SAVE_SETTINGS" };
      await saveSettings(settings);
      return { success: true };
    }

    case "GET_IGNORED_FIELDS":
      return getIgnoredFields();

    case "ADD_IGNORED_FIELD": {
      const payload = parseIgnoredFieldPayload(message.payload);
      if (!payload) return { error: "Invalid payload for ADD_IGNORED_FIELD" };
      const ignored = await addIgnoredField(payload);
      return ignored ?? { error: "Failed to add ignored field" };
    }

    case "REMOVE_IGNORED_FIELD": {
      const ignoredId = parseStringPayload(message.payload);
      if (!ignoredId)
        return { error: "Invalid payload for REMOVE_IGNORED_FIELD" };
      await removeIgnoredField(ignoredId);
      return { success: true };
    }

    default:
      return { error: `Unhandled type in storageHandler: ${message.type}` };
  }
}

export const storageHandler: MessageHandler = {
  supportedTypes: SUPPORTED,
  handle,
};
