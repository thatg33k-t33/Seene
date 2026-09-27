import { z } from "zod";
import { SceneRecipeSchema, SCENE_RECIPE_DIRECTORY, SceneRecipeIdSchema, type SceneCatalog, type SceneRecipe } from "./recipes";
import { motionDuration } from "./motion";
import type { PreviewDefinitionInput } from "./preview";
import type { SceneIssue } from "./scene";

/** SOURCE OF TRUTH: PlatformProjectSchema, ProjectRegistrySchema, PlatformCatalogSchema, PlatformSceneSchema,
 * PlatformContentSchema, RegisterProjectSchema, SceneDraftSchema, PlatformStatusSchema.
 * WHAT: validate the local platform's project registry, external-project summaries, scene catalog and
 * scene drafts, and derive the presentation settings a created scene starts from.
 * WHY: the platform, the host Vite bridges and the browser client must share one contract without
 * reading or writing each other's files.
 * WHERE: src/vite plugins answer with these shapes; src/platform renders them; tests validate the API.
 */

export const PLATFORM_HOME_DIRECTORY = ".seene";
export const PLATFORM_REGISTRY_FILE = "projects.json";
export const PLATFORM_API_PREFIX = "/__seene/platform";
export const SCENE_PRESENTATION_SURFACE = "seene-application";
export const SCENE_PRESENTATION_WIDTH = 1400;
export const SCENE_PRESENTATION_HEIGHT = 980;

export const PlatformIssueSchema = z.strictObject({
  path: z.string(),
  message: z.string().min(1),
});
export const ProjectEntrySchema = z.strictObject({
  path: z.string().trim().min(1).max(1000),
  name: z.string().trim().min(1).max(120),
  addedAt: z.string().trim().min(1).max(40),
});
export const ProjectRegistrySchema = z.strictObject({
  version: z.literal(1),
  projects: z.array(ProjectEntrySchema).max(200),
});
export const RegisterProjectSchema = z.strictObject({
  path: z.string().trim().min(1).max(1000).refine(value => !/[\u0000-\u001f]/.test(value), "Use a filesystem path without control characters."),
});
export const PlatformProjectSchema = z.strictObject({
  path: z.string().min(1),
  name: z.string().min(1),
  connected: z.boolean(),
  sceneDirectory: z.string().min(1),
  sceneCount: z.number().int().nonnegative(),
  addedAt: z.string().min(1),
  updatedAt: z.string().optional(),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).optional(),
  entry: z.string().min(1).optional(),
  adapter: z.enum(["next-app", "next-pages", "react"]).optional(),
  issues: z.array(PlatformIssueSchema),
});
export const PlatformSceneSchema = z.strictObject({
  id: SceneRecipeIdSchema,
  title: z.string().min(1),
  description: z.string(),
  source: z.string().min(1),
  binding: z.string().min(1),
  durationMs: z.number().nonnegative(),
  hasSnapshot: z.boolean(),
});
export const PlatformCatalogSchema = z.strictObject({
  scenes: z.array(PlatformSceneSchema),
  issues: z.array(PlatformIssueSchema),
});
export const PlatformContentSelectionSchema = z.strictObject({
  file: z.string().trim().min(1).max(400),
  export: z.string().regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Use a JavaScript identifier for a named export.").optional(),
});
export const PlatformContentFileSchema = z.strictObject({
  path: z.string().min(1),
  default: z.boolean(),
  exports: z.array(z.string()),
});
export const PlatformContentSchema = z.strictObject({
  files: z.array(PlatformContentFileSchema),
});
export const SceneDraftSchema = z.strictObject({
  id: SceneRecipeIdSchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  content: PlatformContentSelectionSchema.optional(),
});
export const CreateSceneRequestSchema = z.strictObject({ path: RegisterProjectSchema.shape.path, ...SceneDraftSchema.shape });
export const RemoveSceneRequestSchema = z.strictObject({ path: RegisterProjectSchema.shape.path, id: SceneRecipeIdSchema });

export const PlatformProjectsSchema = z.strictObject({
  home: z.string().min(1),
  projects: z.array(PlatformProjectSchema),
});
export const PlatformCatalogResponseSchema = z.strictObject({
  project: PlatformProjectSchema,
  catalog: PlatformCatalogSchema,
});
export const PlatformContentResponseSchema = z.strictObject({
  project: PlatformProjectSchema,
  content: PlatformContentSchema,
});
export const PlatformSceneResponseSchema = z.strictObject({
  project: PlatformProjectSchema,
  scene: PlatformSceneSchema,
  catalog: PlatformCatalogSchema,
});
export const PlatformStatusSchema = z.strictObject({
  origin: z.string().min(1),
  url: z.string().min(1),
  reachable: z.boolean(),
  message: z.string().min(1),
});
export const PlatformErrorSchema = z.strictObject({ error: z.string().min(1) });

export type ProjectEntry = z.output<typeof ProjectEntrySchema>;
export type ProjectRegistry = z.output<typeof ProjectRegistrySchema>;
export type PlatformProject = z.output<typeof PlatformProjectSchema>;
export type PlatformCatalog = z.output<typeof PlatformCatalogSchema>;
export type PlatformScene = z.output<typeof PlatformSceneSchema>;
export type PlatformContent = z.output<typeof PlatformContentSchema>;
export type PlatformStatus = z.output<typeof PlatformStatusSchema>;
export type SceneDraft = z.output<typeof SceneDraftSchema>;
/** Registry text is user-editable; keep every valid entry and silently drop the rest. */
export function loadProjectRegistry(text: string | undefined): ProjectRegistry {
  if (text === undefined) return { version: 1, projects: [] };
  let document: unknown;
  try { document = JSON.parse(text); } catch { return { version: 1, projects: [] }; }
  const projects: ProjectEntry[] = [];
  const candidates = document && typeof document === "object" && Array.isArray((document as { projects?: unknown }).projects)
    ? (document as { projects: unknown[] }).projects : [];
  for (const candidate of candidates) {
    const parsed = ProjectEntrySchema.safeParse(candidate);
    if (parsed.success && !projects.some(entry => entry.path === parsed.data.path)) projects.push(parsed.data);
  }
  return { version: 1, projects };
}

