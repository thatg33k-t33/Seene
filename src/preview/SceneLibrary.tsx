
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  RESOURCES,
  motionDuration,
  matrixFor,
  TransformSchema,
  type SceneIssue,
} from "../core";

import { Scene, Surface, SceneErrorBoundary } from "../react";

import { ScenePreview } from "./ScenePreview";
import type { PreviewHot } from "./connection";
import { GettingStarted } from "./GettingStarted";

export type SceneLibraryProps = {
  sources?: Record<string, unknown>;
  bindings?: Record<string, ComponentType<{ children?: ReactNode }>>;
  sourceIssues?: SceneIssue[];
  hostContent?: ReactNode;
  hot?: PreviewHot;
  backHref?: string;
};

const EMPTY_SOURCES: Record<string, unknown> = {};
const EMPTY_BINDINGS: Record<string, ComponentType<{ children?: ReactNode }>> = {};

const ROW_HEIGHT = 150;
const HEADING_HEIGHT = 110;

const camera = {
  perspective: 1800,
  rotateX: -22,
};

const focus = {
  distance: 1400,
  fStop: 4,
  focalLength: 220,
  maxBlur: 7,
};

const view = matrixFor(
  TransformSchema.parse({
    rotateX: camera.rotateX,
  }),
);

const SCENE_QUERY_PARAM = "seene-scene";

function isPreviewQuery(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.searchParams.get("seene-preview") === "1" || url.searchParams.get("flute-preview") === "1";
}

function getSelectedSceneId(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const url = new URL(window.location.href);
  return (
    url.searchParams.get("seene-scene") ??
    url.searchParams.get("flute-scene") ??
    undefined
  );
}

function getVisibleRows(scroll: number, height: number, count: number) {
  const localY = (screenY: number) => {
    const y = screenY - height / 2;

    const denominator = camera.perspective * view[5] + y * view[9];

    if (denominator <= 0) {
      return -Infinity;
    }

    return height / 2 + (y * camera.perspective) / denominator;
  };

  const top = localY(-3 * focus.maxBlur);
  const bottom = localY(height + 3 * focus.maxBlur);

  const firstVisible =
    Math.floor((scroll + top - (height / 2 - ROW_HEIGHT / 2)) / ROW_HEIGHT) - 1;

  const lastVisible =
    Math.ceil((scroll + bottom - (height / 2 - ROW_HEIGHT / 2)) / ROW_HEIGHT) +
    2;

  return {
    start: Math.max(0, firstVisible),
    end: Math.min(count, Math.max(Math.max(0, firstVisible) + 6, lastVisible)),
  };
}

function SceneSnapshot({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover rounded-md opacity-80"
      onError={() => setFailed(true)}
    />
  );
}

