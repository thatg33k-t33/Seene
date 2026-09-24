import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer, type Server } from "node:http";
import { executeProjectCommand } from "../../src/project/commands";
import { ProjectResultSchema, type ProjectResult } from "../../src/core/project";
import * as services from "../../src/project/services";
import { generatedPreview, htmlEntry, inspectEntry } from "../../src/project/vite";
import { RESOURCES } from "../../src/core/resources";
import { SEENE_BRAND } from "../../src/core/branding";

const roots: string[] = [];
const servers: Server[] = [];
const original = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "./Provider";
import App from "./App";
// Keep this provider and all application state.
createRoot(document.getElementById("root")!).render(
  <StrictMode><Provider tenant="local"><App /></Provider></StrictMode>,
);
`;
async function put(root: string, file: string, text: string) {
  await mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await writeFile(path.join(root, file), text);
}
async function fixture(options: { installed?: boolean; source?: string } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "flute-project-"));
  roots.push(root);
  await put(root, "package.json", JSON.stringify({ name: "host", scripts: { dev: "vite" },
    dependencies: { react: "^19.2.0", "react-dom": "^19.2.0", ...(options.installed === false ? {} : { "@thatg33k/seene": "0.1.0" }) },
    devDependencies: { vite: "^7.3.6" } }));
  await put(root, "package-lock.json", '{"lockfileVersion":3}');
  await put(root, "index.html", '<div id="root"></div><script type="module" src="/src/main.tsx"></script>');
  await put(root, "vite.config.ts", 'import {defineConfig} from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({plugins:[react()]});');
  await put(root, "src/main.tsx", options.source ?? original);
  await put(root, ".env", "FIXTURE_ONLY=preserve\n");
  await put(root, "node_modules/react/package.json", '{"name":"react","version":"19.2.0"}');
  await put(root, "node_modules/react-dom/package.json", '{"name":"react-dom","version":"19.2.0"}');
  if (options.installed !== false) await installFixture(root);
  return root;
}
async function installFixture(root: string) {
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  pkg.dependencies["@thatg33k/seene"] = "0.1.0";
  await put(root, "package.json", JSON.stringify(pkg));
  await put(root, "node_modules/@thatg33k/seene/package.json", JSON.stringify({ name: "@thatg33k/seene", version: "0.1.0", exports: { "./preview": { import: "./preview.js" } } }));
  await put(root, "node_modules/@thatg33k/seene/preview.js", "export const ProjectPreview = () => null;");
}
function run(root: string, operation: unknown = "init-project", input: unknown = {}) {
  return executeProjectCommand(operation, input, { root });
}
function success(result: ProjectResult) {
  expect(ProjectResultSchema.safeParse(result).success).toBe(true);
  expect(result, JSON.stringify(result)).toMatchObject({ success: true });
  if (!result.success) throw new Error(JSON.stringify(result));
  return result.data;
}
function failure(result: ProjectResult, code: string) {
  expect(ProjectResultSchema.safeParse(result).success).toBe(true);
  expect(result).toMatchObject({ success: false, issues: [{ code }] });
}
async function server(body: (url: string) => { status?: number; headers?: Record<string, string>; text?: string }) {
  const app = createServer((req, res) => {
    const response = body(req.url ?? "/");
    res.writeHead(response.status ?? 200, response.headers ?? { "content-type": "text/html" });
    res.end(response.text ?? "");
  });
  servers.push(app);
  await new Promise<void>(resolve => app.listen(0, "127.0.0.1", resolve));
  const address = app.address();
  if (!address || typeof address === "string") throw new Error("Invalid address");
  return `http://127.0.0.1:${address.port}`;
}
afterEach(async () => {
  vi.restoreAllMocks();
  while (servers.length) {
    const s = servers.pop();
    await new Promise<void>(resolve => s?.close(() => resolve()));
  }
  while (roots.length) {
    const r = roots.pop();
    if (r) await rm(r, { recursive: true, force: true });
  }
});

