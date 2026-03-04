/**
 * Panel Messaging — Chrome runtime/tab messaging helpers for the DevTools panel.
 */

import type { ExtensionMessage } from "@/types";
import { panelState } from "./panel-state";

// ── Page & Background Messaging ───────────────────────────────────────────────

export async function sendToPage(message: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage({
    type: "DEVTOOLS_RELAY",
    payload: { tabId: panelState.inspectedTabId, message },
  });
}

export async function sendToBackground(
  message: ExtensionMessage,
): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

// ── Inspected Page Introspection ──────────────────────────────────────────────

export function getInspectedPageInfo(): Promise<
  [string | undefined, string | undefined]
> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      "[location.href, document.title]",
      (result: unknown) => {
        if (Array.isArray(result) && result.length === 2) {
          resolve([result[0] as string, result[1] as string]);
        } else {
          resolve([undefined, undefined]);
        }
      },
    );
  });
}

export function getInspectedUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      "window.location.href",
      (result: unknown) => {
        resolve(String(result ?? ""));
      },
    );
  });
}
