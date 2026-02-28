/// <reference types="node" />
import { test as base, chromium, expect } from "@playwright/test";
import type { BrowserContext, Page, Worker, TestInfo } from "@playwright/test";
import v8ToIstanbul from "v8-to-istanbul";
import { createCoverageMap } from "istanbul-lib-coverage";
import fs from "fs";
import path from "path";

const DIST_PATH = path.join(process.cwd(), "dist");
const COVERAGE_OUTPUT = path.join(process.cwd(), ".coverage", "e2e");

/**
 * Returns the Chrome for Testing executable path (bundled by Playwright) for
 * use with `launchPersistentContext`. Regular stable Chrome ignores
 * `--load-extension` unless Developer Mode is already enabled in the profile,
 * so we always prefer Chrome for Testing (which has no such restriction).
 * The `CHROME_PATH` env var can be used to override for exotic CI setups.
 */
function getChromiumExecutablePath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  // chromium.executablePath() resolves the Playwright-bundled Chrome for Testing
  try {
    return chromium.executablePath();
  } catch {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  }
}

async function collectAndSaveCoverage(
  entries: Awaited<
    ReturnType<(typeof base)["prototype"]["coverage"]["stopJSCoverage"]>
  >,
  testInfo: TestInfo,
): Promise<void> {
  const map = createCoverageMap({});

  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      if (url.protocol !== "chrome-extension:") continue;

      // Map chrome-extension://ID/assets/foo.js → dist/assets/foo.js
      const localPath = path.join(DIST_PATH, url.pathname);
      if (!fs.existsSync(localPath)) continue;

      const converter = v8ToIstanbul(localPath, 0, {
        source: entry.source ?? undefined,
      });
      await converter.load();
      converter.applyCoverage(entry.functions);
      map.merge(converter.toIstanbul());
    } catch {
      // Skip entries that can't be converted (e.g. no source map)
    }
  }

  fs.mkdirSync(COVERAGE_OUTPUT, { recursive: true });
  const safeName = testInfo.titlePath
    .join("_")
    .replace(/[^a-z0-9_]/gi, "-")
    .slice(0, 100);
  fs.writeFileSync(
    path.join(COVERAGE_OUTPUT, `${safeName}.json`),
    JSON.stringify(map.toJSON(), null, 2),
  );
}

interface ExtensionFixtures {
  /**
   * Override built-in `context` with a persistent Chrome context that has
   * the Fill All extension loaded. MV3 service workers require a persistent
   * user data directory — regular browser contexts do NOT support them.
   */
  context: BrowserContext;
  /** Page created from the extension-enabled persistent context. */
  page: Page;
  /** The extension background service worker. */
  background: Worker;
  /** The extension ID extracted from the service worker URL. */
  extensionId: string;
  /** Auto fixture — collects JS coverage from chrome-extension:// URLs. */
  _coverage: void;
}

/**
 * Extended Playwright `test` that:
 * 1. Loads the Fill All extension via `launchPersistentContext` (required for MV3)
 * 2. Overrides `context` and `page` so all tests use the extension-enabled context
 * 3. Provides `background` (service worker) and `extensionId`
 * 4. Auto-collects JS coverage from chrome-extension:// URLs
 *
 * Usage:
 * ```ts
 * import { test, expect } from "@/__tests__/e2e/fixtures";
 *
 * test("fill form", async ({ page }) => {
 *   await page.goto("/test-form.html");
 *   // extension is already loaded — content script will be injected
 * });
 * ```
 */
export const test = base.extend<ExtensionFixtures>({
  // Override built-in `context` — creates a new Chrome process with the
  // extension loaded for every test (scope: "test" for full isolation).
  context: [
    async ({}, use) => {
      const context = await chromium.launchPersistentContext("", {
        headless: false,
        executablePath: getChromiumExecutablePath(),
        args: [
          `--disable-extensions-except=${DIST_PATH}`,
          `--load-extension=${DIST_PATH}`,
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-infobars",
          "--disable-popup-blocking",
        ],
      });
      await use(context);
      await context.close();
    },
    { scope: "test" },
  ],

  // Override built-in `page` — creates a page from the persistent context.
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    // context.close() in the context fixture will close the page as well.
  },

  // Waits for the extension background service worker to register.
  background: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent("serviceworker", { timeout: 15_000 });
    }
    await use(sw);
  },

  extensionId: async ({ background }, use) => {
    await use(background.url().split("/")[2]);
  },

  _coverage: [
    async ({ page }, use, testInfo) => {
      await page.coverage.startJSCoverage();
      await use();
      const entries = await page.coverage.stopJSCoverage();
      await collectAndSaveCoverage(entries, testInfo);
    },
    { auto: true },
  ],
});

export { expect };
