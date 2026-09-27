import { useMemo, useEffect } from "react";
import { DoubleSide, Shape, ExtrudeGeometry } from "three";
import type { Biome } from "../types/study";

export function Tree({
  x,
  z,
  scale = 1,
  color = "#739578",
  round = false,
  snowy = false,
}: {
  x: number;
  z: number;
  scale?: number;
  color?: string;
  round?: boolean;
  snowy?: boolean;
}) {
  return (
    <group position={[x, 0.06, z]} scale={scale}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.09, 0.8, 5]} />
        <meshStandardMaterial color="#837a59" />
      </mesh>
      {round ? (
        <mesh position={[0, 0.95, 0]} castShadow>
          <icosahedronGeometry args={[0.52, 1]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ) : (
        [0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.6 + i * 0.32, 0]} castShadow>
            <coneGeometry args={[0.46 - i * 0.095, 0.83 - i * 0.12, 6]} />
            <meshStandardMaterial
              color={
                snowy
                  ? i === 2
                    ? "#edf2ed"
                    : "#a4bab0"
                  : i === 2
                    ? "#97ad82"
                    : color
              }
              flatShading
            />
          </mesh>
        ))
      )}
    </group>
  );
}
function Mountain({
  x,
  z,
  scale = 1,
  snow = false,
}: {
  x: number;
  z: number;
  scale?: number;
  snow?: boolean;
}) {
  return (
    <group position={[x, 0, z]} scale={[scale, scale, scale * 0.85]}>
      <mesh position={[0, 1.05, 0]} rotation={[0, 0.4, 0]} castShadow>
        <coneGeometry args={[1.5, 2.7, 5]} />
        <meshStandardMaterial color="#98a791" flatShading />
      </mesh>
      <mesh position={[-0.6, 0.65, 0.5]} rotation={[0, 0.8, 0]} castShadow>
        <coneGeometry args={[0.9, 1.7, 5]} />
        <meshStandardMaterial color="#abb59a" flatShading />
      </mesh>
      {snow && (
        <mesh position={[0, 2.03, 0]} rotation={[0, 0.4, 0]}>
          <coneGeometry args={[0.43, 0.77, 5]} />
          <meshStandardMaterial color="#edeede" flatShading />
        </mesh>
      )}
    </group>
  );
}
export function Cottage({
  position,
  scale = 1,
  color = "#dfcfad",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.29, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.75, 0.55, 0.52]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.62, 0.4, 4]} />
        <meshStandardMaterial color="#ab7960" flatShading />
      </mesh>
      <mesh position={[0, 0.22, 0.267]}>
        <planeGeometry args={[0.16, 0.32]} />
        <meshStandardMaterial color="#718471" />
      </mesh>
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.32, 0.269]}>
          <planeGeometry args={[0.14, 0.17]} />
          <meshStandardMaterial color="#f8e5ad" />
        </mesh>
      ))}
      <mesh position={[0.22, 0.8, -0.12]}>
        <boxGeometry args={[0.1, 0.26, 0.1]} />
        <meshStandardMaterial color="#b8a88f" />
      </mesh>
    </group>
  );
}
export function NatureBiome({
  biome,
  extensionX = 0,
  extensionZ = 0,
}: {
  biome: Biome;
  extensionX?: number;
  extensionZ?: number;
}) {
  const snowy = biome === "tundra";
  const island = useMemo(() => {
    const shape = new Shape();
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 1 + Math.sin(i * 9.3) * 0.03;
      const x = Math.cos(a) * 5.55 * r + Math.max(0, Math.cos(a)) * extensionX;
      const y = Math.sin(a) * 4.3 * r + Math.max(0, Math.sin(a)) * extensionZ;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    return new ExtrudeGeometry(shape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 1,
      steps: 1,
    });
  }, [extensionX, extensionZ]);
  useEffect(() => () => island.dispose(), [island]);
  const trees = useMemo(
    () =>
      Array.from({ length: biome === "forest" ? 54 : 28 }, (_, i) => {
        const angle = i * 2.39996;
        const rad = 0.8 + ((i % 8) / 8) * 1.9;
        return {
          x: -1.2 + Math.cos(angle) * rad,
          z: -0.8 + Math.sin(angle) * rad * 0.66,
          scale: 0.48 + ((i * 7) % 11) / 17,
        };
      }).filter((t) => !(t.x > -0.5 && t.z > -0.7)),
    [biome],
  );
  return (
    <group>
      <mesh
        geometry={island}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.63, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={snowy ? "#e3ece7" : biome === "coast" ? "#d4d2af" : "#b8c7a2"}
          flatShading
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.5, 0.03, -0.05]}
        scale={[biome === "coast" ? 3.2 : 1.85, 1.12, 1]}
      >
        <circleGeometry args={[1, 40]} />
        <meshStandardMaterial
          color={snowy ? "#b6cfd8" : "#8bbfc0"}
          roughness={snowy ? 0.65 : 0.3}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, -0.12]}
        position={[1.5, 0.025, -0.05]}
        scale={[biome === "coast" ? 3.4 : 2, 1.24, 1]}
      >
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color={snowy ? "#f1f4ef" : "#d1cfb0"} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[1.5 + i * 0.27, 0.045, -0.1 + i * 0.23]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.7 - i * 0.1, 0.013, 1]}
        >
          <circleGeometry args={[1, 24]} />
          <meshStandardMaterial
            color="#c5dddd"
            transparent
            opacity={0.55}
            side={DoubleSide}
          />
        </mesh>
      ))}
      <Mountain
        x={-2.6}
        z={-2.4}
        scale={biome === "mountains" ? 1.4 : 0.9}
        snow={biome === "mountains" || snowy}
      />
      <Mountain
        x={-0.8}
        z={-3.1}
        scale={biome === "mountains" ? 1.05 : 0.72}
        snow={biome === "mountains" || snowy}
      />
      {trees.map((tree, i) => (
        <Tree
          key={i}
          {...tree}
          round={biome === "village"}
          snowy={snowy}
          color={["#678b70", "#789878", "#8ba17b", "#527961"][i % 4]}
        />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <Tree
          key={`edge${i}`}
          x={-4.4 + i * 0.8}
          z={3.25 + Math.sin(i * 2) * 0.28}
          scale={0.38 + (i % 3) * 0.1}
          color="#769778"
          snowy={snowy}
        />
      ))}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh
          key={`rock${i}`}
          position={[
            3 + Math.sin(i * 3) * 1.7,
            0.11,
            -2 + Math.cos(i * 5) * 1.4,
          ]}
          scale={[0.2 + (i % 3) * 0.08, 0.2, 0.3]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#b1b5a1" flatShading />
        </mesh>
      ))}
      {biome === "village" && (
        <>
          <Cottage position={[-0.8, 0.07, 0.1]} />
          <Cottage position={[-2.2, 0.07, 0.5]} scale={0.8} />
          <Cottage position={[-1.4, 0.07, 1.1]} scale={0.65} color="#eee2c1" />
        </>
      )}
      {biome === "coast" && (
        <group position={[3.7, 0.03, -2]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 1.6, 9]} />
            <meshStandardMaterial color="#f0e9d5" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.18, 9]} />
            <meshStandardMaterial color="#ad7360" />
          </mesh>
          <mesh position={[0, 1.75, 0]}>
            <coneGeometry args={[0.3, 0.3, 9]} />
            <meshStandardMaterial color="#667b77" />
          </mesh>
        </group>
      )}
      <group position={[1, 0.05, 1.5]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.6, 0.06, 0.22]} />
          <meshStandardMaterial color="#9a7d5f" />
        </mesh>
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.06, 0]}>
            <boxGeometry args={[0.06, 0.18, 0.19]} />
            <meshStandardMaterial color="#6e7963" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
