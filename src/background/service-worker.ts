/**
 * Background service worker — handles messages and context menu
 */

import type { ExtensionMessage } from "@/types";
import {
  getRules,
  saveRule,
  deleteRule,
  getSavedForms,
  deleteForm,
  getSettings,
  saveSettings,
  getIgnoredFields,
  addIgnoredField,
  removeIgnoredField,
  getFieldDetectionCache,
  getFieldDetectionCacheForUrl,
  saveFieldDetectionCacheForUrl,
  deleteFieldDetectionCacheForUrl,
  clearFieldDetectionCache,
} from "@/lib/storage/storage";
import {
  getLearnedEntries,
  clearLearnedEntries,
  storeLearnedEntry,
  removeLearnedEntryBySignals,
  buildSignalsFromRule,
  retrainLearnedFromRules,
} from "@/lib/ai/learning-store";
import {
  getDatasetEntries,
  addDatasetEntry,
  removeDatasetEntry,
  clearDataset,
  importDatasetEntries,
  exportDatasetEntries,
} from "@/lib/dataset/runtime-dataset";
import {
  hasRuntimeModel,
  getRuntimeModelMeta,
  deleteRuntimeModel,
} from "@/lib/ai/runtime-trainer";
import {
  parseIncomingMessage,
  parseIgnoredFieldPayload,
  parseRulePayload,
  parseSaveFieldCachePayload,
  parseSettingsPayload,
  parseStringPayload,
} from "@/lib/messaging/validators";
import {
  sendToActiveTab,
  sendToSpecificTab,
} from "@/lib/chrome/active-tab-messaging";
import { initLogger, createLogger } from "@/lib/logger";

void initLogger();
const log = createLogger("ServiceWorker");

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
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "FILL_ALL_FIELDS" },
        {
          injectIfNeeded: true,
        },
      );
      break;
    case "fill-all-save-form":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "SAVE_FORM" },
        {
          injectIfNeeded: true,
        },
      );
      break;
    case "fill-all-field-rule":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "FILL_SINGLE_FIELD" },
        {
          injectIfNeeded: true,
        },
      );
      break;
    case "fill-all-toggle-panel":
      void sendToSpecificTab(
        tab.id,
        tab.url,
        { type: "TOGGLE_PANEL" },
        {
          injectIfNeeded: true,
        },
      );
      break;
  }
});

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: unknown) => void) => {
    const parsed = parseIncomingMessage(message);
    if (!parsed) {
      sendResponse({ error: "Invalid message format" });
      return false;
    }

    handleMessage(parsed as ExtensionMessage)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // Keep message channel open for async
  },
);

/**
 * Broadcast a message to all tabs that have an active content script.
 * Errors are silently ignored (tabs without content script injected, chrome:// tabs, etc.).
 * Note: does NOT require the `tabs` permission — tab.id is always accessible.
 */