describe("project initialization and preview integration", () => {
  it("recognizes current React refresh injection and Vite timestamped entry", () => {
    const id = "36c238cf-44e8-43be-b72a-e5196b075598";
    const adapted = inspectEntry(original, "main.tsx", id);
    expect(adapted.integrated).toBe(true);
    expect(adapted.text).toContain("FluteProjectPreview");
    expect(inspectEntry(adapted.text, "main.tsx", id).integrated).toBe(true);
    const timestamped = original.replace('src/main.tsx', 'src/main.tsx?t=1730000000000');
    expect(inspectEntry(timestamped, "main.tsx?t=1730000000000", id).integrated).toBe(true);
  });
  it("waits for an edited entry to reach the existing dev server", async () => {
    const root = await fixture();
    const first = success(await run(root));
    const url = await server(url => ({ text: url === "/"
      ? '<script type="module" src="/src/main.tsx"></script>'
      : 'import {ProjectPreview} from "/node_modules/.vite/deps/@thatg33k_seene_preview.js"; const projectId="' + first.project!.projectId + '";' }));
    const open = vi.spyOn(services, "openBrowser").mockResolvedValue();
    const result = success(await run(root, "open-preview", { url, launch: false }));
    expect(result.url).toBe(url + "/?flute-preview=1");
    expect(open).not.toHaveBeenCalled();
  });
  it("rejects unknown operations and malformed input before any filesystem effect", async () => {
    const root = await fixture();
    failure(await run(root, "unknown-operation"), "invalid-operation");
    failure(await run(root, "open-preview", { url: "not-a-url" }), "invalid-input");
    expect(await readdir(root)).not.toContain(".flute");
  });
  it("preserves host providers, source/config/env/lock bytes and stays idempotent across all entry operations", async () => {
    const root = await fixture();
    const config = await readFile(path.join(root, "vite.config.ts"), "utf8");
    const env = await readFile(path.join(root, ".env"), "utf8");
    const lock = await readFile(path.join(root, "package-lock.json"), "utf8");
    const first = success(await run(root));
    expect(first.changed).toBe(true);
    expect(success(await run(root)).changed).toBe(false);
    expect(success(await run(root, "sync-project")).changed).toBe(false);
    expect(success(await run(root, "load-project")).project!.projectId).toBe(first.project!.projectId);
    expect(await readFile(path.join(root, "vite.config.ts"), "utf8")).toBe(config);
    expect(await readFile(path.join(root, ".env"), "utf8")).toBe(env);
    expect(await readFile(path.join(root, "package-lock.json"), "utf8")).toBe(lock);
    const main = await readFile(path.join(root, "src/main.tsx"), "utf8");
    expect(main).toContain('<Provider tenant="local">');
    expect(main).toContain('<App /></Provider></StrictMode>');
  });
  it("supports an aliased createRoot and separate top-level root const, including JSX entries", async () => {
    const root = await fixture({ source: 'import { createRoot as mount } from "react-dom/client";\nimport App from "./App";\nmount(document.getElementById("root")!).render(<App />);\n' });
    success(await run(root));
    const jsxRoot = await fixture({ source: 'import { createRoot } from "react-dom/client";\nimport App from "./App";\nconst container = document.getElementById("root");\nconst root = createRoot(container);\nroot.render(<App />);\n' });
    await rm(path.join(jsxRoot, "src/main.tsx"));
    await put(jsxRoot, "src/main.jsx", 'import { createRoot } from "react-dom/client";\nimport App from "./App";\ncreateRoot(document.getElementById("root")).render(<App />);\n');
    await put(jsxRoot, "index.html", '<div id="root"></div><script type="module" src="/src/main.jsx"></script>');
    success(await run(jsxRoot));
  });
  it.each([
    '<script type="module" src="./src/main.tsx"></script>',
    '<script type="module" src="src/main.tsx"></script>',
    '<script type="module" src="/src/main.tsx"></script>',
  ])("uses a portable connection instead of rewriting ambiguous root syntax", async html => {
    const root = await fixture();
    await put(root, "index.html", html);
    const result = success(await run(root));
    expect(result.integration?.kind).toBe("react");
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(original);
  });
  it.each([
    { config: 'import { defineConfig } from "vite"; import react from "@vitejs/plugin-react"; export default defineConfig({ plugins: [react()] });', missing: "react" },
    { config: 'import { defineConfig } from "vite"; export default defineConfig({});', missing: "vite" },
    { html: '<html><body><script src="/src/main.tsx"></script></body></html>' },
    { lock: "yarn.lock" },
    { lock: "pnpm-lock.yaml" },
    { lock: "bun.lockb" },
  ])("keeps custom host vite.config.ts intact or rejects a missing React package", async fixtureChanges => {
    const root = await fixture();
    if (fixtureChanges.config) await put(root, "vite.config.ts", fixtureChanges.config);
    if (fixtureChanges.missing) {
      const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
      delete pkg.dependencies[fixtureChanges.missing];
      await put(root, "package.json", JSON.stringify(pkg));
    }
    if (fixtureChanges.html) await put(root, "index.html", fixtureChanges.html);
    if (fixtureChanges.lock) {
      await rm(path.join(root, "package-lock.json"));
      await put(root, fixtureChanges.lock, "lock");
    }
    const result = await run(root);
    failure(result, "unsupported-project");
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(original);
  });
  it("reports missing package with public installation instructions without mutating the app", async () => {
    const root = await fixture({ installed: false });
    const result = await run(root);
    failure(result, "missing-installation");
    expect(JSON.stringify(result)).toContain("npm install @thatg33k/seene");
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(original);
    expect(await readdir(root)).not.toContain(".flute");
  });
  it("does not trust a user manifest without installed package or real integration", async () => {
    const root = await fixture({ installed: false });
    success(await run(root, "init-project", { adapter: "react" }));
    const result = await run(root, "load-project");
    failure(result, "missing-installation");
  });
  it("checks installed preview export on repeat even when state and wrapper exist", async () => {
    const root = await fixture();
    success(await run(root));
    await rm(path.join(root, "node_modules/@thatg33k/seene/preview.js"));
    failure(await run(root, "load-project"), "missing-installation");
  });
  it.each([
    "../outside.tsx",
    ".env.tsx",
    ".git/secret.tsx",
    "src/../../outside.tsx",
  ])("denies entry traversal/protected target %s", async target => {
    const root = await fixture();
    const result = await run(root, "init-project", { adapter: "react" });
    const state = JSON.parse(await readFile(path.join(root, ".flute/project.json"), "utf8"));
    state.entry = target;
    await put(root, ".flute/project.json", JSON.stringify(state));
    failure(await run(root, "load-project"), "denied-path");
  });
  it.each([".flute", "SEENE.md", "src/main.tsx", "package-lock.json", "vite.config.ts"])("denies symlink targets %s before writing", async target => {
    const root = await fixture();
    await symlink(path.join(root, "index.html"), path.join(root, target));
    const result = await run(root);
    failure(result, "denied-path");
    expect(await readFile(path.join(root, "index.html"), "utf8")).toBe('<div id="root"></div><script type="module" src="/src/main.tsx"></script>');
  });
  it("escapes persisted entry paths and dirty project identity", async () => {
    const root = await fixture();
    success(await run(root));
    const project = JSON.parse(await readFile(path.join(root, ".flute/project.json"), "utf8"));
    project.projectId = "bad-uuid";
    await put(root, ".flute/project.json", JSON.stringify(project));
    failure(await run(root, "load-project"), "invalid-file");
  });
  it("resumes failed installation through the same pending identity", async () => {
    const root = await fixture({ installed: false });
    await put(root, "flute.tgz", "fixture transport only");
    const install = vi.spyOn(services, "installPackage").mockRejectedValueOnce(new Error("interrupted"));
    failure(await run(root, "init-project", { packageSource: "./flute.tgz" }), "project-error");
    const firstProject = JSON.parse(await readFile(path.join(root, ".flute/pending.json"), "utf8")).project;
    install.mockImplementation(async project => installFixture(project));
    const second = success(await run(root, "init-project", { packageSource: "./flute.tgz" }));
    expect(second.project).toEqual(firstProject);
    expect(await readdir(path.join(root, ".flute"))).toEqual(["project.json"]);
  });
  it("resumes an interruption between entry and state writes without duplicate wrapping", async () => {
    const root = await fixture();
    const write = services.atomicWrite;
    vi.spyOn(services, "atomicWrite").mockImplementation(async (...args) => {
      if (args[1] === ".flute/project.json") throw new Error("interrupted");
      return write(...args);
    });
    failure(await run(root), "project-error");
    const pendingText = await readFile(path.join(root, ".flute/pending.json"), "utf8");
    const originalMain = await readFile(path.join(root, "src/main.tsx"), "utf8");
    vi.restoreAllMocks();
    success(await run(root));
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(originalMain);
    expect(JSON.parse(await readFile(path.join(root, ".flute/pending.json"), "utf8"))).toEqual(JSON.parse(pendingText));
    expect(await readdir(path.join(root, ".flute"))).toEqual(["project.json"]);
  });
  it("refuses dirty source after an interrupted write, then recovers when restored", async () => {
    const root = await fixture();
    const write = services.atomicWrite;
    vi.spyOn(services, "atomicWrite").mockImplementation(async (...args) => {
      if (args[1] === ".flute/project.json") throw new Error("interrupted");
      return write(...args);
    });
    failure(await run(root), "project-error");
    vi.restoreAllMocks();
    await put(root, "src/main.tsx", original + "// manual edit\n");
    failure(await run(root), "conflict");
    await put(root, "src/main.tsx", original);
    success(await run(root));
  });
  it("refuses changed files in atomic mutation instead of overwriting them", async () => {
    const root = await fixture();
    await expect(services.atomicWrite(root, "src/main.tsx", "replacement", "stale")).rejects.toMatchObject({ code: "conflict" });
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(original);
  });
  it("verifies dev entry identity, preserves the origin and optionally opens only that preview", async () => {
    const root = await fixture();
    const project = success(await run(root)).project!;
    const url = await server(route => ({ text: route === "/"
      ? '<script type="module" src="/@vite/client"></script><script type="module">import RefreshRuntime from "/@react-refresh";</script><script type="module" src="/src/main.tsx"></script>'
      : 'import {ProjectPreview} from "/node_modules/.vite/deps/@thatg33k_seene_preview.js"; const projectId="' + project.projectId + '";' }));
    const open = vi.spyOn(services, "openBrowser").mockResolvedValue();
    expect(success(await run(root, "open-preview", { url, launch: false })).url).toBe(url + "/?flute-preview=1");
    expect(open).not.toHaveBeenCalled();
    success(await run(root, "open-preview", { url, launch: true }));
    expect(open).toHaveBeenCalledWith(await services.canonicalRoot(root), url + "/?flute-preview=1");
  });
  it.each(["wrong-entry", "wrong-id", "redirect", "too-large", "missing"])("rejects %s dev server without opening a browser", async kind => {
    const root = await fixture();
    success(await run(root));
    const url = await server(route => kind === "redirect" ? { status: 302, headers: { location: "http://example.com" } }
      : kind === "too-large" ? { text: "x".repeat(2_000_001) }
      : { text: route === "/" ? '<script type="module" src="/src/' + (kind === "wrong-entry" ? "other" : "main") + '.tsx"></script>' : "wrong project" });
    if (kind === "missing") await new Promise<void>(resolve => servers[0].close(() => resolve()));
    const open = vi.spyOn(services, "openBrowser").mockResolvedValue();
    const result = await run(root, "open-preview", { url });
    failure(result, "missing-dev-server");
    expect(JSON.stringify(result)).toContain("pnpm dev");
    expect(open).not.toHaveBeenCalled();
  });
  it("preserves entry directives and refuses type-only React imports", () => {
    const id = "36c238cf-44e8-43be-b72a-e5196b075598";
    const source = '"use client";\n' + original;
    const adapted = inspectEntry(source, "main.tsx", id).text;
    expect(adapted.startsWith('"use client";\n')).toBe(true);
    expect(inspectEntry(adapted, "main.tsx", id).integrated).toBe(true);
    expect(() => inspectEntry(original.replace('import { createRoot }', 'import type { createRoot }'), "main.tsx", id)).toThrow();
  });
  it("uses a portable connection for ambiguous HTML without rewriting it", async () => {
    const root = await fixture();
    await put(root, "index.html", '<script type="module" src="/src/main.tsx"></script><script type=module src="/src/other.tsx"></script>');
    expect(success(await run(root)).integration?.kind).toBe("react");
    expect(await readFile(path.join(root,"index.html"),"utf8")).toContain("type=module");
  });
  it("repairs a partial package install on a pending retry with an explicit tarball", async () => {
    const root = await fixture({ installed: false });
    await put(root, "flute.tgz", "fixture transport only");
    const install = vi.spyOn(services, "installPackage").mockImplementationOnce(async project => {
      await put(project, "node_modules/@thatg33k/seene/package.json", '{');
      throw new Error("interrupted install");
    });
    failure(await run(root, "init-project", { packageSource: "./flute.tgz" }), "project-error");
    install.mockImplementation(async project => installFixture(project));
    success(await run(root, "init-project", { packageSource: "./flute.tgz" }));
    expect(success(await run(root)).changed).toBe(false);
  });
  it("finishes cleanup after state was committed but journal removal was interrupted", async () => {
    const root = await fixture();
    vi.spyOn(services, "removeText").mockRejectedValueOnce(new Error("interrupted cleanup"));
    failure(await run(root), "project-error");
    failure(await run(root, "load-project"), "incomplete-setup");
    vi.restoreAllMocks();
    success(await run(root));
    expect(success(await run(root)).changed).toBe(false);
  });
  it("rejects altered gate, duplicate wrappers and shadowed names", () => {
    const id = "36c238cf-44e8-43be-b72a-e5196b075598";
    const adapted = inspectEntry(original, "main.tsx", id).text;
    expect(() => inspectEntry(adapted.replace("import.meta.env.DEV", "true"), "main.tsx", id)).toThrow();
    expect(() => inspectEntry(adapted + "\nconst stolen = FluteProjectPreview;", "main.tsx", id)).toThrow();
    expect(() => inspectEntry(original + "\nfunction another(createRoot: unknown) {}", "main.tsx", id)).toThrow();
  });
});

