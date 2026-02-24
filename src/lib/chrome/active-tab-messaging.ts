/**
 * Chrome extension tab messaging utilities.
 * Provides helpers for sending messages to content scripts,
 * with optional auto-injection when the content script is not yet loaded.
 */

import type { ExtensionMessage } from "@/types";

interface ActiveTabMessageOptions {
  injectIfNeeded?: boolean;
}

async function sendToTab(
  tabId: number,
  tabUrl: string | undefined,
  message: ExtensionMessage,
): Promise<unknown> {
  const url = tabUrl ?? "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { error: "Content script not available on this page" };
  }

  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (initialError) {
    return {
      error: "Content script not responding",
      details: String(initialError),
    };
  }
}

/**
 * Sends a message to a tab, auto-injecting the content script if the first
 * attempt fails (e.g. on a freshly opened page).
 */
export async function sendToTabWithInjection(
  tabId: number,
  tabUrl: string | undefined,
  message: ExtensionMessage,
): Promise<unknown> {
  const firstTry = await sendToTab(tabId, tabUrl, message);
  if (!(firstTry && typeof firstTry === "object" && "error" in firstTry)) {
    return firstTry;
  }

  try {
    const manifest = chrome.runtime.getManifest();
    const files = (manifest.content_scripts?.[0]?.js ?? []) as string[];
    if (files.length === 0)
      throw new Error("No content script files in manifest");
    await chrome.scripting.executeScript({
      target: { tabId },
      files,
    });
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (injectErr) {
    return {
      error: "Content script not responding",
      details: String(injectErr),
    };
  }
}

/**
 * Sends a message to the currently active tab.
 * Optionally injects the content script if it’s not yet loaded.
 */
export async function sendToActiveTab(
  message: ExtensionMessage,
  options: ActiveTabMessageOptions = {},
): Promise<unknown> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { error: "No active tab" };

  if (!options.injectIfNeeded) {
    return sendToTab(tab.id, tab.url, message);
  }

  try {
    return await sendToTabWithInjection(tab.id, tab.url, message);
  } catch (initialError) {
    return {
      error: "Content script not responding",
      details: String(initialError),
    };
  }
}

/**
 * Sends a message to a specific tab by ID.
 * Optionally injects the content script if it’s not yet loaded.
 */
export async function sendToSpecificTab(
  tabId: number,
  tabUrl: string | undefined,
  message: ExtensionMessage,
  options: ActiveTabMessageOptions = {},
): Promise<unknown> {
  if (!options.injectIfNeeded) {
    return sendToTab(tabId, tabUrl, message);
  }
  return sendToTabWithInjection(tabId, tabUrl, message);
}
