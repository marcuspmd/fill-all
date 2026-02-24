/**
 * Popup messaging helpers — wraps chrome messaging APIs
 */

import type { ExtensionMessage } from "@/types";
import { sendToActiveTab as sendMessageToActiveTab } from "@/lib/chrome/active-tab-messaging";

export async function sendToActiveTab(
  message: ExtensionMessage,
): Promise<unknown> {
  const result = await sendMessageToActiveTab(message, {
    injectIfNeeded: true,
  });
  if (result && typeof result === "object" && "error" in result) {
    return null;
  }
  return result;
}

export async function sendToBackground(
  message: ExtensionMessage,
): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

export async function getActivePageUrl(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? "";
}

export function escapeHtml(text: string | undefined | null): string {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