export function registryWithout(root: string, entries: ProjectEntry[]): ProjectRegistry {
  return { version: 1, projects: entries.filter(entry => entry.path !== root) };
}

/** A scene slug that satisfies the canonical recipe id contract. */
export function sceneIdFromTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function sceneComponentName(id: string): string {
  return "Scene" + id.split("-").filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}

/** The presentation starting point for a new scene: close oblique framing, shallow focus, slow travel. */
export function defaultSceneDefinition(): PreviewDefinitionInput {
  return {
    scene: {
      version: 3,
      camera: { perspective: 1800, rotateX: 4, rotateY: -7 },
      focus: { distance: 1800, fStop: 8, focalLength: 50, maxBlur: 6 },
      nodes: [{ id: SCENE_PRESENTATION_SURFACE }],
    },
    motion: { durationMs: 4000, tracks: [] },
  };
}

export function createSceneRecipe(input: { id: string; title: string; description?: string }): SceneRecipe {
  return SceneRecipeSchema.parse({
    version: 1,
    id: input.id,
    title: input.title,
    ...(input.description ? { description: input.description } : {}),
    definition: defaultSceneDefinition(),
  });
}

/**
 * Generated scene source. Without a selection the scene presents the whole application subtree the host
 * passes to ProjectPreview; with a selection it renders that application's own component. Seene never
 * generates stand-in product UI.
 */
export function sceneComponentSource(input: { id: string; content?: { importSpecifier: string; export?: string } }): string {
  const name = sceneComponentName(input.id);
  const open = `    <Surface id=${JSON.stringify(SCENE_PRESENTATION_SURFACE)} style={{ width: ${SCENE_PRESENTATION_WIDTH}, height: ${SCENE_PRESENTATION_HEIGHT} }}>`;
  if (!input.content) {
    return `import { Surface } from "@thatg33k/seene";
import type { ReactNode } from "react";

export default function ${name}({ children }: { children?: ReactNode }) {
  return (
${open}
      {children}
    </Surface>
  );
}
`;
  }
  const element = input.content.export ?? "ApplicationContent";
  const binding = input.content.export ? `{ ${input.content.export} }` : element;
  return `import { Surface } from "@thatg33k/seene";
import ${binding} from ${JSON.stringify(input.content.importSpecifier)};

export default function ${name}() {
  return (
${open}
      <${element} />
    </Surface>
  );
}
`;
}

/** Which application module a scene may present. Only the developer's own source qualifies. */
export function isApplicationSourcePath(target: string): boolean {
  const normalized = target.replace(/\\/g, "/").replace(/^\.\//, "");
  if (normalized.includes("..")) return false;
  if (!/^src\/[A-Za-z0-9._/-]+\.(?:tsx|jsx)$/.test(normalized)) return false;
  return !normalized.startsWith(SCENE_RECIPE_DIRECTORY + "/");
}

/** Discover the components a developer can choose from. Text analysis only; the file itself is re-read before use. */
export function analyzeApplicationModule(source: string): { default: boolean; exports: string[] } {
  const found = new Set<string>();
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
    /export\s+(?:const|let|var|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) found.add(match[1]);
  for (const match of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const clause of match[1].split(",")) {
      const name = clause.trim().split(/\s+as\s+/).pop()?.trim();
      if (name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) found.add(name);
    }
  }
  return { default: /export\s+default\b/.test(source), exports: [...found].sort((a, b) => a.localeCompare(b)) };
}

/** The development studio URL for a connected project. A React adapter mounts the wrapper on its own route. */
export function previewUrl(adapter: string | undefined, origin: string, sceneId?: string): string {
  const base = origin.replace(/\/+$/, "");
  const route = adapter === "next-app" || adapter === "next-pages" ? "/seene" : "/";
  return `${base}${route}?seene-preview=1${sceneId ? `&seene-scene=${sceneId}` : ""}`;
}

/** Platform state lives outside any application, so Seene never becomes the owner of a consumer's filesystem. */
export function platformHome(configured: string | undefined, home: string): string {
  const value = configured?.trim();
  return value ? value : `${home.replace(/[\\/]+$/, "")}/${PLATFORM_HOME_DIRECTORY}`;
}

export function summarizeCatalog(catalog: SceneCatalog): PlatformCatalog {
  return {
    issues: catalog.issues.map(issue => ({ path: issue.path, message: issue.message })),
    scenes: catalog.scenes.map(scene => ({
      id: scene.id,
      title: scene.title,
      description: scene.description ?? "",
      source: scene.source,
      binding: scene.binding,
      durationMs: scene.definition.motion ? motionDuration(scene.definition.motion) : 0,
      hasSnapshot: scene.snapshot !== undefined,
    })),
  };
}

export function issueFor(error: unknown, target = ""): SceneIssue {
  const known = error instanceof Error && "code" in error && "target" in error;
  const reported = known && typeof (error as { target?: unknown }).target === "string" ? String((error as { target: string }).target) : target;
  return {
    path: reported,
    message: known ? (error as Error).message : "Unable to read this project's files. Check the path and permissions, then retry.",
  };
}

