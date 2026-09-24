# Seene Architecture

## Source of truth and linear flow

`docs/product.md` owns product intent; this file owns the implementation map.

1. A developer opens the Seene studio, selects a scene, and adjusts camera, depth, focus and motion parameters using the interactive Scene Inspector.
2. `SceneSchema`, `MotionSchema` and `PreviewDefinitionSchema` validate the source. TypeScript types derive from these Zod contracts.
3. `src/core/preview.ts:presentPreview` delegates to existing scene/motion validation.
4. `src/preview/session.ts:usePreviewSession` keeps valid settings and an elapsed presentation cursor.
5. `src/preview/ScenePreview.tsx` renders the product chrome and passes configuration/time to `Scene`.
6. `src/react/index.tsx` registers live surfaces through `registry.ts`. `src/core/spatial.ts` computes camera transforms, camera-depth focus and filter weights. `FocusFilter.tsx` translates those weights into native browser filters.
7. `useSceneCapture` seeks the session and exposes the scene viewport. CLI export validates and executes capture/FFmpeg effects.
