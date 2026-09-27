import { useState, type FormEvent } from "react";
import { previewUrl, type PlatformStatus } from "../core/platform";
import { platformApi, presentHref, settingsHref, PROJECTS_ROUTE } from "./api";
import { useResource } from "./data";
import { CreateSceneDialog } from "./CreateSceneDialog";
import { Command, Notice, Panel, StatusPill, buttonPrimary, buttonQuiet, fieldClass } from "./ui";

export function StudioView({ project }: { project: string }) {
  const catalog = useResource(`catalog:${project}`, () => platformApi.catalog(project));
  const [selected, setSelected] = useState("");
  const [origin, setOrigin] = useState("http://127.0.0.1:5173");
  const [status, setStatus] = useState<PlatformStatus>();
  const [statusError, setStatusError] = useState("");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [message, setMessage] = useState("");

  const data = catalog.data;
  const scenes = data?.catalog.scenes ?? [];
  const activeScene = scenes.find(scene => scene.id === selected);
  const studioUrl = data ? previewUrl(data.project.adapter, origin, activeScene?.id) : "";

  const connect = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setStatusError("");
    try { setStatus(await platformApi.status(project, origin.trim())); }
    catch (failure) { setStatusError(failure instanceof Error ? failure.message : "The preview could not be checked."); }
    finally { setChecking(false); }
  };

  const removeScene = async (id: string) => {
    setConfirmDelete("");
    setMessage("");
    try {
      await platformApi.removeScene(project, id);
      if (selected === id) setSelected("");
      catalog.reload();
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : "The scene could not be removed."); }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <header className="space-y-3">
        <a className="font-mono text-xs text-[#85858e] hover:text-[#f1f1f4]" href={PROJECTS_ROUTE}>← Projects</a>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-medium tracking-tight text-[#f1f1f4]">{data?.project.name ?? "Studio"}</h1>
            <p className="truncate font-mono text-xs text-[#85858e]">{project}</p>
          </div>
          <div className="flex items-center gap-2">
            {data && <StatusPill ok={data.project.connected} label={data.project.connected ? "Connected" : "Not connected"} />}
            <a className={buttonQuiet} href={settingsHref(project)}>Settings</a>
            {scenes.length > 0 && <a className={buttonPrimary} href={presentHref(project, activeScene?.id ?? scenes[0].id)}>Present</a>}
          </div>
        </div>
      </header>

      {catalog.error && <Notice>{catalog.error}</Notice>}
      {catalog.loading && !data && <p className="text-sm text-[#85858e]">Reading this project's scenes…</p>}
      {message && <Notice>{message}</Notice>}
      {data && !data.project.connected && (
        <Notice tone="info">
          This project is not connected yet. Run <Command>pnpm exec seene init</Command> in {project}, then refresh.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel
          title="Scenes"
          description="Every scene presents real UI from this application."
          actions={<button type="button" className={buttonPrimary} onClick={() => setCreating(true)}>+ New scene</button>}
        >
          {scenes.length === 0 ? (
            <p className="text-sm text-[#85858e]">No scenes yet. Create the first one to present part of your application.</p>
          ) : (
            <ul className="space-y-3">
              {scenes.map((scene, index) => (
                <li
                  key={scene.id}
                  data-scene-id={scene.id}
                  className={`rounded-xl border px-4 py-3 ${selected === scene.id ? "border-[#55555d] bg-[#19191e]" : "border-[#222228] bg-[#141418]"}`}
                >
                  <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setSelected(scene.id)}>
                    <span className="font-mono text-xs text-[#85858e]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-medium text-[#f1f1f4]">{scene.title}</strong>
                      <span className="block truncate text-xs text-[#85858e]">{scene.description || "A scene from your application"}</span>
                    </span>
                    <span className="font-mono text-xs text-[#85858e]">{Math.round(scene.durationMs / 1000)}s</span>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a className={buttonQuiet} href={previewUrl(data?.project.adapter, origin, scene.id)} target="_blank" rel="noreferrer">Open in app studio</a>
                    <a className={buttonQuiet} href={presentHref(project, scene.id)}>Present</a>
                    {confirmDelete === scene.id ? (
                      <>
                        <button type="button" className={buttonQuiet} onClick={() => removeScene(scene.id)}>Confirm delete</button>
                        <button type="button" className={buttonQuiet} onClick={() => setConfirmDelete("")}>Cancel</button>
                      </>
                    ) : (
                      <button type="button" className={buttonQuiet} onClick={() => setConfirmDelete(scene.id)}>Delete</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data && data.catalog.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              {data.catalog.issues.map(issue => <Notice key={`${issue.path}:${issue.message}`}>{`${issue.path}: ${issue.message}`}</Notice>)}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Preview"
            description="Your application renders here from its own development server, with Seene's camera, focus and timeline active."
          >
            <form className="flex flex-col gap-3 sm:flex-row" aria-label="Connect preview" onSubmit={connect}>
              <label className="sr-only" htmlFor="preview-origin">Development server</label>
              <input id="preview-origin" className={fieldClass} value={origin} onChange={event => setOrigin(event.target.value)} placeholder="http://127.0.0.1:5173" />
              <button type="submit" className={buttonPrimary} disabled={checking}>{checking ? "Checking…" : "Connect"}</button>
            </form>
            {statusError && <div className="mt-3"><Notice>{statusError}</Notice></div>}
            {status && (
              <div className="mt-3 space-y-3">
                <Notice tone={status.reachable ? "info" : "error"}>{status.message}</Notice>
                {status.reachable && <iframe key={studioUrl} title="Application preview" className="h-[520px] w-full rounded-xl border border-[#222228] bg-black" src={studioUrl} />}
              </div>
            )}
            <p className="mt-4 text-xs text-[#55555d]">
              Camera, focus, motion and the timeline are edited live inside your application's own studio. Seene stores each scene as a recipe next to its component.
            </p>
          </Panel>
        </div>
      </div>

      {creating && (
        <CreateSceneDialog
          project={project}
          onClose={() => setCreating(false)}
          onCreated={id => { setCreating(false); setSelected(id); catalog.reload(); }}
        />
      )}
    </div>
  );
}

