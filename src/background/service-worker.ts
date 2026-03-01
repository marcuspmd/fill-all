/**
 * Background service worker — message router, context menu and keyboard commands.
 *
 * Business logic is delegated to domain-specific handlers via the handler registry.
 * This file stays thin: setup listeners → parse → dispatch → respond.
 */

import type { ExtensionMessage } from "@/types";
import { parseIncomingMessage } from "@/lib/messaging/validators";
import {
  sendToActiveTab,
  sendToSpecificTab,
} from "@/lib/chrome/active-tab-messaging";
import { setupContextMenu, handleContextMenuClick } from "./context-menu";
import { dispatchMessage } from "./handler-registry";
import { initLogger, createLogger } from "@/lib/logger";

void initLogger();
const log = createLogger("ServiceWorker");

// Allow content scripts to access chrome.storage.session for shared log store
chrome.storage.session.setAccessLevel({
  accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
});

// ── Context Menu ──────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// ── Message Router ────────────────────────────────────────────────────────────

/** Messages that must be forwarded to the active tab's content script */
const CONTENT_SCRIPT_MESSAGES = new Set([
  "FILL_ALL_FIELDS",
  "FILL_SINGLE_FIELD",
  "SAVE_FORM",
  "LOAD_SAVED_FORM",
  "APPLY_TEMPLATE",
  "DETECT_FIELDS",
  "GET_FORM_FIELDS",
  "START_WATCHING",
  "STOP_WATCHING",
  "GET_WATCHER_STATUS",
  "TOGGLE_PANEL",
  "SHOW_PANEL",
  "HIDE_PANEL",
  "EXPORT_E2E",
  "START_RECORDING",
  "STOP_RECORDING",
  "PAUSE_RECORDING",
  "RESUME_RECORDING",
  "GET_RECORDING_STATUS",
  "GET_RECORDING_STEPS",
  "EXPORT_RECORDING",
]);

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: unknown) => void) => {
    const parsed = parseIncomingMessage(message);
    if (!parsed) {
      sendResponse({ error: "Invalid message format" });
      return false;
    }

    handleMessage(parsed as ExtensionMessage)
      .then(sendResponse)
      .catch((err) => {
        log.warn("Message handling failed:", err);
        sendResponse({
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return true; // Keep message channel open for async
  },
);

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  // DevTools relay: forward inner message to a specific tab's content script
  if (message.type === "DEVTOOLS_RELAY") {
    const payload = message.payload as
      | { tabId: number; message: ExtensionMessage }
      | undefined;
    if (!payload?.tabId || !payload?.message) {
      return { error: "Invalid DEVTOOLS_RELAY payload" };
    }
    return sendToSpecificTab(payload.tabId, undefined, payload.message, {
      injectIfNeeded: true,
    });
  }

  // Forward content-script-bound messages to the active tab
  if (CONTENT_SCRIPT_MESSAGES.has(message.type)) {
    return sendToActiveTab(message, { injectIfNeeded: true });
  }

  // Dispatch to the appropriate domain handler
  const result = await dispatchMessage(message);
  if (result !== null) return result;

  return { error: `Unknown message type: ${message.type}` };
}

// ── Keyboard Shortcut ─────────────────────────────────────────────────────────

chrome.commands?.onCommand?.addListener((command) => {
  if (command === "fill-all-fields") {
    void sendToActiveTab({ type: "FILL_ALL_FIELDS" }, { injectIfNeeded: true });
  }
});
