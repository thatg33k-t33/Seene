# Seene by THATG33K

Cinematic scene studio for your **real React UI**. Take your real React application and create cinematic, spatial presentations of it. Seene provides the renderer, camera system, perspective, depth-of-field effects, timeline playback and MP4 export. Your app keeps its components, providers and styles.

Open source under the [MIT license](LICENSE). Runs locally. No account or cloud subscription is needed.

## Install (one command)

**React DOM 18.2+ or 19**, with **Node 22.12+** for the CLI.

```sh
npx @thatg33k/seene init
```

That single command installs `@thatg33k/seene` into your project using your own package manager
(npm, pnpm, Yarn or Bun), wires up the integration, and writes `SEENE.md` for your coding agent.
It never replaces your framework, entry point or providers, and it is safe to re-run.

Keep your existing dev server running, then open the Studio:

```sh
npx seene open --url http://127.0.0.1:5173
```

In Next.js, open `/seene` on your existing dev server (usually port 3000). In Vite, setup connects
the existing root. To create scenes from the Studio, add `seeneCreateScenePlugin()` from
`@thatg33k/seene/vite` to the existing Vite `plugins` array without removing the framework's React
plugin. Start host apps with the dev script declared by their own package.

## Authoring in Seene Studio

Open the Seene studio, select or load your real React UI components, and use the built-in **Scene Inspector** to adjust camera position, rotation, focal length, focus distance, depth of field blur, and motion duration live.

```sh
npx seene scenes
npx seene open --scene my-shot --url http://127.0.0.1:5173
npx seene snapshot --scene my-shot --url http://127.0.0.1:5173
```

Generated instructions always use your project's package manager (`npx`, `pnpm exec`, `yarn` or
`bunx`) — read `SEENE.md` after init for the exact commands.

## Export video

Install FFmpeg on your system and Chromium once:

```sh
npx playwright install chromium
```

Export your scene to MP4:

```sh
npx seene export --url 'http://127.0.0.1:5173/?seene-preview=1&seene-scene=my-shot' --output my-shot.mp4 --fps 60
```

30, 60 and 120 FPS are supported.

## Development

```sh
pnpm install
pnpm build
pnpm dev
```
