/** SOURCE OF TRUTH: Seene public landing page.
 * WHAT: the static, server-free project home served on GitHub Pages.
 * WHY: the public site must never depend on the local platform server.
 * WHERE: Platform renders it as the default route.
 */
import type { ReactNode } from "react";
import { SEENE_BRAND, SEENE_INSTALL_COMMAND } from "../core/branding";
import { FrameSection, Kbd } from "./site";

const CAPABILITIES = [
  { title: "Camera", body: "Position, rotate and frame real interface layers in 3D space instead of presenting a fixed screenshot." },
  { title: "Depth of field", body: "Thin-lens focus distance and focal length blur surfaces by depth, so attention lands where it should." },
  { title: "Motion timeline", body: "Keyframed tracks with cinematic easing drive deterministic playback. Same input, same frame, every run." },
  { title: "Your own components", body: "Scenes render the components you already have, inside the providers and styles you already ship." },
  { title: "Export", body: "Capture real frames headlessly and encode to MP4 at 30, 60 or 120 FPS." },
  { title: "Open source", body: "MIT licensed. The library, CLI and this site live in one public repository." },
];

const RECIPE_EXAMPLE = `{
  "version": 1,
  "id": "dashboard",
  "title": "Dashboard",
  "definition": { "scene": { "nodes": [{ "id": "panel" }] } }
}`;

const COMPONENT_EXAMPLE = `import { Surface } from "@thatg33k/seene";
import Dashboard from "../../Dashboard";

export default function DashboardScene() {
  return (
    <Surface id="panel" style={{ width: 1400, height: 980 }}>
      <Dashboard />
    </Surface>
  );
}`;

const MANUAL_MOUNT_EXAMPLE = `import { SeeneProjectPreview } from "./seene/ProjectPreview";

<ExistingProviders>
  <SeeneProjectPreview enabled={developmentFlag}>
    <ExistingApp />
  </SeeneProjectPreview>
</ExistingProviders>`;

function ExternalLink({ href, className = "", children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      className="seene-btn seene-btn-secondary seene-btn-nav shrink-0"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
      }}
    >
      {label ?? "Copy"}
    </button>
  );
}

