/** SOURCE OF TRUTH: SceneSchema, NodeSchema, TransformSchema, SCENE_BACKGROUND.
 * WHAT: versioned spatial data, black void backdrop and validation; types derive here.
 * WHY: renderer and future project adapters must accept the same contract.
 * WHERE: core/spatial.ts evaluates it; react/ binds live components without serializing them.
 */
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
  scale: finite.default(1),
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
  perspective: finite.min(100).max(50000).default(1800),
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
  distance: finite.min(10).max(100000).default(1800),
  fStop: finite.min(0.1).max(128).default(8),
  focalLength: finite.min(1).max(5000).default(50),
  maxBlur: finite.min(0).max(64).default(6),
});
export type Focus = z.output<typeof FocusSchema>;
export type FocusInput = z.input<typeof FocusSchema>;
export const SceneSchema = z.strictObject({
  version: z.literal(3),
  camera: CameraSchema,
  focus: FocusSchema,
  nodes: z.array(NodeSchema).max(4096),
});
export type SceneDefinition = z.output<typeof SceneSchema>;
export type SceneInput = z.input<typeof SceneSchema>;
const SceneIssueSchema = z.strictObject({
  path: z.string(),
  message: z.string(),
});
export type SceneIssue = z.output<typeof SceneIssueSchema>;
export function validateScene(definition: unknown) {
  return SceneSchema.safeParse(definition);
}
