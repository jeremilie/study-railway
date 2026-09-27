import { useState, useEffect } from "react";
import { useStudyStore } from "../store/useStudyStore";
import type { Station } from "../types/study";
import { isComplete } from "../lib/model";
import { StationEditor } from "./PlanEditors";
import { Icon } from "./Icon";
import { MAX_STATIONS } from "../lib/planning";
export function StationList({ expanded = false }: { expanded?: boolean }) {
  const { data, selectStation, moveStation, completeStation } = useStudyStore();
  const stations = data.stations.filter(
    (s) => s.subjectId === data.selectedSubject,
  );
  const subject = data.subjects.find((s) => s.id === data.selectedSubject);
  const [editing, setEditing] = useState<Station | "new" | null>(null);
  const [details, setDetails] = useState(data.selectedStation);
  useEffect(() => setDetails(data.selectedStation), [data.selectedStation]);
  return (
    <section
      className={`station-panel panel ${expanded ? "expanded-planner" : ""}`}
      aria-labelledby="stations-heading"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">EVERY STOP IS A SMALL VICTORY</span>
          <h2 id="stations-heading">
            Your stations <span className="count-pill">{stations.length}</span>
          </h2>
        </div>
        <button
          className="text-button"
          data-focus-fallback
          disabled={!!data.timer || !subject || stations.length >= MAX_STATIONS}
          onClick={() => setEditing("new")}
        >
          <Icon name="plus" size={16} />
          Add station
        </button>
      </div>
      {stations.length >= MAX_STATIONS && (
        <p className="station-limit" role="status">
          Maximum of 10 stations reached.
        </p>
      )}
      <ol className="station-list">
        {stations.map((station, index) => (
          <li
            key={station.id}
            className={`${data.selectedStation === station.id ? "current" : ""} ${isComplete(station) ? "completed" : ""}`}
          >
            <div className="station-line" />
            <button
              className="station-main"
              disabled={!!data.timer}
              aria-pressed={data.selectedStation === station.id}
              aria-expanded={expanded || details === station.id}
              aria-controls={`station-details-${station.id}`}
              onClick={() => {
                selectStation(station.id);
                setDetails(details === station.id ? "" : station.id);
              }}
            >
              <span className="station-marker">
                {isComplete(station) ? (
                  <Icon name="check" size={15} />
                ) : (
                  <span />
                )}
              </span>
              <span className="station-info">
                <strong>
                  {station.title}
                  {data.selectedStation === station.id && (
                    <span className="next-label">
                      {data.timer ? "ON THE WAY" : "NEXT STOP"}
                    </span>
                  )}
                </strong>
                <span className="station-subtitle">
                  {isComplete(station)
                    ? "Destination reached"
                    : `${station.completed} of ${station.target} focus sessions`}
                </span>
              </span>
              <span className="session-dots" aria-hidden="true">
                {Array.from({ length: Math.min(station.target, 6) }, (_, i) => (
                  <i
                    key={i}
                    className={i < station.completed ? "filled" : ""}
                  />
                ))}
                {station.target > 6 && <small>+{station.target - 6}</small>}
              </span>
            </button>
            <button
              className="icon-button station-edit"
              disabled={!!data.timer}
              aria-label={`Edit ${station.title}`}
              onClick={() => setEditing(station)}
            >
              <Icon name="edit" size={15} />
            </button>
            {(expanded || details === station.id) && (
              <div
                className="station-details"
                id={`station-details-${station.id}`}
              >
                <p>
                  {station.description ||
                    "No notes yet. Make this destination your own."}
                </p>
                <div>
                  <button
                    className="text-button"
                    disabled={
                      !!data.timer || station.completed >= station.target
                    }
                    onClick={() => completeStation(station.id)}
                  >
                    <Icon name="check" size={14} />
                    {station.manualComplete
                      ? "Mark unfinished"
                      : "Mark complete"}
                  </button>
                  <span className="reorder-actions">
                    <button
                      className="icon-button small"
                      disabled={!!data.timer || index === 0}
                      aria-label={`Move ${station.title} up`}
                      onClick={() => moveStation(station.id, -1)}
                    >
                      <Icon name="up" size={15} />
                    </button>
                    <button
                      className="icon-button small"
                      disabled={!!data.timer || index === stations.length - 1}
                      aria-label={`Move ${station.title} down`}
                      onClick={() => moveStation(station.id, 1)}
                    >
                      <Icon name="moveDown" size={15} />
                    </button>
                  </span>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
      {!stations.length && (
        <div className="empty-state">
          <Icon name="pin" size={32} />
          <h3>Where would you like to go?</h3>
          <p>
            {subject
              ? "Give your first study goal a place on the map."
              : "Create a subject line to start your journey."}
          </p>
          {subject && (
            <button
              className="secondary"
              disabled={!!data.timer}
              onClick={() => setEditing("new")}
            >
              Add your first station
              <Icon name="plus" size={16} />
            </button>
          )}
        </div>
      )}
      <div className="station-footer">
        <Icon name="route" size={15} />
        <span>Little by little is how we get there.</span>
      </div>
      {editing && (
        <StationEditor
          station={editing === "new" ? undefined : editing}
          subjectId={data.selectedSubject}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
