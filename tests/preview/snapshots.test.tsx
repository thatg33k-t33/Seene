// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { SceneLibrary, SceneModuleLibrary } from "../../src/preview";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPdwAAAAASUVORK5CYII=";
const recipe = (id: string, title: string, snapshot?: { image: string; timeMs: number }) => ({
  version: 1,
  id,
  title,
  definition: { scene: { version: 3, nodes: [{ id: "seene-application" }] } },
  ...(snapshot ? { snapshot } : {}),
});

function enterLibrary(query = "?seene-preview=1") {
  window.history.replaceState({}, "", "/" + query);
  vi.stubGlobal("ResizeObserver", function () {
    return { observe() {}, disconnect() {} };
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

it("uses inert cached images without mounting host scenes and recovers a failed image on replacement", () => {
  enterLibrary();
  const Host = vi.fn(() => null);
  const sources = (snapshot?: { image: string; timeMs: number }) => ({
    "src/seene/scenes/demo.scene.json": recipe("demo", "Actual scene", snapshot),
  });
  const bindings = { "src/seene/scenes/demo.tsx": Host };
  const view = render(<SceneLibrary sources={sources({ image, timeMs: 0 })} bindings={bindings} />);
  const link = screen.getByRole("link", { name: /Actual scene/ });
  const img = link.querySelector("img")!;
  expect(img.getAttribute("src")).toBe(image);
  expect(Host).not.toHaveBeenCalled();
  fireEvent.error(img);
  expect(link.querySelector("img")).toBeNull();
  expect(link.textContent).toContain("01");
  view.rerender(<SceneLibrary sources={sources({ image: image.replace("Pdw", "Pdx"), timeMs: 0 })} bindings={bindings} />);
  const replacement = link.querySelector("img")!;
  expect(replacement).not.toBe(img);
  expect(replacement.hidden).toBe(false);
  view.rerender(<SceneLibrary sources={sources()} bindings={bindings} />);
  expect(link.querySelector("img")).toBeNull();
  expect(link.textContent).toContain("01");
  expect(Host).not.toHaveBeenCalled();
});

it("opens a scene with the real host application as its rendered child", async () => {
  enterLibrary("?seene-preview=1&seene-scene=demo");
  function Scene({ children }: { children?: ReactNode }) {
    return <div data-testid="scene-content">{children}</div>;
  }
  const modules = {
    "/src/seene/scenes/demo.scene.json": async () => ({ default: recipe("demo", "Actual scene") }),
    "/src/seene/scenes/demo.tsx": async () => ({ default: Scene }),
  };
  render(
    <SceneModuleLibrary
      modules={modules}
      hostContent={<main>Existing React application</main>}
    />,
  );
  expect(await screen.findByText("Existing React application")).toBeTruthy();
  expect(screen.getByTestId("scene-content").textContent).toBe("Existing React application");
  fireEvent.click(screen.getByRole("link", { name: "Back to scenes" }));
  await waitFor(() => expect(screen.getByRole("link", { name: /Actual scene/ })).toBeTruthy());
});

it("keeps three valid scenes available while reporting the path of one broken component module", async () => {
  enterLibrary();
  const modules = {
    "/src/seene/scenes/alpha.scene.json": async () => ({ default: recipe("alpha", "Alpha scene") }),
    "/src/seene/scenes/alpha.tsx": async () => ({ default: () => null }),
    "/src/seene/scenes/beta.scene.json": async () => ({ default: recipe("beta", "Beta scene") }),
    "/src/seene/scenes/beta.tsx": async () => ({ default: () => null }),
    "/src/seene/scenes/broken.scene.json": async () => ({ default: recipe("broken", "Broken scene") }),
    "/src/seene/scenes/broken.tsx": async () => {
      throw new Error("Broken component import failed");
    },
    "/src/seene/scenes/delta.scene.json": async () => ({ default: recipe("delta", "Delta scene") }),
    "/src/seene/scenes/delta.tsx": async () => ({ default: () => null }),
  };
  render(<SceneModuleLibrary modules={modules} />);
  expect(await screen.findByRole("link", { name: /Alpha scene/ })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Beta scene/ })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Delta scene/ })).toBeTruthy();
  expect(screen.queryByRole("link", { name: /Broken scene/ })).toBeNull();
  fireEvent.click(screen.getByText(/Some scene files have problems \(1\)/));
  expect(await screen.findByText("src/seene/scenes/broken.tsx")).toBeTruthy();
  await waitFor(() => expect(document.querySelector("details li")?.textContent).toContain("Broken component import failed"));
  expect(document.querySelectorAll("[data-seene-id^='scene-row-']").length).toBe(3);
});
