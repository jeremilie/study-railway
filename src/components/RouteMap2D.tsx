import { useStudyStore } from "../store/useStudyStore";
import { isComplete } from "../lib/model";
import { Icon, biomeIcon } from "./Icon";
import { useNow } from "../lib/hooks";
import { trainUnits } from "../lib/journey";
export function RouteMap2D() {
  const { data, selectStation } = useStudyStore();
  const subject = data.subjects.find((s) => s.id === data.selectedSubject);
  const stations = data.stations.filter(
    (s) => s.subjectId === data.selectedSubject,
  );
  const now = useNow();
  const units = trainUnits(data, data.selectedSubject, now);
  const leg = Math.min(Math.max(0, stations.length - 1), Math.floor(units));
  const legPercent = Math.round((units - leg) * 100);
  return (
    <div
      className={`route-2d ${subject?.biome ?? ""}`}
      data-train-units={units.toFixed(5)}
      style={
        { "--line-color": subject?.color ?? "#54866a" } as React.CSSProperties
      }
    >
      <div className="route-2d-scenery">
        <Icon name={subject ? biomeIcon[subject.biome] : "sprout"} size={60} />
        <span>A little further, one station at a time.</span>
      </div>
      {stations.length > 0 && (
        <div className="route-train-progress">
          <Icon name="train" size={18} />
          <progress
            aria-label="Train progress toward next station"
            value={legPercent}
            max={100}
          />
          <span>
            {legPercent}% to {stations[leg]?.title}
          </span>
        </div>
      )}
      <ol>
        {stations.map((station, i) => (
          <li key={station.id}>
            <button
              disabled={!!data.timer}
              className={data.selectedStation === station.id ? "selected" : ""}
              onClick={() => selectStation(station.id)}
              aria-pressed={data.selectedStation === station.id}
            >
              <span className="map-stop">
                {isComplete(station) ? <Icon name="check" size={16} /> : i + 1}
              </span>
              <span>
                <strong>{station.title}</strong>
                <small>
                  {station.completed} of {station.target} sessions
                  {isComplete(station) ? " · Complete" : ""}
                </small>
              </span>
              {data.selectedStation === station.id && (
                <Icon name="train" size={23} />
              )}
            </button>
          </li>
        ))}
      </ol>
      {!stations.length && (
        <p className="empty-copy">
          Your route is waiting. Add a station below to begin.
        </p>
      )}
    </div>
  );
}
