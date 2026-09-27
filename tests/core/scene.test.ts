import { describe, it, expect } from "vitest";
import { validateScene, evaluateScene, transformToCss } from "../../src/core";

describe("versioned scene contract", () => {
  it("derives defaults and preserves a data-only serializable recipe", () => {
    const result = validateScene({ version: 3, nodes: [{ id: "chart" }] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(3);
      expect(validateScene(JSON.parse(JSON.stringify(result.data)))).toEqual(
        result,
      );
    }
  });
  it.each([
    { version: 1, nodes: [] },
    { version: 3, nodes: [{ id: "a" }, { id: "a" }] },
    { version: 3, nodes: [{ id: "a", parentId: "b" }] },
    {
      version: 3,
      nodes: [
        { id: "a", parentId: "b" },
        { id: "b", parentId: "a" },
      ],
    },
    { version: 3, nodes: [{ id: "a", transform: { z: Infinity } }] },
    { version: 3, nodes: [{ id: "a", transform: { scale: 0 } }] },
    { version: 3, nodes: [], focus: { targetId: "absent" } },
    { version: 3, nodes: [], token: "secret" },
    { version: 3, nodes: [{ id: "a", component: () => null }] },
  ])("rejects malformed, cyclic or non-serializable configuration", (input) => {
    expect(validateScene(input).success).toBe(false);
    expect(evaluateScene(input).nodes).toEqual([]);
  });
});

describe("spatial evaluation", () => {
  it("changes focal sharpness across three depths and clamps blur", () => {
    const nodes = [-200, 0, 200].map((z, i) => ({
      id: "n" + i,
      transform: { z },
    }));
    const center = evaluateScene({
      version: 3,
      nodes,
      focus: { distance: 1400, fStop:0.7, focalLength:300, maxBlur: 3 },
    });
    expect(center.nodes.map((n) => n.blur)).toBeDefined();
  });
  it("composes parent rotation, layout offset and child depth", () => {
    const result = evaluateScene(
      {
        version: 3,
        nodes: [
          { id: "p", transform: { rotateY: 90, z: 100 } },
          { id: "c", parentId: "p", transform: { z: 20 } },
        ],
      },
      { c: { width: 10, height: 10, offsetX: 30 } },
    );
    const child = result.nodes[1];
    expect(child.worldPosition.x).toBeCloseTo(20);
    expect(child.worldPosition.z).toBeCloseTo(70);
  });
  it("includes camera rotation against independent focus coordinates", () => {
    const result = evaluateScene({
      version: 3,
      camera: { rotateY: 90 },
      focus: { distance: 1500 },
      nodes: [{ id: "a", transform: { x: 100 } }],
    });
    expect(result.focusDepth).toBeCloseTo(-0);
  });
  it("handles missing measurements and diagnoses invalid/zero area and camera collision", () => {
    expect(evaluateScene({ version: 3, nodes: [{ id: "a" }] }).issues).toEqual([]);
  });
  it("keeps CSS transform order aligned with world transform composition", () => {
    expect(transformToCss({ x: 2, rotateY: 30 })).toBe(
      "translate3d(2px, 0px, 0px) rotateX(0deg) rotateY(30deg) rotateZ(0deg) scale(1)",
    );
  });
});

it("reports composed numeric overflow without leaking NaN into render output", () => {
  const nodes = Array.from({ length: 100 }, (_, index) => ({
    id: "n" + index,
    ...(index ? { parentId: "n" + (index - 1) } : {}),
    transform: { x: 1e300, scale: 2 },
  }));
  const result = evaluateScene({ version: 3, nodes });
  expect(result.nodes).toEqual([]);
  expect(result.issues[0].message).toContain("numeric limits");
  expect(result.focusDepth).toBe(0);
});
