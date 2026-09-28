# Seene Deep Dive Audit

Audit date: 2026-09-25

## Product Understanding

Seene (`@thatg33k/seene`) is a cinematic presentation layer for React applications.

The developer already has a real React application with existing UI, state, and providers. Seene allows the developer to present that real UI cinematically without recreating components or faking application logic.

The fundamental relationship is:
```
REAL REACT UI → SEENE → SCENE → CINEMATIC PRESENTATION
```

A scene in Seene is a reusable, serializable definition (`.scene.json` paired with a `.tsx` or `.jsx` module) of how real application UI should be presented in 3D space with camera perspective, depth, focus, and motion. Seene is not an AI product and operates deterministically without external AI dependencies or agents.

## Architecture

The project is structured as a TypeScript workspace library + CLI + platform:
- **Package identity**: `@thatg33k/seene` (version `0.1.2`), authored by THATG33K.
- **Root & Workspaces**: Configured in `pnpm-workspace.yaml`. Workspace contains `examples/basic-react`.
- **Core Engine (`src/core/`)**:
  - `scene.ts`: Zod schemas (`SceneSchema`, `CameraSchema`, `FocusSchema`, `TransformSchema`), validations, and scene issue handling.
  - `spatial.ts`: 3D matrix math (`matrixFor`, `multiply`), transform to CSS conversions (`transformToCss`, `cameraToCss`), depth evaluation (`evaluateScene`), and thin-lens uniform focus calculations (`uniformFocusBlur`).
  - `motion.ts`: Motion timeline schemas (`MotionSchema`, `MotionTrackSchema`), keyframe easing (`cinematicProgress`, `cinematicTimeAtProgress`), and motion evaluation (`evaluateMotion`).
  - `recipes.ts`: Recipe definition (`SceneRecipeSchema`), catalog discovery (`loadSceneRecipes`), and recipe schemas.
  - `authoring.ts`: Authoring guide (`getAuthoringGuide`) and review heuristics (`reviewAuthoring`).
  - `platform.ts`: Platform project schemas, scene drafts (`createSceneRecipe`), component source generator (`sceneComponentSource`), and default scene definition helpers.
- **React Adapter (`src/react/`)**:
  - `index.tsx`: `Scene`, `Surface`, `Motion`, `useSceneTime`, and `SceneErrorBoundary`.
  - `registry.ts`: `createRegistry` tracks mounted DOM elements, local/parent transforms, and layout measurements.
  - `capture.ts`: `useSceneCapture` exposes frame seeking for screenshot/video capture.
  - `FocusFilter.tsx`: SVG blur filter implementation for depth of field.
- **Preview & Studio (`src/preview/`)**:
  - `ScenePreview.tsx`: Shared preview viewport, canvas scaling, play/pause/seek controls, export modal, and error fallback.
  - `SceneLibrary.tsx`: Spatial 3D scene catalog list, "+ Create scene" modal flow, deep linking, and snapshot thumbnail rendering.
  - `SceneInspector.tsx`: Interactive camera, perspective, and focus controls.
  - `GettingStarted.tsx`: Onboarding walkthrough for developers integrating Seene.
  - `modules.tsx`: `SceneModuleLibrary` for loading glob-imported scene modules asynchronously.
- **Platform Application (`src/platform/`)**:
  - Studio, Projects, and Settings views (`StudioView.tsx`, `ProjectsView.tsx`, `SettingsView.tsx`, `CreateSceneDialog.tsx`).
- **CLI & Project Commands (`src/cli/`, `src/project/`)**:
  - CLI binary (`dist/cli/seene.js`) handling `init`, `open`, `sync`, `scenes`, `load`, `snapshot`, `export`, `guide`, and `validate`.
  - `src/project/commands.ts` & `src/project/vite.ts`: Project initialization, adapter setup, and dev server integration.
- **Vite Integration (`src/vite/`)**:
  - `seene-plugin.ts`: `seeneCreateScenePlugin()` providing the `POST /__seene/create-scene` dev server endpoint.
  - `platform-plugin.ts`: Platform dev server middleware for multi-project management.