async function broadcastToAllTabs(message: ExtensionMessage): Promise<void> {
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(
    tabs
      .filter((tab) => tab.id != null)
      .map((tab) =>
        chrome.tabs.sendMessage(tab.id!, message).catch(() => {
          /* tab has no content script — expected */
        }),
      ),
  );
}

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
  return sendToActiveTab(message, { injectIfNeeded: true });
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
      {
        const rule = parseRulePayload(message.payload);
        if (!rule) return { error: "Invalid payload for SAVE_RULE" };
        await saveRule(rule);
        const signals = buildSignalsFromRule(rule);
        if (signals) {
          await storeLearnedEntry(signals, rule.fieldType);
        }
      }
      return { success: true };

    case "DELETE_RULE":
      {
        const ruleId = parseStringPayload(message.payload);
        if (!ruleId) return { error: "Invalid payload for DELETE_RULE" };
        await deleteRule(ruleId);
      }
      return { success: true };

    case "GET_SETTINGS":
      return getSettings();

    case "SAVE_SETTINGS":
      {
        const settings = parseSettingsPayload(message.payload);
        if (!settings) return { error: "Invalid payload for SAVE_SETTINGS" };
        await saveSettings(settings);
      }
      return { success: true };

    case "GET_SAVED_FORMS":
      return getSavedForms();

    case "DELETE_FORM":
      {
        const formId = parseStringPayload(message.payload);
        if (!formId) return { error: "Invalid payload for DELETE_FORM" };
        await deleteForm(formId);
      }
      return { success: true };

    case "GET_IGNORED_FIELDS":
      return getIgnoredFields();

    case "ADD_IGNORED_FIELD": {
      const payload = parseIgnoredFieldPayload(message.payload);
      if (!payload) return { error: "Invalid payload for ADD_IGNORED_FIELD" };
      return addIgnoredField(payload);
    }

    case "REMOVE_IGNORED_FIELD":
      {
        const ignoredId = parseStringPayload(message.payload);
        if (!ignoredId)
          return { error: "Invalid payload for REMOVE_IGNORED_FIELD" };
        await removeIgnoredField(ignoredId);
      }
      return { success: true };

    case "GET_FIELD_CACHE": {
      const payload = message.payload as { url?: string } | undefined;
      if (payload?.url) {
        return getFieldDetectionCacheForUrl(payload.url);
      }
      return getFieldDetectionCache();
    }

    case "SAVE_FIELD_CACHE": {
      const payload = parseSaveFieldCachePayload(message.payload);
      if (!payload) {
        return { error: "Invalid payload for SAVE_FIELD_CACHE" };
      }
      // Respect user's cache-enabled setting
      const cacheSettings = await getSettings();
      if (cacheSettings.cacheEnabled === false) {
        return { success: true, skipped: true };
      }
      return saveFieldDetectionCacheForUrl(payload.url, payload.fields);
    }

    case "DELETE_FIELD_CACHE":
      {
        const url = parseStringPayload(message.payload);
        if (!url) return { error: "Invalid payload for DELETE_FIELD_CACHE" };
        await deleteFieldDetectionCacheForUrl(url);
      }
      return { success: true };

    case "CLEAR_FIELD_CACHE":
      await clearFieldDetectionCache();
      return { success: true };

    case "GET_LEARNED_ENTRIES":
      return getLearnedEntries();

    case "CLEAR_LEARNED_ENTRIES":
      await clearLearnedEntries();
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return { success: true };

    case "RETRAIN_LEARNING_DATABASE": {
      const rules = await getRules();
      const result = await retrainLearnedFromRules(rules);
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      log.info(
        `RETRAIN_LEARNING_DATABASE concluído: ` +
          `imported=${result.imported}, skipped=${result.skipped}, ` +
          `totalRules=${result.totalRules}, durationMs=${result.durationMs}`,
      );
      return { success: true, ...result };
    }

    // ── Dataset CRUD ──────────────────────────────────────────────────────

    case "GET_DATASET":
      return getDatasetEntries();

    case "ADD_DATASET_ENTRY": {
      const entry = message.payload as
        | Parameters<typeof addDatasetEntry>[0]
        | undefined;
      if (!entry?.signals || !entry?.type) {
        return { error: "Invalid payload for ADD_DATASET_ENTRY" };
      }
      const added = await addDatasetEntry(entry);
      // Keep learning store in sync with the dataset
      await storeLearnedEntry(added.signals, added.type, undefined, "auto");
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return added;
    }

    case "REMOVE_DATASET_ENTRY": {
      const id = parseStringPayload(message.payload);
      if (!id) return { error: "Invalid payload for REMOVE_DATASET_ENTRY" };
      // Fetch before removing so we can sync the learning store by signals
      const allEntries = await getDatasetEntries();
      const entry = allEntries.find((e) => e.id === id);
      await removeDatasetEntry(id);
      if (entry) {
        await removeLearnedEntryBySignals(entry.signals);
        void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      }
      return { success: true };
    }

    case "CLEAR_DATASET":
      await clearDataset();
      await clearLearnedEntries();
      void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      return { success: true };

    case "IMPORT_DATASET": {
      const entries = message.payload as
        | Parameters<typeof importDatasetEntries>[0]
        | undefined;
      if (!Array.isArray(entries))
        return { error: "Invalid payload for IMPORT_DATASET" };
      const added = await importDatasetEntries(entries);
      // Sync each imported entry to the learning store so the classifier
      // benefits immediately without requiring a full retrain.
      if (added > 0) {
        for (const e of entries) {
          if (e.signals && e.type) {
            await storeLearnedEntry(e.signals, e.type, undefined, "auto");
          }
        }
        void broadcastToAllTabs({ type: "INVALIDATE_CLASSIFIER" });
      }
      return { success: true, added };
    }

    case "SEED_DATASET": {
      // Lazy-import the static training samples so they don't bloat the SW bundle
      const { TRAINING_SAMPLES } = await import("@/lib/dataset/training-data");
      const seeds = TRAINING_SAMPLES.map((s) => ({
        signals: s.signals,
        type: s.type,
        source: "builtin" as const,
        difficulty: s.difficulty,
      }));
      const added = await importDatasetEntries(seeds);
      return { success: true, added };
    }

    case "EXPORT_DATASET":
      return exportDatasetEntries();

    case "GET_RUNTIME_MODEL_META": {
      const meta = await getRuntimeModelMeta();
      const exists = await hasRuntimeModel();
      return { exists, meta };
    }

    case "DELETE_RUNTIME_MODEL":
      await deleteRuntimeModel();
      void broadcastToAllTabs({ type: "RELOAD_CLASSIFIER" });
      return { success: true };

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// Handle keyboard shortcut
chrome.commands?.onCommand?.addListener((command) => {
  if (command === "fill-all-fields") {
    void sendToActiveTab({ type: "FILL_ALL_FIELDS" }, { injectIfNeeded: true });
  }
});
