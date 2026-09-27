import {
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  memo,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Html,
  Line,
  OrbitControls,
  OrthographicCamera,
} from "@react-three/drei";
import {
  CatmullRomCurve3,
  Group,
  Vector3,
  InstancedMesh,
  Object3D,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useStudyStore } from "../store/useStudyStore";
import { useMedia, useNow } from "../lib/hooks";
import { isComplete } from "../lib/model";
import { routeCurve, stationPosition } from "../lib/routes";
import { NatureBiome } from "./NatureBiome";
import { StationBuilding } from "./StationBuilding";
import { sceneLayout, trainRoutePosition } from "../lib/sceneLayout";
import { trainUnits } from "../lib/journey";
import { ScenicLandmark } from "./ScenicLandmark";
import { TundraDetails } from "./TundraDetails";

const MemoNatureBiome = memo(NatureBiome);
function Sleepers({
  curve,
  snowy,
}: {
  curve: CatmullRomCurve3;
  snowy: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);
  const count = Math.round((curve.getLength() / routeCurve.getLength()) * 100);
  useLayoutEffect(() => {
    const object = new Object3D();
    for (let i = 0; i < count; i++) {
      const p = curve.getPointAt(i / count);
      const tangent = curve.getTangentAt(i / count);
      object.position.set(p.x, 0.185, p.z);
      object.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
      object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [curve, count]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} receiveShadow>
      <boxGeometry args={[0.38, 0.035, 0.08]} />
      <meshStandardMaterial color={snowy ? "#eaf0ec" : "#95836a"} />
    </instancedMesh>
  );
}

const Rails = memo(function Rails({
  color,
  curve,
  snowy,
}: {
  color: string;
  curve: CatmullRomCurve3;
  snowy: boolean;
}) {
  const rails = useMemo(
    () =>
      [-0.12, 0.12].map(
        (offset) =>
          new CatmullRomCurve3(
            Array.from({ length: 120 }, (_, i) => {
              const t = i / 120;
              const point = curve.getPointAt(t);
              const tangent = curve.getTangentAt(t);
              return point.add(
                new Vector3(-tangent.z, 0, tangent.x).multiplyScalar(offset),
              );
            }),
            true,
          ),
      ),
    [curve],
  );
  return (
    <group>
      <mesh scale={[1, 0.35, 1]}>
        <tubeGeometry args={[curve, 240, 0.22, 6, true]} />
        <meshStandardMaterial color={snowy ? "#cfddd8" : "#c5b89c"} />
      </mesh>
      {rails.map((rail, i) => (
        <mesh key={i}>
          <tubeGeometry args={[rail, 160, 0.027, 5, true]} />
          <meshStandardMaterial color="#6c7164" />
        </mesh>
      ))}
      <Sleepers curve={curve} snowy={snowy} />
      <Line
        points={curve
          .getPoints(120)
          .map((p) => [p.x, 0.235, p.z] as [number, number, number])}
        color={color}
        lineWidth={1.3}
        transparent
        opacity={0.48}
      />
    </group>
  );
});
function Train({
  progress,
  moving,
  reduced,
  curve,
}: {
  progress: number;
  moving: boolean;
  reduced: boolean;
  curve: CatmullRomCurve3;
}) {
  const group = useRef<Group>(null);
  const current = useRef(progress);
  const { invalidate } = useThree();
  useFrame((_, delta) => {
    if (!group.current) return;
    current.current =
      reduced || !moving
        ? progress
        : current.current +
          (progress - current.current) * Math.min(1, delta * 3);
    const t = ((current.current % 1) + 1) % 1;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    group.current.position.set(p.x, 0.28, p.z);
    group.current.rotation.y = Math.atan2(tangent.x, tangent.z);
    if (moving && !reduced) invalidate();
  });
  return (
    <group ref={group} scale={1.12}>
      <mesh position={[0, 0.22, 0.17]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.5]} />
        <meshStandardMaterial color="#c17e4f" />
      </mesh>
      <mesh position={[0, 0.37, -0.02]} castShadow>
        <boxGeometry args={[0.33, 0.3, 0.25]} />
        <meshStandardMaterial color="#e2bd80" />
      </mesh>
      <mesh position={[0, 0.55, -0.02]} castShadow>
        <boxGeometry args={[0.4, 0.07, 0.35]} />
        <meshStandardMaterial color="#526c58" />
      </mesh>
      <mesh position={[0, 0.42, 0.28]}>
        <cylinderGeometry args={[0.055, 0.05, 0.22, 8]} />
        <meshStandardMaterial color="#56675a" />
      </mesh>
      <mesh position={[0, 0.39, 0.111]}>
        <planeGeometry args={[0.2, 0.16]} />
        <meshStandardMaterial color="#c6d9ca" />
      </mesh>
      {[-0.18, 0.18].flatMap((x) =>
        [-0.05, 0.3].map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.04, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.09, 0.09, 0.04, 10]} />
            <meshStandardMaterial color="#48534a" />
          </mesh>
        )),
      )}
      <group position={[0, 0, -0.57]}>
        <mesh position={[0, 0.21, 0]} castShadow>
          <boxGeometry args={[0.31, 0.28, 0.48]} />
          <meshStandardMaterial color="#dbac71" />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.36, 0.07, 0.52]} />
          <meshStandardMaterial color="#6f8266" />
        </mesh>
        {[-0.161, 0.161].flatMap((x) =>
          [-0.13, 0.1].map((z) => (
            <mesh
              key={`${x}-${z}`}
              position={[x, 0.25, z]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[0.14, 0.13]} />
              <meshStandardMaterial color="#e9ead7" side={2} />
            </mesh>
          )),
        )}
      </group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0.03 + i * 0.07, 0.7 + i * 0.18, 0.27 - i * 0.12]}
        >
          <icosahedronGeometry args={[0.06 + i * 0.03, 1]} />
          <meshStandardMaterial
            color="#f5f3e6"
            transparent
            opacity={0.6 - i * 0.15}
          />
        </mesh>
      ))}
    </group>
  );
}
function SceneContent({
  reset,
  zoom,
  onUnavailable,
  labels,
}: {
  reset: number;
  zoom: number;
  onUnavailable: () => void;
  labels: RefObject<HTMLDivElement | null>;
}) {
  const { data, selectStation } = useStudyStore();
  const { camera, invalidate, size, gl } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const now = useNow();
  const subject = data.subjects.find((s) => s.id === data.selectedSubject);
  const stations = data.stations.filter(
    (s) => s.subjectId === data.selectedSubject,
  );
  const layout = useMemo(() => sceneLayout(stations.length), [stations.length]);
  const curve = layout.curve;
  const timer = data.timer;
  const units = trainUnits(data, data.selectedSubject, now);
  const trainProgress = trainRoutePosition(units, stations.length);
  const fit = Math.min(
    size.width / (13.2 + layout.extensionX * 1.05 + layout.extensionZ * 0.65),
    size.height / (9.3 + layout.extensionZ * 0.8 + layout.extensionX * 0.45),
  );
  const previousFit = useRef(0);
  const previousZoom = useRef(zoom);
  const previousCenter = useRef(new Vector3());
  const previousReset = useRef(-1);
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      onUnavailable();
    };
    gl.domElement.addEventListener("webglcontextlost", handler);
    return () => gl.domElement.removeEventListener("webglcontextlost", handler);
  }, [gl, onUnavailable]);
  useLayoutEffect(() => {
    if (!("isOrthographicCamera" in camera)) return;
    const center = new Vector3(...layout.center);
    if (!previousFit.current || previousReset.current !== reset) {
      camera.position.set(center.x + 11, center.y + 9.7, center.z + 13);
      controls.current?.target.copy(center);
      camera.zoom = fit * zoom;
    } else {
      camera.zoom *=
        ((fit / previousFit.current) * zoom) / previousZoom.current;
      const shift = center.clone().sub(previousCenter.current);
      camera.position.add(shift);
      controls.current?.target.add(shift);
    }
    previousFit.current = fit;
    previousZoom.current = zoom;
    previousCenter.current.copy(center);
    previousReset.current = reset;
    camera.updateProjectionMatrix();
    controls.current?.update();
    invalidate();
  }, [fit, zoom, reset, layout, camera, invalidate]);
  useEffect(() => {
    gl.domElement.dataset.trainUnits = units.toFixed(5);
    gl.domElement.dataset.stationCount = String(stations.length);
  }, [gl, units, stations.length]);
  const evening = data.settings.lighting === "evening";
  const sunrise = data.settings.lighting === "sunrise";
  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[11, 10, 13]}
        zoom={40}
        near={0.1}
        far={150}
      />
      <ambientLight
        intensity={evening ? 1.1 : 1.8}
        color={evening ? "#bfd0ef" : "#fff8e7"}
      />
      <directionalLight
        castShadow
        position={[-4, 9, 6]}
        intensity={evening ? 2 : 2.8}
        color={sunrise ? "#ffd3a0" : "#fff1d6"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-normalBias={0.05}
      />
      <group position={[0, -0.2, 0]}>
        <MemoNatureBiome
          biome={subject?.biome ?? "forest"}
          extensionX={layout.extensionX}
          extensionZ={layout.extensionZ}
        />
        <Rails
          color={subject?.color ?? "#54866a"}
          curve={curve}
          snowy={subject?.biome === "tundra"}
        />
        {layout.landmarks.map((position, index) => (
          <ScenicLandmark
            key={`${subject?.biome}-${index}`}
            biome={subject?.biome ?? "forest"}
            index={index}
            position={position}
          />
        ))}
        {subject?.biome === "tundra" && (
          <TundraDetails bounds={layout.bounds} reducedMotion={reduced} />
        )}
        {stations.map((station, i) => {
          const p = curve.getPointAt(stationPosition(i, stations.length));
          const tangent = curve.getTangentAt(
            stationPosition(i, stations.length),
          );
          const outward = new Vector3(-tangent.z, 0, tangent.x).multiplyScalar(
            -0.63,
          );
          const selected = station.id === data.selectedStation;
          return (
            <group key={station.id} position={[p.x, 0.02, p.z]}>
              <mesh position={[outward.x, 0.12, outward.z]} receiveShadow>
                <boxGeometry args={[1, 0.18, 0.6]} />
                <meshStandardMaterial
                  color={isComplete(station) ? "#eee6b4" : "#d8c7a8"}
                  emissive={isComplete(station) ? "#c9b364" : "#000000"}
                  emissiveIntensity={0.2}
                />
              </mesh>
              <StationBuilding
                id={station.id}
                position={[outward.x, 0.2, outward.z]}
                snowy={subject?.biome === "tundra"}
                complete={isComplete(station)}
              />
              <Html
                portal={
                  labels.current ? { current: labels.current } : undefined
                }
                position={[outward.x, selected ? 1.55 : 1.05, outward.z]}
                center
                zIndexRange={[4, 0]}
              >
                <button
                  className={`scene-label ${selected ? "selected" : ""}`}
                  disabled={!!timer}
                  onClick={() => selectStation(station.id)}
                  aria-label={`Select station ${station.title}`}
                >
                  <span style={{ background: subject?.color }} />
                  {station.title}
                  {selected && (
                    <small>
                      {timer?.kind === "focus"
                        ? "ON THE WAY"
                        : isComplete(station)
                          ? "DESTINATION REACHED"
                          : "YOUR NEXT STOP"}
                    </small>
                  )}
                </button>
              </Html>
            </group>
          );
        })}
        <Train
          key={data.selectedSubject}
          curve={curve}
          progress={trainProgress}
          moving={timer?.status === "running"}
          reduced={reduced}
        />
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.94, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.11} />
      </mesh>
      <OrbitControls
        ref={controls}
        enableDamping={!reduced}
        dampingFactor={0.07}
        minZoom={Math.max(1, fit * 0.4)}
        maxZoom={Math.max(100, fit * 4)}
        maxPolarAngle={Math.PI / 2.4}
        minPolarAngle={0.35}
        enablePan
      />
    </>
  );
}
export default function ScenicRailwayScene(props: {
  reset: number;
  zoom: number;
  onUnavailable: () => void;
  labels: RefObject<HTMLDivElement | null>;
}) {
  return (
    <Canvas
      shadows
      frameloop="demand"
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      fallback={<p>3D isn’t available. Switch to the 2D route above.</p>}
      aria-label="Interactive miniature railway landscape. Drag to orbit, scroll to zoom, right-drag to pan. All stations are also available in the list below."
      role="group"
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
