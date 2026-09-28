import { describe, it, expect } from "vitest";
import { PRESENTATION_PRESETS, applyPresentationPreset, type PresentationPresetName } from "../../src/core/preview";

describe("presentation presets", () => {
  it("defines all 10 presentation presets", () => {
    const keys = Object.keys(PRESENTATION_PRESETS);
    expect(keys).toEqual([
      "clean", "focus", "depth", "soft-blur", "cinematic",
      "product", "hero", "wide", "close", "dramatic"
    ]);
  });

  it.each(Object.keys(PRESENTATION_PRESETS) as PresentationPresetName[])("applies preset %s to a definition", presetName => {
    const base = {
      scene: { version: 3 as const, camera: {}, focus: {}, nodes: [{ id: "surface" }] },
      width: 1400,
      height: 980,
    };
    const updated = applyPresentationPreset(base, presetName);
    const preset = PRESENTATION_PRESETS[presetName];
    expect(updated.scene.camera).toMatchObject(preset.camera);
    expect(updated.scene.focus).toMatchObject(preset.focus);
  });
});
