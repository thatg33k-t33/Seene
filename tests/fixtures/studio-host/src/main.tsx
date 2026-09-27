import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProjectPreview } from "@thatg33k/seene/preview";
import { App } from "./App";

// A minimal external consumer: the application keeps its own root and providers, and Seene only wraps it.
// `active` selects the studio route for this fixture page instead of a query parameter.
const sceneModules = import.meta.glob("./seene/scenes/*.{scene.json,tsx}");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectPreview projectId="studio-fixture" enabled active sceneModules={sceneModules}>
      <App />
    </ProjectPreview>
  </StrictMode>,
);
