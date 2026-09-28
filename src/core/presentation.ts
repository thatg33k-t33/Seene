import { z } from "zod";
import { CameraSchema, FocusSchema } from "./scene";
import { MotionSchema, MotionTrackSchema, type MotionTrack } from "./motion";
import { CascadeSchema, createCascadeTracks, type CascadeInput } from "./choreography";
import type { PreviewDefinitionInput } from "./preview";

export const AUTHORED_PRESENTATION = "authored";

export const PresentationIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase presentation slug.");

export type PresentationEntrance = Omit<Partial<CascadeInput>, "items">;

export const PresentationSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1).max(40),
  summary: z.string().min(1).max(140),
  camera: CameraSchema,
  focus: FocusSchema,
  durationMs: z.number().int().positive().max(120_000),
  tracks: z.array(MotionTrackSchema),
  entrance: z.custom<PresentationEntrance>().optional(),
});
export type Presentation = z.output<typeof PresentationSchema>;
export type PresentationId = z.infer<typeof PresentationIdSchema>;

type Keyframes = readonly (readonly [number, number])[];

const cameraTrack = (
  property: "x" | "y" | "z" | "rotateX" | "rotateY" | "rotateZ",
  keyframes: Keyframes,
): MotionTrack =>
  MotionTrackSchema.parse({
    target: { kind: "camera" },
    property,
    keyframes: keyframes.map(([timeMs, value]) => ({ timeMs, value })),
  });

const focusTrack = (
  property: "distance" | "fStop" | "focalLength" | "maxBlur",
  keyframes: Keyframes,
): MotionTrack =>
  MotionTrackSchema.parse({
    target: { kind: "focus" },
    property,
    keyframes: keyframes.map(([timeMs, value]) => ({ timeMs, value })),
  });

const clean: Presentation = {
  id: "clean",
  label: "Clean",
  summary: "Centered product framing with a slow, steady drift.",
  camera: { perspective: 2200, x: 0, y: 0, z: 0, rotateX: 3, rotateY: -6, rotateZ: 0 },
  focus: { distance: 2200, fStop: 8, focalLength: 50, maxBlur: 0 },
  durationMs: 6000,
  tracks: [cameraTrack("x", [[0, 0], [6000, -70]])],
};

const depth: Presentation = {
  id: "depth",
  label: "Depth",
  summary: "A converging dolly that keeps the interface sharp as space builds around it.",
  camera: { perspective: 1400, x: 0, y: 0, z: 0, rotateX: 6, rotateY: -16, rotateZ: 0 },
  focus: { distance: 1400, fStop: 5.6, focalLength: 50, maxBlur: 5 },
  durationMs: 7000,
  tracks: [
    cameraTrack("z", [[0, 0], [7000, -240]]),
    focusTrack("distance", [[0, 1400], [7000, 1160]]),
  ],
  entrance: { depth: 70, depthStep: 10, staggerMs: 160, entranceMs: 2000 },
};

const cinematic: Presentation = {
  id: "cinematic",
  label: "Cinematic",
  summary: "A slow push-in that settles into an angled hero frame.",
  camera: { perspective: 1200, x: 0, y: 0, z: 0, rotateX: 8, rotateY: -22, rotateZ: 0 },
  focus: { distance: 1200, fStop: 5.6, focalLength: 50, maxBlur: 5 },
  durationMs: 8000,
  tracks: [
    cameraTrack("z", [[0, 0], [8000, -340]]),
    cameraTrack("rotateY", [[0, -22], [8000, -14]]),
    focusTrack("distance", [[0, 1200], [8000, 860]]),
  ],
  entrance: { depth: 80, depthStep: 12, staggerMs: 200, entranceMs: 2600 },
};

const floating: Presentation = {
  id: "floating",
  label: "Floating",
  summary: "A suspended plane that rises and tilts as if held in space.",
  camera: { perspective: 2000, x: 0, y: 0, z: 0, rotateX: 7, rotateY: -10, rotateZ: 0 },
  focus: { distance: 2000, fStop: 5.6, focalLength: 50, maxBlur: 4 },
  durationMs: 7000,
  tracks: [
    cameraTrack("y", [[0, -40], [7000, 40]]),
    cameraTrack("rotateX", [[0, 7], [7000, 4]]),
  ],
  entrance: { depth: 60, depthStep: 8, staggerMs: 140, entranceMs: 1800 },
};

