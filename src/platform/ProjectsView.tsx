import { useState, type FormEvent } from "react";
import { platformApi, settingsHref, studioHref } from "./api";
import { useResource } from "./data";
import { Command, Notice, Panel, StatusPill, buttonPrimary, buttonQuiet, fieldClass } from "./ui";

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
    <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
      <section className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1a1a1f] px-3.5 py-1 text-xs font-mono text-[#a29bfe]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a29bfe] animate-pulse" />
          Seene by THATG33K
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#f1f1f4] sm:text-5xl">
          Present your React interfaces as cinematic scenes.
        </h1>
        <p className="max-w-3xl text-base text-[#85858e]">
          Connect Seene to your existing React or Next.js application to compose 3D spatial scenes,
          depth of field, camera perspective, and motion without altering your UI logic.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-[#f1f1f4]">Getting Started</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {WORKFLOW_STEPS.map(item => (
            <div key={item.step} className="flex flex-col justify-between rounded-xl border border-[#222228] bg-[#141418] p-4 space-y-3">
              <div className="space-y-1">
                <span className="font-mono text-xs font-semibold text-[#a29bfe]">{item.step}</span>
                <h3 className="text-sm font-medium text-[#f1f1f4]">{item.title}</h3>
                <p className="text-xs text-[#85858e] leading-relaxed">{item.description}</p>
              </div>
              {item.command && (
                <div className="rounded border border-[#303038] bg-[#19191e] px-2.5 py-1.5 font-mono text-[11px] text-[#f1f1f4] truncate">
                  <span className="text-[#66666e]">$ </span>{item.command}
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
          <button
            type="submit"
            className={`${buttonPrimary} shrink-0 gap-1.5`}
            disabled={busy || !target.trim()}
            aria-keyshortcuts="r"
          >
            {busy ? (
              <>
                <span className="seene-spinner" aria-hidden="true" />
                <span>Registering…</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M7 2v10M2 7h10" strokeLinecap="round" />
                </svg>
                <span>Register project</span>
                <kbd aria-hidden="true" className="seene-kbd seene-kbd-on-primary">R</kbd>
              </>
            )}
          </button>
        </form>
        {error && <div className="mt-3"><Notice>{error}</Notice></div>}
      </Panel>

      {projects.error && <Notice>{projects.error}</Notice>}
      {projects.loading && !projects.data && <p className="text-sm text-[#85858e]">Loading registered projects…</p>}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-[#f1f1f4]">Your Projects</h2>
          <span className="font-mono text-xs text-[#85858e]">{list.length} registered</span>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2b2b32] bg-[#141418]/50 p-8 text-center space-y-2">
            <p className="text-sm font-medium text-[#f1f1f4]">No projects registered yet</p>
            <p className="text-xs text-[#85858e]">Run <Command>pnpm exec seene init</Command> in your React project, then enter its path above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map(project => (
              <article key={project.path} data-project-path={project.path} className="flex flex-col justify-between gap-4 rounded-2xl border border-[#222228] bg-[#16161a] p-6 hover:border-[#33333c] transition-colors">
                <div className="space-y-3">
                  <header className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="truncate text-lg font-medium text-[#f1f1f4]">{project.name}</h3>
                      <p className="truncate font-mono text-xs text-[#85858e]" title={project.path}>{project.path}</p>
                    </div>
                    <StatusPill ok={project.connected} label={project.connected ? "Connected" : "Not connected"} />
                  </header>
                  <p className="text-xs text-[#85858e]">
                    {project.sceneCount === 1 ? "1 scene" : `${project.sceneCount} scenes`}
                    {project.adapter ? ` · ${project.adapter}` : ""}
                    {project.packageManager ? ` · ${project.packageManager}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#222228]">
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
                  <Notice tone="info">Run <Command>pnpm exec seene init</Command> in this project folder, then refresh.</Notice>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
