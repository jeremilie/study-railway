import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, DynamicDrawUsage } from "three";
import {
  createSnowParticles,
  stepSnowParticles,
  type SnowBounds,
} from "../lib/snow";

export type { SnowBounds } from "../lib/snow";

export interface SnowfallProps {
  bounds: SnowBounds;
  reducedMotion: boolean;
  /** Disable the demand-loop animation while keeping particles visible. */
  active?: boolean;
}

/** A single draw call; R3F owns and disposes geometry/material/attribute refs. */
export function Snowfall({
  bounds,
  reducedMotion,
  active = true,
}: SnowfallProps) {
  const { minX, maxX, minZ, maxZ } = bounds;
  const volume = useMemo(
    () => ({ minX, maxX, minZ, maxZ }),
    [minX, maxX, minZ, maxZ],
  );
  const snow = useMemo(
    () =>
      createSnowParticles(
        volume,
        Math.min(
          420,
          Math.max(160, Math.round((maxX - minX) * (maxZ - minZ) * 2.4)),
        ),
      ),
    [volume, minX, maxX, minZ, maxZ],
  );
  const attribute = useRef<BufferAttribute>(null);
  const invalidate = useThree((state) => state.invalidate);
  const dpr = useThree((state) => state.viewport.dpr);
  const uniforms = useMemo(() => ({ pointSize: { value: 4 * dpr } }), [dpr]);

  useEffect(() => {
    if (active && !reducedMotion) invalidate();
  }, [active, reducedMotion, snow, invalidate]);

  useFrame((_, delta) => {
    if (!active || reducedMotion || !attribute.current) return;
    stepSnowParticles(snow, volume, Math.min(delta, 0.05));
    attribute.current.needsUpdate = true;
    invalidate();
  });

  return (
    <points name="tundra-snowfall" frustumCulled={false} renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute
          ref={attribute}
          attach="attributes-position"
          args={[snow.positions, 3]}
          usage={DynamicDrawUsage}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={`
          uniform float pointSize;
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = pointSize;
          }
        `}
        fragmentShader={`
          void main() {
            float radius = length(gl_PointCoord - vec2(0.5));
            float alpha = (1.0 - smoothstep(0.08, 0.5, radius)) * 0.65;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(0.94, 0.97, 1.0, alpha);
            #include <colorspace_fragment>
          }
        `}
      />
    </points>
  );
}

function Lantern({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.04, z]}>
      <mesh position={[0, 0.29, 0]} castShadow>
        <boxGeometry args={[0.045, 0.58, 0.045]} />
        <meshStandardMaterial color="#8b8477" />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.14, 0.19, 0.14]} />
        <meshStandardMaterial
          color="#f2ce8b"
          emissive="#e9aa54"
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh position={[0, 0.74, 0]} castShadow>
        <coneGeometry args={[0.14, 0.11, 4]} />
        <meshStandardMaterial color="#7d8988" flatShading />
      </mesh>
    </group>
  );
}

function Sledge({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.05, z]} rotation={[0, -0.35, 0]}>
      {[-0.17, 0.17].map((side) => (
        <group key={side} position={[side, 0, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.045, 0.055, 0.76]} />
            <meshStandardMaterial color="#7e8d94" />
          </mesh>
          <mesh position={[0, 0.11, 0.37]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[0.045, 0.055, 0.21]} />
            <meshStandardMaterial color="#7e8d94" />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.05, 0.18, 0.43]} />
            <meshStandardMaterial color="#a6937b" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.46, 0.065, 0.59]} />
        <meshStandardMaterial color="#b8a18a" />
      </mesh>
      <mesh position={[0, 0.3, -0.09]}>
        <boxGeometry args={[0.36, 0.055, 0.29]} />
        <meshStandardMaterial color="#aa8584" />
      </mesh>
    </group>
  );
}

/** Small fixed-size props placed relative to bounds; no scene-wide scaling.
 * Includes one Snowfall. Use Snowfall separately only when not mounting this group.
 * Props occupy an inner elliptical ring; track/station placement belongs to layout.
 */
export function TundraDetails({
  bounds,
  reducedMotion,
}: Omit<SnowfallProps, "active">) {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const radiusX = (bounds.maxX - bounds.minX) * 0.32;
  const radiusZ = (bounds.maxZ - bounds.minZ) * 0.3;
  return (
    <group name="tundra-details">
      {Array.from({ length: 9 }, (_, i) => {
        const angle = i * 2.399963;
        const x = centerX + Math.cos(angle) * radiusX;
        const z = centerZ + Math.sin(angle) * radiusZ;
        return (
          <group key={i} position={[x, 0.045, z]}>
            <mesh scale={[0.42 + (i % 3) * 0.09, 0.13, 0.28]} receiveShadow>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial
                color={i % 2 ? "#e1e9ee" : "#d4e0e8"}
                flatShading
              />
            </mesh>
            {i % 2 === 0 && (
              <group position={[0.18, 0.09, -0.1]}>
                <mesh scale={[0.22, 0.2, 0.18]} castShadow>
                  <dodecahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color="#a2b5c0" flatShading />
                </mesh>
                <mesh position={[0, 0.12, 0]} scale={[0.21, 0.075, 0.17]}>
                  <icosahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color="#edf1ef" flatShading />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
      <Sledge x={centerX - radiusX * 0.6} z={centerZ + radiusZ * 0.65} />
      <Lantern
        x={centerX - radiusX * 0.6 - 0.48}
        z={centerZ + radiusZ * 0.65}
      />
      <Lantern x={centerX + radiusX * 0.8} z={centerZ - radiusZ * 0.5} />
      <Snowfall bounds={bounds} reducedMotion={reducedMotion} />
    </group>
  );
}
