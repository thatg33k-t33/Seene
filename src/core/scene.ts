import { z } from "zod";
export const SCENE_BACKGROUND = "#000000" as const;
const finite = z.number().finite();
const id = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/, "Use a stable alphanumeric ID.");
export const TransformSchema = z.strictObject({
  x: finite.default(0),
  y: finite.default(0),
  z: finite.default(0),
  rotateX: finite.default(0),
  rotateY: finite.default(0),
  rotateZ: finite.default(0),
  scale: finite.min(0.0001).max(100).default(1),
});
export type Transform = z.output<typeof TransformSchema>;
export type TransformInput = z.input<typeof TransformSchema>;
export const NodeSchema = z.strictObject({
  id,
  parentId: id.optional(),
  transform: TransformSchema.optional(),
});
export type SceneNode = z.output<typeof NodeSchema>;
export type SceneNodeInput = z.input<typeof NodeSchema>;
export const CameraSchema = z.strictObject({
  perspective: finite.min(100).max(50000).default(1400),
  x: finite.default(0),
  y: finite.default(0),
  z: finite.default(0),
  rotateX: finite.default(0),
  rotateY: finite.default(0),
  rotateZ: finite.default(0),
});
export type Camera = z.output<typeof CameraSchema>;
export type CameraInput = z.input<typeof CameraSchema>;
export const FocusSchema = z.strictObject({
  distance: finite.min(1).max(100000).default(1400),
  fStop: finite.min(0.1).max(128).default(8),
  focalLength: finite.min(1).max(5000).default(50),
  maxBlur: finite.min(0).max(32).default(6),
}).superRefine((val, ctx) => {
  if (val.distance > 0 && val.focalLength > 0 && val.distance <= val.focalLength) {
    ctx.addIssue({ code: "custom", path: ["distance"], message: "Focus distance must exceed focal length." });
  }
});
export type Focus = z.output<typeof FocusSchema>;
export type FocusInput = z.input<typeof FocusSchema>;
export const SceneSchema = z.strictObject({
  version: z.literal(3).default(3),
  camera: CameraSchema.optional().default({ perspective: 1400, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }),
  focus: FocusSchema.optional().default({ distance: 1400, fStop: 8, focalLength: 50, maxBlur: 6 }),
  nodes: z.array(NodeSchema).max(4096),
}).superRefine((data, ctx) => {
  const ids = new Set<string>();
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i];
    if (ids.has(node.id)) {
      ctx.addIssue({ code: "custom", path: ["nodes", i, "id"], message: `Duplicate surface ID: ${node.id}` });
    }
    ids.add(node.id);
  }
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i];
    if (node.parentId) {
      if (!ids.has(node.parentId)) {
        ctx.addIssue({ code: "custom", path: ["nodes", i, "parentId"], message: `Parent ID ${node.parentId} not found.` });
      } else if (node.parentId === node.id) {
        ctx.addIssue({ code: "custom", path: ["nodes", i, "parentId"], message: `Node ${node.id} cannot be its own parent.` });
      }
    }
  }
  const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
  for (let i = 0; i < data.nodes.length; i++) {
    const start = data.nodes[i];
    const visited = new Set<string>([start.id]);
    let current = start;
    while (current.parentId && nodeMap.has(current.parentId)) {
      if (visited.has(current.parentId)) {
        ctx.addIssue({ code: "custom", path: ["nodes", i, "parentId"], message: `Cyclic parent hierarchy involving ${current.parentId}.` });
        break;
      }
      visited.add(current.parentId);
      current = nodeMap.get(current.parentId)!;
    }
  }
});
export type SceneDefinition = z.output<typeof SceneSchema>;
export type SceneInput = z.input<typeof SceneSchema>;
const SceneIssueSchema = z.strictObject({
  path: z.string(),
  message: z.string(),
});
export type SceneIssue = z.output<typeof SceneIssueSchema>;
export function validateScene(definition: unknown) {
  if (typeof definition === "object" && definition !== null) {
    const checkSerializable = (obj: any): boolean => {
      if (typeof obj === "function" || typeof obj === "symbol") return false;
      if (obj && typeof obj === "object") {
        for (const k of Object.keys(obj)) {
          if (!checkSerializable(obj[k])) return false;
        }
      }
      return true;
    };
    if (!checkSerializable(definition)) {
      return { success: false as const, error: { issues: [{ path: ["nodes"], message: "Scene configuration must be serializable data." }] } };
    }
  }
  return SceneSchema.safeParse(definition);
}
