import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { SEENE_BRAND } from "../src/core";
import { SceneLibrary } from "../src/preview";
document.title = SEENE_BRAND.title;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SceneLibrary hot={import.meta.hot} />
  </StrictMode>,
);
