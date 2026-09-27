import { useMemo, useSyncExternalStore, useState, type ReactNode } from "react";
import { Surface } from "../react";
import type { PreviewDefinitionInput } from "../core";
import { ScenePreview } from "./ScenePreview";
import {SceneModuleLibrary,type SceneModules} from "./modules";
export {SceneLibrary} from "./SceneLibrary";
export type {SceneLibraryProps} from "./SceneLibrary";
export {SceneModuleLibrary} from "./modules";
export type {SceneModules} from "./modules";
import type { PreviewHot } from "./connection";
export { ScenePreview } from "./ScenePreview";
export type { ScenePreviewProps } from "./ScenePreview";
export type { PreviewHot } from "./connection";

export type ProjectPreviewProps = {children?: ReactNode; projectId: string; enabled: boolean; active?: boolean; hot?: PreviewHot; sceneModules?: SceneModules};
const initialDefinition: PreviewDefinitionInput = {
  scene: {version: 3, camera: {perspective:1800,rotateX:4,rotateY:-7},focus:{distance:1800,fStop:8,maxBlur:6},nodes:[{id:"seene-application"}]},
};
export function ProjectPreview({children, projectId, enabled, active, hot, sceneModules}: ProjectPreviewProps): ReactNode {
  const [locationAtMount] = useState(() => typeof window === "undefined" ? "" : window.location.href);
  const location = useSyncExternalStore(() => () => {}, () => locationAtMount, () => "");
  const entry = useMemo(() => {
    if (!location) return null;
    const url = new URL(location);
    const requested = url.searchParams.get("seene-preview") === "1" || url.searchParams.get("flute-preview") === "1" || url.searchParams.has("seene-scene") || url.searchParams.has("flute-scene");
    url.searchParams.delete("seene-preview");
    url.searchParams.delete("flute-preview");
    url.searchParams.delete("seene-scene");
    url.searchParams.delete("flute-scene");
    return {requested, back: url.pathname + url.search + url.hash};
  }, [location]);
  const content = useMemo(() => <Surface id="seene-application" style={{width:"100%",minHeight:980}}>{children}</Surface>, [children]);
  if (!enabled || !(active ?? entry?.requested)) return children;
  if(sceneModules) return <div data-seene-project={projectId}><SceneModuleLibrary modules={sceneModules} hot={hot} backHref={entry?.back} hostContent={children}/></div>;
  return <div data-seene-project={projectId}><ScenePreview title="Your application" definition={initialDefinition} backHref={entry?.back} hot={hot}>
    {content}
  </ScenePreview></div>;
}
