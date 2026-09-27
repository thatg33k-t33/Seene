import { useState, type FormEvent } from "react";
import { platformApi, settingsHref, studioHref } from "./api";
import { useResource } from "./data";
import { Command, Notice, Panel, StatusPill, buttonPrimary, buttonQuiet, fieldClass } from "./ui";

/** SOURCE OF TRUTH: ProjectsView.
 * WHAT: list the React applications this machine has connected, add another folder, and forget one.
 * WHY: a project is an external application; the platform owns only its own registry.
 * WHERE: app/main.tsx renders it for the platform's default route.
 */

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
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-medium tracking-tight text-[#f1f1f4]">Projects</h1>
        <p className="max-w-3xl text-sm text-[#85858e]">
          Seene connects to React applications that already exist. A project points at one of those applications on this machine;
          Seene reads its scenes and writes new ones there, and never copies or replaces its source.
        </p>
        {projects.data && <p className="font-mono text-xs text-[#55555d]">{`Seene home: ${projects.data.home}`}</p>}
      </header>

      <Panel title="Add project" description="Point Seene at your application's folder. Run pnpm exec seene init inside it first so the connection exists.">
        <form className="flex flex-col gap-3 sm:flex-row" aria-label="Add project" onSubmit={add}>
          <label className="sr-only" htmlFor="project-path">Project folder</label>
          <input id="project-path" className={fieldClass} value={target} placeholder="/Users/you/projects/maya" onChange={event => setTarget(event.target.value)} />
          <button type="submit" className={buttonPrimary} disabled={busy || !target.trim()}>{busy ? "Adding…" : "Add project"}</button>
        </form>
        {error && <div className="mt-3"><Notice>{error}</Notice></div>}
      </Panel>

      {projects.error && <Notice>{projects.error}</Notice>}
      {projects.loading && !projects.data && <p className="text-sm text-[#85858e]">Loading your projects…</p>}

      {projects.data && list.length === 0 && (
        <Panel title="Connect your first React application" description="Your application stays where it is. Seene adds the integration to it.">
          <ol className="space-y-3 text-sm text-[#85858e]">
            <li>1. In your application folder, run <Command>pnpm exec seene init</Command>.</li>
            <li>2. Start that application with its own development script.</li>
            <li>3. Add its folder above, then compose scenes from its real UI.</li>
          </ol>
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map(project => (
          <article key={project.path} data-project-path={project.path} className="flex flex-col gap-4 rounded-2xl border border-[#222228] bg-[#16161a] p-6">
            <header className="space-y-1">
              <h2 className="truncate text-lg font-medium text-[#f1f1f4]">{project.name}</h2>
              <p className="truncate font-mono text-xs text-[#85858e]" title={project.path}>{project.path}</p>
            </header>
            <StatusPill ok={project.connected} label={project.connected ? "Connected" : "Not connected"} />
            <p className="text-sm text-[#85858e]">
              {project.sceneCount === 1 ? "1 scene" : `${project.sceneCount} scenes`}
              {project.packageManager ? ` · ${project.packageManager}` : ""}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2">
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
              <Notice tone="info">Run <Command>pnpm exec seene init</Command> in this project, then refresh.</Notice>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