const focus: Presentation = {
  id: "focus",
  label: "Focus",
  summary: "A single focal plane that racks sharp while the surroundings fall away.",
  camera: { perspective: 1800, x: 0, y: 0, z: 0, rotateX: 4, rotateY: -10, rotateZ: 0 },
  focus: { distance: 1830, fStop: 4, focalLength: 50, maxBlur: 6 },
  durationMs: 6000,
  tracks: [
    cameraTrack("x", [[0, 0], [6000, -40]]),
    focusTrack("distance", [[0, 1830], [6000, 1800]]),
  ],
  entrance: { depth: 50, depthStep: 10, staggerMs: 180, entranceMs: 2400 },
};

const showcase: Presentation = {
  id: "showcase",
  label: "Showcase",
  summary: "A revealed hero shot that pulls back to present the whole product.",
  camera: { perspective: 1600, x: 0, y: 0, z: 0, rotateX: 5, rotateY: -18, rotateZ: 0 },
  focus: { distance: 1340, fStop: 5.6, focalLength: 50, maxBlur: 4 },
  durationMs: 7000,
  tracks: [
    cameraTrack("z", [[0, -260], [7000, 0]]),
    focusTrack("distance", [[0, 1340], [7000, 1600]]),
  ],
  entrance: { depth: 70, depthStep: 10, staggerMs: 150, entranceMs: 2000 },
};

const minimal: Presentation = {
  id: "minimal",
  label: "Minimal",
  summary: "Almost editorial: a level plane and one deliberate rise.",
  camera: { perspective: 2600, x: 0, y: 0, z: 0, rotateX: 2, rotateY: -4, rotateZ: 0 },
  focus: { distance: 2600, fStop: 8, focalLength: 50, maxBlur: 0 },
  durationMs: 5000,
  tracks: [cameraTrack("y", [[0, 0], [5000, -24]])],
};

const assertEntrance = (value: Presentation) => {
  if (!value.entrance) return;
  const parsed = CascadeSchema.safeParse({ ...value.entrance, items: [{ id: "probe" }] });
  if (!parsed.success) {
    throw new Error(`Presentation ${value.id} has an invalid entrance: ${parsed.error.issues[0]?.message}`);
  }
};

export const PRESENTATIONS: readonly Presentation[] = Object.freeze(
  [clean, depth, cinematic, floating, focus, showcase, minimal].map((value) => {
    const parsed = PresentationSchema.parse(value);
    assertEntrance(parsed);
    return parsed;
  }),
);

export const DEFAULT_PRESENTATION = "clean";

export function isPresentationId(value: unknown): value is string {
  return typeof value === "string" && PRESENTATIONS.some((item) => item.id === value);
}

export function presentation(id: string): Presentation {
  const found = PRESENTATIONS.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown Seene presentation: ${id}`);
  return found;
}

function entranceTracks(treatment: Presentation, nodeIds: string[]): MotionTrack[] {
  if (!treatment.entrance || !nodeIds.length) return [];
  const options = CascadeSchema.parse({ ...treatment.entrance, items: nodeIds.map((id) => ({ id })) });
  if (options.entranceMs <= 0 || options.depth <= 0) return [];
  const gaps = Math.max(1, nodeIds.length - 1);
  const budget = Math.max(0, treatment.durationMs - options.entranceMs);
  return createCascadeTracks({ ...options, staggerMs: Math.min(options.staggerMs, Math.floor(budget / gaps)) });
}

export function applyPresentation(
  definition: PreviewDefinitionInput,
  id: string,
): PreviewDefinitionInput {
  const treatment = presentation(id);
  const nodeIds = definition.scene.nodes.map((node) => node.id);
  return {
    ...definition,
    scene: { ...definition.scene, camera: treatment.camera, focus: treatment.focus },
    motion: MotionSchema.parse({
      durationMs: treatment.durationMs,
      speed: 1,
      tracks: [...treatment.tracks, ...entranceTracks(treatment, nodeIds)],
    }),
  };
}

export function resolvePresentation(
  definition: PreviewDefinitionInput,
  id: string | undefined,
): PreviewDefinitionInput {
  return id && isPresentationId(id) ? applyPresentation(definition, id) : definition;
}

export const PresentationListSchema = z.strictObject({
  active: z.string(),
  options: z.array(
    z.strictObject({ id: z.string(), label: z.string(), summary: z.string() }),
  ),
});
export type PresentationList = z.output<typeof PresentationListSchema>;

export function listPresentations(): PresentationList {
  return PresentationListSchema.parse({
    active: DEFAULT_PRESENTATION,
    options: PRESENTATIONS.map(({ id, label, summary }) => ({ id, label, summary })),
  });
}
