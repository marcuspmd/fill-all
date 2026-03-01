/// <reference types="node" />
import { test as base, chromium, expect } from "@playwright/test";
import type { BrowserContext, Worker } from "@playwright/test";
import path from "path";

const EXTENSION_PATH = path.join(process.cwd(), "dist");
const CHROME_PATH =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export interface ExtensionFixtures {
  extContext: BrowserContext;
  background: Worker;
  extensionId: string;
}

/**
 * Extended Playwright `test` with a persistent Chrome context that has the
 * Fill All extension loaded.
 *
 * Provides:
 * - `extContext`: the BrowserContext with the extension loaded
 * - `background`: the extension's background service worker (for sending messages)
 * - `extensionId`: the extension ID extracted from the service worker URL
 *
 * Usage:
 * ```ts
 * import { test, expect } from "@/__tests__/e2e/fixtures/extension";
 *
 * test("fill form", async ({ extContext, background }) => {
 *   const page = await extContext.newPage();
 *   await page.goto("http://localhost:8765/test-form.html");
 *   // ...
 * });
 * ```
 *
 * Helper to send a message to the content script of a page:
 * ```ts
 * await sendToTab(background, page.url(), { type: "FILL_ALL_FIELDS" });
 * ```
 */
export const test = base.extend<ExtensionFixtures>({
  extContext: [
    async ({}, use) => {
      const context = await chromium.launchPersistentContext("", {
        headless: false,
        executablePath: CHROME_PATH,
        args: [
          `--disable-extensions-except=${EXTENSION_PATH}`,
          `--load-extension=${EXTENSION_PATH}`,
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-infobars",
          "--disable-popup-blocking",
          "--disable-background-networking",
        ],
      });
      await use(context);
      await context.close();
    },
    { scope: "test" },
  ],

  background: async ({ extContext }, use) => {
    let [sw] = extContext.serviceWorkers();
    if (!sw) {
      sw = await extContext.waitForEvent("serviceworker");
    }
    // Give the service worker time to initialize
    await sw.waitForEvent("close").catch(() => {});
    [sw] = extContext.serviceWorkers();
    if (!sw) {
      sw = await extContext.waitForEvent("serviceworker");
    }
    await use(sw);
  },

  extensionId: async ({ background }, use) => {
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

export { expect };

/**
 * Sends a message to the content script of the given page via the background
 * service worker (`chrome.tabs.sendMessage`).
 *
 * @param background - The extension background service worker
 * @param pageUrl - URL of the page (used to find the tab ID)
 * @param message - Message object to send (`{ type, payload? }`)
 * @returns The response from the content script
 */
export async function sendToTab(
  background: Worker,
  pageUrl: string,
  message: Record<string, unknown>,
): Promise<unknown> {
  const origin = new URL(pageUrl).origin;
  return background.evaluate(
    async ({ tabOrigin, msg }) => {
      const tabs = await chrome.tabs.query({ url: `${tabOrigin}/*` });
      const tab = tabs[0];
      if (!tab?.id) throw new Error(`No tab found for origin: ${tabOrigin}`);
      return chrome.tabs.sendMessage(tab.id, msg);
    },
    { tabOrigin: origin, msg: message },
  );
}
