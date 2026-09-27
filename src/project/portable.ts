import type { ProjectState } from "../core/project";

export function portableIntegration(project: ProjectState, catalog: string): Record<string,string> {
  const files: Record<string,string> = {
    "src/seene/catalog.js": catalog,
    "src/seene/ProjectPreview.jsx": `"use client";
import React from "react";
import { ProjectPreview } from "@thatg33k/seene/preview";
import { sceneModules } from "./catalog";
export function SeeneProjectPreview({ children, enabled, active, ...props }) {
  if (!enabled) return children;
  return <ProjectPreview {...props} projectId=${JSON.stringify(project.projectId)} enabled={enabled} active={active} sceneModules={sceneModules}>{children}</ProjectPreview>;
}
`,
  };
  if (project.adapter === "react") return files;
  files["src/seene/Studio.jsx"] = `"use client";
import React from "react";
import dynamic from "next/dynamic";
const Preview = process.env.NODE_ENV === "development" ? dynamic(() => import("./ProjectPreview").then(m => m.SeeneProjectPreview), { ssr: false }) : () => null;
export default function SeeneStudio() {
  return <Preview enabled={process.env.NODE_ENV === "development"} active />;
}
`;
  const depth = project.entry.split("/").length - 1;
  const studio = "../".repeat(depth) + "src/seene/Studio";
  if (project.adapter === "next-app") {
    files[project.entry] = `import React from "react";
import { notFound } from "next/navigation";
import SeeneStudio from ${JSON.stringify(studio)};
export default function SeenePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <><meta name="seene-project" content=${JSON.stringify(project.projectId)} /><SeeneStudio /></>;
}
`;
  } else {
    files[project.entry] = `import React from "react";
import SeeneStudio from ${JSON.stringify(studio)};
export function getServerSideProps() {
  return process.env.NODE_ENV === "development" ? { props: {} } : { notFound: true };
}
export default function SeenePage() {
  return <><meta name="seene-project" content=${JSON.stringify(project.projectId)} /><SeeneStudio /></>;
}
`;
  }
  return files;
}

export function portableCatalog(entries: {source:string;binding:string}[]): string {
  const imports = entries.map((entry,index) => `import recipe${index} from ${JSON.stringify("./scenes/" + entry.source.split("/").pop())};`);
  const mappings = entries.flatMap((entry,index) => [
    `  ${JSON.stringify(entry.source)}: async () => ({default:recipe${index}}),`,
    `  ${JSON.stringify(entry.binding)}: () => import(${JSON.stringify("./scenes/" + entry.binding.split("/").pop()?.replace(/\.[jt]sx$/, ""))}),`,
  ]);
  return imports.join("\n") + "\nexport const sceneModules = {\n" + mappings.join("\n") + "\n};\n";
}
