/// <reference types="node" />
import { defineConfig } from "@playwright/test";

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
        // The actual browser launch (launchPersistentContext) is handled by the
        // custom `context` fixture in src/__tests__/e2e/fixtures/index.ts.
        // MV3 extensions require a persistent context with a user data directory
        // — regular browser.newContext() does NOT support service workers.
        browserName: "chromium",
      },
    },
  ],
});
