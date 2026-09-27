import { SeeneProjectPreview } from "./seene/ProjectPreview";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@thatg33k/seene/style.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <SeeneProjectPreview projectId="f3ccd191-e177-4572-a293-86a4804daeb8" enabled={import.meta.env.DEV}>{<StrictMode>
    <App />
  </StrictMode>}</SeeneProjectPreview>
);
