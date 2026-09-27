# Seene Repository Audit

Audit date: 2026-09-25

> Post-audit correction: this repository previously contained an internal consumer application (`local-project`) plus a repository-owned demo scene pair under `src/seene/`. Both have been removed. Seene is now the platform itself: `src/platform` is the product surface (Projects, Studio, Settings), consumer applications live outside this repository and connect through `pnpm exec seene init`, and no production or development path depends on an in-repository consumer. The findings below are kept as an audit record of the earlier worktree.

The worktree already contained many uncommitted edits at audit start. This report describes the files present at audit time; it does not assume the earlier audit claims are current.

## 1. Product Understanding

The source implements Seene as a React presentation layer for real host UI. `src/react` registers/renders application surfaces, `src/core` validates scenes and evaluates spatial/focus/motion values, and `src/preview` provides a Scene Library and Studio preview with camera/focus controls, timeline, HMR connection, and export hand-off. The existing host React tree remains the component source; recipe files describe presentation and bind scene component modules.

The repository also contains a development instance of Seene itself, a standalone package consumer example, and an initialized local consumer project. The product is not AI-dependent and the source inspected does not implement AI inference.

## 2. Current Architecture

- Workspace/package: root package is `@thatg33k/seene`, exports the library, preview entry, and `./style.css`, and declares the `seene` binary at `dist/cli/seene.js`. `pnpm-workspace.yaml` includes the root, `examples/*`, `apps/*`, and `packages/*`. The only example is `examples/basic-react`; consumer applications live outside this repository and connect through `pnpm exec seene init`.
- Application: `app/main.tsx` loads `src/seene/scenes/*.{scene.json,tsx}` through Vite glob imports and renders `SceneModuleLibrary`. Root `vite.config.ts` runs React and Tailwind, aliases the package specifiers to local source for generated files, and owns the `POST /__seene/create-scene` middleware.
- Core: `src/core` owns Zod schemas, scene/spatial math, focus, motion, preview validation, recipe resolution, project contracts, and resource registrations. `scripts/check-architecture.mjs` checks layer boundaries and single-owner declarations.
- React integration: `src/react` owns scene/surface rendering, registry, error boundary, capture, and focus filters.
- Preview/Studio: `src/preview` owns `SceneLibrary`, `ScenePreview`, `SceneModuleLibrary`, `GettingStarted`, inspectors, timeline/session, HMR connection, and runtime-injected preview theme styles. `ProjectPreview` provides a host-app adapter.
- CLI/project: `src/cli` parses local commands; `src/project` owns init/sync/open/discovery and filesystem services; `vite.cli.config.ts` builds the executable. `src/export` owns snapshots and video capture/encoding integration.
- Recipes/persistence: scene recipes are JSON files under `src/seene/scenes`, paired with TSX/JSX module files. The core loader validates records and bindings; CLI discovery scans local files; Vite application glob imports the browser-side modules.
- Tailwind: `src/index.css` imports Tailwind v4. `vite.config.ts` and `vite.lib.config.ts` both register `@tailwindcss/vite`. Root exports the built library stylesheet at `@thatg33k/seene/style.css`.
- Examples: `examples/basic-react` consumes `@thatg33k/seene` with `workspace:*` and imports the exported CSS. A real consumer project is an external React application with its own `src/seene/scenes` recipe/component pairs; it is never stored inside this repository.
- Tests: Vitest suites are split into `tests/core`, `tests/react`, `tests/preview`, `tests/project`, `tests/cli`, and `tests/export`; Node architecture/release suites live at `tests/architecture.test.mjs` and `tests/release.test.mjs`; Playwright suites are in `tests/browser`; scripts provide installed-package, library, portable, and iteration harnesses.

## 3. Working Features

