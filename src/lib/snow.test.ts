import { describe, expect, it } from "vitest";
import { createSnowParticles, stepSnowParticles } from "./snow";

const bounds = { minX: -8, maxX: 12, minZ: -5, maxZ: 6 };

describe("snow particles", () => {
  it("reproduces placement after remount and covers expanded bounds", () => {
    const first = createSnowParticles(bounds, 240);
    const second = createSnowParticles({ ...bounds }, 240);
    expect(first.positions).toEqual(second.positions);
    const xs = Array.from(first.positions).filter((_, i) => i % 3 === 0);
    expect(Math.min(...xs)).toBeLessThan(-7);
    expect(Math.max(...xs)).toBeGreaterThan(11);
  });

  it("recycles indefinitely inside the volume using the original buffers", () => {
    const snow = createSnowParticles(bounds, 64);
    const positions = snow.positions;
    const motion = snow.motion;
    for (let frame = 0; frame < 3000; frame++) {
      stepSnowParticles(snow, bounds, 0.1);
      for (let i = 0; i < positions.length; i += 3) {
        expect(positions[i]).toBeGreaterThanOrEqual(bounds.minX);
        expect(positions[i]).toBeLessThanOrEqual(bounds.maxX);
        expect(positions[i + 1]).toBeGreaterThanOrEqual(0.08);
        expect(positions[i + 1]).toBeLessThanOrEqual(4.6);
        expect(positions[i + 2]).toBeGreaterThanOrEqual(bounds.minZ);
        expect(positions[i + 2]).toBeLessThanOrEqual(bounds.maxZ);
      }
    }
    expect(snow.positions).toBe(positions);
    expect(snow.motion).toBe(motion);
  });

  it("falls, sways, and leaves particles untouched for a static frame", () => {
    const snow = createSnowParticles(bounds, 1);
    snow.positions[1] = 2;
    const before = snow.positions.slice();
    stepSnowParticles(snow, bounds, 0);
    expect(snow.positions).toEqual(before);
    stepSnowParticles(snow, bounds, 0.5);
    expect(snow.positions[1]).toBeLessThan(2);
    expect(snow.positions[0]).not.toBe(before[0]);
  });
});
