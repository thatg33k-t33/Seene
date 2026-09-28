import { AuthView } from "./AuthView";
import { ProjectsView } from "./ProjectsView";
import { SettingsView } from "./SettingsView";
import { StudioView } from "./StudioView";
import { PresentationView } from "./PresentationView";
import { PROJECTS_ROUTE } from "./api";
import { useHashRoute } from "./data";
import { SiteHeader, useSiteShortcuts } from "./site";
import { useState } from "react";

export function Platform() {
  const route = useHashRoute();
  const [paletteOpen, setPaletteOpen] = useState(false);
  useSiteShortcuts();
  return (
    <div className="min-h-screen bg-[var(--seene-bg)] text-[var(--seene-text)]">
      <SiteHeader onPalette={() => setPaletteOpen(true)} />
      <main>
        {route.view === "login" && <AuthView mode="login" />}
        {route.view === "signup" && <AuthView mode="signup" />}
        {route.view === "projects" && <ProjectsView />}
        {route.view === "studio" && <StudioView project={route.project} />}
        {route.view === "settings" && <SettingsView project={route.project} />}
        {route.view === "present" && <PresentationView project={route.project} scene={route.scene} />}
      </main>
      {paletteOpen && (
        <div role="dialog" aria-modal="true" aria-label="Command menu" className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 p-4 pt-24" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-md rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-2 shadow-xl" onClick={event => event.stopPropagation()}>
            <input autoFocus className="h-9 w-full rounded-sm border border-[var(--seene-border)] px-3 text-sm" placeholder="Type a command…" aria-label="Command menu" onKeyDown={event => { if (event.key === "Escape") setPaletteOpen(false); }} />
            <div className="mt-2 grid gap-1">
              <a className="seene-nav-item" href={PROJECTS_ROUTE} onClick={() => setPaletteOpen(false)}>Go to projects</a>
              <button type="button" className="seene-nav-item" onClick={() => { void navigator.clipboard?.writeText("npm i -g @thatg33k/seene"); setPaletteOpen(false); }}>Copy install command</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