| Feature | Implementation | Evidence and verification |
| --- | --- | --- |
| Package/library/app/CLI bundling | `package.json`, `vite*.config.ts` | `pnpm run build` emitted app assets, `dist/library/index.js`, `preview.js`, `seene.css`, declarations, and `dist/cli/seene.js`; terminal wrapper later reported status 2 with a PTY warning, so this is an observed completed build but not a clean command exit. |
| Tailwind library stylesheet | `vite.lib.config.ts`, `src/index.css`, `package.json` | Built `dist/library/seene.css` measured 24,782 bytes and contains `.flex{`, `.absolute{`, `display:flex`, and Tailwind variables. |
| Core + React engine test coverage | `tests/core`, `tests/react` | Core summary: 154/155 pass; React summary: 26/26 pass. |
| Architecture boundaries | `scripts/check-architecture.mjs`, `tests/architecture.test.mjs` | Architecture command reports checks passed and 138/138 tests pass. |
| Example consumer package contract | `examples/basic-react` | `pnpm --filter basic-react-example run build` produced Vite assets and CSS with expected bundled output; package uses workspace dependency and style export. |
| Workspace-local executable for a consuming workspace app | package `bin`, example workspace link | `pnpm --filter basic-react-example exec seene --version` prints `0.1.2`. `pnpm exec seene` at the repository root does not resolve the root package's own bin; use a consumer workspace package context or `node dist/cli/seene.js` at root. |
| Recipe schema/catalog happy paths | `src/core/recipes.ts`, `src/project/discovery.ts` | Core recipe suite is 24/24 pass; project recipe suite is 15/18 pass (three failing expectations documented below). |
| Root app scene discovery wiring | `app/main.tsx`, `src/preview/modules.tsx` | App source glob and recipe/binding loader are present; production build emitted modules for existing `acc` and `website` recipes. Full browser interaction remains unverified. |
| CLI help/authoring contracts | `src/cli/index.ts`, `tests/cli/cli.test.ts` | `tests/cli/cli.test.ts` reports 18/18 pass. Consumer workspace executable version check passes. |

## 4. Broken Features

### B1 — Motion test asserts a value the schema rejects

- Symptom: `pnpm run test:core` fails at `preserves strictly positive bounds even for the smallest finite value`; evaluation returns no surface state and the test dereferences it.
- Root cause: `SurfaceMotionSchema` reuses `TransformSchema`, whose scale range has a positive lower bound. `Number.MIN_VALUE` is below that supported range; it is not a valid motion value.
- Files: `src/core/motion.ts`, `src/core/scene.ts`, `tests/core/motion.test.ts`.
- Severity: medium (red suite, misleading test rather than evidence of a renderer defect).
- Fix: rewrite the test to assert the smallest supported scale succeeds and below-bound scale yields a validation issue.

### B2 — Consumer handoff still instructs `npx seene`

- Symptom: the generated consumer guide (`SEENE.md`) told developers to run `npx seene` for guide, scenes, and open.
- Root cause: stale handoff text disagreed with the workspace-local package contract. The generic fallback text in `src/project/commands.ts` still describes an npm installation; local tarball mode is separately supported.
- Files: the generated consumer `SEENE.md` document, `src/project/commands.ts`, `README.md`.
- Severity: high for the requested unpublished/local workflow.
- Fix: update persisted handoff and user-facing local development instructions to `pnpm exec seene`; distinguish a local workspace/package install from optional future published distribution.

### B3 — Generated scene source does not present the host application's real UI

