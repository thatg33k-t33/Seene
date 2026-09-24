import { useState } from "react";
import type { PreviewDefinitionInput } from "../core";

export type SceneInspectorProps = {
  definition?: PreviewDefinitionInput;
  onChange?: (updated: PreviewDefinitionInput) => void;
};

export function SceneInspector({definition, onChange}: SceneInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  if (!definition) return null;

  const camera = definition.scene?.camera ?? {};
  const focus = definition.scene?.focus ?? {};
  const durMs = definition.motion?.durationMs ?? 0;

  const updateCamera = (key: string, val: number) => {
    if (!onChange) return;
    onChange({
      ...definition,
      scene: {
        ...definition.scene,
        camera: { ...camera, [key]: val }
      }
    });
  };

  const updateFocus = (key: string, val: number) => {
    if (!onChange) return;
    onChange({
      ...definition,
      scene: {
        ...definition.scene,
        focus: { ...focus, [key]: val }
      }
    });
  };

  const updateDuration = (val: number) => {
    if (!onChange) return;
    onChange({
      ...definition,
      motion: { ...(definition.motion || {durationMs: 2000, tracks: []}), durationMs: val }
    });
  };

  return <div className="relative">
    <button className="appearance-none border border-white/20 rounded-full px-4 py-2.5 bg-[#242424] text-white text-xs font-medium inline-flex items-center justify-center gap-2 cursor-pointer hover:bg-[#3a3a3a] transition-colors" onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? "Close Inspector" : "Scene Inspector"}
    </button>
    {isOpen && <div className="absolute bottom-16 right-0 w-80 rounded-2xl border border-white/15 bg-[#141414]/95 p-5 text-xs text-white shadow-2xl backdrop-blur-xl z-50">
      <h3 className="mb-4 text-sm font-semibold">Camera & Lens</h3>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <label className="space-y-1"><span>Cam X</span> <input type="number" value={camera.x ?? 0} onChange={e => updateCamera("x", parseFloat(e.target.value) || 0)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" /></label>
        <label className="space-y-1"><span>Cam Y</span> <input type="number" value={camera.y ?? 0} onChange={e => updateCamera("y", parseFloat(e.target.value) || 0)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" /></label>
        <label className="space-y-1"><span>Cam Z</span> <input type="number" value={camera.z ?? 0} onChange={e => updateCamera("z", parseFloat(e.target.value) || 0)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" /></label>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <label className="space-y-1"><span>Rot X</span> <input type="number" value={camera.rotateX ?? 0} onChange={e => updateCamera("rotateX", parseFloat(e.target.value) || 0)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" /></label>
        <label className="space-y-1"><span>Rot Y</span> <input type="number" value={camera.rotateY ?? 0} onChange={e => updateCamera("rotateY", parseFloat(e.target.value) || 0)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" /></label>
        <label className="space-y-1"><span>Rot Z</span> <input type="number" value={camera.rotateZ ?? 0} onChange={e => updateCamera("rotateZ", parseFloat(e.target.value) || 0)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" /></label>
      </div>

      <div className="mb-3">
        <label className="block space-y-1"><span>Perspective: {camera.perspective ?? 1400}</span>
          <input type="range" min="100" max="5000" step="50" value={camera.perspective ?? 1400} onChange={e => updateCamera("perspective", parseFloat(e.target.value))} className="w-full accent-white" />
        </label>
      </div>

      <div className="mb-3">
        <label className="block space-y-1"><span>Focal Length: {focus.focalLength ?? 50}</span>
          <input type="range" min="10" max="300" step="5" value={focus.focalLength ?? 50} onChange={e => updateFocus("focalLength", parseFloat(e.target.value))} className="w-full accent-white" />
        </label>
      </div>

      <div className="mb-3">
        <label className="block space-y-1"><span>F-Stop: {focus.fStop ?? 8}</span>
          <input type="range" min="0.7" max="22" step="0.5" value={focus.fStop ?? 8} onChange={e => updateFocus("fStop", parseFloat(e.target.value))} className="w-full accent-white" />
        </label>
      </div>

      <div className="mb-3">
        <label className="block space-y-1"><span>Focus Distance: {focus.distance ?? 1400}</span>
          <input type="range" min="0" max="3000" step="50" value={focus.distance ?? 1400} onChange={e => updateFocus("distance", parseFloat(e.target.value))} className="w-full accent-white" />
        </label>
      </div>

      <div>
        <label className="block space-y-1"><span>Motion Duration (ms):</span>
          <input type="number" step="500" value={durMs} onChange={e => updateDuration(parseFloat(e.target.value) || 2000)} className="w-full rounded bg-[#222] px-2 py-1 text-white border border-white/10" />
        </label>
      </div>
    </div>}
  </div>;
}
