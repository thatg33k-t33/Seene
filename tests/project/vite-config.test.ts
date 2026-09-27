import { describe, expect, it } from "vitest";
import { inspectConfig } from "../../src/project/vite";

const shadcn = `import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});`;
const inspect = (source: string) => inspectConfig(source, "vite.config.ts");
const seene = `import react from '@vitejs/plugin-react';
import {seeneCreateScenePlugin} from '@thatg33k/seene/vite';
export default {plugins: [react(), seeneCreateScenePlugin()]};`;

describe("Vite configuration compatibility", () => {
  it.each([
    ["official React and Tailwind plugins", shadcn],
    ["node:path import", shadcn.replace("from 'path'", "from 'node:path'")],
    ["renamed supported imports", shadcn.replaceAll("path", "nodePath").replace("from 'nodePath'", "from 'path'")
      .replaceAll("tailwindcss", "cssPlugin").replace("@cssPlugin/vite", "@tailwindcss/vite")
      .replace("{ defineConfig }", "{ defineConfig as config }").replace("default defineConfig", "default config")],
    ["React SWC", shadcn.replace("@vitejs/plugin-react'", "@vitejs/plugin-react-swc'")],
    ["static host options and custom source alias", shadcn.replace("plugins:", "server: { host: '127.0.0.1' }, plugins:")],
    ["standard React plugin", "import react from '@vitejs/plugin-react'; export default {plugins: [react()]};"],
    ["Seene scene creation plugin", seene],
  ])("accepts %s without changing the host configuration", (_name, source) => {
    expect(() => inspect(source)).not.toThrow();
  });

  it.each([
    ["missing React refresh plugin", "export default {root: './', base: '/', server: {port: 5173, strictPort: true}};"],
    ["unknown imported plugin", shadcn.replace("@tailwindcss/vite", "custom-plugin")],
    ["unbound plugin call", shadcn.replace("tailwindcss()", "customPlugin()")],
    ["plugin options requiring manual review", shadcn.replace("react()", "react({})")],
    ["duplicate React plugin", shadcn.replace("react()", "react(), react()")],
    ["multiple React implementations", shadcn.replace("import path", "import swc from '@vitejs/plugin-react-swc'; import path")
      .replace("react()", "react(), swc()")],
    ["plugin array spread", shadcn.replace("react()", "...react()")],
    ["dynamic root", shadcn.replace("plugins:", "root: process.env.ROOT, plugins:")],
    ["unsupported external root", shadcn.replace("plugins:", "root: '../other', plugins:")],
    ["dynamic config", shadcn.replace("defineConfig({", "defineConfig(() => ({").replace("});", "}));")],
    ["config spread", shadcn.replace("plugins:", "...options, plugins:")],
    ["duplicate config key", shadcn.replace("plugins:", "plugins: [react()], plugins:")],
    ["unknown config imports", shadcn.replace("@tailwindcss/vite", "custom-plugin")],
    ["type-only React plugin", shadcn.replace("import react", "import type react")],
    ["unknown Seene Vite export", seene.replace("seeneCreateScenePlugin", "anotherPlugin")],
    ["Seene plugin options requiring manual review", seene.replace("seeneCreateScenePlugin()", "seeneCreateScenePlugin({})")],
    ["Seene plugin default import", seene.replace("{seeneCreateScenePlugin}", "seeneCreateScenePlugin")],
  ])("rejects %s with a supported-project diagnostic", (_name, source) => {
    expect(() => inspect(source)).toThrow(expect.objectContaining({ code: "unsupported-project" }));
  });
});