- Symptom: the create handler generates a title/description mock inside `Surface`; the initialized consumer has real React children available, but `ProjectPreview` does not pass them into `SceneModuleLibrary` or the selected scene module.
- Root cause: the module-library branch drops the host subtree, and the generated scene component was authored as independent demo content rather than a presentation wrapper for the existing app.
- Files: `vite.config.ts`, `src/preview/index.tsx`, `src/preview/modules.tsx`, `src/preview/SceneLibrary.tsx`, `src/project/vite.ts`, and the generated host preview adapter in an initialized consumer project.
- Severity: critical (contradicts Seene's source-of-truth product contract even when the scene technically opens).
- Fix: pass host children through the library into the selected scene component; generate a `Surface` wrapper that renders those children, not mock UI. Escape all generated title data safely if it remains in generated source.

### B4 — Create-scene writes source using an unescaped title

- Symptom: titles containing quotes, JSX delimiters, or other source-sensitive text are interpolated directly into generated TSX and can make the created scene fail module parsing (or alter the authored JSX).
- Root cause: the root Vite middleware builds component source with a raw title interpolation.
- Files: `vite.config.ts`, tests for creation.
- Severity: high (real creation flow breaks for otherwise schema-valid titles).
- Fix: render title as a safely escaped JS/JSX string literal or do not embed it in source; test generated TSX parsing plus recipe validation.

### B4 — Consumer Vite app does not get scene-creation middleware

- Symptom: the package-generated preview adapter discovers scene modules for an existing host app, but `+ Create scene` posted to `/__seene/create-scene`, which only the Seene repository's root `vite.config.ts` handled. Host Vite configs that never registered the plugin could not create scenes.
- Root cause: the creation endpoint was owned by the product repository's app config rather than being part of the consumer integration.
- Files: `vite.config.ts`, `src/project/vite.ts`, `examples/basic-react/vite.config.ts`, preview creation UI.
- Severity: critical for creating scenes from an initialized consumer's Studio; root Seene app endpoint itself exists.
- Fix: provide one reusable Vite plugin owned by project integration and have initialized/fixture consumer configs use it, or explicitly constrain create-scene support to the root app and remove that action from consumer surfaces. Preserve one canonical implementation.

### B5 — Scene-module loader fails as a whole on one rejected import

- Symptom: `SceneModuleLibrary` loads all recipe and component modules in one `Promise.allSettled`; if one binding fails to import, it throws the first rejection and the UI reports one global source error, discarding already loaded catalog entries.
- Root cause: load results are not associated with their paths and reconciled independently; one broken TSX module blocks discovery of all valid scenes.
- Files: `src/preview/modules.tsx`, recipe/catalog behavior tests.
- Severity: high for diagnosing/fixing scene source errors and preserving a useful library.
- Fix: retain per-path import diagnostics and let valid recipe/binding pairs reach catalog resolution; do not suppress failed-scene diagnostics.

### B6 — Project recipe tests verify obsolete diagnostics/bounds

- Symptom: `tests/project/recipes.test.ts` expects a serialized `Symlinked` error even though symlinked bindings are excluded and the recipe correctly reports a missing component; it also expects 256 irrelevant directory entries to fail although the scan limit applies to files read/scenes.
- Root cause: test assumptions do not reflect current scoped discovery contract and fixture layout.
- Files: `tests/project/recipes.test.ts`, `src/project/services.ts`, `src/project/discovery.ts`.
- Severity: medium (3/18 failures; security behavior needs intentional assertions).
- Fix: assert observable exclusion and specific diagnostics for symlinks; test the actual bounded scan contract instead of unrelated filler file counting.

### B7 — Broad launch/project/preview test suites are not aligned to current source

- Symptom: `pnpm run test:launch` reports 87 failures / 114 passes. The failures include Vite config and refresh-boundary tests, project command/init fixture expectations, portable route expectations, onboarding/snapshot/controls UI contracts, and the symlink/bounds failures above. `tests/preview/onboarding.test.tsx` still expects removed clipboard prompt UI; `snapshots.test.tsx` supplies an empty-node recipe and expects the old UI to list it. Browser specs also assert old first-run copy and unavailable product features.
- Likely root cause: tests and fixtures span multiple product iterations and do not consistently describe current schemas, generated adapters, route/query contracts, or UI.
- Files: failures across `tests/project/*`, `tests/preview/*`, `tests/cli/terminal.test.ts`, `tests/browser/*` and associated scripts.
- Severity: high (large default/verification suites red and cannot currently verify product behavior).
- Fix: triage failures against actual behavior one suite at a time; rewrite only obsolete tests, repair true source defects, and add focused user-visible scene workflow tests.

### B8 — Export suites require local browser/encoder tools and have additional failures

- Symptom: `pnpm run test:export` reports 15 failed / 39 passed. Real capture cases cannot launch Playwright Chromium here; the environment also lacks a usable encoder/browser as required for video. Snapshot tests also show failures unrelated to those prerequisites (mutation preservation, static scenes, cancellation result expectations).
- Root cause: environment prerequisites plus several test/source contract mismatches; not all failures can be dismissed as environment-only.
- Files: `src/export/*`, `tests/export/*`, Playwright/browser setup.
- Severity: medium/high for export confidence.
- Fix: classify each failure after browser is runnable; keep deterministic unit tests for capture-independent behavior and run true integration export where FFmpeg/Chromium are installed.

### B9 — Full browser interaction could not be exercised in this sandbox

- Symptom: `pnpm run test:browser` builds the fixture bundle but all 8 tests fail before page navigation because system Chrome aborts with socket/ptrace permission errors. It does not establish whether the UI tests themselves pass.
- Root cause: sandbox cannot launch `/opt/google/chrome/chrome`; Chromium download is not available in this environment.
- Files: `playwright.config.ts`, `tests/browser/*`.
- Severity: blocking verification, environment-specific.
- Fix: rerun with approved browser execution permissions or a supported Playwright browser environment, then fix observed application failures.

### B10 — `open-scene` appends the canonical query parameter twice

- Symptom: `src/project/recipes.ts` calls `url.searchParams.set("seene-scene", ...)` twice in succession.
- Root cause: duplicated implementation statement, currently idempotent but erroneous and unneeded.
- Files: `src/project/recipes.ts`.
- Severity: low (no user-visible wrong URL currently).
- Fix: remove duplicate and retain exact URL assertion.

### B11 — Local workspace install/runtime path is inconsistent in the root dev helper

- Symptom: `scripts/dev.mjs` used to launch a workspace consumer project when its package symlink existed; a root-level `pnpm exec seene` cannot find the package's own declared binary, while executing from `basic-react-example` does.
- Root cause: `pnpm exec` resolves binaries in the invoking workspace's dependencies; the root package's own `bin` is not self-linked. The dev helper silently skipped or started the consumer depending on install state.
- Files: `scripts/dev.mjs`, workspace package setup/docs.
- Severity: medium (easy to invoke incorrectly; consumer bin works after install).
- Fix: the platform dev helper now starts exactly one server and never starts a consumer application; consumers run their own dev script in their own workspace context.

## 5. Duplicate / Conflicting Implementations

| Conflict | Files | Keep | Merge/remove | Reason |
| --- | --- | --- | --- | --- |
| Multiple scene directory names | `src/core/recipes.ts` accepts `src/seene/scenes` and legacy `src/flute/scenes`; current app/init generators use `src/seene/scenes` | `src/seene/scenes` as write/canonical path | Keep `src/flute/scenes` read compatibility only while needed for migration | Existing old consumer recipes may exist; new writes must be canonical. |
| Root app and generated consumer adapter implementations | `app/main.tsx`, `src/project/vite.ts`, generated host adapter in an initialized consumer project | Project generator as canonical adapter source; the platform app mounts `src/platform` directly | Avoid adding a second independent generator; compare generated adapter output to the generator in tests | The platform surface and the host connection are different products; only the host connection is generated per consumer. |
| Scene file import/loading paths | Vite glob loader `src/preview/modules.tsx` vs CLI filesystem discovery `src/project/discovery.ts` | Keep separate browser module loading and Node-safe metadata discovery, sharing the canonical `loadSceneRecipes` resolver | Do not merge into a filesystem-only browser loader | Different runtimes; shared schema/recipe resolution prevents conflicting behavior. |
| Preview styling | Tailwind utilities + runtime-injected `theme.ts`/`studio-theme.ts` | Keep Tailwind for app/library utility styling and injected theme only for consumer-independent preview chrome | Do not restore unused standalone library/onboarding/token CSS | Runtime theme strings are intentionally self-contained; Tailwind CSS is compiled and exported. |

## 6. Test Audit

- `tests/core` (9 files): scene/schema, spatial/focus, motion interpolation, recipe resolution, authoring, project/preview; current result 154/155. Rewrite the `Number.MIN_VALUE` motion test to validate accepted bounds and errors. It does not exercise file creation or browser loading.
- `tests/react` (2 files): real React scene/surface transforms, capture, registration/focus behavior; current 26/26. It does not validate scene source discovery or library navigation.
- `tests/preview` (4 files): controls, onboarding, ProjectPreview routing/context, snapshots. Current failures are mostly UI/schema expectations from older iterations. Rewrite to current `GettingStarted`, `seene-*` query names, valid recipe fixtures, and user-visible navigation; add loader mixed-valid/invalid module coverage.
- `tests/project` (5 files): project init/sync, portable integration, discovery/CLI recipe commands, refresh boundary and config safety. Recipe subset is 15/18; launch output shows many additional stale expectations. Keep real traversal/symlink/protected-file assertions, but assert behavior rather than obsolete exact copy/generated names.
- `tests/cli` (2 files): CLI flags/help/version and terminal onboarding. CLI functional suite is 18/18; terminal is 15/19 because four tests expect old Web Prodigies copy. Rewrite brand assertion to `THATG33K`; test command syntax and no side effects.
- `tests/export` (2 files): real MP4 encoding and JSON snapshot persistence/cancellation. Current 15 failures in combined export command; browser/FFmpeg environment blocks integration cases, and snapshot failures need source-vs-test triage.
- `tests/architecture.test.mjs`: 138 architecture/source-boundary assertions; all pass. It verifies policy and symbol ownership, not runtime scene creation.
- `tests/release.test.mjs`: package/release metadata checks; not independently run during this audit. It must not imply publishing is part of local development.
- `tests/browser` (2 Playwright files): 8 cases covering focus, preview controls, viewport, library/back navigation, and snapshots; unable to launch Chrome here. `preview.spec.ts` contains obsolete empty-state/onboarding/scene library selectors and branding assumptions; rewrite after browser access is available.
- `tests/agent` and fixture tests: historical/dormant agent trial assets and host fixtures; not a normal user workflow suite. Remove stale identity strings from the historical JSON instead of treating them as product API.
- `scripts/check-library.mjs`, `check-installed.mjs`, `check-portable.mjs`, `check-iterate.mjs`: end-to-end/harness checks. Some selectors and source assumptions need comparison against current UI before trusting; `check-installed.mjs` is a stronger consumer workflow candidate, but requires package/browser installation conditions.

Missing high-value tests: Vite create-scene middleware contract (including title escaping and file pair), app/consumer SceneModuleLibrary discovery, valid+invalid module coexistence, persisted scene opening after reload, package CSS content/export, and complete navigation round-trip.

## 7. Styling Audit

- Tailwind v4 starts at `src/index.css` via `@import "tailwindcss"`.
- Both root application and library builds register `@tailwindcss/vite` (`vite.config.ts`, `vite.lib.config.ts`).
- The built library stylesheet at `dist/library/seene.css` is 24,782 bytes and contains utility selectors such as `.flex{` and `.absolute{`; `package.json` exports it at `./style.css`.
- The standalone example imports `@thatg33k/seene/style.css`, so it consumes the package stylesheet rather than private source CSS.
- `src/index.css` also defines body/root tokens and resets; this is application-level base CSS, not an alternative component styling framework.
- `src/preview/theme.ts` and `studio-theme.ts` provide runtime-scoped CSS strings injected by preview rendering so the preview shell can work in a host app without that app scanning Seene's Tailwind source. This is a runtime requirement; keep it.
- `src/preview/seene-library.css`, `seene-onboarding.css`, and `seene-tokens.css` are already removed in the current worktree. The root build confirms current Tailwind output.

## 8. Branding Audit

- Package identity and descriptions use `@thatg33k/seene` / `THATG33K` in `package.json`, CLI, docs, and app branding.
- No `@webprodigies`/Webprodigies matches were found in source. Historical string remains in `tests/agent/trial.json`; stale audit text also contains the string until this report replacement. Remove the historical occurrence if a global zero-reference requirement is retained.
- Historical `npx seene` guidance has been replaced by `pnpm exec seene`; README uses `npm install @thatg33k/seene` as a published package install example despite local-only current development expectations. `npm` still appears in legitimate integration/release fixtures and `pnpm-workspace` project scripts; classify those by usage, do not mechanically replace them.
- `src/core/recipes.ts` accepts `src/flute/scenes` as legacy read compatibility. No other source `flute` match was found in the source scan. Historical `.idea/flute-main.iml` metadata and the prior stale audit must be cleaned; generated `dist` outputs should not be treated as source of truth.
- No TODO/FIXME strings were found in the source scan.
- Source comments found in `src/preview/session.ts`, `studio-theme.ts`, `theme.ts`; there is also a generated-code comment string in `src/project/portable.ts`. Remove comments from files modified as part of this repair; avoid broad formatting churn in unrelated code.

## 9. Runtime Flow

Actual path in the repository's own platform app:

`pnpm run dev` (`scripts/dev.mjs`) → root `vite.config.ts` aliases the package specifiers to local source and mounts `seenePlatformPlugin()` → `app/main.tsx` mounts `src/platform/Platform` → Projects view reads the local project registry (`SEENE_HOME/projects.json`) through `/__seene/platform/projects` → a registered external project is inspected on disk (`.seene/project.json`, `package.json`, `src/seene/scenes`) → Studio lists the project's real scenes and its discovered application components → create posts a validated draft to `/__seene/platform/projects/scenes`, which writes `src/seene/scenes/<id>.scene.json` + `<id>.tsx` **inside the external project** → the scene component renders that project's real UI (`Surface` wrapper around the app's own component, or the host subtree passed by `ProjectPreview`) → Preview/Presentation embed the project's own development studio (`?seene-preview=1&seene-scene=<id>`), where the Scene Inspector, timeline and camera/focus editing stay live.

For an external consumer, `pnpm exec seene init` (run inside that application) detects Next App/Pages Router or a standard Vite setup, generates the host connection (`src/seene/ProjectPreview.*`), records `.seene/project.json`, and writes `SEENE.md`. Its development glob exposes scene modules and `ProjectPreview` chooses `SceneModuleLibrary`; Vite hosts add `seeneCreateScenePlugin()` so `+ Create scene` writes through that host's own dev server. Nothing in this repository starts, imports or discovers a consumer application; the platform only reads the projects a developer registers locally.

The creation code uses the correct canonical output directory and currently sends a schema-valid recipe. It does not yet robustly escape a title before embedding it into generated TSX. The module loader currently rejects its entire load operation on any rejected module import. These are the two product-flow defects to fix first. Browser-level confirmation, scene creation from the UI, restart persistence, and camera/timeline interaction could not be completed in the sandbox because Chrome cannot launch.

## 10. Build / Run Verification

Commands run during this audit:

| Command | Observed result |
| --- | --- |
| `pnpm run typecheck` | No TypeScript diagnostics printed; terminal wrapper returned status 2 with `Cannot set tty process group` after command completion. Need a clean rerun. |
| `pnpm run test:core` | 154 passed, 1 failed (motion test described in B1). |
| `pnpm run test:react` | 26 passed, 0 failed in Vitest summary; wrapper status 2 due PTY warning. |
| `pnpm run test:architecture` | Architecture checks passed; 138 passed, 0 failed; wrapper status 2 due PTY warning. |
| `pnpm --filter basic-react-example run build` | Vite completed with 109 modules, generated JS/CSS; wrapper status 2 due PTY warning. |
| `pnpm run build` | Architecture checks and all app/library/CLI Vite builds completed; emitted `dist/library/{seene.css,index.js,preview.js}`, declarations, and `dist/cli/seene.js`; wrapper status 2 due PTY warning. |
| `pnpm run test:launch` | 87 failed, 114 passed, 11 suites; includes stale/incorrect expectations and project/preview defects described above. |
| `pnpm run test:recipes` | 39 passed, 3 failed; two symlink diagnostics and one directory bound expectation. |
| `pnpm run test:export` | 39 passed, 15 failed; environment capture/tool failures plus snapshot contract failures. |
| `pnpm run test:browser` | Test fixture build completed; 8/8 tests failed before execution because Chrome could not create a socket/ptrace under sandbox restrictions. |
| `pnpm --filter basic-react-example exec seene --version` | Printed `0.1.2`; local workspace executable available from the consumer package. |
| `pnpm exec seene --version` (root) | Failed: root package's own binary is not linked into root `node_modules/.bin`. |
| CSS content inspection | `dist/library/seene.css`: 24,782 bytes; `.flex{`, `.absolute{`, `display:flex`, Tailwind variables present; no `@import` left in built CSS. |
| `node dist/cli/seene.js ...` | Not separately run in this audit; consumer workspace version check verifies executable entry can run. |
| Development app/browser workflow | Not yet run; must be revisited after targeted fixes and with browser permissions. |

## 11. Recommended Implementation Order

1. Correct the motion regression test to agree with the existing transform schema; retain its supported-boundary coverage.
2. Preserve host React children through `ProjectPreview` → `SceneModuleLibrary` → selected scene component; generate a real host-presenting `Surface` wrapper instead of mock scene content.
3. Fix and test scene creation generation (safe title handling, collision handling, valid recipe/source pair) in the existing middleware; decide consumer endpoint ownership once, rather than duplicating middleware.
4. Change `SceneModuleLibrary` to preserve valid catalog entries while reporting specific failed module paths; add valid/invalid mixed-module regression tests.
5. Remove duplicate query assignment and repair project recipe/security tests against actual directory scan and symlink contracts.
6. Rewrite stale preview/CLI/project/browser expectations to current user-visible flows and Seene/local workspace package identity; fix genuine code failures discovered by those tests.
7. Update generated/persisted handoff docs and remove stale branding/comment artifacts. Keep legacy `src/flute/scenes` read support only if needed.
8. Obtain a clean typecheck/build/test command status, run package export/CSS checks and consumer integration build, then run the dev app and perform the complete create/open/back/restart workflow in a browser-capable environment.

## 12. Definition of Done

- `pnpm run build` and `pnpm run typecheck` exit cleanly and emit the documented library CSS/JS/types and CLI.
- Core, React, architecture, CLI, and scene recipe tests pass; rewritten tests match the intended product, not obsolete markup.
- `@thatg33k/seene/style.css` contains compiled Tailwind utility classes; the independent consumer builds using the workspace package and exported CSS.
- In a real Vite consumer, local CLI init works, the Scene Library discovers actual recipes/components, and scene creation writes a valid JSON recipe and parseable TSX source under `src/seene/scenes`.
- HMR discovers a created scene; it can be opened, renders the bound real component in `ScenePreview`, camera/inspector/timeline work, back navigation returns to the library, and the scene survives a server restart.
- A bad scene module yields an actionable per-file diagnostic without preventing valid scenes from being listed/opened.
- No stale Webprodigies branding or `npx seene` development instructions remain; intentional legacy path/query compatibility is explicitly documented.
- Browser/export verification is either run with supported local dependencies or recorded as an environment limitation, not reported as a pass.
