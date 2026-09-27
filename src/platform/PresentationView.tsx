import { useState, type FormEvent } from "react";
import { previewUrl, type PlatformStatus } from "../core/platform";
import { platformApi, presentHref, studioHref } from "./api";
import { useResource } from "./data";
import { Notice, buttonPrimary, buttonQuiet, fieldClass } from "./ui";

export function PresentationView({ project, scene }: { project: string; scene: string }) {
  const catalog = useResource(`catalog:${project}`, () => platformApi.catalog(project));
  const [origin, setOrigin] = useState("http://127.0.0.1:5173");
  const [status, setStatus] = useState<PlatformStatus>();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const scenes = catalog.data?.catalog.scenes ?? [];
  const index = scenes.findIndex(item => item.id === scene);
  const current = index >= 0 ? scenes[index] : undefined;

  const connect = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    setError("");
    try { setStatus(await platformApi.status(project, origin.trim())); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "The preview could not be checked."); }
    finally { setChecking(false); }
  };

  if (catalog.error) return <div className="px-6 py-10"><Notice>{catalog.error}</Notice></div>;
  if (catalog.loading && !catalog.data) return <p className="px-6 py-10 text-sm text-[#85858e]">Preparing the experience…</p>;
  if (!current) {
    return (
      <div className="space-y-4 px-6 py-10">
        <Notice>This scene is not part of this project any more.</Notice>
        <a className={buttonQuiet} href={studioHref(project)}>Back to the studio</a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222228] px-6 py-3">
        <a className="font-mono text-xs text-[#85858e] hover:text-[#f1f1f4]" href={studioHref(project)}>Exit presentation</a>
        <p className="text-sm font-medium text-[#f1f1f4]">
          {current.title}
          <span className="ml-3 font-mono text-xs text-[#85858e]">{`${index + 1} / ${scenes.length}`}</span>
        </p>
        <div className="flex items-center gap-2">
          {index > 0 && <a className={buttonQuiet} href={presentHref(project, scenes[index - 1].id)}>Previous</a>}
          {index < scenes.length - 1 && <a className={buttonQuiet} href={presentHref(project, scenes[index + 1].id)}>Next</a>}
        </div>
      </header>

      {!status?.reachable && (
        <div className="space-y-3 px-6 py-5">
          <form className="flex flex-col gap-3 sm:flex-row" aria-label="Connect presentation" onSubmit={connect}>
            <label className="sr-only" htmlFor="presentation-origin">Development server</label>
            <input id="presentation-origin" className={fieldClass} value={origin} onChange={event => setOrigin(event.target.value)} placeholder="http://127.0.0.1:5173" />
            <button type="submit" className={buttonPrimary} disabled={checking}>{checking ? "Checking…" : "Start presentation"}</button>
          </form>
          {error && <Notice>{error}</Notice>}
          {status && <Notice>{status.message}</Notice>}
        </div>
      )}

      {status?.reachable && (
        <iframe
          key={previewUrl(catalog.data?.project.adapter, origin, current.id)}
          title="Experience preview"
          className="min-h-[520px] flex-1 bg-black"
          src={previewUrl(catalog.data?.project.adapter, origin, current.id)}
        />
      )}
    </div>
  );
}
