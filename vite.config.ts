import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [crx({ manifest })],
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
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
