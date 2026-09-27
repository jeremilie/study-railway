import { useEffect, useState } from "react";
import { useStudyStore } from "../store/useStudyStore";
import { remaining } from "../lib/model";
import { useNow } from "../lib/hooks";
import { AudioPanel } from "./AudioPanel";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
export function TimerPanel() {
  const store = useStudyStore();
  const { data } = store;
  const { timer, settings } = data;
  const now = useNow();
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [custom, setCustom] = useState(false);
  const [focus, setFocus] = useState(settings.focus);
  const [rest, setRest] = useState(settings.break);
  const [cancel, setCancel] = useState(false);
  useEffect(() => {
    if (!timer) setCancel(false);
  }, [timer]);
  const kind = timer?.kind ?? mode;
  const seconds = timer ? remaining(timer, now) : settings[kind] * 60;
  const progress = timer ? 1 - seconds / timer.duration : 0;
  const minutes = Math.floor(Math.ceil(seconds) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (Math.ceil(seconds) % 60).toString().padStart(2, "0");
  const station = data.stations.find((s) => s.id === data.selectedStation);
  const subject = data.subjects.find((s) => s.id === data.selectedSubject);
  useEffect(() => {
    document.title = timer
      ? `${minutes}:${secs} · ${timer.kind === "focus" ? "Focus" : "Rest"} — Study Railway`
      : "Study Railway — A little further, every day.";
  }, [timer, minutes, secs]);
  return (
    <section className="timer-card panel" aria-labelledby="timer-heading">
      <div className="card-heading">
        <h2 id="timer-heading">
          <Icon name="clock" size={18} />
          Time to settle in
        </h2>
        <span className="tiny-leaf">
          <Icon name="sprout" size={17} />
        </span>
      </div>
      <div className="timer-tabs" aria-label="Session type">
        <button
          disabled={!!timer}
          className={kind === "focus" ? "active" : ""}
          aria-pressed={kind === "focus"}
          onClick={() => setMode("focus")}
        >
          <Icon name="book" size={15} />
          Focus
        </button>
        <button
          disabled={!!timer}
          className={kind === "break" ? "active" : ""}
          aria-pressed={kind === "break"}
          onClick={() => setMode("break")}
        >
          <Icon name="coffee" size={15} />
          Short break
        </button>
      </div>
      <div className="timer-dial">
        <svg viewBox="0 0 220 220" aria-hidden="true">
          <circle className="dial-track" cx="110" cy="110" r="101" />
          <circle
            className="dial-progress"
            cx="110"
            cy="110"
            r="101"
            strokeDasharray="634.6"
            strokeDashoffset={634.6 * (1 - progress)}
            transform="rotate(-90 110 110)"
          />
          <circle cx="110" cy="9" r="4" fill="#65836a" />
        </svg>
        <div
          className="timer-digits"
          role="timer"
          aria-label={`${minutes} minutes ${secs} seconds remaining`}
        >
          <span>
            {minutes}
            <i>:</i>
            {secs}
          </span>
          <small>
            {timer?.status === "paused"
              ? "A MOMENT TO BREATHE"
              : kind === "break"
                ? "REST IS PART OF THE JOURNEY"
                : timer
                  ? "ONE THING AT A TIME"
                  : "A LITTLE FOCUS GOES A LONG WAY"}
          </small>
        </div>
      </div>
      <div className="timer-presets">
        <button
          disabled={!!timer}
          className={
            settings.focus === 25 && settings.break === 5 ? "selected" : ""
          }
          aria-label="25 minute focus, 5 minute break"
          aria-pressed={settings.focus === 25 && settings.break === 5}
          onClick={() => store.settings({ focus: 25, break: 5 })}
        >
          25 / 5
        </button>
        <button
          disabled={!!timer}
          className={
            settings.focus === 50 && settings.break === 10 ? "selected" : ""
          }
          aria-label="50 minute focus, 10 minute break"
          aria-pressed={settings.focus === 50 && settings.break === 10}
          onClick={() => store.settings({ focus: 50, break: 10 })}
        >
          50 / 10
        </button>
        <button
          disabled={!!timer}
          onClick={() => {
            setFocus(settings.focus);
            setRest(settings.break);
            setCustom(true);
          }}
        >
          <Icon name="settings" size={13} />
          Custom
        </button>
      </div>
      <div className="destination">
        <span
          className="destination-dot"
          style={{ background: subject?.color }}
        />
        <div>
          <span>
            {kind === "break" ? "A WELL-EARNED PAUSE" : "YOUR NEXT STOP"}
          </span>
          <strong>
            {kind === "break"
              ? "A quiet moment by the lake"
              : (station?.title ?? "Choose a station to begin")}
          </strong>
        </div>
        {station && kind === "focus" && <Icon name="flag" size={18} />}
      </div>
      {!timer ? (
        <button
          className="primary start-button"
          disabled={kind === "focus" && !station}
          onClick={() => store.start(kind)}
        >
          <Icon name="play" size={17} />
          {kind === "focus" ? "Begin focus journey" : "Take a peaceful break"}
          <Icon name="right" size={17} />
        </button>
      ) : (
        <>
          <button
            className="primary start-button"
            onClick={timer.status === "running" ? store.pause : store.resume}
          >
            <Icon
              name={timer.status === "running" ? "pause" : "play"}
              size={17}
            />
            {timer.status === "running" ? "Pause journey" : "Resume journey"}
          </button>
          <div className="active-controls">
            <button className="text-button" onClick={() => setCancel(true)}>
              Cancel session
            </button>
            <button
              className="text-button"
              disabled={timer.kind === "focus" && timer.duration - seconds < 1}
              onClick={store.finish}
            >
              <Icon name="check" size={14} />
              {timer.kind === "focus" ? "Complete session" : "Finish break"}
            </button>
          </div>
        </>
      )}
      {!timer && data.breakReady && kind === "focus" && (
        <button
          className="break-prompt text-button"
          onClick={() => setMode("break")}
        >
          <Icon name="coffee" size={15} />
          You’ve earned a little break
          <Icon name="right" size={14} />
        </button>
      )}
      <AudioPanel />
      {custom && (
        <Modal title="Find your own rhythm" onClose={() => setCustom(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              store.settings({ focus, break: rest });
              setCustom(false);
            }}
          >
            <p className="modal-intro">
              A pace that feels right for you. No rush.
            </p>
            <div className="two-fields">
              <label className="field">
                Focus (minutes)
                <input
                  autoFocus
                  type="number"
                  min="1"
                  max="180"
                  required
                  value={focus}
                  onChange={(e) => setFocus(Number(e.target.value))}
                />
              </label>
              <label className="field">
                Break (minutes)
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={rest}
                  onChange={(e) => setRest(Number(e.target.value))}
                />
              </label>
            </div>
            <button className="primary full" type="submit">
              Save my rhythm
              <Icon name="check" size={17} />
            </button>
          </form>
        </Modal>
      )}
      {cancel && (
        <Modal
          title="Pause this journey here?"
          onClose={() => setCancel(false)}
        >
          <p className="modal-intro">
            Canceling won’t add a session or study time. You can also pause and
            return whenever you’re ready.
          </p>
          <div className="modal-actions">
            <button className="text-button" onClick={() => setCancel(false)}>
              Keep going
            </button>
            <button
              className="danger-button"
              onClick={() => {
                store.cancel();
                setCancel(false);
              }}
            >
              Cancel session
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
