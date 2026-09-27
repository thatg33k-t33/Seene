import { z } from "zod";
import { SceneSchema, type SceneIssue } from "./scene";
import { MotionSchema } from "./motion";
import { reviewAuthoring } from "./authoring";

export const PreviewDefinitionSchema = z.strictObject({
  scene: SceneSchema.refine(scene => scene.nodes.length > 0, {
    message: "Preview scenes must contain at least one surface node.",
  }),
  motion: MotionSchema.optional(),
  width: z.number().finite().positive().max(7680).default(1400),
  height: z.number().finite().positive().max(7680).default(980),
});
export type PreviewDefinitionInput = z.input<typeof PreviewDefinitionSchema>;
export type PreviewDefinition = z.output<typeof PreviewDefinitionSchema>;
export function presentPreview(input: unknown):
  { valid: true; definition: PreviewDefinition; issues: SceneIssue[] } |
  { valid: false; issues: SceneIssue[] } {
  const parsed = PreviewDefinitionSchema.safeParse(input);
  if (!parsed.success) return { valid: false, issues: parsed.error.issues.map(issue => ({
    path: issue.path.join("."), message: issue.message,
  })) };
  const review = reviewAuthoring({scene: parsed.data.scene,
    motion: parsed.data.motion ?? {durationMs: 0, tracks: []}});
  return review.valid ? {valid: true, definition: parsed.data, issues: []}
    : {valid: false, issues: review.issues};
}
