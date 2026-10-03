# Changelog

## 0.1.3

### Fix: publishing is unblocked

- `scripts/release.mjs` no longer requires `package-lock.json`. It accepts the committed `pnpm-lock.yaml` (or an npm lockfile) so releases install reproducibly. This was the hard failure behind every red `Publish npm package` run.
- `npm pack --json` output is normalized across npm versions; npm >= 10 returns an object keyed by package name, which previously made the artifact count `undefined`.
- The packed-file allowlist accepts `.css`, so the published `./style.css` export no longer fails validation. Plain string exports are also handled correctly instead of throwing on a missing `types` condition.
- `package.json` `repository`/`homepage`/`bugs` now match the real GitHub remote (`thatg33k-t33/Seene`), so CI's repository assertion passes.
- The publish workflow installs with `pnpm install --frozen-lockfile` (the lockfile actually committed) instead of `npm ci`, which demanded a `package-lock.json` that does not exist.

### Fix: package size

- The library and CLI builds set `publicDir: false`, so the platform site's imagery is no longer copied into the npm package. The tarball drops from ~4.07 MB to ~220 KB (-94.6%); those PNGs were 82.6% of the package and are unreachable from package exports.

### Install: one command

- `seene init` now installs `@thatg33k/seene` from the registry at the exact running CLI version when it is not already present, so `npx @thatg33k/seene init` is a true single step. `--package <tarball>` still takes precedence for local builds and offline use.
- A failed auto-install now reports `install-failed` with the real cause and the exact command to retry, instead of collapsing into a generic project error.
- Generated `SEENE.md` instructions and CLI messages use the consumer's own package manager (`npx`, `pnpm exec`, `yarn` or `bunx`) rather than assuming pnpm.

### Fix

- `ProjectsView`: the "Register project" button referenced a non-existent `SenteButton` component, breaking the build once uncommented.

### Preview / Runtime

- **Fix**: Bridge heartbeat keep-alive now sends periodic `SEENE_STUDIO_PING` every 10s and retries `SEENE_CLIENT_HELLO` every 2s, preventing "Not connected" after 15s of inactivity.
- **Fix**: `ScenePreview` now correctly returns its JSX (was missing `return` statement, returning `undefined`).
- **Fix**: `SceneLibrary` checks `SelectedComponent` for document-level content (`<html>`, `RootLayout`) before rendering; falls back to `ApplicationPreview` (iframe) to preserve document boundaries.
- **Fix**: `ProjectPreview` already detects document content in children via `containsDocumentContent` and routes to `ApplicationPreview` with `route="/"`.
- **Add**: `SEENE_CLIENT_APPLICATION_ERROR` — preview runtime reports application crashes (e.g. Stripe misconfiguration) to the Studio via the bridge, surfacing them as inline notices.
- **Add**: `SEENE_CLIENT_CREATE_SCENE` — preview can request scene creation through the bridge; Studio responds with `SEENE_STUDIO_SCENE_CREATED`.

### Platform site

- **Redesign**: Complete zed.dev-style redesign — CSS variable design tokens, `FrameSection` with rails and corner nodes, `SeeneButton` with primary/secondary/ghost variants and `Kbd` chips.
- **Fix**: "Register project" button now uses `SenteButton` component instead of raw class strings.
- **Fix**: Hardcoded hex colors replaced with CSS variables across `StudioView`, `SettingsView`, `CreateSceneDialog`, `SceneLibrary`, `GettingStarted`, `SceneInspector`, and `BrandAttribution` for proper light/dark mode support.
- **Add**: `AuthView` — local login/signup form with email validation and localStorage account persistence.
- **Add**: `SiteHeader` — sticky header with nav, command palette (Ctrl+K), auth buttons, and keyboard shortcuts.
- **Add**: `useSiteShortcuts` — global keyboard shortcuts (L, S, I, R, ⌘K/Ctrl+K).

### CLI

- `seene init` now supports Next.js App Router with automatic `app/seene/page.jsx` integration.
- `seene open --url` opens the Studio pre-connected to the running app.
- `seene scenes --json` reads the scene catalog as JSON.

### Publish

- GitHub Actions workflow (`.github/workflows/publish.yml`) uses npm trusted publishing (OIDC) — no `NPM_TOKEN` secret needed.
- `prepublishOnly` hook runs full `verify:release` before publishing.
