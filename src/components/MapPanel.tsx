import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useStudyStore } from "../store/useStudyStore";
import { useMedia } from "../lib/hooks";
import { Icon, biomeIcon } from "./Icon";
import { RouteMap2D } from "./RouteMap2D";
const Scene = lazy(() => import("./ScenicRailwayScene"));
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
const biomeNames = {
  forest: "Whispering Woods",
  mountains: "The Alpine Passage",
  village: "Meadowbrook Village",
  coast: "The Coastal Way",
};
export function MapPanel() {
  const { data, settings } = useStudyStore();
  const subject = data.subjects.find((s) => s.id === data.selectedSubject);
  const small = useMedia("(max-width: 760px)");
  const [webgl, setWebgl] = useState(hasWebGL);
  const [reset, setReset] = useState(0);
  const [zoom, setZoom] = useState(1);
  const labels = useRef<HTMLDivElement>(null);
  const unavailable = useCallback(() => setWebgl(false), []);
  const show3D = !small && webgl && data.settings.view === "3d";
  return (
    <section className={`map-panel lighting-${data.settings.lighting}`} aria-labelledby="map-heading">
        <div className="map-topbar">
          <div className="map-line-label">
            <span
              className="line-dot"
              style={{ background: subject?.color ?? "#54866a" }}
            />
            <strong>{subject?.name ?? "Your"} line</strong>
            <span className="map-divider" />
            <span>
              {subject ? biomeNames[subject.biome] : "A new adventure"}
            </span>
          </div>
          <div className="view-switch" aria-label="Map view">
              <button
                disabled={!webgl || small}
                aria-pressed={show3D}
                className={show3D ? "active" : ""}
                onClick={() => settings({ view: "3d" })}
              >
                3D
              </button>
              <button
                aria-pressed={!show3D}
                className={!show3D ? "active" : ""}
                onClick={() => settings({ view: "2d" })}
              >
                2D
              </button>
          </div>
        </div>
        <div className="map-title">
          <span className="eyebrow">
            {data.timer?.kind === "break"
              ? "TAKE A BREATH. YOU’RE DOING WELL."
              : "A QUIETER WAY TO MAKE PROGRESS"}
          </span>
          <h2 id="map-heading">
            {data.timer?.kind === "break"
              ? "Rest awhile, wanderer."
              : "Let your curiosity lead."}
          </h2>
        </div>
        <div className="scene-container">
          <div className="scene-label-layer" ref={labels} />
          {show3D ? (
            <SceneBoundary fallback={<RouteMap2D />}>
              <Suspense
                fallback={
                  <div className="scene-loading">
                    <Icon name="sprout" size={35} />
                    <span>Your little world is growing…</span>
                  </div>
                }
              >
                <Scene
                  reset={reset}
                  zoom={zoom}
                  onUnavailable={unavailable}
                  labels={labels}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            <RouteMap2D />
          )}
        </div>
        <div className="map-bottom">
          <div className="biome-tag">
            <Icon
              name={subject ? biomeIcon[subject.biome] : "leaf"}
              size={15}
            />
            {subject ? biomeNames[subject.biome] : "Room to grow"}
            <span>·</span>
            <select
              aria-label="Scenery lighting"
              value={data.settings.lighting}
              onChange={(e) =>
                settings({
                  lighting: e.target.value as typeof data.settings.lighting,
                })
              }
            >
              <option value="sunrise">Sunrise</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          {show3D && (
            <div className="camera-controls">
              <button
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              >
                <Icon name="plus" size={17} />
              </button>
              <button
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
              >
                <Icon name="minus" size={17} />
              </button>
              <span />
              <button
                aria-label="Reset camera"
                onClick={() => {
                  setReset((n) => n + 1);
                  setZoom(1);
                }}
              >
                <Icon name="reset" size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="map-caption">
          {show3D ? (
            <>
              <Icon name="expand" size={12} />
              Drag to explore · Scroll to zoom · Right-drag to pan
            </>
          ) : (
            <>
              <Icon name="route" size={13} />
              Your journey, simplified. Select any station to explore.
            </>
          )}
        </div>
    </section>
  );
}