describe("installed coding-agent handoff", () => {
  it("creates the canonical guide pointer without requiring a tarball or changing agent instructions", async () => {
    const root = await fixture();
    for (const name of ["AGENTS.md", "CLAUDE.md", ".agents/custom.md", ".codex/config.toml"])
      await put(root, name, "user instructions\n");
    const install = vi.spyOn(services, "installPackage");
    const first = success(await run(root));
    expect(first.handoff).toMatchObject({ path: "SEENE.md", guideCommand: "pnpm exec seene guide --json", guideVersion: RESOURCES["authoring-guide"]().version });
    expect(first.handoff!.prompt).toContain("Seene studio");
    const text = await readFile(path.join(root, "SEENE.md"), "utf8");
    for (const pointer of [SEENE_BRAND.title, SEENE_BRAND.url, "@thatg33k/seene/preview", "src/seene/scenes"])
      expect(text).toContain(pointer);
    expect(text).not.toContain(RESOURCES["authoring-guide"]().concepts[0].mechanism);
    const repeat = success(await run(root));
    expect(repeat.changed).toBe(false);
    expect(repeat.handoff).toEqual(first.handoff);
    expect(await readFile(path.join(root, "SEENE.md"), "utf8")).toBe(text);
    expect(install).not.toHaveBeenCalled();
    for (const name of ["AGENTS.md", "CLAUDE.md", ".agents/custom.md", ".codex/config.toml"])
      expect(await readFile(path.join(root, name), "utf8")).toBe("user instructions\n");
  });
  it.each(["# My Flute notes\n", ""])("preserves a pre-existing user SEENE.md before any setup mutation", async content => {
    const root = await fixture();
    await put(root, "SEENE.md", content);
    const result = await run(root);
    failure(result, "conflict");
    expect(JSON.stringify(result)).toContain("Move or rename");
    expect(await readFile(path.join(root, "SEENE.md"), "utf8")).toBe(content);
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(original);
    expect(await readdir(root)).not.toContain(".flute");
    await rm(path.join(root, "SEENE.md"));
    success(await run(root));
  });
  it("does not mistake an edited generated entry for permission to overwrite", async () => {
    const root = await fixture();
    success(await run(root));
    const text = await readFile(path.join(root, "SEENE.md"), "utf8") + "My notes\n";
    await put(root, "SEENE.md", text);
    failure(await run(root), "conflict");
    expect(await readFile(path.join(root, "SEENE.md"), "utf8")).toBe(text);
    // The handoff is onboarding, not a runtime requirement for existing scenes.
    success(await run(root, "load-project"));
  });
  it("adds the handoff to an already initialized app without rewrapping it", async () => {
    const root = await fixture();
    const first = success(await run(root));
    const source = await readFile(path.join(root, "src/main.tsx"), "utf8");
    await rm(path.join(root, "SEENE.md"));
    const resumed = success(await run(root));
    expect(resumed.changed).toBe(true);
    expect(resumed.project).toEqual(first.project);
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(source);
  });
  it.each(["SEENE.md", "src/main.tsx"])("resumes interruption at %s with the same identity and handoff", async target => {
    const root = await fixture();
    const write = services.atomicWrite;
    vi.spyOn(services, "atomicWrite").mockImplementation(async (...args) => {
      if (args[1] === target) throw new Error("interrupted");
      return write(...args);
    });
    failure(await run(root), "project-error");
    const pending = JSON.parse(await readFile(path.join(root, ".flute/pending.json"), "utf8"));
    vi.restoreAllMocks();
    const result = success(await run(root));
    expect(result.project).toEqual(pending.project);
    expect(result.handoff!.path).toBe("SEENE.md");
    expect(success(await run(root)).changed).toBe(false);
    expect(await readdir(path.join(root, ".flute"))).toEqual(["project.json"]);
  });
  it("preserves a handoff created by another writer during installation and then recovers", async () => {
    const root = await fixture({ installed: false });
    await put(root, "flute.tgz", "fixture transport only");
    vi.spyOn(services, "installPackage").mockImplementation(async project => {
      await installFixture(project);
      await put(project, "SEENE.md", "user document created during install");
    });
    failure(await run(root, "init-project", { packageSource: "./flute.tgz" }), "conflict");
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(original);
    expect(await readFile(path.join(root, "SEENE.md"), "utf8")).toBe("user document created during install");
    await rm(path.join(root, "SEENE.md"));
    success(await run(root));
  });
  it("creates absent files exclusively under concurrent writes", async () => {
    const root = await fixture();
    const results = await Promise.allSettled([
      services.atomicWrite(root, "SEENE.md", "first", undefined),
      services.atomicWrite(root, "SEENE.md", "second", undefined),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find(result => result.status === "rejected")).toMatchObject({ reason: { code: "conflict" } });
    expect(["first", "second"]).toContain(await readFile(path.join(root, "SEENE.md"), "utf8"));
    expect((await readdir(root)).filter(name => name.startsWith("SEENE.md."))).toEqual([]);
  });
  it.each(["react", "react-dom"])("reports missing %s instead of asking for a Flute tarball", async name => {
    const root = await fixture();
    await rm(path.join(root, "node_modules", name), { recursive: true });
    const result = await run(root);
    failure(result, "missing-installation");
    expect(JSON.stringify(result)).toContain("npm install");
    expect(JSON.stringify(result)).toContain(name);
    expect(await readdir(root)).not.toContain(".flute");
    expect(await readdir(root)).not.toContain("SEENE.md");
  });
  it("reports an absent local tarball before creating setup files", async () => {
    const root = await fixture({ installed: false });
    const result = await run(root, "init-project", { packageSource: "./missing.tgz" });
    failure(result, "package-unavailable");
    expect(JSON.stringify(result)).toContain("Correct --package");
    expect(await readdir(root)).not.toContain(".flute");
  });
});

describe("generated preview refresh boundary setup", () => {
  const adapterPath = "src/flute/ProjectPreview.tsx";
  function legacyEntry(id: string, version: number) {
    const props = `projectId="${id}" enabled={import.meta.env.DEV}`
      + (version >= 3 ? ' hot={import.meta.hot}' : '')
      + (version >= 4 ? ' sceneModules={import.meta.env.DEV ? import.meta.glob("/src/flute/scenes/*.{scene.json,tsx}") : undefined}' : '');
    return 'import { ProjectPreview as FluteProjectPreview } from "@thatg33k/seene/preview";\n'
      + original.replace('<StrictMode>', `<FluteProjectPreview ${props}>{<StrictMode>`)
        .replace('</StrictMode>,', '</StrictMode>}</FluteProjectPreview>,');
  }
  it.each([2, 3, 4])("upgrades generated v%s props while preserving identity and providers", async version => {
    const root = await fixture();
    const first = success(await run(root));
    const current = await readFile(path.join(root, "src/main.tsx"), "utf8");
    await rm(path.join(root, adapterPath));
    await put(root, "src/main.tsx", legacyEntry(first.project!.projectId, version));
    success(await run(root));
    expect(await readFile(path.join(root, "src/main.tsx"), "utf8")).toBe(current);
  });
});
