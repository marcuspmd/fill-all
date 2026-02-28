/// <reference types="node" />
import { defineConfig } from "@playwright/test";
import path from "path";

const EXTENSION_PATH = path.join(__dirname, "dist");

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: "./src",
  testMatch: "**/__tests__/e2e/*.test.e2e.ts",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Chrome extension tests must run sequentially

  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["list"],
  ],

  webServer: {
    command: "node e2e/server.js",
    port: 8765,
    reuseExistingServer: true,
    timeout: 10_000,
  },

  use: {
    baseURL: "http://localhost:8765",
    trace: "on-first-retry",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "chrome-extension",
      use: {
        // Chrome extension fixture is defined per test via e2e/fixtures/extension.ts
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.CHROME_PATH ||
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-infobars",
            "--disable-popup-blocking",
          ],
          headless: false,
        },
      },
    },
  ],
});
