import { CatmullRomCurve3, Vector3 } from "three";
export const routeCurve = new CatmullRomCurve3(
  [
    new Vector3(-4.2, 0.17, 0.9),
    new Vector3(-2.5, 0.17, 2.7),
    new Vector3(0.5, 0.17, 3.1),
    new Vector3(3.9, 0.17, 1.8),
    new Vector3(4.2, 0.17, -0.8),
    new Vector3(2.5, 0.17, -2.6),
    new Vector3(-0.5, 0.17, -2.7),
    new Vector3(-3.7, 0.17, -1.6),
  ],
  true,
  "catmullrom",
  0.25,
);
export function stationPosition(index: number, count: number) {
  return 0.12 + (index / Math.max(count, 1)) * 0.79;
}