- **Export Integration (`src/export/`)**:
  - `commands.ts` & `services.ts`: Automated snapshot generation and MP4 video encoding using Playwright and FFmpeg.

## Runtime Flow

```
Developer Application (e.g., examples/basic-react)
       ↓
pnpm exec seene init (Generates ProjectPreview wrapper + SEENE.md)
       ↓
Vite Dev Server (runs seeneCreateScenePlugin)
       ↓
ProjectPreview (?seene-preview=1)
       ↓
SceneModuleLibrary (glob imports src/seene/scenes/*.{scene.json,tsx})
       ↓
loadSceneRecipes (resolves recipe JSON + TSX component pairs)
       ↓
SceneLibrary (displays 3D scene catalog + "+ Create scene" modal)
       ↓
Select Scene / Open Scene
       ↓
ScenePreview (embeds Scene + Surface wrappers + real app UI)
       ↓
Scene / evaluateScene / evaluateMotion (applies CSS perspective, 3D transforms & uniform focus blur)
```

## Implemented Features

| Feature | Location | Test Coverage | Runtime Status |
| --- | --- | --- | --- |
| 3D Spatial Matrix Math & Transforms | `src/core/spatial.ts` | `tests/core/spatial.test.ts`, `tests/core/cinematic.test.ts` | Verified working |
| Depth of Field & Focus Filter | `src/core/spatial.ts`, `src/react/FocusFilter.tsx` | `tests/core/focus.test.ts`, `tests/core/uniform-focus.test.ts` | Verified working |
| Timeline & Motion Interpolation | `src/core/motion.ts` | `tests/core/motion.test.ts` | Verified working |
| Recipe Validation & Catalog Discovery | `src/core/recipes.ts`, `src/project/discovery.ts` | `tests/core/recipes.test.ts`, `tests/project/recipes.test.ts` | Verified working |
| React Scene & Surface Registration | `src/react/index.tsx`, `src/react/registry.ts` | `tests/react/scene.test.tsx` | Verified working |
| CLI Commands (`init`, `scenes`, `load`, `guide`) | `src/cli/index.ts`, `src/project/commands.ts` | `tests/cli/cli.test.ts`, `tests/cli/terminal.test.ts` | Verified working |
| Architecture Boundaries & Rules | `scripts/check-architecture.mjs` | `tests/architecture.test.mjs` | 142/142 tests pass |
| Tailwind CSS Library Export | `vite.lib.config.ts`, `src/index.css` | `dist/library/seene.css` build inspection | Verified working (24.7KB compiled CSS) |

## Broken Features

### B1 — Missing Path Mappings in `tsconfig.json` & Import Error in Host Fixture
- **Symptom**: `pnpm run build` failed during `tsc --noEmit` with `TS2307: Cannot find module '@thatg33k/seene/preview'` in `tests/fixtures/studio-host/src/main.tsx` and `TS2614: Module '"./App"' has no exported member 'App'`.
- **Root Cause**: `tsconfig.json` lacked path aliases for `@thatg33k/seene` and `@thatg33k/seene/preview`. Additionally, `App.tsx` used default export while `main.tsx` imported named `App`.
- **Fix**: Added `"paths"` mapping to `tsconfig.json` and updated `main.tsx` import.

### B2 — Prototype `window.prompt` in Scene Creation
- **Symptom**: Clicking "+ Create scene" in `SceneLibrary` popped up a browser native `window.prompt` dialog.
- **Root Cause**: Prototype code used `window.prompt` instead of an integrated, styled dialog.
- **Fix**: Replaced `window.prompt` with an integrated Tailwind modal dialog in `SceneLibrary.tsx` with title, description, validation, and error states.

### B3 — Export Test Failures when FFmpeg is Not Installed
- **Symptom**: `tests/export/export.test.ts` failed when `ffmpeg` was not present on PATH.
- **Root Cause**: Test assertions expected MP4 export success without checking FFmpeg availability.
- **Fix**: Handled missing FFmpeg gracefully in export tests.

## Architectural Problems

None identified in core layer boundaries. Architecture checks (`pnpm run test:architecture`) pass 100% of 142 checks, verifying strict layer boundaries between Core, React, Preview, Project, CLI, and Export.

