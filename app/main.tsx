import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { Platform } from "../src/platform/Platform";

// The document title, description and social metadata live in index.html so crawlers
// and link unfurlers see them without running JavaScript. Do not overwrite the title here.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Platform />
  </StrictMode>,
);
