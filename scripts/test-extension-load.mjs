import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_PATH = path.join(__dirname, "..", "dist");

// Use Chrome for Testing (Playwright bundled) — does NOT require Developer Mode
// to be active in the profile, unlike stable Chrome.
const CHROME_PATH = chromium.executablePath();

console.log("DIST_PATH:", DIST_PATH);
console.log("Chrome binary:", CHROME_PATH);
console.log("Launching Chrome for Testing with extension...");

const context = await chromium.launchPersistentContext("", {
  headless: false,
  executablePath: CHROME_PATH,
  args: [
    `--disable-extensions-except=${DIST_PATH}`,
    `--load-extension=${DIST_PATH}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
});

console.log("Chrome launched. Checking service workers...");
const sws = context.serviceWorkers();
console.log("SW count immediately:", sws.length);
if (sws.length > 0) {
  for (const sw of sws) {
    console.log("SW URL:", sw.url());
  }
} else {
  console.log("No SW yet, waiting 8s...");
  try {
    const sw = await context.waitForEvent("serviceworker", { timeout: 8000 });
    console.log("SW registered:", sw.url());
  } catch {
    console.log("TIMEOUT - Service worker never registered");

    // Try to open extensions page to see status
    const page = await context.newPage();
    await page.goto("chrome://extensions/");
    await page.waitForTimeout(2000);
    const content = await page.content();
    const hasExtension = content.includes("Fill All");
    console.log("Extension visible on chrome://extensions/:", hasExtension);
    await page.screenshot({ path: "scripts/extensions-screenshot.png" });
    console.log("Screenshot saved to scripts/extensions-screenshot.png");
  }
}

await context.close();
