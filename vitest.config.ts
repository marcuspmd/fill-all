import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/__tests__/**"],
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
