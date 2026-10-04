# Seene

[![npm](https://img.shields.io/npm/v/@thatg33k/seene)](https://www.npmjs.com/package/@thatg33k/seene)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Pages](https://img.shields.io/badge/site-thatg33k--t33.github.io%2FSeene-5b8cff)](https://thatg33k-t33.github.io/Seene/)

**Seene** is a cinematic scene studio for real React DOM interfaces. It presents your existing components with camera perspective, depth of field, timeline motion and local video export. Your app keeps its framework, route, providers, components and styles.

It runs locally: no account, cloud service or subscription is required.

- **Homepage:** <https://thatg33k-t33.github.io/Seene/>
- **Package:** [`@thatg33k/seene`](https://www.npmjs.com/package/@thatg33k/seene)
- **Repository:** <https://github.com/thatg33k-t33/Seene>

## Compatibility

- React DOM **18.2 or 19**.
- Node.js **22.12 or newer** for the Seene CLI.
- Automatic project connection for standard React + Vite roots and Next.js App Router or Pages Router projects.
- Other React DOM renderers use the generated portable wrapper and require a manual mount. React Native without a DOM is not supported.

## Getting started

Run these commands from the consuming application's package directory. Seene never starts or replaces your host development server.

### 1. Install and initialize

```sh
npx @thatg33k/seene init
```

The CLI installs `@thatg33k/seene` using the package manager detected for your project, then creates the Seene project state and `SEENE.md` instructions.

The generated connection depends on the host:

- **Next.js App/Pages Router:** adds a development-only `/seene` Studio route, a local `/api/seene/create-scene` handler, and generated files under `src/seene/`. It does not rewrite the homepage, layouts, or providers.
- **Standard Vite React:** wraps the existing React root and creates `src/seene/ProjectPreview.tsx`. It does not replace the Vite config or React plugin.
- **Custom React DOM renderer:** creates `src/seene/ProjectPreview.jsx` and `src/seene/catalog.js`, but does not edit the host entry. Mount it manually as described below.

Initialization is safe to re-run when its generated files have not been edited. Existing conflicting files are preserved and reported rather than overwritten.

### 2. Author a scene

A scene is a recipe JSON file paired with one default-exported React component. Keep both files directly in `src/seene/scenes`; use a lowercase slug for the shared name and recipe `id`.

`src/seene/scenes/dashboard.scene.json`:

```json
{
  "version": 1,
  "id": "dashboard",
  "title": "Dashboard",
  "definition": {
    "scene": {
      "nodes": [{ "id": "panel" }]
    }
  }
}
```

`src/seene/scenes/dashboard.tsx`:

```tsx
import { Surface } from "@thatg33k/seene";
import Dashboard from "../../Dashboard";

export default function DashboardScene() {
  return (
    <Surface id="panel" style={{ width: 1400, height: 980 }}>
      <Dashboard />
    </Surface>
  );
}
```

A `.jsx` component is also supported. Component `Surface` IDs must match the recipe's scene nodes. Use your existing client-compatible UI and providers; do not put server-only modules or async Server Components in the scene component.

### 3. Discover and validate

```sh
npx seene scenes --json
npx seene validate
```

The JSON command returns validated scenes and diagnostics. Malformed recipes, duplicate IDs, missing or ambiguous component pairs, and invalid paths are reported. An empty scenes directory is a valid empty catalog.

Next.js and manually mounted React renderers use a generated static import catalog. After adding or removing a scene/component pair, refresh it with:

```sh
npx seene sync
```

Standard Vite uses a development `import.meta.glob` and updates as files change; no manual sync is needed for its scene list.

### 4. Mount and activate the preview

**Next.js (automatic):** the generated `/seene` route mounts the Studio in development, and `/api/seene/create-scene` safely writes scene pairs and refreshes the generated import catalog. Keep the host layout/providers intact; no homepage integration is needed. Start Next with the project's own command, then run the open command below. If upgrading a project initialized by an earlier Seene version, rerun `npx seene init` to add the managed API route.

**Standard Vite (automatic):** init wraps the existing React root with a development-only preview gate. Keep the existing React plugin. To enable creating recipe/component files from Studio, add `seeneCreateScenePlugin()` from `@thatg33k/seene/vite` to the existing Vite `plugins` array; this plugin is optional for discovery and preview.

**Custom React DOM renderer (manual):** import the generated wrapper inside your current provider tree. This example assumes the host entry is `src/main.tsx`; adjust the relative import for your file. Pass the host's development flag and leave `active` unset so the query string controls activation.

```tsx
import { SeeneProjectPreview } from "./seene/ProjectPreview";

<ExistingProviders>
  <SeeneProjectPreview enabled={import.meta.env.DEV}>
    <ExistingApp />
  </SeeneProjectPreview>
</ExistingProviders>
```

For a Next.js App Router project using `src/app/(app)/layout.tsx`, use a relative import such as `../../seene/ProjectPreview` and wrap the existing `{children}` inside `<body>` with `enabled={process.env.NODE_ENV === "development"}`. Standard Next.js initialization does not need this manual wrapper: it generates `/seene` and leaves the homepage alone. A custom renderer must actually mount the component; `seene open` does not modify a custom entry or pretend a manual connection is active.

### 5. Open the local preview

Start your existing host server in one terminal. In another, pass its origin explicitly:

```sh
# Next.js
npx seene open --url http://localhost:3000

# Standard Vite
npx seene open --url http://localhost:5173
```

Next.js opens the generated `/seene?seene-preview=1` route. Vite opens the existing root with `?seene-preview=1`. For a manually mounted renderer, use that renderer's origin; the manual mount must already be present.

To open a selected scene, use its slug:

```sh
npx seene open --scene dashboard --url http://localhost:3000
```

Use your actual local origin and port if they differ. Add `--no-open` to verify and print the URL without launching a browser.

## Troubleshooting

- **`manual-preview`:** the generated portable wrapper has not been mounted. Add it around the existing UI inside its providers, set a development-only `enabled` flag, and retry `open`.
- **`missing-dev-server`:** start the host's own dev script, then pass the correct loopback origin (`3000` for a typical Next app, `5173` for a typical Vite app).
- **`invalid-scenes`:** check the reported JSON path, lowercase recipe ID, and matching sibling `.tsx` or `.jsx` file. Keep recipe pairs directly in `src/seene/scenes`.
- **`wrong-dev-server`:** the URL is serving another project or route. Pass the origin of the app initialized by Seene.
- **`conflict` on `/seene`:** preserve the existing route; use `npx @thatg33k/seene init --adapter react` and follow the manual mount steps instead.

Run `npx seene guide --json` for the installed package's complete authoring contract, `npx seene load --scene dashboard --json` to inspect a recipe, or `npx seene sync` to refresh a static catalog.

## Export video

Local MP4 export requires FFmpeg and a Playwright Chromium browser. Install Chromium once:

```sh
npx playwright install chromium
```

Then export an activated preview:

```sh
npx seene export --url 'http://localhost:5173/?seene-preview=1&seene-scene=dashboard' --output dashboard.mp4 --fps 60
```

Supported frame rates are 30, 60 and 120 FPS. Install FFmpeg separately using your operating system's package manager.

## Development

```sh
pnpm install
pnpm dev
```

Build the package and CLI locally with `pnpm build`. Build the static landing page locally with `pnpm build:pages` (output: `dist-pages/`). Neither command publishes or deploys anything.

## Project credits

Seene is built and maintained by [**Yonela Johannes**](https://github.com/Yonela-Johannes) under [**THATG33K**](https://github.com/thatg33k-t33). Yonela is the sole author and repository maintainer; THATG33K is the organization that owns the project and the `@thatg33k` npm scope.

Open source under the [MIT license](LICENSE).