function CommandLine({ value, copy = true }: { value: string; copy?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-3 sm:flex-row sm:items-center">
      <code className="min-w-0 max-w-full flex-1 overflow-x-auto whitespace-nowrap px-1 font-mono text-sm">{value}</code>
      {copy && <CopyButton value={value} />}
    </div>
  );
}
export function LandingView() {
  return (
    <>
      <FrameSection label="Overview" edge="bottom" rails={[{ kind: "solid", flex: 2 }, { kind: "dashed", flex: 3 }, { kind: "solid", flex: 4 }]}>
        <div className="relative py-16 text-center sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--seene-border)] bg-[var(--seene-surface)] px-3.5 py-1 font-mono text-xs text-[var(--seene-text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--seene-accent)]" aria-hidden="true" />
            {SEENE_BRAND.packageName} · {SEENE_BRAND.license} licensed
          </p>
          <h1 className="seene-hero-rise mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Present your React interfaces as cinematic scenes.
          </h1>
          <p className="seene-hero-rise mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-[var(--seene-text-muted)]">
            Seene is a cinematic scene studio for real React applications. Keep your components,
            providers and styles, and add a camera, depth of field, motion timeline and video export
            over the interface you already built.
          </p>
          <div className="mx-auto mt-7 max-w-2xl">
            <CommandLine value={SEENE_INSTALL_COMMAND} />
            <p className="mt-3 font-mono text-xs text-[var(--seene-text-muted)]">
              Needs Node 22.12+ and React 18.2+ or 19. Installs as {SEENE_BRAND.packageName}.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <a className="seene-btn seene-btn-primary seene-btn-cta" href="#install">
              Get started <Kbd onPrimary>I</Kbd>
            </a>
            <ExternalLink className="seene-btn seene-btn-secondary seene-btn-cta" href={SEENE_BRAND.repository}>
              View on GitHub
            </ExternalLink>
            <ExternalLink className="seene-btn seene-btn-secondary seene-btn-cta" href={SEENE_BRAND.npm}>
              npm package
            </ExternalLink>
          </div>
        </div>
      </FrameSection>

      <FrameSection label="Capabilities" edge="both" rails={[{ kind: "dashed", flex: 2 }, { kind: "solid", flex: 4 }, { kind: "dashed", flex: 1 }]}>
        <div className="py-14">
          <h2 className="seene-h2 text-3xl">What Seene gives you</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(item => (
              <article key={item.title} className="rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-5">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--seene-text-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </FrameSection>

      <FrameSection label="Install and start" edge="both" texture rails={[{ kind: "solid", flex: 4 }, { kind: "dashed", flex: 2 }, { kind: "solid", flex: 2 }]}>
        <div id="install" className="py-14">
          <h2 className="seene-h2 text-3xl">Install and start</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[var(--seene-text-muted)]">
            Seene supports React DOM 18.2 or 19 and Node.js 22.12 or newer for the CLI. It works with
            standard Vite React roots, Next.js App/Pages Router projects, and custom React DOM renderers.
            Run init from your application package directory; your existing homepage and providers stay yours.
          </p>
          <div className="mx-auto mt-8 max-w-3xl text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">1 · Install and initialize</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--seene-text-muted)]">Init installs <code className="font-mono">@thatg33k/seene</code> using the project package manager, then writes a project connection and the generated <code className="font-mono">SEENE.md</code> instructions.</p>
            <div className="mt-3"><CommandLine value={SEENE_INSTALL_COMMAND} /></div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--seene-text-muted)]">Standard Vite setup wraps the existing React root. Next.js setup adds a development-only <code className="font-mono">/seene</code> route without changing the homepage. Other React renderers get a preview wrapper that you mount manually.</p>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">2 · Author a recipe and matching component</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--seene-text-muted)]">Create a lowercase slug pair directly under <code className="font-mono">src/seene/scenes</code>. The recipe ID must match both filenames; the component default-exports React UI whose <code className="font-mono">Surface</code> IDs match the recipe nodes.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="min-w-0"><p className="mb-2 font-mono text-xs text-[var(--seene-text-muted)]">dashboard.scene.json</p><pre className="min-w-0 max-w-full overflow-x-auto rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4 font-mono text-xs leading-relaxed"><code>{RECIPE_EXAMPLE}</code></pre></div>
              <div className="min-w-0"><p className="mb-2 font-mono text-xs text-[var(--seene-text-muted)]">dashboard.tsx</p><pre className="min-w-0 max-w-full overflow-x-auto rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4 font-mono text-xs leading-relaxed"><code>{COMPONENT_EXAMPLE}</code></pre></div>
            </div>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">3 · Discover and validate</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <CommandLine value="npx seene scenes --json" />
              <CommandLine value="npx seene validate" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--seene-text-muted)]">For Next.js and manually mounted React connections, run <code className="font-mono">npx seene sync</code> after adding or removing scene/component pairs to refresh the generated import catalog. Vite discovers the files through its development glob.</p>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">4 · Start your app and open its local preview</h3>
            <p className="mt-2 text-sm text-[var(--seene-text-muted)]">Start the host with its existing dev script in one terminal. Then use the origin for that framework:</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <article className="min-w-0 rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4"><h4 className="text-sm font-medium">Next.js</h4><p className="mt-1 text-xs leading-relaxed text-[var(--seene-text-muted)]">Init generates <code className="font-mono">/seene</code>; the CLI verifies that route and opens it. Your App Router homepage is not replaced.</p><div className="mt-3"><CommandLine value="npx seene open --url http://localhost:3000" /></div></article>
              <article className="min-w-0 rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4"><h4 className="text-sm font-medium">Standard Vite</h4><p className="mt-1 text-xs leading-relaxed text-[var(--seene-text-muted)]">Init connects the existing root. The optional Vite plugin enables scene-file creation from Studio.</p><div className="mt-3"><CommandLine value="npx seene open --url http://localhost:5173" /></div></article>
            </div>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">Custom React renderer · manual mount</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--seene-text-muted)]">Init does not edit custom entry points. This example assumes a host entry at <code className="font-mono">src/main.tsx</code>; adjust the wrapper import to be relative to your entry/layout. Mount it inside your existing provider tree and set the development flag for your framework:</p>
            <pre className="mt-3 min-w-0 max-w-full overflow-x-auto rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4 font-mono text-xs leading-relaxed"><code>{MANUAL_MOUNT_EXAMPLE}</code></pre>
            <p className="mt-3 text-sm leading-relaxed text-[var(--seene-text-muted)]">For a Next.js manual mount in <code className="font-mono">src/app/(app)/layout.tsx</code>, the relative import is <code className="font-mono">../../seene/ProjectPreview</code> and the flag is <code className="font-mono">process.env.NODE_ENV === "development"</code>. In a Vite entry use <code className="font-mono">import.meta.env.DEV</code>. Keep <code className="font-mono">active</code> unset so the <code className="font-mono">?seene-preview=1</code> query activates the preview, then run <code className="font-mono">npx seene open --url &lt;origin&gt;</code>.</p>
          </div>
        </div>
      </FrameSection>

      <FrameSection label="Troubleshooting" edge="both" rails={[{ kind: "solid", flex: 3 }, { kind: "dashed", flex: 2 }, { kind: "solid", flex: 3 }]}>
        <div className="py-14">
          <h2 className="seene-h2 text-3xl">Troubleshooting</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              ["manual-preview", "The generated React wrapper has not been mounted. Add SeeneProjectPreview around the existing UI inside its providers, then retry open."],
              ["missing-dev-server", "Start the application's own dev script and pass its local origin: usually localhost:3000 for Next.js or localhost:5173 for Vite."],
              ["invalid-scenes", "Keep each recipe directly in src/seene/scenes and match its lowercase ID to one sibling .tsx or .jsx component. Fix the reported JSON/component path."],
              ["route conflict", "A host route already uses /seene. Preserve that route and initialize with --adapter react to use the documented manual mount instead."],
            ].map(([title, body]) => <article key={title} className="rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4"><h3 className="font-mono text-xs font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--seene-text-muted)]">{body}</p></article>)}
          </div>
        </div>
      </FrameSection>

      <FrameSection label="Open source" edge="both" texture rails={[{ kind: "dashed", flex: 3 }, { kind: "solid", flex: 3 }, { kind: "dashed", flex: 3 }]}>
        <div className="mx-auto max-w-2xl py-14 text-center">
          <h2 className="seene-h2 text-3xl">Open source, no account required</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--seene-text-muted)]">
            Seene runs entirely on your machine. There is no sign-up, no cloud service and no
            telemetry. Read the source, fork it, or file an issue.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <ExternalLink className="seene-btn seene-btn-secondary seene-btn-cta" href={SEENE_BRAND.repository}>Source code</ExternalLink>
            <ExternalLink className="seene-btn seene-btn-secondary seene-btn-cta" href={SEENE_BRAND.examples}>Examples</ExternalLink>
            <ExternalLink className="seene-btn seene-btn-secondary seene-btn-cta" href={SEENE_BRAND.issues}>Issues</ExternalLink>
          </div>

          <div className="mx-auto mt-10 max-w-lg rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">Project credits</p>
            <p className="mt-3 text-sm leading-relaxed">
              Seene is built and maintained by{" "}
              <ExternalLink className="font-medium underline underline-offset-2" href={SEENE_BRAND.maintainerProfile}>{SEENE_BRAND.maintainer}</ExternalLink>{" "}
              under{" "}
              <ExternalLink className="font-medium underline underline-offset-2" href={SEENE_BRAND.organization}>{SEENE_BRAND.creator}</ExternalLink>.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--seene-text-muted)]">
              Released under the {SEENE_BRAND.license} license.
            </p>
          </div>
        </div>
      </FrameSection>

      <FrameSection label="Footer" edge="top">
        <footer className="flex flex-col gap-6 py-10 text-sm text-[var(--seene-text-muted)] sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm space-y-2">
            <p className="text-base font-semibold tracking-tight text-[var(--seene-text)]">{SEENE_BRAND.name}</p>
            <p>{SEENE_BRAND.tagline}</p>
            <p className="text-xs">
              Built and maintained by{" "}
              <ExternalLink className="underline underline-offset-2" href={SEENE_BRAND.maintainerProfile}>{SEENE_BRAND.maintainer}</ExternalLink>{" · "}
              <ExternalLink className="underline underline-offset-2" href={SEENE_BRAND.organization}>{SEENE_BRAND.creator}</ExternalLink>
            </p>
          </div>
          <nav aria-label="Footer" className="grid gap-2 sm:grid-cols-2 sm:gap-x-10">
            <ExternalLink className="hover:underline" href={SEENE_BRAND.repository}>GitHub</ExternalLink>
            <ExternalLink className="hover:underline" href={SEENE_BRAND.npm}>npm</ExternalLink>
            <ExternalLink className="hover:underline" href={SEENE_BRAND.docs}>Documentation</ExternalLink>
            <ExternalLink className="hover:underline" href={SEENE_BRAND.examples}>Examples</ExternalLink>
            <ExternalLink className="hover:underline" href={SEENE_BRAND.issues}>Issues</ExternalLink>
            <ExternalLink className="hover:underline" href={`${SEENE_BRAND.repository}/blob/main/LICENSE`}>License</ExternalLink>
          </nav>
        </footer>
      </FrameSection>
    </>
  );
}