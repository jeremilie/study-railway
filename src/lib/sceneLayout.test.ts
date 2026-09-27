import { describe, expect, it } from "vitest";
import { sceneLayout } from "./sceneLayout";
import { routeCurve, stationPosition } from "./routes";
import { landmarkCount, stationStyle } from "./planning";
describe("deterministic expanding railway", () => {
  it("leaves the original island and route untouched for zero through three stations", () => {
    for (const count of [0, 1, 2, 3]) {
      const layout = sceneLayout(count);
      expect(layout.extensionX).toBe(0);
      expect(layout.extensionZ).toBe(0);
      for (const t of [0, 0.2, 0.5, 0.9])
        expect(layout.curve.getPointAt(t).toArray()).toEqual(
          routeCurve.getPointAt(t).toArray(),
        );
      expect(layout.landmarks).toEqual([]);
    }
  });
  it("grows path length faster than station count so stops do not crowd", () => {
    const originalSpacing = (routeCurve.getLength() * 0.79) / 3;
    for (let count = 4; count <= 10; count++) {
      const layout = sceneLayout(count);
      expect((layout.curve.getLength() * 0.79) / count).toBeGreaterThan(
        originalSpacing,
      );
      expect(layout.extensionX).toBeGreaterThan(0);
      expect(layout.extensionZ).toBeGreaterThan(0);
    }
  });
  it("unlocks exactly three unique additional landmarks at five, seven and nine", () => {
    expect([0, 3, 4, 5, 6, 7, 8, 9, 10].map(landmarkCount)).toEqual([
      0, 0, 0, 1, 1, 2, 2, 3, 3,
    ]);
    for (let count = 5; count <= 10; count++) {
      const layout = sceneLayout(count);
      expect(layout.landmarks).toHaveLength(landmarkCount(count));
      expect(sceneLayout(count).landmarks).toEqual(layout.landmarks);
      for (const [x, , z] of layout.landmarks) {
        const distances = layout.curve
          .getSpacedPoints(200)
          .map((p) => Math.hypot(p.x - x, p.z - z));
        expect(Math.min(...distances)).toBeGreaterThan(1.7);
        for (let i = 0; i < count; i++) {
          const p = layout.curve.getPointAt(stationPosition(i, count));
          expect(Math.hypot(p.x - x, p.z - z)).toBeGreaterThan(2.3);
        }
      }
    }
  });
  it("keeps station designs stable and distributes all three starting designs", () => {
    expect(
      new Set(["biology-0", "biology-1", "biology-2"].map(stationStyle)).size,
    ).toBe(3);
    expect(stationStyle("persisted-station-uuid")).toBe(
      stationStyle("persisted-station-uuid"),
    );
  });
});
