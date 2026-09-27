import { lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { SCENE_RECIPE_DIRECTORY, type SceneCatalog, type SceneRecipe } from "../core/recipes";
import { RESOURCES } from "../core/resources";
import { analyzeApplicationModule, isApplicationSourcePath, type PlatformContent } from "../core/platform";
import type { SceneIssue } from "../core/scene";

export class PlatformFault extends Error {
  code: string;
  target: string;
  constructor(code: string, message: string, target = "") {
    super(message);
    this.name = "PlatformFault";
    this.code = code;
    this.target = target;
  }
}

const protectedParts = new Set([".git", "node_modules"]);
const maxRecipeBytes = 256_000;
const maxSourceBytes = 64_000;

export async function resolveProjectTarget(root: string, target: string): Promise<string> {
  if (path.isAbsolute(target)) throw new PlatformFault("denied-path", "Use a project-relative path.", target);
  const relative = target.replace(/^[/\\]+/, "");
  if (!relative) throw new PlatformFault("denied-path", "Use a project-relative path.", target);
  const base = path.resolve(root);
  const absolute = path.resolve(base, relative);
  if (absolute !== base && !absolute.startsWith(base + path.sep)) throw new PlatformFault("denied-path", "Path escapes the project root.", target);
  const parts = path.relative(base, absolute).split(path.sep).filter(Boolean);
  if (parts.some(part => protectedParts.has(part))) throw new PlatformFault("denied-path", "Path enters a protected directory.", target);
  let current = base;
  for (const part of parts) {
    current = path.join(current, part);
    const entry = await lstat(current).catch(error => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    });
    if (entry?.isSymbolicLink()) throw new PlatformFault("denied-path", "Symlinked targets are refused.", target);
  }
  return absolute;
}

async function readScoped(root: string, target: string, limit: number): Promise<string | undefined> {
  const absolute = await resolveProjectTarget(root, target);
  const entry = await lstat(absolute).catch(() => undefined);
  if (!entry?.isFile() || entry.size > limit) return undefined;
  return readFile(absolute, "utf8");
}

export async function readSceneCatalog(root: string, sceneId?: string): Promise<SceneCatalog> {
  const directory = await resolveProjectTarget(root, SCENE_RECIPE_DIRECTORY).catch(() => undefined);
  const entries = directory ? await readdir(directory, { withFileTypes: true }).catch(() => []) : [];
  const sources: { path: string; document: unknown }[] = [];
  const bindingPaths: string[] = [];
  const issues: SceneIssue[] = [];
  for (const entry of entries.slice(0, 256)) {
    if (!entry.isFile()) continue;
    const relative = `${SCENE_RECIPE_DIRECTORY}/${entry.name}`;
    if (/\.[jt]sx$/.test(entry.name)) { bindingPaths.push(relative); continue; }
    if (!entry.name.endsWith(".scene.json")) continue;
    const text = await readScoped(root, relative, maxRecipeBytes);
    if (text === undefined) { issues.push({ path: relative, message: "Recipe disappeared during discovery. Restore it or refresh the scene list." }); continue; }
    try { sources.push({ path: relative, document: JSON.parse(text) }); }
    catch { issues.push({ path: relative, message: "Invalid recipe JSON. Correct its syntax and reload the scene list." }); }
  }
  const catalog = RESOURCES["resolve-recipes"]({ sources, bindingPaths, ...(sceneId === undefined ? {} : { sceneId }) });
  return { ...catalog, issues: [...issues, ...catalog.issues].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) };
}

export async function writeSceneSourcePair(root: string, id: string, recipe: SceneRecipe, componentSource: string): Promise<"created" | "exists"> {
  const directory = await resolveProjectTarget(root, SCENE_RECIPE_DIRECTORY);
  const recipePath = path.join(directory, `${id}.scene.json`);
  const bindingPath = path.join(directory, `${id}.tsx`);
  const exists = (target: string) => lstat(target).then(() => true, () => false);
  if (await exists(recipePath) || await exists(bindingPath)) return "exists";
  await mkdir(directory, { recursive: true });
  let created = false;
  try {
    await writeFile(bindingPath, componentSource, { encoding: "utf8", flag: "wx" });
    created = true;
    await writeFile(recipePath, JSON.stringify(recipe, null, 2), { encoding: "utf8", flag: "wx" });
    return "created";
  } catch (error) {
    if (created) await rm(bindingPath, { force: true });
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return "exists";
    throw error;
  }
}

export async function removeSceneSourcePair(root: string, id: string): Promise<boolean> {
  const directory = await resolveProjectTarget(root, SCENE_RECIPE_DIRECTORY);
  const recipePath = path.join(directory, `${id}.scene.json`);
  const removed = await lstat(recipePath).then(() => true, () => false);
  await rm(recipePath, { force: true });
  await rm(path.join(directory, `${id}.tsx`), { force: true });
  return removed;
}

export async function discoverApplicationContent(root: string, limit = 400): Promise<PlatformContent> {
  const files: PlatformContent["files"] = [];
  const walk = async (relative: string) => {
    if (files.length >= limit) return;
    const absolute = await resolveProjectTarget(root, relative).catch(() => undefined);
    if (!absolute) return;
    const entries = await readdir(absolute, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (files.length >= limit) return;
      if (entry.name.startsWith(".") || protectedParts.has(entry.name)) continue;
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) {
        if (child === SCENE_RECIPE_DIRECTORY || child.startsWith(SCENE_RECIPE_DIRECTORY + "/")) continue;
        if (entry.name === "dist" || entry.name === "build") continue;
        await walk(child);
        continue;
      }
      if (!entry.isFile() || !isApplicationSourcePath(child)) continue;
      const text = await readScoped(root, child, maxSourceBytes);
      if (text === undefined) continue;
      const analysis = analyzeApplicationModule(text);
      if (!analysis.default && !analysis.exports.length) continue;
      files.push({ path: child, default: analysis.default, exports: analysis.exports });
    }
  };
  await walk("src");
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)) };
}

export function componentImportSpecifier(target: string): string {
  const relative = path.posix.relative(SCENE_RECIPE_DIRECTORY, target.replace(/\\/g, "/")).replace(/\.(?:tsx|jsx)$/, "");
  return relative.startsWith(".") ? relative : `./${relative}`;
}
