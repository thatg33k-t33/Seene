import { SEENE_BRAND } from "../core/branding";
import { ProjectsView } from "./ProjectsView";
import { SettingsView } from "./SettingsView";
import { StudioView } from "./StudioView";
import { PresentationView } from "./PresentationView";
import { PROJECTS_ROUTE } from "./api";
import { useHashRoute } from "./data";

export function Platform() {
  const route = useHashRoute();
  return (
    <div className="min-h-screen bg-[#111114] text-[#f1f1f4]">
      <header className="border-b border-[#222228] bg-[#111114]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <a className="flex items-baseline gap-3" href={PROJECTS_ROUTE}>
            <span className="text-lg font-semibold tracking-tight text-[#f1f1f4]">{SEENE_BRAND.name}</span>
            <span className="hidden text-xs text-[#55555d] sm:inline">Cinematic presentations for real React interfaces</span>
          </a>
          <a className="font-mono text-xs text-[#85858e] transition-colors hover:text-[#f1f1f4]" href={PROJECTS_ROUTE}>Projects</a>
        </div>
      </header>
      <main>
        {route.view === "projects" && <ProjectsView />}
        {route.view === "studio" && <StudioView project={route.project} />}
        {route.view === "settings" && <SettingsView project={route.project} />}
        {route.view === "present" && <PresentationView project={route.project} scene={route.scene} />}
      </main>
    </div>
  );
}
