import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: ["**/*.test.e2e.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      reportsDirectory: ".coverage/unit",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/**/__tests__/**",
        "src/**/index.ts",
        "src/**/*.interface.ts",
        "src/lib/storage/storage.ts",
        // DOM-heavy files: require real browser/MutationObserver — covered by E2E tests
        "src/lib/form/dom-watcher.ts",
        "src/lib/form/field-icon.ts",
        "src/lib/form/field-icon-rule.ts",
        "src/lib/form/field-icon-styles.ts",
        "src/lib/form/field-icon-utils.ts",
        "src/lib/form/field-overlay.ts",
        "src/lib/form/floating-panel.ts",
        "src/lib/form/form-filler.ts",
        // TensorFlow.js training: requires a real browser with TF.js bundled
        "src/lib/ai/runtime-trainer.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@lib": resolve(__dirname, "src/lib"),
      "@generators": resolve(__dirname, "src/lib/generators"),
      "@rules": resolve(__dirname, "src/lib/rules"),
      "@ai": resolve(__dirname, "src/lib/ai"),
      "@form": resolve(__dirname, "src/lib/form"),
      "@storage": resolve(__dirname, "src/lib/storage"),
      "@types": resolve(__dirname, "src/types"),
    },
  },
});
