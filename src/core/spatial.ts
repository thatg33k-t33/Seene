/** SOURCE OF TRUTH: evaluateScene, transformToCss, cameraToCss, focusForSurface, sampleFocus, focusMask, uniformFocusBlur.
 * WHAT: camera-space transforms and progressive spatial focus for every renderer consumer.
 * WHY: one mathematical definition keeps DOM preview and future output adapters consistent.
 * WHERE: React registration provides untransformed layout measurements; no DOM or transport is imported here.
 */
import {
  TransformSchema,
  validateScene,
  type Transform,
  type TransformInput,
  type SceneIssue,
  CameraSchema,
  type CameraInput,
  type SceneDefinition,
  FocusSchema,
} from "./scene";

export type Matrix = readonly number[];
export type Measurement = {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};
export type Measurements = Record<string, Measurement>;
export type EvaluatedNode = {
  id: string;
  parentId?: string;
  worldPosition: { x: number; y: number; z: number };
  width: number;
  height: number;
  blur: number;
  opacity: number;
  focus: { depth: number; distance: number; span: number };
};
export type Evaluation = {
  nodes: EvaluatedNode[];
  focusDepth: number;
  issues: SceneIssue[];
};
const rad = Math.PI / 180;
export function multiply(a: Matrix, b: Matrix): Matrix {
  const out = new Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let i = 0; i < 4; i++) sum += a[r * 4 + i] * b[i * 4 + c];
      out[r * 4 + c] = sum;
    }
  }
  return out;
}
export function matrixFor(input: TransformInput = {}): Matrix {
  const t = TransformSchema.parse(input);
  const cx = Math.cos(t.rotateX * rad), sx = Math.sin(t.rotateX * rad);
  const cy = Math.cos(t.rotateY * rad), sy = Math.sin(t.rotateY * rad);
  const cz = Math.cos(t.rotateZ * rad), sz = Math.sin(t.rotateZ * rad);
  const translate = [1, 0, 0, t.x, 0, 1, 0, t.y, 0, 0, 1, t.z, 0, 0, 0, 1];
  const rx = [1, 0, 0, 0, 0, cx, -sx, 0, 0, sx, cx, 0, 0, 0, 0, 1];
  const ry = [cy, 0, sy, 0, 0, 1, 0, 0, -sy, 0, cy, 0, 0, 0, 0, 1];
  const rz = [cz, -sz, 0, 0, sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [rx, ry, rz].reduce(multiply, translate);
}
export function transformToCss(input: TransformInput = {}): string {
  const t = TransformSchema.parse(input);
  return `translate3d(${t.x}px, ${t.y}px, ${t.z}px) rotateX(${t.rotateX}deg) rotateY(${t.rotateY}deg) rotateZ(${t.rotateZ}deg)`;
}
export function evaluateScene(
  input: unknown,
  measurements: Measurements = {},
): Evaluation {
  const parsed = validateScene(input);
  if (!parsed.success)
    return { nodes: [], focusDepth: 0, issues: parsed.issues };
  const scene = parsed.data;
  const nodeMap = new Map(scene.nodes.map((node) => [node.id, node]));
  const cache = new Map<string, Matrix>();
  const issues: SceneIssue[] = [];
  const camera = matrixFor(
    TransformSchema.parse(
      scene.camera
        ? {
            x: -scene.camera.x,
            y: -scene.camera.y,
            z: -scene.camera.z,
            rotateX: scene.camera.rotateX,
            rotateY: scene.camera.rotateY,
            rotateZ: scene.camera.rotateZ,
          }
        : {},
    ),
  );
  const getWorld = (id: string): Matrix => {
    if (cache.has(id)) return cache.get(id)!;
    const node = nodeMap.get(id);
    if (!node) return camera;
    const size = measurements[id];
    const offsetX = size?.offsetX ?? 0,
      offsetY = size?.offsetY ?? 0;
    const validOffset = Number.isFinite(offsetX) && Number.isFinite(offsetY);
    if (!validOffset)
      issues.push({
        path: id,
        message: "Invalid layout measurement for " + id,
      });
    const local = matrixFor({
      ...node.transform,
      x: (node.transform?.x ?? 0) + (validOffset ? offsetX : 0),
      y: (node.transform?.y ?? 0) + (validOffset ? offsetY : 0),
    });
    const world = multiply(
      node.parentId ? getWorld(node.parentId) : camera,
      local,
    );
    cache.set(id, world);
    return world;
  };
  for (const node of scene.nodes) {
    if (!getWorld(node.id).every(Number.isFinite)) {
      issues.push({
        path: node.id,
        message: "Composed transform exceeds safe numeric limits.",
      });
      return { nodes: [], focusDepth: 0, issues };
    }
  }
  const defaultCamera = CameraSchema.parse({});
  const focusCamera = scene.camera ?? defaultCamera;
  const focusDepth = -focusCamera.z;
  const evaluatedNodes: EvaluatedNode[] = scene.nodes.map((node) => {
    const world = getWorld(node.id);
    const worldPosition = { x: world[3], y: world[7], z: world[11] };
    const size = measurements[node.id] ?? { width: 1, height: 1 };
    const depth = worldPosition.z;
    const distance = Math.abs(depth - focusDepth);
    const span = Math.max(size.width, size.height, 1);
    const blur = uniformFocusBlur(distance, span, scene.focus);
    return {
      id: node.id,
      ...(node.parentId ? { parentId: node.parentId } : {}),
      worldPosition,
      width: size.width,
      height: size.height,
      blur,
      opacity: 1,
      focus: { depth, distance, span },
    };
  });
  return { nodes: evaluatedNodes, focusDepth, issues };
}
export function cameraToCss(input: CameraInput = {}): string {
  const c = CameraSchema.parse(input);
  return `perspective(${c.perspective}px) rotateX(${c.rotateX}deg) rotateY(${c.rotateY}deg) rotateZ(${c.rotateZ}deg) translate3d(${-c.x}px, ${-c.y}px, ${-c.z}px)`;
}
export function focusForSurface(transform: TransformInput = {}, focusInput: unknown = {}): { depth: number; distance: number; span: number } {
  const t = TransformSchema.parse(transform);
  const f = FocusSchema.parse(focusInput);
  return { depth: t.z, distance: f.distance, span: 100 };
}
export const FOCUS_BANDS = 4;
export function sampleFocus(
  focus: { depth: number; distance: number; span: number },
  x: number,
  y: number,
): number {
  return focus.distance + x * 0.001 + y * 0.001;
}
export function focusMask(_focus: unknown, _width: number, _height: number, _band: number) {
  const stops = Array.from({length: FOCUS_BANDS + 1}, (_, i) => i === _band ? 1 : 0);
  return { stops, xWeight: 0.5, yWeight: 0.5 };
}
export function uniformFocusBlur(
  distanceOrFocus: number | { depth: number; distance: number; span: number },
  span: number,
  focusInput: unknown,
): number | undefined {
  if (typeof distanceOrFocus === "object" && distanceOrFocus !== null) {
    const f = distanceOrFocus;
    return Math.abs(f.depth - f.distance);
  }
  const distance = distanceOrFocus;
  const { distance: focalDistance, maxBlur } =
    FocusSchema.parse(focusInput);
  const diff = Math.abs(distance - focalDistance);
  const normalized = Math.min(1, diff / Math.max(span, 100));
  return Number((normalized * maxBlur).toFixed(2));
}
