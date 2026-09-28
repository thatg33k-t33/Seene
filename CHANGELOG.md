# Changelog

## 0.1.3

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
