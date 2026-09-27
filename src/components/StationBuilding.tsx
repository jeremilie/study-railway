import { Cottage } from "./NatureBiome";
import { stationStyle } from "../lib/planning";

export function StationBuilding({
  id,
  position,
  snowy,
  complete,
}: {
  id: string;
  position: [number, number, number];
  snowy: boolean;
  complete: boolean;
}) {
  const style = stationStyle(id);
  const roof = snowy ? "#f2f4ee" : "#6b806b";
  const wall = complete ? "#eddaa4" : snowy ? "#c5bda8" : "#e3d6b8";
  return (
    <group position={position} scale={0.62}>
      {style === 0 ? (
        <Cottage position={[0, 0, 0]} color={wall} />
      ) : style === 1 ? (
        <>
          <mesh position={[0, 0.33, 0]} castShadow>
            <boxGeometry args={[1.1, 0.65, 0.58]} />
            <meshStandardMaterial color={wall} />
          </mesh>
          <mesh
            position={[0, 0.78, 0]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[1.25, 1, 0.75]}
            castShadow
          >
            <coneGeometry args={[0.67, 0.35, 4]} />
            <meshStandardMaterial color={roof} />
          </mesh>
          <mesh position={[0.4, 0.75, 0.02]} castShadow>
            <boxGeometry args={[0.25, 1.3, 0.28]} />
            <meshStandardMaterial color={wall} />
          </mesh>
          <mesh position={[0.4, 1.45, 0.02]} castShadow>
            <coneGeometry args={[0.25, 0.3, 4]} />
            <meshStandardMaterial color={roof} />
          </mesh>
          <mesh position={[0.4, 1.04, 0.169]}>
            <circleGeometry args={[0.085, 12]} />
            <meshStandardMaterial color="#faf0cc" />
          </mesh>
          <mesh position={[0.4, 1.055, 0.177]}>
            <boxGeometry args={[0.014, 0.085, 0.012]} />
            <meshStandardMaterial color="#6c745f" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[-0.2, 0.32, 0]} castShadow>
            <boxGeometry args={[0.7, 0.64, 0.65]} />
            <meshStandardMaterial color={wall} />
          </mesh>
          <mesh
            position={[-0.2, 0.82, 0]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[1, 1, 0.85]}
            castShadow
          >
            <coneGeometry args={[0.65, 0.52, 4]} />
            <meshStandardMaterial color={roof} />
          </mesh>
          <mesh position={[0.42, 0.57, 0]} castShadow>
            <boxGeometry args={[0.65, 0.08, 0.77]} />
            <meshStandardMaterial color={roof} />
          </mesh>
          {[0.2, 0.65].map((x) => (
            <mesh key={x} position={[x, 0.27, 0.27]} castShadow>
              <boxGeometry args={[0.045, 0.55, 0.045]} />
              <meshStandardMaterial color="#8c795d" />
            </mesh>
          ))}
          <mesh position={[0.4, 0.15, 0]}>
            <boxGeometry args={[0.48, 0.07, 0.2]} />
            <meshStandardMaterial color="#8e7559" />
          </mesh>
        </>
      )}
      {style !== 0 &&
        [-0.32, 0].map((x) => (
          <mesh key={x} position={[x, 0.35, 0.33]}>
            <planeGeometry args={[0.14, 0.2]} />
            <meshStandardMaterial
              color="#f9db99"
              emissive="#d6a348"
              emissiveIntensity={snowy ? 0.35 : 0.06}
            />
          </mesh>
        ))}
      {snowy && (
        <>
          <mesh
            position={[0, 0.84, 0]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[style === 1 ? 1.25 : 1, 1, 0.85]}
          >
            <coneGeometry args={[0.64, 0.27, 4]} />
            <meshStandardMaterial color="#f1f5ef" />
          </mesh>
          <mesh position={[-0.56, 0.29, 0.2]}>
            <boxGeometry args={[0.09, 0.14, 0.09]} />
            <meshStandardMaterial
              color="#f5ce80"
              emissive="#e7b053"
              emissiveIntensity={0.55}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
