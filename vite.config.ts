import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { seenePlatformPlugin } from "./src/vite/platform-plugin";

// The Seene platform's own server. Consumer applications keep their own Vite config and add
// seeneCreateScenePlugin() from @thatg33k/seene/vite when they want scene creation from their studio.
export default defineConfig({
  resolve: {
    alias: {
      "@thatg33k/seene/preview": path.resolve(process.cwd(), "src/preview/index.tsx"),
      "@thatg33k/seene": path.resolve(process.cwd(), "src/index.ts"),
    },
  },
  plugins: [react(), tailwindcss(), seenePlatformPlugin()],
  server: {host:"127.0.0.1",port:Number(process.env.APP_PORT ?? process.env.PORT ?? 5173),strictPort:true},
  preview: {host:"127.0.0.1",port:Number(process.env.APP_PORT ?? process.env.PORT ?? 5173),strictPort:true},
});
