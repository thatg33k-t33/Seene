import { useState, type FormEvent } from "react";
import { platformApi, settingsHref, studioHref } from "./api";
import { useResource } from "./data";
import { Command, Notice, Panel, StatusPill, buttonPrimary, buttonQuiet, fieldClass } from "./ui";
import { FrameSection, Kbd, PlusIcon, SeeneButton } from "./site";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Connect your app",
    description: "Run your development server and initialize Seene integration.",
    command: "pnpm exec seene init",
  },
  {
    step: "02",
    title: "Choose what to present",
    description: "Select an Application, Page, Section, or Component target.",
  },
  {
    step: "03",
    title: "Create a scene",
    description: "Establish a new cinematic scene recipe in your project.",
  },
  {
    step: "04",
    title: "Compose the scene",
    description: "Adjust camera perspective, rotation, focus distance, and blur.",
  },
  {
    step: "05",
    title: "Preview live motion",
    description: "Animate timeline playback over your real running application.",
  },
  {
    step: "06",
    title: "Save & present",
    description: "Apply cinematic presets and share or export finished presentations.",
  },
];

export function ProjectsView() {
  const projects = useResource("projects", () => platformApi.projects());
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState("");

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await platformApi.addProject(target.trim());
      setTarget("");
      projects.reload();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The project could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (path: string) => {
    setError("");
    setConfirmRemove("");
    try {
      await platformApi.removeProject(path);
      projects.reload();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The project could not be removed.");
    }
  };

  const list = projects.data?.projects ?? [];

  return (
    <>
      <FrameSection label="Seene introduction" edge="bottom" rails={[{ kind: "solid", flex: 2 }, { kind: "dashed", flex: 3 }, { kind: "solid", flex: 4 }]}>
        <div className="relative py-16 text-center sm:py-20">
          <button type="button" className="seene-hero-drop absolute left-1/2 top-0 -translate-x-1/2 rounded-b border border-t-0 border-[var(--seene-border)] bg-gradient-to-b from-white to-blue-50 px-4 py-1.5 text-xs" style={{ borderColor: "rgb(147 197 253 / 0.2)" }} onClick={() => document.getElementById("seene-preview")?.scrollIntoView({ behavior: "smooth" })}>
            Watch demo
          </button>
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--seene-border)] bg-[var(--seene-surface)] px-3.5 py-1 font-mono text-xs text-[var(--seene-text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--seene-accent)]" aria-hidden="true" />
            Seene by THATG33K
          </p>
          <h1 className="seene-hero-rise mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Present your React interfaces as cinematic scenes.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm tracking-tight text-[var(--seene-text-muted)]">
            Connect Seene to your existing React or Next.js application for spatial scenes, depth of field and motion.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a className="seene-btn seene-btn-primary seene-btn-cta" href="#install">Install <Kbd onPrimary>I</Kbd></a>
            <a className="seene-btn seene-btn-secondary seene-btn-cta" href="#install">View docs</a>
          </div>
          <div id="seene-preview" className="seene-hero-rise mx-auto mt-10 max-w-4xl overflow-clip rounded-md shadow-xl" style={{ boxShadow: "0 24px 64px rgb(100 116 139 / 0.2)", border: "1px solid var(--seene-border)", aspectRatio: "16 / 11" }}>
            <div className="flex items-center gap-1.5 border-b border-[var(--seene-border)] bg-[var(--seene-surface-2)] px-4 py-2.5" aria-hidden="true">
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#e5e7eb" }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "#e5e7eb" }} />
              <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--seene-accent)" }} />
            </div>
            <div className="grid gap-3 bg-[var(--seene-surface)] p-5 text-left sm:grid-cols-[180px_minmax(0,1fr)]">
              <div className="space-y-2">
                {["Overview", "Revenue", "Export"].map(item => (
                  <div key={item} className="rounded-sm border border-[var(--seene-border)] px-3 py-2 text-xs">{item}</div>
                ))}
              </div>
              <div className="rounded-sm border border-[var(--seene-border)] bg-[var(--seene-surface-2)] p-4">
                <div className="h-3 w-2/3 rounded-sm bg-[var(--seene-offgray-200)]" />
                <div className="mt-2 h-3 w-1/2 rounded-sm bg-[var(--seene-offgray-100)]" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map(index => (
                    <div key={index} className="h-16 rounded-sm border border-[var(--seene-border)] bg-[var(--seene-surface)]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FrameSection>
      <FrameSection label="Workflow" edge="both" rails={[{ kind: "dashed", flex: 2 }, { kind: "solid", flex: 4 }, { kind: "dashed", flex: 1 }]}>
      <div className="space-y-12 py-12">

      <section className="space-y-4">
        <h2 className="seene-h2 text-3xl">Getting started</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {WORKFLOW_STEPS.map(item => (
            <div key={item.step} className="flex flex-col justify-between rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-4 space-y-3">
              <div className="space-y-1">
                <span className="font-mono text-xs font-semibold text-[var(--seene-accent)]">{item.step}</span>
                <h3 className="text-sm font-medium">{item.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--seene-text-muted)]">{item.description}</p>
              </div>
              {item.command && (
                <div className="truncate rounded-sm border border-[var(--seene-border)] bg-[var(--seene-surface-2)] px-2.5 py-1.5 font-mono text-[11px]">
                  <span className="text-[var(--seene-text-muted)]">$ </span>{item.command}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Panel title="Register Project" description="Enter the folder path of your React application on this machine.">
        <form className="flex flex-col gap-3 sm:flex-row sm:items-start" aria-label="Register project" onSubmit={add}>
          <label className="sr-only" htmlFor="project-path">Project folder path</label>
          <input
            id="project-path"
            className={fieldClass}
            value={target}
            autoComplete="off"
            spellCheck={false}
            placeholder="/Users/you/projects/my-app"
            onChange={event => setTarget(event.target.value)}
          />
           <SeeneButton variant="primary" size="cta" kbd={<Kbd onPrimary>R</Kbd>} loading={busy} disabled={!target.trim()} className="shrink-0 gap-1.5" type="submit" aria-keyshortcuts="r">
              <PlusIcon /> Register project
            </SeeneButton>
        </form>
        {error && <div className="mt-3"><Notice>{error}</Notice></div>}
      </Panel>

      {projects.error && <Notice>{projects.error}</Notice>}
      {projects.loading && !projects.data && <p className="text-sm text-[var(--seene-text-muted)]">Loading registered projects…</p>}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium tracking-tight">Your Projects</h2>
          <span className="font-mono text-xs text-[var(--seene-text-muted)]">{list.length} registered</span>
        </div>

        {list.length === 0 ? (
          <div className="space-y-2 rounded-md border border-dashed border-[var(--seene-border)] bg-[var(--seene-surface)] p-8 text-center">
            <p className="text-sm font-medium">No projects registered yet</p>
            <p className="text-xs text-[var(--seene-text-muted)]">Run <Command>npm i -g @thatg33k/seene</Command> then <Command>seene init</Command> in your React project.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map(project => (
              <article key={project.path} data-project-path={project.path} className="flex flex-col justify-between gap-4 rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-6">
                <div className="space-y-3">
                  <header className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="truncate text-lg font-medium">{project.name}</h3>
                      <p className="truncate font-mono text-xs text-[var(--seene-text-muted)]" title={project.path}>{project.path}</p>
                    </div>
                    <StatusPill ok={project.connected} label={project.connected ? "Connected" : "Not connected"} />
                  </header>
                  <p className="text-xs text-[var(--seene-text-muted)]">
                    {project.sceneCount === 1 ? "1 scene" : `${project.sceneCount} scenes`}
                    {project.adapter ? ` · ${project.adapter}` : ""}
                    {project.packageManager ? ` · ${project.packageManager}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--seene-border)]">
                  <a className={buttonPrimary} href={studioHref(project.path)}>Open studio</a>
                  <a className={buttonQuiet} href={settingsHref(project.path)}>Settings</a>
                  {confirmRemove === project.path ? (
                    <>
                      <button type="button" className={buttonQuiet} onClick={() => remove(project.path)}>Confirm remove</button>
                      <button type="button" className={buttonQuiet} onClick={() => setConfirmRemove("")}>Cancel</button>
                    </>
                  ) : (
                    <button type="button" className={buttonQuiet} onClick={() => setConfirmRemove(project.path)}>Remove</button>
                  )}
                </div>

                {!project.connected && (
                  <Notice tone="info">Run <Command>seene init</Command> in this project folder, then refresh.</Notice>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      </div>
      </FrameSection>
      <FrameSection label="Install" edge="both" texture rails={[{ kind: "solid", flex: 4 }, { kind: "dashed", flex: 2 }, { kind: "solid", flex: 2 }]}>
        <div id="install" className="py-14 text-center">
          <h2 className="seene-h2 text-3xl">Install Seene in one command</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--seene-text-muted)]">Published as <span className="font-mono">@thatg33k/seene</span>. No cloning or local linking.</p>
          <div className="mx-auto mt-6 flex max-w-xl flex-col gap-2 rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-3 text-left sm:flex-row sm:items-center">
            <code className="flex-1 truncate font-mono text-sm">npm i -g @thatg33k/seene && seene init</code>
            <button type="button" className="seene-btn seene-btn-secondary seene-btn-nav shrink-0" onClick={() => { void navigator.clipboard?.writeText("npm i -g @thatg33k/seene && seene init"); }}>
              Copy <Kbd>C</Kbd>
            </button>
          </div>
        </div>
      </FrameSection>
      <FrameSection label="Final call to action" edge="both" texture rails={[{ kind: "dashed", flex: 3 }, { kind: "solid", flex: 3 }, { kind: "dashed", flex: 3 }]}>
        <div className="mx-auto max-w-xl py-14 text-center" style={{ background: "linear-gradient(to bottom, rgb(219 234 254 / 0.1), rgb(250 247 239 / 0.4), transparent)" }}>
          <div className="mx-auto flex items-center justify-center" style={{ width: 160, height: 160, borderRadius: 40, border: "8px solid rgb(255 255 255 / 0.5)", boxShadow: "0 24px 64px rgb(15 23 42 / 0.18)", background: "radial-gradient(circle at 30% 20%, rgb(100 116 139 / 0.08), rgb(148 163 184 / 0.02), rgb(255 255 255 / 0.08))" }}>
            <span style={{ width: 96, height: 96, borderRadius: 32, background: "#05070d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/logo-seene.png" alt="Seene" width={80} height={80} style={{ width: 80, height: "auto" }} />
            </span>
          </div>
          <h2 className="seene-h2 mt-6 text-3xl">Start your first cinematic scene</h2>
          <p className="mt-2 text-sm text-[var(--seene-text-muted)]">Keep your components, providers and styles. Seene adds the camera.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a className="seene-btn seene-btn-primary seene-btn-cta" href="#install">Install <Kbd onPrimary>I</Kbd></a>
            <a className="seene-btn seene-btn-secondary seene-btn-cta" href="https://github.com/thatg33k-t33/Seene">View source</a>
          </div>
        </div>
      </FrameSection>
      <FrameSection label="Footer" edge="top">
        <footer className="flex flex-col gap-4 py-8 text-xs text-[var(--seene-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>Seene by THATG33K · Cinematic scenes for real React interfaces</span>
          <span className="font-mono">MIT · seene v0.1.2</span>
        </footer>
      </FrameSection>
    </>
  );
}
