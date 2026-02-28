/// <reference types="node" />
import { test as base, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";
import v8ToIstanbul from "v8-to-istanbul";
import { createCoverageMap } from "istanbul-lib-coverage";
import fs from "fs";
import path from "path";

const DIST_PATH = path.join(process.cwd(), "dist");
const COVERAGE_OUTPUT = path.join(process.cwd(), ".coverage", "e2e");

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

/**
 * Extended Playwright `test` with automatic JS coverage collection.
 *
 * Each test that imports this `test` will automatically:
 * 1. Start JS coverage before the test
 * 2. Stop JS coverage after the test
 * 3. Write an Istanbul-format JSON to `.coverage/e2e/`
 *
 * Coverage is scoped to `chrome-extension://` URLs (extension scripts).
 *
 * Usage:
 * ```ts
 * import { test, expect } from "@/__tests__/e2e/fixtures";
 * ```
 */
export const test = base.extend<{ _coverage: void }>({
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