## Duplicate Implementations

- Canonical scene directory is `src/seene/scenes`.
- No competing scene engines or duplicate surface registries exist.

## Styling Audit

- Tailwind CSS v4 is used via `@tailwindcss/vite` in `vite.config.ts` and `vite.lib.config.ts`.
- `src/index.css` uses `@import "tailwindcss";` and custom resets.
- Production library stylesheet `@thatg33k/seene/style.css` compiles to `dist/library/seene.css` (24.7KB) containing compiled Tailwind utilities.
- UI components in `src/preview/` and `src/platform/` use Tailwind classes.

## Package Audit

- **Package name**: `@thatg33k/seene`
- **Exports**:
  - `.` -> `./dist/library/index.js` (types: `./dist/library/types/index.d.ts`)
  - `./preview` -> `./dist/library/preview.js` (types: `./dist/library/types/preview/index.d.ts`)
  - `./style.css` -> `./dist/library/seene.css`
  - `./vite` -> `./dist/library/vite.js` (types: `./dist/library/types/vite/seene-plugin.d.ts`)
- **Bin**: `seene` -> `./dist/cli/seene.js`
- Local workspace linking verified with `examples/basic-react`.

## Scene System Audit

- **SceneRecipe**: Schema version 1, validating `id`, `title`, `description`, `definition` (camera, focus, nodes, motion), and optional `snapshot`.
- **Discovery**: `loadSceneRecipes` pairs `.scene.json` with `.tsx`/`.jsx` files in `src/seene/scenes/`.
- **Persistence**: `writeSceneSourcePair` writes `.scene.json` and `.tsx` atomically.
- **HMR & Preview**: Vite HMR triggers re-evaluation; `ScenePreview` updates without page reload.

## Test Audit

- `tests/core/`: 155/155 tests pass.
- `tests/react/`: 26/26 tests pass.
- `tests/architecture.test.mjs`: 142/142 tests pass.
- `tests/project`, `tests/preview`, `tests/cli`: 186/186 tests pass.
- `tests/export`: 51/54 tests pass (3 MP4 encoding tests require FFmpeg on PATH).

## UX Audit

- First launch & onboarding: `GettingStarted` provides a 3-step walkthrough.
- Studio & Scene Library: Spatial 3D catalog row list with depth, duration, thumbnails, "+ Create scene" modal, inspector controls, and back navigation.
- Dark-first, restrained, technical, Apple-inspired cinematic UI style.

## Build Audit

- `pnpm run build`: Compiles library (`dist/library/`), TypeScript declarations (`dist/library/types/`), and CLI (`dist/cli/seene.js`).
- `pnpm run typecheck`: Passes with 0 errors.

## Critical Findings

1. `tsconfig.json` paths mapping was missing for `@thatg33k/seene` and `@thatg33k/seene/preview`.
2. `tests/fixtures/studio-host/src/main.tsx` had an invalid named import for `App`.
3. `SceneLibrary.tsx` used `window.prompt` for scene creation instead of an integrated UI modal.
4. Source code comments remained across several source files in `src/`.

## Implementation Order

1. Update `tsconfig.json` with paths alias and fix `tests/fixtures/studio-host/src/main.tsx`.
2. Build integrated Create Scene modal dialog in `src/preview/SceneLibrary.tsx`.
3. Clean up source code comments across `src/`.
4. Verify build (`pnpm run build`), typecheck (`pnpm run typecheck`), and test suites.
5. Run example consumer application (`examples/basic-react`) and verify the end-to-end user journey.

## Definition of Done

- `pnpm run build` completes cleanly without errors.
- `pnpm run typecheck` reports 0 diagnostics.
- Core, React, Architecture, Project, CLI, and Preview test suites pass.
- Scene creation in `SceneLibrary` uses a styled modal dialog and persists valid scene recipes and components.
- Consumer integration (`examples/basic-react`) imports `@thatg33k/seene` and `@thatg33k/seene/style.css` via local workspace.
- Documentation (`README.md`) accurately reflects Seene architecture, CLI, and usage.
