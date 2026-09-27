export interface SnowBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SnowParticles {
  positions: Float32Array;
  /** Per particle: origin X, origin Z, fall speed, sway phase. */
  motion: Float32Array;
  elapsed: number;
}

const FLOOR = 0.08;
const HEIGHT = 4.52;

/** Allocate once per bounds/count change; identical inputs reproduce the scene. */
export function createSnowParticles(
  bounds: SnowBounds,
  count: number,
): SnowParticles {
  const positions = new Float32Array(count * 3);
  const motion = new Float32Array(count * 4);
  let seed = 17431;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const p = i * 3;
    const m = i * 4;
    positions[p] = motion[m] =
      bounds.minX + next() * (bounds.maxX - bounds.minX);
    positions[p + 1] = FLOOR + next() * HEIGHT;
    positions[p + 2] = motion[m + 1] =
      bounds.minZ + next() * (bounds.maxZ - bounds.minZ);
    motion[m + 2] = 0.18 + next() * 0.2;
    motion[m + 3] = next() * Math.PI * 2;
  }
  return { positions, motion, elapsed: 0 };
}

function wrap(value: number, min: number, span: number) {
  return span > 0 ? min + ((((value - min) % span) + span) % span) : min;
}

/** Mutates existing buffers only. Callers skip this entirely for reduced motion. */
export function stepSnowParticles(
  snow: SnowParticles,
  bounds: SnowBounds,
  delta: number,
) {
  if (!(delta > 0) || !Number.isFinite(delta)) return;
  snow.elapsed += delta;
  const positions = snow.positions;
  const motion = snow.motion;
  for (let i = 0; i < positions.length / 3; i++) {
    const p = i * 3;
    const m = i * 4;
    const phase = motion[m + 3];
    positions[p] = wrap(
      motion[m] + Math.sin(snow.elapsed * 0.42 + phase) * 0.12,
      bounds.minX,
      bounds.maxX - bounds.minX,
    );
    positions[p + 1] = wrap(
      positions[p + 1] - delta * motion[m + 2],
      FLOOR,
      HEIGHT,
    );
    positions[p + 2] = wrap(
      motion[m + 1] + Math.sin(snow.elapsed * 0.3 + phase) * 0.07,
      bounds.minZ,
      bounds.maxZ - bounds.minZ,
    );
  }
}
