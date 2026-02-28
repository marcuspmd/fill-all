import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");
const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

console.log("DIST path:", DIST);
console.log("CHROME path:", CHROME);

const context = await chromium.launchPersistentContext("", {
  headless: false,
  executablePath: CHROME,
  args: [
    `--disable-extensions-except=${DIST}`,
    `--load-extension=${DIST}`,
    "--no-first-run",
    "--no-default-browser-check",
  ],
});

console.log("Context launched. Checking service workers immediately...");
const immediate = context.serviceWorkers();
console.log("Immediate serviceWorkers count:", immediate.length);

console.log("Waiting up to 15s for service worker event...");
let sw;
try {
  sw = await context.waitForEvent("serviceworker", { timeout: 15000 });
  console.log("SUCCESS! Service worker URL:", sw.url());
} catch (e) {
  console.error("FAILED: Service worker event timed out:", e.message);
  const workers = context.serviceWorkers();
  console.log("ServiceWorkers after timeout:", workers.length);
  workers.forEach((w, i) => console.log(`  [${i}]`, w.url()));
}

await new Promise((r) => setTimeout(r, 2000));
await context.close();
console.log("Done.");
