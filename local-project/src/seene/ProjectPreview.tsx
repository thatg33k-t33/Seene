import { ProjectPreview } from "@webprodigies/flute/preview";
import type { ComponentProps } from "react";

const sceneModules = import.meta.env.DEV ? import.meta.glob("/src/seene/scenes/*.{scene.json,tsx}") : undefined;

export function FluteProjectPreview(props: Omit<ComponentProps<typeof ProjectPreview>, "sceneModules" | "hot">) {
  if (!import.meta.env.DEV) return props.children;
  return <ProjectPreview {...props} sceneModules={sceneModules} hot={import.meta.hot} />;
}
