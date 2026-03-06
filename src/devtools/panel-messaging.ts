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

// NOTE: `chrome.devtools.inspectedWindow.eval()` is the only official mechanism
// to execute code in the inspected page's context from a DevTools panel.
// It is safe here because:
//   1. Only callable from a DevTools panel context (requires "devtools_page" in manifest)
//   2. All script strings are hardcoded — no user data is interpolated
// Never interpolate external/user-controlled data into the eval string.
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
