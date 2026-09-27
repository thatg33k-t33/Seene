import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProjectPreview } from "@thatg33k/seene/preview";
import App from "./App";

const sceneModules = import.meta.glob("./seene/scenes/*.{scene.json,tsx}");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectPreview projectId="studio-fixture" enabled active sceneModules={sceneModules}>
      <App />
    </ProjectPreview>
  </StrictMode>,
);
