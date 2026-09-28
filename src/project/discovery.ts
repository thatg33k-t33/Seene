import {RESOURCES} from "../core/resources";
import { SCENE_RECIPE_DIRECTORY, type SceneCatalog } from "../core/recipes";
import { sceneApplicationRoute } from "../core/platform";
import type { SceneIssue } from "../core/scene";
import * as services from "./services";

function diagnostic(error: unknown, target = ""): SceneIssue {
  const known = error instanceof Error && "code" in error && "target" in error;
  return { path: known && typeof error.target === "string" ? error.target : target,
    message: known ? error.message : "Unable to read the local scene source. Check files and permissions, then retry." };
}
export async function discoverRecipes(root: string, sceneId?: string): Promise<SceneCatalog> {
  const paths = await services.scanDirectory(root, SCENE_RECIPE_DIRECTORY, 256);
  const sources: { path: string; document: unknown }[] = [];
  const bindingPaths: string[] = [];
  const issues: SceneIssue[] = [];
  for (const path of paths) {
    if (/\.[jt]sx$/.test(path)) {
      try { if (await services.isRegularFile(root, path)) bindingPaths.push(path); }
      catch (error) { issues.push(diagnostic(error, path)); }
    } else if (path.endsWith(".scene.json")) {
      try {
        const text = await services.readText(root, path, 256_000);
        if (text === undefined) {
          issues.push({ path, message: "Recipe disappeared during discovery. Restore it or refresh the scene list." });
          continue;
        }
        let document: unknown;
        try { document = JSON.parse(text); }
        catch {
          issues.push({ path, message: "Invalid recipe JSON. Correct its syntax and reload the scene list." });
          continue;
        }
        sources.push({ path, document });
      } catch (error) { issues.push(diagnostic(error, path)); }
    }
  }
  const catalog = RESOURCES["resolve-recipes"]({ sources, bindingPaths, ...(sceneId === undefined ? {} : { sceneId }) });
  const scenes = await Promise.all(catalog.scenes.map(async scene => {
    if (scene.application) return scene;
    let source: string | undefined;
    try { source = await services.readText(root, scene.binding, 64_000); }
    catch (error) { issues.push(diagnostic(error, scene.binding)); }
    if (source === undefined) return scene;
    const route = sceneApplicationRoute({ source, bindingPath: scene.binding });
    return route ? { ...scene, application: { route } } : scene;
  }));
  const selected = sceneId === undefined ? undefined : scenes.find(scene => scene.id === sceneId);
  return { ...catalog, scenes, selected,
    issues: [...issues, ...catalog.issues].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) };
}
