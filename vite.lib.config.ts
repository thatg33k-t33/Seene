import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "dist/library",
    emptyOutDir: true,
    lib: { entry: { index: "src/index.ts", preview: "src/preview/index.tsx", vite: "src/vite/seene-plugin.ts" }, formats: ["es"], fileName: (_format, name) => `${name}.js` },
    rollupOptions: {
      output: { banner: '"use client";' },
      external: ["react", "react-dom", "react/jsx-runtime", "react-error-boundary", "zod", "vite", "node:fs/promises", "node:http", "node:path"],
    },
    sourcemap: true,
  },
});
