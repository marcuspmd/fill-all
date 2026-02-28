import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.json";

export default defineConfig(async () => {
  const istanbulPlugins =
    process.env.VITE_COVERAGE === "true"
      ? [
          (await import("vite-plugin-istanbul")).default({
            include: "src/*",
            exclude: ["node_modules", "src/__tests__"],
            extension: [".ts"],
            requireEnv: false,
          }),
        ]
      : [];

  return {
    plugins: [crx({ manifest }), ...istanbulPlugins],
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
      sourcemap: true,
      rollupOptions: {
        input: {
          "devtools-panel": resolve(__dirname, "src/devtools/panel.html"),
        },
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
  };
});
