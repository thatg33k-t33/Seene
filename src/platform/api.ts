import {
  PLATFORM_API_PREFIX, type PlatformCatalog, type PlatformContent, type PlatformProject,
  type PlatformStatus,
} from "../core/platform";

/** SOURCE OF TRUTH: platformApi, readRoute.
 * WHAT: call the local Seene platform API and read the platform's own route state.
 * WHY: the platform surface must not import project or host code, only its shared contract.
 * WHERE: src/platform views and routing use these helpers.
 */

export type ProjectsResponse = { home: string; projects: PlatformProject[] };
export type CatalogResponse = { project: PlatformProject; catalog: PlatformCatalog };
export type ContentResponse = { project: PlatformProject; content: PlatformContent };
export type SceneResponse = { project: PlatformProject; scene: PlatformCatalog["scenes"][number]; catalog: PlatformCatalog };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, init); }
  catch { throw new Error("The Seene platform server is not answering. Restart pnpm run dev and retry."); }
  const payload = await response.json().catch(() => undefined) as { error?: string } | undefined;
  if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : `The platform request failed (${response.status}).`);
  return payload as T;
}

function body(value: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) };
}

export const platformApi = {
  projects: () => request<ProjectsResponse>(`${PLATFORM_API_PREFIX}/projects`),
  addProject: (target: string) => request<ProjectsResponse>(`${PLATFORM_API_PREFIX}/projects`, body({ path: target })),
  removeProject: (target: string) => request<ProjectsResponse>(`${PLATFORM_API_PREFIX}/projects`, { ...body({ path: target }), method: "DELETE" }),
  catalog: (target: string) => request<CatalogResponse>(`${PLATFORM_API_PREFIX}/projects/scenes?path=${encodeURIComponent(target)}`),
  content: (target: string) => request<ContentResponse>(`${PLATFORM_API_PREFIX}/projects/content?path=${encodeURIComponent(target)}`),
  status: (target: string, origin: string) => request<PlatformStatus>(`${PLATFORM_API_PREFIX}/projects/status?path=${encodeURIComponent(target)}&origin=${encodeURIComponent(origin)}`),
  createScene: (draft: { path: string; id: string; title: string; description?: string; content?: { file: string; export?: string } }) =>
    request<SceneResponse>(`${PLATFORM_API_PREFIX}/projects/scenes`, body(draft)),
  removeScene: (target: string, id: string) => request<CatalogResponse>(`${PLATFORM_API_PREFIX}/projects/scenes`, { ...body({ path: target, id }), method: "DELETE" }),
};

export type Route =
  | { view: "projects" }
  | { view: "studio"; project: string }
  | { view: "settings"; project: string }
  | { view: "present"; project: string; scene: string };

export const PROJECTS_ROUTE = "#/projects";
export function studioHref(project: string): string { return `#/projects/${encodeURIComponent(project)}`; }
export function settingsHref(project: string): string { return `${studioHref(project)}/settings`; }
export function presentHref(project: string, scene: string): string { return `#/present/${encodeURIComponent(project)}/${encodeURIComponent(scene)}`; }

export function readRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/");
  const [head] = parts;
  if (head === "projects" && typeof parts[1] === "string" && parts[1]) {
    const project = decodeURIComponent(parts[1]);
    if (parts[2] === "settings") return { view: "settings", project };
    return { view: "studio", project };
  }
  if (head === "present" && parts[1] && parts[2]) return { view: "present", project: decodeURIComponent(parts[1]), scene: decodeURIComponent(parts[2]) };
  return { view: "projects" };
}
