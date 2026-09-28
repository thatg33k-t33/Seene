import { useState } from "react";
import { PROJECTS_ROUTE, platformApi } from "./api";
import { useResource } from "./data";
import { Command, Notice, Panel, StatusPill, buttonQuiet } from "./ui";

const connectionLabels: Record<string, string> = {
  "next-app": "Next.js App Router",
  "next-pages": "Next.js Pages Router",
  react: "React renderer wrapper",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[var(--seene-border)] py-3 last:border-b-0 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-[var(--seene-text-muted)]">{label}</dt>
      <dd className="break-words font-mono text-xs text-[var(--seene-text)]">{value}</dd>
    </div>
  );
}

export function SettingsView({ project }: { project: string }) {
  const settings = useResource(`settings:${project}`, async () => {
    const result = await platformApi.projects();
    return { home: result.home, project: result.projects.find(item => item.path === project) };
  });
  const [error, setError] = useState("");
  const [confirmForget, setConfirmForget] = useState(false);

  const forget = async () => {
    setError("");
    try {
      await platformApi.removeProject(project);
      window.location.hash = PROJECTS_ROUTE;
    } catch (failure) { setError(failure instanceof Error ? failure.message : "The project could not be forgotten."); }
  };

  const found = settings.data?.project;
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
      <header className="space-y-3">
        <a className="font-mono text-xs text-[var(--seene-text-muted)] hover:text-[var(--seene-text)]" href={PROJECTS_ROUTE}>← Projects</a>
        <h1 className="text-3xl font-medium tracking-tight text-[var(--seene-text)]">Settings</h1>
        {found && <StatusPill ok={found.connected} label={found.connected ? "Connected" : "Not connected"} />}
      </header>

      {settings.error && <Notice>{settings.error}</Notice>}
      {error && <Notice>{error}</Notice>}
      {settings.loading && !settings.data && <p className="text-sm text-[var(--seene-text-muted)]">Reading this project…</p>}
      {settings.data && !found && <Notice>This project is not registered with Seene any more. Return to Projects and add it again.</Notice>}

      {found && settings.data && (
        <>
          <Panel title="Project" description="A project is a link to an application that lives outside Seene.">
            <dl>
              <Row label="Name" value={found.name} />
              <Row label="Folder" value={found.path} />
              <Row label="Package manager" value={found.packageManager ?? "unknown"} />
              <Row label="Connected entry" value={found.entry ?? "not connected"} />
              <Row label="Host connection" value={found.adapter ? connectionLabels[found.adapter] ?? found.adapter : "not connected"} />
              <Row label="Scene directory" value={found.sceneDirectory} />
              <Row label="Scenes" value={String(found.sceneCount)} />
              <Row label="Seene home" value={settings.data.home} />
            </dl>
          </Panel>

          <Panel title="Keep this connection healthy" description="Run these in the application's own folder with its package manager.">
            <ul className="space-y-3 text-sm text-[var(--seene-text-muted)]">
              <li>Refresh the scene catalog after adding files: <Command>pnpm exec seene sync</Command></li>
              <li>Validate the recorded connection: <Command>pnpm exec seene validate</Command></li>
              <li>Read the catalog as JSON: <Command>pnpm exec seene scenes --json</Command></li>
            </ul>
          </Panel>

          {found.issues.length > 0 && (
            <Panel title="Diagnostics" description="Seene reports what it can and cannot read in this project.">
              <div className="space-y-2">
                {found.issues.map(issue => <Notice key={`${issue.path}:${issue.message}`}>{`${issue.path}: ${issue.message}`}</Notice>)}
              </div>
            </Panel>
          )}

          <Panel title="Forget project" description="Removes the project from this Seene installation. Your application and its scenes stay untouched.">
            {confirmForget ? (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={buttonQuiet} onClick={forget}>Confirm forget</button>
                <button type="button" className={buttonQuiet} onClick={() => setConfirmForget(false)}>Cancel</button>
              </div>
            ) : (
              <button type="button" className={buttonQuiet} onClick={() => setConfirmForget(true)}>Forget project</button>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
