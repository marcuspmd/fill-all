/**
 * Broadcast helper — sends a message to all tabs that have an active content script.
 */

import type { ExtensionMessage } from "@/types";

export async function broadcastToAllTabs(
  message: ExtensionMessage,
): Promise<void> {
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
