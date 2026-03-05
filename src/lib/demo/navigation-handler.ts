/**
 * Navigation Handler — manages page navigation during demo replay.
 *
 * Runs in the **background** service-worker context. Uses `chrome.tabs`
 * and `chrome.webNavigation` to navigate and wait for page load before
 * signalling the orchestrator to continue.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("NavigationHandler");

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Navigate a tab to `url` and wait until the page is fully loaded.
 *
 * @returns true when the target URL is loaded, false on timeout.
 */
export async function navigateAndWait(
  tabId: number,
  url: string,
  timeoutMs = 30_000,
): Promise<boolean> {
  try {
    await chrome.tabs.update(tabId, { url });
    return await waitForTabLoad(tabId, timeoutMs);
  } catch (err) {
    log.warn(`Navigation to ${url} failed:`, err);
    return false;
  }
}

/**
 * Wait for a tab to finish loading (status === "complete").
 */
export function waitForTabLoad(
  tabId: number,
  timeoutMs = 30_000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      log.warn(`Tab ${tabId} load timed out after ${timeoutMs}ms`);
      resolve(false);
    }, timeoutMs);

    function listener(
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(true);
      }
    }

    chrome.tabs.onUpdated.addListener(listener);

    // Check if already loaded
    chrome.tabs
      .get(tabId)
      .then((tab) => {
        if (tab.status === "complete") {
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(true);
        }
      })
      .catch(() => {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(false);
      });
  });
}

/**
 * Inject a content script into a tab.
 * Used to re-inject after cross-origin navigations that destroy the
 * previous content-script context.
 *
 * Chrome re-injects the manifest-declared content script automatically
 * when the page loads. This function polls until the content script is
 * responsive (via PING) or the timeout is reached.
 */
export async function injectContentScript(tabId: number): Promise<boolean> {
  const maxAttempts = 6;
  const retryDelayMs = 250;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(retryDelayMs);
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "PING" });
      if (response?.pong) return true;
    } catch {
      // content script not yet ready — retry
    }
  }

  log.warn(`Content script did not respond in tab ${tabId} after polling`);
  return false;
}

/**
 * Wait for a URL pattern to appear in the tab (e.g. after a redirect).
 */
export function waitForUrlPattern(
  tabId: number,
  urlFragment: string,
  timeoutMs = 15_000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(false);
    }, timeoutMs);

    function listener(
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) {
      if (
        updatedTabId === tabId &&
        changeInfo.status === "complete" &&
        tab.url?.includes(urlFragment)
      ) {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(true);
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
