import type { ReactNode } from "react";
import type { Biome } from "../types/study";

type Point = [number, number, number];
const WOOD = "#9b886d";
const DARK = "#73817b";
const STONE = "#adb5aa";
const SNOW = "#e7eeee";

function Box({
  at,
  size,
  color = WOOD,
  rotation,
}: {
  at: Point;
  size: Point;
  color?: string;
  rotation?: Point;
}) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Pole({
  at,
  height,
  radius = 0.06,
  color = WOOD,
}: {
  at: Point;
  height: number;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={at} castShadow>
      <cylinderGeometry args={[radius, radius * 1.15, height, 6]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Roof({
  at,
  radius = 0.7,
  color = DARK,
}: {
  at: Point;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={at} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[radius, radius * 0.6, 4]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Boulder({
  at,
  size,
  color = STONE,
}: {
  at: Point;
  size: Point;
  color?: string;
}) {
  return (
    <mesh position={at} scale={size} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}

function Beam({
  from,
  to,
  width = 0.045,
  color = WOOD,
}: {
  from: Point;
  to: Point;
  width?: number;
  color?: string;
}) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);
  return (
    <group
      position={[
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2,
        (from[2] + to[2]) / 2,
      ]}
      rotation={[0, Math.atan2(dx, dz), 0]}
    >
      <Box
        at={[0, 0, 0]}
        size={[width, width, length]}
        rotation={[-Math.atan2(dy, Math.hypot(dx, dz)), 0, 0]}
        color={color}
      />
    </group>
  );
}

function Glow({ at, size = [0.13, 0.19, 0.13] }: { at: Point; size?: Point }) {
  return (
    <mesh position={at}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#f4d99f"
        emissive="#dfa354"
        emissiveIntensity={0.55}
      />
    </mesh>
  );
}

function Arch({
  color = STONE,
  ice = false,
}: {
  color?: string;
  ice?: boolean;
}) {
  return (
    <group>
      {[-0.68, 0.68].map((x) => (
        <Box key={x} at={[x, 0.25, 0]} size={[0.33, 0.5, 0.48]} color={color} />
      ))}
      <mesh position={[0, 0.45, 0]} scale={[1, 1, 1.2]} castShadow>
        <torusGeometry args={[0.68, 0.18, 4, 9, Math.PI]} />
        <meshStandardMaterial
          color={color}
          flatShading
          roughness={ice ? 0.35 : 0.9}
          metalness={ice ? 0.08 : 0}
        />
      </mesh>
    </group>
  );
}

function RangerLookout() {
  return (
    <group name="ranger-lookout">
      {[-0.35, 0.35].flatMap((x) =>
        [-0.3, 0.3].map((z) => (
          <Pole key={`${x}:${z}`} at={[x, 0.68, z]} height={1.36} />
        )),
      )}
      <Beam from={[-0.35, 0.12, 0.3]} to={[0.35, 1.2, 0.3]} />
      <Beam from={[0.35, 0.12, -0.3]} to={[-0.35, 1.2, -0.3]} />
      <Box at={[0, 1.22, 0]} size={[1.06, 0.1, 0.9]} />
      <Box at={[0, 1.51, -0.1]} size={[0.65, 0.48, 0.5]} color="#b4bb94" />
      <Box at={[0, 1.56, 0.155]} size={[0.43, 0.16, 0.015]} color="#627f7e" />
      <Roof at={[0, 1.91, -0.07]} radius={0.73} />
      {[-0.45, 0.45].map((x) => (
        <Pole key={x} at={[x, 1.39, 0.36]} height={0.35} radius={0.025} />
      ))}
      <Box at={[0, 1.56, 0.36]} size={[0.95, 0.045, 0.045]} />
      <group position={[0.64, 0.54, 0]} rotation={[0, 0, -0.25]}>
        {[-0.12, 0.12].map((x) => (
          <Box key={x} at={[x, 0, 0]} size={[0.04, 1.12, 0.04]} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box
            key={i}
            at={[0, -0.45 + i * 0.18, 0]}
            size={[0.27, 0.035, 0.045]}
          />
        ))}
      </group>
    </group>
  );
}

function StoneBridge() {
  return (
    <group name="stone-bridge">
      <mesh
        position={[0, 0.018, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.5, 1.16, 1]}
      >
        <circleGeometry args={[1, 14]} />
        <meshStandardMaterial color="#92b8b6" roughness={0.5} />
      </mesh>
      <group scale={[1.12, 0.63, 1.4]}>
        <Arch />
      </group>
      <Box at={[0, 0.72, 0]} size={[2, 0.13, 0.67]} color="#bbc0ae" />
      {[-0.33, 0.33].map((z) => (
        <Box key={z} at={[0, 0.9, z]} size={[2, 0.24, 0.12]} color={STONE} />
      ))}
      {[-0.98, 0.98].map((x) => (
        <Box
          key={x}
          at={[x, 0.19, 0]}
          size={[0.27, 0.36, 0.65]}
          color={STONE}
        />
      ))}
    </group>
  );
}

function ShrineTree() {
  return (
    <group name="hollow-shrine-tree">
      {/* An open arch makes a genuine visible hollow, with a recessed shrine. */}
      <group scale={[0.8, 1.05, 0.9]}>
        <Arch color="#8b8068" />
      </group>
      <Box at={[0, 0.43, -0.18]} size={[0.48, 0.72, 0.12]} color="#665f53" />
      <Box at={[0, 0.16, 0]} size={[0.3, 0.13, 0.28]} color={STONE} />
      <Glow at={[0, 0.34, 0.03]} size={[0.11, 0.22, 0.11]} />
      <Boulder at={[0, 1.3, 0]} size={[0.67, 0.46, 0.56]} color="#809777" />
      <Boulder
        at={[-0.46, 1.09, -0.06]}
        size={[0.38, 0.32, 0.4]}
        color="#91a283"
      />
      <Boulder
        at={[0.43, 1.2, 0.02]}
        size={[0.36, 0.3, 0.35]}
        color="#718b71"
      />
      <Beam from={[-0.39, 0.16, 0]} to={[-0.83, 0.045, 0.3]} width={0.13} />
      <Beam from={[0.39, 0.16, 0]} to={[0.78, 0.045, 0.4]} width={0.13} />
      <Beam
        from={[-0.47, 0.79, 0.25]}
        to={[0.47, 0.79, 0.25]}
        width={0.025}
        color="#c2b899"
      />
      {[-0.24, 0, 0.24].map((x) => (
        <Box
          key={x}
          at={[x, 0.7, 0.25]}
          size={[0.065, 0.13, 0.02]}
          color="#e3d9b9"
          rotation={[0, 0, 0.18]}
        />
      ))}
    </group>
  );
}

function RopeBridge() {
  return (
    <group name="alpine-rope-bridge">
      {[-0.86, 0.86].map((x) => (
        <Boulder
          key={x}
          at={[x, 0.2, 0]}
          size={[0.33, 0.28, 0.47]}
          color="#aeb8b5"
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -0.88 + i * 0.22;
        const y = 0.31 + x * x * 0.2;
        return (
          <Box
            key={i}
            at={[x, y, 0]}
            size={[0.18, 0.055, 0.53]}
            color={i % 2 ? WOOD : "#b19e85"}
          />
        );
      })}
      {[-0.3, 0.3].map((z) => (
        <group key={z}>
          {[-0.94, 0.94].map((x) => (
            <Pole key={x} at={[x, 0.61, z]} height={0.98} radius={0.04} />
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const x = -0.94 + i * (1.88 / 6);
            const next = x + 1.88 / 6;
            return (
              <group key={i}>
                <Beam
                  from={[x, 0.77 + x * x * 0.24, z]}
                  to={[next, 0.77 + next * next * 0.24, z]}
                  width={0.024}
                  color="#b5ad93"
                />
                <Beam
                  from={[x, 0.35 + x * x * 0.2, z]}
                  to={[x, 0.77 + x * x * 0.24, z]}
                  width={0.018}
                  color="#b5ad93"
                />
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

function CableCar() {
  return (
    <group name="cable-car-tower">
      <Box at={[0, 0.1, 0]} size={[0.58, 0.2, 0.58]} color={STONE} />
      <Beam
        from={[-0.24, 0.15, 0]}
        to={[-0.1, 1.72, 0]}
        width={0.1}
        color={DARK}
      />
      <Beam
        from={[0.24, 0.15, 0]}
        to={[0.1, 1.72, 0]}
        width={0.1}
        color={DARK}
      />
      <Box at={[0, 1.72, 0]} size={[1.45, 0.12, 0.23]} color={DARK} />
      <Beam
        from={[-0.95, 1.83, 0]}
        to={[0.95, 1.83, 0]}
        width={0.025}
        color="#747975"
      />
      <Pole at={[0.62, 1.55, 0]} height={0.51} radius={0.026} color={DARK} />
      <Box at={[0.62, 1.08, 0]} size={[0.49, 0.48, 0.43]} color="#b38777" />
      <Box at={[0.62, 1.19, 0.22]} size={[0.37, 0.18, 0.015]} color="#b5cdcf" />
      <Box at={[0.62, 1.35, 0]} size={[0.54, 0.07, 0.47]} color={SNOW} />
      <Beam
        from={[-0.2, 0.42, 0]}
        to={[0.17, 1.18, 0]}
        width={0.055}
        color={DARK}
      />
    </group>
  );
}

function SummitCabin() {
  return (
    <group name="summit-refuge-cabin">
      <Boulder at={[0, 0.09, 0]} size={[0.95, 0.16, 0.75]} color="#a8b2ae" />
      <Box at={[0, 0.43, 0]} size={[1.03, 0.63, 0.76]} color="#b49b80" />
      <Roof at={[0, 0.94, 0]} radius={0.9} color={SNOW} />
      <Box at={[0, 0.33, 0.388]} size={[0.22, 0.42, 0.025]} color={DARK} />
      {[-0.32, 0.32].map((x) => (
        <Glow key={x} at={[x, 0.49, 0.39]} size={[0.18, 0.21, 0.02]} />
      ))}
      <Box at={[0.29, 1.02, -0.14]} size={[0.14, 0.43, 0.15]} color={STONE} />
      <Box at={[0, 0.16, 0.55]} size={[0.51, 0.1, 0.27]} color={STONE} />
      <Pole at={[-0.83, 0.52, 0]} height={0.96} radius={0.03} />
      <Box at={[-0.75, 0.87, 0]} size={[0.35, 0.15, 0.045]} color="#bd9b88" />
    </group>
  );
}

function Windmill() {
  return (
    <group name="village-windmill">
      <mesh position={[0, 0.64, 0]} castShadow>
        <cylinderGeometry args={[0.31, 0.47, 1.28, 7]} />
        <meshStandardMaterial color="#d4c9ab" flatShading />
      </mesh>
      <Roof at={[0, 1.42, 0]} radius={0.63} color="#9f8671" />
      <Box at={[0, 0.24, 0.43]} size={[0.18, 0.4, 0.04]} color={DARK} />
      <group position={[0, 1.18, 0.4]} rotation={[0, 0, 0.3]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
            <Box at={[0, 0.43, 0]} size={[0.055, 0.88, 0.045]} color={DARK} />
            <Box
              at={[0.07, 0.56, 0.012]}
              size={[0.18, 0.47, 0.035]}
              color="#e1d9bd"
            />
          </group>
        ))}
        <Boulder at={[0, 0, 0.04]} size={[0.12, 0.12, 0.09]} color={WOOD} />
      </group>
    </group>
  );
}

function Well() {
  return (
    <group name="stone-water-well">
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.37, 12]} />
        <meshStandardMaterial color="#789598" />
      </mesh>
      {[0, 1].flatMap((row) =>
        Array.from({ length: 10 }, (_, i) => {
          const angle = ((i + row * 0.5) * Math.PI) / 5;
          return (
            <Box
              key={`${row}:${i}`}
              at={[
                Math.cos(angle) * 0.43,
                0.14 + row * 0.22,
                Math.sin(angle) * 0.43,
              ]}
              size={[0.26, 0.21, 0.18]}
              rotation={[0, Math.PI / 2 - angle, 0]}
              color={row ? "#b9bba9" : STONE}
            />
          );
        }),
      )}
      {[-0.58, 0.58].map((x) => (
        <Pole key={x} at={[x, 0.7, 0]} height={1.4} radius={0.055} />
      ))}
      <Roof at={[0, 1.46, 0]} radius={0.94} color="#9f8c77" />
      <Beam from={[-0.6, 0.98, 0]} to={[0.6, 0.98, 0]} width={0.07} />
      <Pole at={[0, 0.73, 0]} height={0.5} radius={0.012} color="#bdb398" />
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.075, 0.15, 6]} />
        <meshStandardMaterial color="#8c9894" />
      </mesh>
    </group>
  );
}

function OrchardWagon() {
  return (
    <group name="apple-orchard-wagon">
      {[-0.55, 0.55].map((x, i) => (
        <group key={x} position={[x, 0, -0.42]}>
          <Pole at={[0, 0.43, 0]} height={0.86} radius={0.06} />
          <Boulder
            at={[0, 0.99, 0]}
            size={[0.45, 0.43, 0.42]}
            color={i ? "#95a381" : "#7f9a78"}
          />
          {[-0.22, 0.04, 0.23].map((fruit, j) => (
            <Boulder
              key={fruit}
              at={[fruit, 0.9 + (j % 2) * 0.23, 0.31]}
              size={[0.07, 0.075, 0.07]}
              color="#bb8270"
            />
          ))}
        </group>
      ))}
      <group position={[0, 0, 0.47]} rotation={[0, -0.2, 0]}>
        <Box at={[0, 0.3, 0]} size={[0.77, 0.09, 0.43]} />
        {[-0.22, 0.22].map((z) => (
          <Box
            key={z}
            at={[0, 0.46, z]}
            size={[0.78, 0.23, 0.035]}
            color="#b29a7e"
          />
        ))}
        {[-0.29, 0.29].flatMap((x) =>
          [-0.27, 0.27].map((z) => (
            <mesh
              key={`${x}:${z}`}
              position={[x, 0.19, z]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.17, 0.17, 0.065, 8]} />
              <meshStandardMaterial color={DARK} flatShading />
            </mesh>
          )),
        )}
        <Beam from={[0.36, 0.3, 0]} to={[0.91, 0.2, 0]} width={0.045} />
        {[-0.22, 0, 0.22].map((x) => (
          <Boulder
            key={x}
            at={[x, 0.4, 0]}
            size={[0.11, 0.09, 0.11]}
            color="#b8876b"
          />
        ))}
      </group>
    </group>
  );
}

function PierBoat() {
  return (
    <group name="pier-and-boat">
      {Array.from({ length: 7 }, (_, i) => (
        <Box
          key={i}
          at={[-0.7 + i * 0.21, 0.29, -0.26]}
          size={[0.18, 0.08, 0.6]}
          color={i % 2 ? "#b09b7d" : WOOD}
        />
      ))}
      {[-0.72, 0.58].flatMap((x) =>
        [-0.53, 0.03].map((z) => (
          <Pole
            key={`${x}:${z}`}
            at={[x, 0.27, z]}
            height={0.54}
            radius={0.055}
          />
        )),
      )}
      <group position={[0.03, 0.1, 0.51]} rotation={[0, -0.13, 0]}>
        <mesh
          rotation={[0, 0, Math.PI / 2]}
          scale={[0.33, 0.88, 0.38]}
          castShadow
        >
          <cylinderGeometry args={[0.6, 0.22, 1.35, 5]} />
          <meshStandardMaterial color="#9a8b75" flatShading />
        </mesh>
        <Box at={[0, 0.13, 0]} size={[0.75, 0.035, 0.2]} color="#6d7f7b" />
        {[-0.23, 0.23].map((x) => (
          <Box key={x} at={[x, 0.17, 0]} size={[0.1, 0.05, 0.33]} />
        ))}
        <Beam
          from={[-0.47, 0.17, -0.2]}
          to={[0.47, 0.23, 0.18]}
          width={0.028}
        />
      </group>
      <Beam
        from={[0.58, 0.47, 0.03]}
        to={[0.49, 0.25, 0.44]}
        width={0.018}
        color="#c4b99d"
      />
    </group>
  );
}

function CoastalArch() {
  return (
    <group name="coastal-stone-arch">
      <group scale={[1.13, 1.12, 1]}>
        <Arch color="#bebba7" />
      </group>
      <Boulder at={[-0.84, 0.13, 0]} size={[0.3, 0.23, 0.4]} color="#b7b6a2" />
      <Boulder at={[0.81, 0.14, 0]} size={[0.28, 0.25, 0.37]} color="#b7b6a2" />
      <Boulder at={[-0.42, 1.18, 0]} size={[0.28, 0.1, 0.23]} color="#a9b39a" />
      <Beam
        from={[0.07, 1.39, 0]}
        to={[0.18, 1.35, 0]}
        width={0.03}
        color="#e9e6d4"
      />
      <Beam
        from={[0.18, 1.35, 0]}
        to={[0.29, 1.39, 0]}
        width={0.03}
        color="#e9e6d4"
      />
    </group>
  );
}

function BellTower() {
  return (
    <group name="signal-bell-tower">
      <Box at={[0, 0.14, 0]} size={[0.85, 0.28, 0.74]} color={STONE} />
      {[-0.29, 0.29].flatMap((x) =>
        [-0.23, 0.23].map((z) => (
          <Pole
            key={`${x}:${z}`}
            at={[x, 0.98, z]}
            height={1.45}
            radius={0.065}
            color="#abb4ab"
          />
        )),
      )}
      <Roof at={[0, 1.78, 0]} radius={0.7} color="#7e9996" />
      <Box at={[0, 1.48, 0]} size={[0.66, 0.08, 0.1]} />
      <mesh position={[0, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.23, 0.32, 8]} />
        <meshStandardMaterial
          color="#b7a16b"
          metalness={0.25}
          roughness={0.7}
          flatShading
        />
      </mesh>
      <Pole at={[0, 0.9, 0]} height={0.43} radius={0.015} color="#c1b69a" />
      <Glow at={[0, 0.42, 0]} size={[0.17, 0.22, 0.17]} />
    </group>
  );
}

function LanternCamp() {
  return (
    <group name="tundra-lantern-camp">
      <Boulder at={[0, 0.05, 0]} size={[1.04, 0.09, 0.86]} color={SNOW} />
      <mesh
        position={[-0.18, 0.42, -0.2]}
        rotation={[0, Math.PI / 4, 0]}
        scale={[1, 1, 0.85]}
        castShadow
      >
        <coneGeometry args={[0.78, 0.8, 4]} />
        <meshStandardMaterial color="#a2b7bc" flatShading />
      </mesh>
      <Box
        at={[-0.18, 0.24, 0.26]}
        size={[0.26, 0.38, 0.025]}
        color="#657d85"
      />
      {[-0.77, 0.72].map((x) => (
        <group key={x}>
          <Pole at={[x, 0.42, 0.32]} height={0.8} radius={0.03} />
          <Glow at={[x, 0.72, 0.32]} />
          <Roof at={[x, 0.86, 0.32]} radius={0.17} color={DARK} />
        </group>
      ))}
      <Box at={[0.15, 0.14, 0.69]} size={[0.62, 0.17, 0.18]} />
      <Box at={[0.15, 0.24, 0.69]} size={[0.65, 0.04, 0.21]} color={SNOW} />
    </group>
  );
}

function IceArch() {
  return (
    <group name="tundra-ice-arch">
      <Arch color="#b9d7df" ice />
      <Boulder at={[-0.78, 0.13, 0]} size={[0.3, 0.21, 0.33]} color={SNOW} />
      <Boulder at={[0.78, 0.12, 0]} size={[0.3, 0.2, 0.34]} color={SNOW} />
      {[-0.34, 0, 0.34].map((x, i) => (
        <mesh
          key={x}
          position={[x, 0.91 - Math.abs(x) * 0.25, 0]}
          rotation={[Math.PI, 0, 0]}
        >
          <coneGeometry args={[0.055, i === 1 ? 0.26 : 0.18, 5]} />
          <meshStandardMaterial color="#d4e8eb" flatShading roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function WeatherStation() {
  return (
    <group name="tundra-weather-station">
      {[-0.31, 0.31].map((x) => (
        <Pole
          key={x}
          at={[x, 0.23, 0]}
          height={0.46}
          radius={0.035}
          color={DARK}
        />
      ))}
      <Box at={[0, 0.58, 0]} size={[0.77, 0.52, 0.49]} color="#ccd6d4" />
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          at={[0, 0.4 + i * 0.11, 0.26]}
          size={[0.66, 0.04, 0.045]}
          color="#a2b5b8"
        />
      ))}
      <Roof at={[0, 0.97, 0]} radius={0.68} color={SNOW} />
      <Pole at={[0.66, 0.87, 0]} height={1.74} radius={0.025} color={DARK} />
      <Beam
        from={[0.31, 1.51, 0]}
        to={[0.98, 1.51, 0]}
        width={0.03}
        color={DARK}
      />
      {[-0.29, 0.29].map((x) => (
        <Boulder
          key={x}
          at={[0.66 + x, 1.51, 0]}
          size={[0.1, 0.07, 0.1]}
          color="#9bafaf"
        />
      ))}
      <Box at={[0.7, 1.79, 0]} size={[0.38, 0.1, 0.035]} color="#bc9b85" />
      <Glow at={[-0.51, 0.24, 0.1]} />
    </group>
  );
}

const LANDMARKS: Record<string, readonly (() => ReactNode)[]> = {
  forest: [RangerLookout, StoneBridge, ShrineTree],
  mountains: [RopeBridge, CableCar, SummitCabin],
  village: [Windmill, Well, OrchardWagon],
  coast: [PierBoat, CoastalArch, BellTower],
  tundra: [LanternCamp, IceArch, WeatherStation],
};

export interface ScenicLandmarkProps {
  biome: Biome;
  index: number;
  /** Ground origin in scene units; every model fits a horizontal radius of ~1.3. */
  position: Point;
}

/** Additional landmarks only. Caller controls unlocks and collision-free placement.
 * Invalid indices render nothing rather than wrapping and repeating a landmark.
 */
export function ScenicLandmark({
  biome,
  index,
  position,
}: ScenicLandmarkProps) {
  const Model =
    Number.isInteger(index) && index >= 0
      ? LANDMARKS[biome]?.[index]
      : undefined;
  return Model ? (
    <group position={position} name={`landmark-${biome}-${index}`}>
      <Model />
    </group>
  ) : null;
}
