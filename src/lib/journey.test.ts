import { describe, expect, it } from "vitest";
import { seed, start, pause, resume, finish } from "./model";
import { checkpointJourney, trainUnits } from "./journey";

function journey() {
  const data = seed();
  data.stations = data.stations.map((s) =>
    s.id === data.selectedStation ? { ...s, target: 3 } : s,
  );
  return data;
}
describe("cumulative train progress", () => {
  it("arrives only after all three planned sessions and never resets at session start", () => {
    let data = journey();
    expect(trainUnits(data, "biology", 0)).toBe(0);
    for (let session = 1; session <= 3; session++) {
      const now = session * 2000000;
      data = start(data, "focus", now);
      expect(trainUnits(data, "biology", now)).toBeCloseTo((session - 1) / 3);
      expect(trainUnits(data, "biology", now + 750000)).toBeCloseTo(
        (session - 0.5) / 3,
      );
      data = finish(data, now + 1500000);
      expect(trainUnits(data, "biology", now + 1500000)).toBeCloseTo(
        session / 3,
      );
    }
  });
  it("preserves progress through pause, resume, breaks, and serialized reload", () => {
    let data = finish(start(journey(), "focus", 0), 1500000);
    data = start(data, "break", 1600000);
    expect(trainUnits(data, "biology", 1700000)).toBeCloseTo(1 / 3);
    data = finish(data, 1900000);
    data = start(data, "focus", 2000000);
    data = pause(data, 2375000);
    expect(trainUnits(data, "biology", 3000000)).toBeCloseTo(1.25 / 3);
    data = JSON.parse(JSON.stringify(checkpointJourney(data, 3000000)));
    data = resume(data, 3100000);
    expect(trainUnits(data, "biology", 3100000)).toBeCloseTo(1.25 / 3);
  });
  it("retains a high-water mark when canceling or increasing the target", () => {
    let data = start(journey(), "focus", 0);
    data = checkpointJourney(data, 750000);
    data = { ...data, timer: null };
    expect(trainUnits(data, "biology", 900000)).toBeCloseTo(1 / 6);
    data = start(data, "focus", 1000000);
    expect(trainUnits(data, "biology", 1000000)).toBeCloseTo(1 / 6);
    data = finish(data, 2500000);
    data = checkpointJourney(data, 2500000);
    data.stations = data.stations.map((s) =>
      s.id === data.selectedStation ? { ...s, target: 10 } : s,
    );
    expect(trainUnits(data, "biology", 3000000)).toBeCloseTo(1 / 3);
  });
  it("moves from the previous stop for later stations and keeps subjects independent", () => {
    let data = journey();
    data.selectedStation = "biology-1";
    data = start(data, "focus", 0);
    expect(trainUnits(data, "biology", 0)).toBe(1);
    data = finish(data, 1500000);
    data = checkpointJourney(data, 1500000);
    data.selectedStation = "biology-0";
    expect(trainUnits(data, "biology", 1600000)).toBeCloseTo(1 + 1 / 3);
    expect(trainUnits(data, "math", 1600000)).toBe(0);
  });
});
