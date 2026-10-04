# Seene Product Audit

Audit date: 2026-10-04

This audit describes the current source and local verification. The package is `@thatg33k/seene`; this document does not authorize or perform a release.

## Product and repository boundaries

- **Package and CLI:** `src/core/`, `src/react/`, `src/preview/`, `src/project/`, `src/cli/`, `src/vite/`, and `src/export/` build to `dist/library/` and `dist/cli/`.
- **Studio and landing page:** `src/platform/` renders the local Studio and the static landing-page source. `vite.pages.config.ts` builds the static site to `dist-pages/`.
- **Public package surface:** `package.json` exports the root library, `/preview`, `/style.css`, `/vite`, and the `seene` executable. `scripts/release.mjs check` validates the local tarball without publishing.
- **Tests and example:** `tests/` contains core, project, preview, CLI, export, browser, and release checks. `examples/basic-react/` is the standard Vite consumer.
- **Real-world consumer:** a separate Next.js 15 / React 19 portfolio exists outside this repository. Its working tree contains pre-existing user changes, so integration verification was performed on a temporary copy; the consumer was not edited.

## Confirmed findings and repairs

### Discovery scope and worktrees

`discoverRecipes()` reads the canonical `src/seene/scenes` directory. Before this audit, the shared recursive scanner excluded only `.git`, `.seene`, and `node_modules`; if used on a broader root or when a worktree/cache directory existed beneath a scanned tree, unrelated files could enter traversal. The scanner now skips known Git, AI-agent/worktree, IDE, dependency, build, and cache directories, including `.kilo` and `.agents`. It still scans ordinary project scene files. Missing directories remain empty catalogs; non-`ENOENT` filesystem errors are no longer silently converted to empty results.

The exact historical sibling path `.kilo/worktrees/.../src/seene/scenes` is outside the canonical scene directory in the current source and therefore could not be reproduced by the current `discoverRecipes()` call alone. Regression coverage now verifies both the project-root worktree boundary and ignored directories during broad scans, while confirming valid host scenes are retained.

Recipe files are intentionally required directly in `src/seene/scenes`; nested recipe files are diagnosed rather than treated as canonical. IDs match lowercase slugs and the recipe filename; each recipe requires exactly one sibling `.tsx` or `.jsx` component. Empty catalogs, invalid JSON/schema, duplicate IDs, missing bindings, and ambiguous bindings have diagnostics.

### Next.js detection and routing

The automatic detector recognized a declared `next` dependency but only looked for `app/layout.*` or `src/app/layout.*`. A valid App Router organized under a route group such as `src/app/(app)/layout.tsx` was missed and fell back to the manual React adapter. A second failure path existed when a project declared Vite but its `dev` script was `next dev` without a direct `next` dependency: setup could reach Vite-specific validation.

Next detection now prioritizes the declared framework and `next dev` script, reports a missing Next dependency without a Vite error, and finds root route-group layouts. It adds the generated `/seene` page beside the route-group homepage without rewriting that homepage. `open --url` verifies the generated route and returns an actionable Next-specific error when the server/route cannot be reached. Regression tests cover Next 15, mixed Vite dependencies, missing Next metadata, route groups, and route verification.

### Preview integration and documentation

Next.js App/Pages Router and standard Vite have generated automatic connections. A custom React DOM renderer intentionally receives `src/seene/ProjectPreview.jsx` and a static catalog but is not mounted automatically. Previously, the `manual-preview` message and generated handoff did not clearly say what to mount or which development flag to use.

The CLI now states that manual mounting is required and explains the development-only `enabled` prop, query activation, provider placement, and framework-specific flag. Generated `SEENE.md`, README, and landing-page content explain Next.js, Vite, and custom React workflows separately. Existing, unchanged generated handoff files are safely refreshed; user-edited or unrelated `SEENE.md` files still produce a conflict and are preserved.

### Package and release artifact

The package has a Node.js `>=22.12.0` requirement and React/React DOM peer range `18.2` through `19.x`. Its declared exports, generated JavaScript, declarations, CSS and CLI are checked by the release-artifact verifier. The verifier also checks the executable shebang/permissions and package contents. Local artifact verification passed; no package was published.

## Supported local workflow

1. In a React DOM project (React 18.2/19; Node 22.12+), run `npx @thatg33k/seene init` from its package root.
2. Keep the existing host dev server and project structure. Next.js gets a development-only `/seene` route; standard Vite wraps the existing React root; custom React DOM renderers must mount the generated wrapper themselves.
3. Author a root-level `src/seene/scenes/<id>.scene.json` and matching `<id>.tsx` or `<id>.jsx` component.
4. Run `npx seene scenes --json` and `npx seene validate`. Run `npx seene sync` after adding/removing pairs for Next/manual React static catalogs; Vite's glob is automatic.
5. Start the host with its own dev script and run `npx seene open --url <origin>`; typical origins are `http://localhost:3000` for Next and `http://localhost:5173` for Vite.

## Local commands

- `npm run build`: architecture checks, typecheck, Studio build, package library/declarations, and CLI build.
- `npm run build:pages`: static landing-page build.
- `npm run test:launch`: project, preview, and CLI integration tests.
- `npm run verify:release`: local package artifact verification only.

## Final local validation

- `npm run build`: passed, including architecture checks, TypeScript, Studio, package/library declarations, and CLI builds.
- `npm run build:pages`: passed; static landing page generated locally.
- `npm run test:core`: 176 passed; `npm run test:react`: 40 passed; `npm run test:architecture`: 142 passed.
- `npm run test:launch`: 231 passed across project, preview, and CLI suites.
- `npm run test:browser`: 8 passed, including the updated landing-page workflow, local-project-console contract, preview runtime, and focus behavior.
- `npm run verify:release`: passed for the local `0.1.5` tarball; `npm run test:installed`: passed against the installed local tarball. `node --test tests/release.test.mjs`: 34 passed.
- Next.js integration was smoke-tested in an isolated temporary consumer copy against the locally built package: homepage returned HTTP 200 before and after, its source remained unchanged, and generated `/seene?seene-preview=1` returned HTTP 200.
- `npm run test:export`: 52 passed, 3 could not pass because `ffmpeg`/`ffprobe` are absent; the observed failure is the explicit `missing-ffmpeg` diagnostic, not a weakened test.
- `npm run test:performance`: could not launch because the configured Chromium executable is absent at `/home/skye/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`; no system Chromium was found. No hardware-performance result is claimed.
- `git diff --check`: passed.

No npm publication or website deployment was performed, and no publishing/deployment YAML was changed.

## Remaining boundaries

- React Native without a DOM is not supported.
- A custom React renderer is not auto-mounted; host entry/layout changes remain the developer's responsibility.
- A conflicting `/seene` route is preserved; use the documented manual React adapter instead.
- App Router integration selects a root layout or a route-group layout suitable for `/seene`; unusual nested dynamic-segment layouts may require the manual adapter.
- Recipe/component files must be directly in the canonical scene directory.

No publishing/deployment YAML was changed. No npm publication or website deployment was performed.
