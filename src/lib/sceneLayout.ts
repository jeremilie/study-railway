import { CatmullRomCurve3, Vector3 } from "three";
import { routeCurve, stationPosition } from "./routes";
import { landmarkCount } from "./planning";

export interface SceneLayout {
  curve: CatmullRomCurve3;
  extensionX: number;
  extensionZ: number;
  center: [number, number, number];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  landmarks: [number, number, number][];
}

/** Grow the eastern and northern land only. Original terrain features keep their
 * geometry, scale and world coordinates; this is not a uniform scene scale. */
export function sceneLayout(count: number): SceneLayout {
  const extra = Math.max(0, Math.min(10, count) - 3);
  let extensionX = extra * 2.2;
  let extensionZ = extra * 1.65;
  let curve = routeCurve;
  if (extra) {
    const desiredLength =
      routeCurve.getLength() * (count / 3) * (1 + extra * 0.025);
    for (let attempt = 0; attempt < 30; attempt++) {
      curve = new CatmullRomCurve3(
        routeCurve.points.map(
          (p) =>
            new Vector3(
              p.x + Math.max(0, p.x / 4.2) * extensionX,
              p.y,
              p.z + Math.min(0, p.z / 2.7) * extensionZ,
            ),
        ),
        true,
        "catmullrom",
        0.25,
      );
      if (curve.getLength() >= desiredLength) break;
      extensionX *= 1.1;
      extensionZ *= 1.1;
    }
  }
  const layout: SceneLayout = {
    curve,
    extensionX,
    extensionZ,
    center: [extensionX / 2, 0.3, -extensionZ / 2],
    bounds: {
      minX: -5.7,
      maxX: 5.7 + extensionX,
      minZ: -4.5 - extensionZ,
      maxZ: 4.5,
    },
    landmarks: [],
  };
  const unlocks = landmarkCount(count);
  if (!unlocks) return layout;
  const track = curve.getSpacedPoints(220);
  const stops = Array.from({ length: count }, (_, i) =>
    curve.getPointAt(stationPosition(i, count)),
  );
  const candidates: [number, number, number][] = [];
  for (let x = -3; x < layout.bounds.maxX - 1.8; x += 0.6) {
    for (let z = layout.bounds.minZ + 1.8; z < 1; z += 0.6) {
      if (x < 4.4 && z > -3.8) continue; // preserve the entire original scenery
      const inside =
        (x / (x > 0 ? 5.55 + extensionX : 5.55)) ** 2 +
        (z / (z < 0 ? 4.3 + extensionZ : 4.3)) ** 2;
      if (inside > 0.7) continue;
      if (track.some((p) => Math.hypot(p.x - x, p.z - z) < 2.05)) continue;
      if (stops.some((p) => Math.hypot(p.x - x, p.z - z) < 2.65)) continue;
      candidates.push([Number(x.toFixed(3)), 0.02, Number(z.toFixed(3))]);
    }
  }
  const destinations = [
    [extensionX * 0.65 + 2, -1.5],
    [extensionX * 0.4, -extensionZ * 0.7 - 1],
    [0, -extensionZ * 0.65 - 1],
  ];
  for (let index = 0; index < unlocks; index++) {
    const target = destinations[index];
    const point = candidates
      .filter((p) =>
        layout.landmarks.every(
          (other) => Math.hypot(p[0] - other[0], p[2] - other[2]) > 3.6,
        ),
      )
      .sort(
        (a, b) =>
          Math.hypot(a[0] - target[0], a[2] - target[1]) -
          Math.hypot(b[0] - target[0], b[2] - target[1]),
      )[0];
    if (point) layout.landmarks.push(point);
  }
  return layout;
}

export function trainRoutePosition(units: number, stationCount: number) {
  if (!stationCount || units <= 0) return 0.03;
  const bounded = Math.min(stationCount, units);
  const index = Math.min(stationCount - 1, Math.floor(bounded));
  const fraction = bounded - index;
  const from = index === 0 ? 0.03 : stationPosition(index - 1, stationCount);
  const to = stationPosition(index, stationCount);
  return from + (to - from) * fraction;
}
