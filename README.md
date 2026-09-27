# Seene by THATG33K

Cinematic scene studio for your **real React UI**. Take your real React application and create cinematic, spatial presentations of it. Seene provides the renderer, camera system, perspective, depth-of-field effects, timeline playback and MP4 export. Your app keeps its components, providers and styles.

Open source under the [MIT license](LICENSE). Runs locally. No account or cloud subscription is needed. Seene is under local development and is not installed from the public npm registry.

## Local workspace development

**React DOM 18.2+ or 19**, with **Node 22.12+** for the CLI.

From this repository:

```sh
pnpm install
pnpm run build
pnpm --filter basic-react-example exec seene --version
pnpm --filter basic-react-example dev
```

For another consumer inside this pnpm workspace, declare `@thatg33k/seene` as `workspace:*` and run the local executable from that consumer's workspace context. `pnpm exec seene init` connects its existing React application; no public npm package lookup is involved.

Keep your existing dev server running. Use the URL it prints:

```sh
pnpm exec seene open --url http://127.0.0.1:5173
```

In Next.js, open `/seene` on your existing dev server (usually port 3000). In Vite, setup connects the existing root. To create scenes from the Studio, add `seeneCreateScenePlugin()` from `@thatg33k/seene/vite` to the existing Vite `plugins` array without removing the framework's React plugin. Start host apps with the dev script declared by their package; use pnpm for this workspace.

## Authoring in Seene Studio

Open the Seene studio, select or load your real React UI components, and use the built-in **Scene Inspector** to adjust camera position, rotation, focal length, focus distance, depth of field blur, and motion duration live.

```sh
pnpm exec seene scenes
pnpm exec seene open --scene my-shot --url http://127.0.0.1:5173
pnpm exec seene snapshot --scene my-shot --url http://127.0.0.1:5173
```

## Export video

Install FFmpeg on your system and Chromium once:

```sh
pnpm exec playwright install chromium
```

Export your scene to MP4:

```sh
pnpm exec seene export --url 'http://127.0.0.1:5173/?seene-preview=1&seene-scene=my-shot' --output my-shot.mp4 --fps 60
```

30, 60 and 120 FPS are supported.

## Development

```sh
pnpm install
pnpm build
pnpm dev
```