export function SceneLibrary({
  sources = EMPTY_SOURCES,
  bindings = EMPTY_BINDINGS,
  sourceIssues = [],
  hostContent,
  hot,
  backHref,
}: SceneLibraryProps) {
  const [entered, setEntered] = useState(() => {
    if (typeof window === "undefined") return false;
    return getSelectedSceneId() !== undefined || isPreviewQuery() || localStorage.getItem("seene-entered") === "true";
  });
  const [sceneId, setSceneId] = useState(getSelectedSceneId);
  const [scroll, setScroll] = useState(0);
  const [size, setSize] = useState({
    width: 1200,
    height: 1000,
  });

  const scrollerRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef(0);

  const { width, height } = size;

  const catalog = useMemo(
    () => {
      const resolved = RESOURCES["resolve-recipes"]({
        sources: Object.entries(sources).map(([path, document]) => ({
          path,
          document,
        })),
        bindingPaths: Object.keys(bindings),
        ...(sceneId ? { sceneId } : {}),
      });
      const failedModulePaths = new Set(sourceIssues.map(issue => issue.path));
      return {
        ...resolved,
        issues: [
          ...resolved.issues.filter(issue =>
            !(failedModulePaths.has(issue.path) && issue.message.includes("needs matching component")),
          ),
          ...sourceIssues,
        ].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0),
      };
    },
    [sources, bindings, sourceIssues, sceneId],
  );

  const selectedScene = catalog.selected;

  const SelectedComponent = selectedScene
    ? bindings[selectedScene.binding]
    : undefined;

  useEffect(() => {
    const handlePopState = () => {
      setSceneId(getSelectedSceneId());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (selectedScene && SelectedComponent) {
      return;
    }

    const element = scrollerRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    const observer = new ResizeObserver(measure);

    observer.observe(element);
    measure();

    element.scrollTop = savedScrollRef.current;

    return () => {
      observer.disconnect();
    };
  }, [selectedScene?.id, SelectedComponent]);

  const buildDestination = useCallback((id?: string) => {
    const url = new URL(window.location.href);

    if (id) {
      url.searchParams.set(SCENE_QUERY_PARAM, id);
    } else {
      url.searchParams.delete(SCENE_QUERY_PARAM);
    }

    return url.pathname + url.search + url.hash;
  }, []);

  const navigate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, id?: string) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();

      const destination = buildDestination(id);

      window.history.pushState({}, "", destination);
      setSceneId(id);
    },
    [buildDestination],
  );

  const closeScene = useCallback(() => {
    const destination = buildDestination();

    window.history.pushState({}, "", destination);
    setSceneId(undefined);
  }, [buildDestination]);

  const handleCreateScene = async () => {
    const titlePrompt = window.prompt("Enter scene title (e.g. Dashboard Showcase):");
    if (!titlePrompt || !titlePrompt.trim()) return;
    const title = titlePrompt.trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `scene-${Date.now()}`;

    const recipe = {
      version: 1,
      id,
      title,
      description: "Authored in Seene Studio",
      definition: {
        scene: {
          version: 3,
          camera: { perspective: 1800, rotateX: 4, rotateY: -7 },
          focus: { distance: 1800, fStop: 8, focalLength: 50, maxBlur: 6 },
          nodes: [{ id: "seene-application" }]
        },
        motion: { durationMs: 4000, tracks: [] }
      }
    };

    try {
      const res = await fetch("/__seene/create-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, recipe })
      });
      const data = await res.json();
      if (data.success) {
        const destination = buildDestination(id);
        window.history.pushState({}, "", destination);
        window.location.reload();
      } else {
        alert("Failed to create scene: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to communicate with local development server: " + err.message);
    }
  };

  if (!entered) {
    return (
      <GettingStarted
        onStartCreating={() => {
          setEntered(true);
          try {
            localStorage.setItem("seene-entered", "true");
          } catch {}
        }}
      />
    );
  }

  if (selectedScene && SelectedComponent) {
    return (
      <ScenePreview
        key={selectedScene.id}
        definition={selectedScene.definition}
        title={selectedScene.title}
        backHref={buildDestination()}
        onBack={closeScene}
        hot={hot}
      >
        <SelectedComponent>{hostContent}</SelectedComponent>
      </ScenePreview>
    );
  }

  const planeWidth = Math.min(940, Math.max(320, width - 64));

  const { start, end } = getVisibleRows(scroll, height, catalog.scenes.length);

  const contentHeight =
    height + Math.max(0, (catalog.scenes.length - 1) * ROW_HEIGHT);

  return (
    <main data-seene-library="" className="fixed inset-0 isolate overflow-hidden bg-[#111114] text-[#f1f1f4]">
      {sceneId && (
        <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[#303038] bg-[#1a1a1f] px-5 py-3 text-xs text-[#85858e] shadow-lg" role="alert">
          <span className="text-[#f1f1f4]">This scene can&apos;t be opened.</span> Fix its source file or{" "}
          <a href={buildDestination()} onClick={(event) => navigate(event)} className="text-[#f1f1f4] underline hover:text-white">
            go back to all scenes
          </a>
          .
        </div>
      )}

      {catalog.issues.length > 0 && (
        <details className="absolute top-16 left-1/2 z-50 -translate-x-1/2 max-w-lg rounded-xl border border-[#303038] bg-[#1a1a1f] p-4 text-xs text-[#85858e]">
          <summary className="cursor-pointer font-medium text-[#f1f1f4]">
            Some scene files have problems ({catalog.issues.length})
          </summary>

          <ul className="mt-2 space-y-1 pl-4 list-disc">
            {catalog.issues.map((issue, index) => (
              <li key={`${issue.path}-${index}`}>
                <strong className="text-[#f1f1f4]">{issue.path}</strong>
                {": "}
                {issue.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      {catalog.scenes.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl font-medium tracking-tight text-white">Your scenes will show up here.</h1>
            <p className="text-sm text-[#85858e]">Create your first cinematic scene to showcase your React components.</p>
            <button
              type="button"
              onClick={handleCreateScene}
              className="mt-4 appearance-none border border-white/20 rounded-full px-6 py-3 bg-white text-[#111] text-xs font-medium inline-flex items-center gap-2 cursor-pointer hover:bg-neutral-200 transition-colors pointer-events-auto"
            >
              + Create scene
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden outline-none focus:outline-none"
          role="region"
          aria-label="Scene library"
          tabIndex={0}
          onScroll={(event) => {
            const nextScroll = event.currentTarget.scrollTop;

            savedScrollRef.current = nextScroll;
            setScroll(nextScroll);
          }}
        >
          <div
            style={{
              height: contentHeight,
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <SceneErrorBoundary>
                <Scene
                  camera={camera}
                  focus={focus}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Surface
                    id="scene-list"
                    transform={{ y: -scroll }}
                    style={{
                      position: "absolute",
                      left: (width - planeWidth) / 2,
                      top: height / 2 - HEADING_HEIGHT,
                      width: planeWidth,
                      height: contentHeight,
                    }}
                  >
                    <Surface
                      id="scene-list-heading"
                      style={{
                        position: "absolute",
                        top: 0,
                        width: planeWidth,
                        height: HEADING_HEIGHT,
                      }}
                    >
                      <header className="flex items-center justify-between border-b border-[#303038] pb-4 pointer-events-auto">
                        <div className="flex items-center gap-4">
                          <h1 className="text-sm font-semibold tracking-wider text-[#85858e] uppercase">
                            Your scenes
                          </h1>
                          <button
                            type="button"
                            onClick={handleCreateScene}
                            className="appearance-none border border-white/20 rounded-full px-3 py-1.5 bg-[#242424] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                          >
                            + Create scene
                          </button>
                        </div>

                        <span className="text-xs font-mono text-[#85858e]">
                          {catalog.scenes.length}{" "}
                          {catalog.scenes.length === 1 ? "scene" : "scenes"}
                        </span>
                      </header>
                    </Surface>

                    {catalog.scenes.slice(start, end).map((scene, index) => {
                      const number = start + index;
                      const duration = Math.round(
                        (scene.definition.motion
                          ? motionDuration(scene.definition.motion)
                          : 0) / 1000,
                      );

                      return (
                        <Surface
                          key={scene.id}
                          id={`scene-row-${scene.id}`}
                          style={{
                            position: "absolute",
                            top: HEADING_HEIGHT + number * ROW_HEIGHT,
                            width: planeWidth,
                            height: ROW_HEIGHT,
                          }}
                        >
                          <a
                            className="group flex items-center justify-between gap-6 border-b border-[#222228] py-6 transition-colors hover:border-[#303038] focus-visible:outline-2 focus-visible:outline-white"
                            data-scene-id={scene.id}
                            href={buildDestination(scene.id)}
                            onFocus={(event) => {
                              if (
                                event.currentTarget.matches(":focus-visible")
                              ) {
                                scrollerRef.current?.scrollTo({
                                  top: Math.max(0, number * ROW_HEIGHT),
                                  behavior: "smooth",
                                });
                              }
                            }}
                            onClick={(event) => navigate(event, scene.id)}
                          >
                            <span className="relative flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-[#1a1a1f] border border-[#303038] font-mono text-xs text-[#85858e]">
                              {String(number + 1).padStart(2, "0")}

                              {scene.snapshot && (
                                <SceneSnapshot key={scene.snapshot.image} src={scene.snapshot.image} />
                              )}
                            </span>

                            <span className="flex flex-1 flex-col min-w-0">
                              <strong className="text-base font-medium text-[#f1f1f4] group-hover:text-white truncate">
                                {scene.title}
                              </strong>

                              <span className="text-xs text-[#85858e] truncate mt-0.5">
                                {scene.description || "A scene from your app"}
                              </span>
                            </span>

                            <span className="flex items-center gap-2 font-mono text-xs text-[#85858e] group-hover:text-[#f1f1f4]">
                              {duration}s<span aria-hidden="true">↗</span>
                            </span>
                          </a>
                        </Surface>
                      );
                    })}
                  </Surface>
                </Scene>
              </SceneErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {catalog.scenes.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-40">
          <p className="rounded-full border border-[#303038] bg-[#1a1a1f]/90 px-4 py-2 font-mono text-[11px] text-[#85858e] shadow-md backdrop-blur-md">
            Scroll to browse · Click a scene to play
          </p>
        </div>
      )}
    </main>
  );
}
