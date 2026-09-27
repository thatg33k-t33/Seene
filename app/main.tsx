import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { SEENE_BRAND } from "../src/core";
import { Platform } from "../src/platform/Platform";

document.title = SEENE_BRAND.title;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Platform />
  </StrictMode>,
);
