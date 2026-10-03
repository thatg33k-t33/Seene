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

const WORKFLOW = [
  { step: "01", title: "Install", body: "Run the init command in a React project. It installs the package and writes your integration.", command: SEENE_INSTALL_COMMAND },
  { step: "02", title: "Compose", body: "Select your real components and frame them with the scene inspector." },
  { step: "03", title: "Animate", body: "Set camera and focus tracks over a timeline, then preview against your running app." },
  { step: "04", title: "Export", body: "Render the scene to video once the composition is right." },
];

const OPEN_STUDIO_COMMAND = "npx seene open --url http://127.0.0.1:5173";

const QUICK_START = `import { Scene, Surface } from "@thatg33k/seene";
import "@thatg33k/seene/style.css";

export function Hero() {
  return (
    <Scene>
      <Surface id="panel" style={{ width: 1200, height: 800 }}>
        <YourDashboard />
      </Surface>
    </Scene>
  );
}`;

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
      <code className="flex-1 overflow-x-auto whitespace-nowrap px-1 font-mono text-sm">{value}</code>
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
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-[var(--seene-text-muted)]">
            One command installs the package with your own package manager, connects your app and
            writes an <code className="font-mono">SEENE.md</code> guide. Nothing is uploaded and no account is required.
          </p>
          <div className="mx-auto mt-8 max-w-3xl text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">1 · Install</h3>
            <div className="mt-2"><CommandLine value={SEENE_INSTALL_COMMAND} /></div>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">2 · Author a scene</h3>
            <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4 font-mono text-xs leading-relaxed"><code>{QUICK_START}</code></pre>

            <h3 className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--seene-text-muted)]">3 · Open the studio</h3>
            <div className="mt-2"><CommandLine value={OPEN_STUDIO_COMMAND} /></div>
          </div>
        </div>
      </FrameSection>
<FrameSection label="Workflow" edge="both" rails={[{ kind: "solid", flex: 3 }, { kind: "dashed", flex: 2 }, { kind: "solid", flex: 3 }]}>
        <div className="py-14">
          <h2 className="seene-h2 text-3xl">How it works</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map(item => (
              <article key={item.step} className="flex flex-col gap-3 rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-5">
                <div>
                  <span className="font-mono text-xs font-semibold text-[var(--seene-accent)]">{item.step}</span>
                  <h3 className="mt-1 text-sm font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--seene-text-muted)]">{item.body}</p>
                </div>
                {item.command && (
                  <div className="mt-auto truncate rounded-sm border border-[var(--seene-border)] bg-[var(--seene-surface-2)] px-2.5 py-1.5 font-mono text-[11px]">
                    <span className="text-[var(--seene-text-muted)]">$ </span>{item.command}
                  </div>
                )}
              </article>
            ))}
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