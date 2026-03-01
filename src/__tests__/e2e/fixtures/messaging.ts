/**
 * E2E helpers for sending Chrome extension messages from Playwright tests.
 *
 * Because content scripts run in an isolated world, the only way to trigger
 * extension functionality from Playwright is via the service worker, which
 * can call `chrome.tabs.sendMessage(tabId, message)`.
 */
import type { Page } from "@playwright/test";

type ExtensionMsg = { type: string; payload?: unknown };

/**
 * Sends a message to the content script running on `page` by going through
 * the background service worker.
 *
 * @returns The response from the content script handler.
 */
export async function sendToContentScript(
  page: Page,
  message: ExtensionMsg,
): Promise<unknown> {
  const context = page.context();

  let [sw] = context.serviceWorkers();
  if (!sw) {
    sw = await context.waitForEvent("serviceworker", { timeout: 10_000 });
  }

  const url = page.url();

  return sw.evaluate(
    async ({ pageUrl, msg }) => {
      const origin = new URL(pageUrl).origin;
      const tabs = await chrome.tabs.query({ url: `${origin}/*` });
      const tab = tabs[0];
      if (!tab?.id) throw new Error(`No tab found for origin: ${origin}`);
      return chrome.tabs.sendMessage(tab.id, msg);
    },
    { pageUrl: url, msg: message },
  );
}

/**
 * Waits for the content script to finish initializing on the given page.
 *
 * The content script registers `chrome.runtime.onMessage` synchronously but
 * may call async `initContentScript()` before being fully operational. We add
 * a small delay after `DOMContentLoaded` to let that settle.
 *
 * If the page exposes `window.__fillAllReady` (set by the content script), we
 * wait for that; otherwise we fall back to a 600 ms timeout which is
 * sufficient for `document_idle` injection.
 */
export async function waitForContentScript(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.readyState === "complete" ||
      document.readyState === "interactive",
  );
  // The content script is injected at `document_idle`; give it time to init.
  await page.waitForTimeout(600);
}
