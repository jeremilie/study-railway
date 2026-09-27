import { useEffect, useId, useRef } from "react";
import { useAudioStore } from "../store/useAudioStore";
import { useStudyStore } from "../store/useStudyStore";
import { Icon } from "./Icon";
import "../styles/audio.css";

export function AudioPanel() {
  const audio = useAudioStore();
  const timerPaused = useStudyStore(
    (state) => state.data.timer?.status === "paused",
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useId();
  useEffect(() => audio.attach(), [audio.attach]);
  const music = audio.settings.source === "music";
  const active = audio.playing || audio.starting;
  const disabled = !audio.loaded || audio.busy;

  return (
    <section className="audio-panel" aria-label="Study audio">
      <div className="audio-sources" role="group" aria-label="Audio source">
        <button
          type="button"
          aria-pressed={!music}
          disabled={disabled}
          onClick={() => audio.selectSource("nature")}
        >
          <Icon name="leaf" size={14} /> Nature sounds
        </button>
        <button
          type="button"
          aria-pressed={music}
          disabled={disabled}
          onClick={() => audio.selectSource("music")}
        >
          <Icon name="sound" size={14} /> My music
        </button>
      </div>
      {music ? (
        audio.tracks.length ? (
          <div className="audio-track-row">
            <label className="sr-only" htmlFor={`${id}-track`}>
              Music track
            </label>
            <select
              id={`${id}-track`}
              disabled={disabled}
              value={audio.settings.selectedTrackId ?? ""}
              onChange={(event) => audio.selectTrack(event.target.value)}
            >
              <option value="" disabled>
                Choose a track
              </option>
              {audio.tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="audio-icon-button"
              aria-label="Delete selected track"
              disabled={disabled || !audio.settings.selectedTrackId}
              onClick={() => {
                if (audio.settings.selectedTrackId)
                  void audio.deleteTrack(audio.settings.selectedTrackId);
              }}
            >
              <Icon name="delete" size={15} />
            </button>
          </div>
        ) : (
          <p className="audio-caption">
            Import a track to make yourself at home.
          </p>
        )
      ) : (
        <p className="audio-caption">Soft wind &amp; flowing water</p>
      )}
      <div className="audio-controls">
        <button
          type="button"
          className="audio-icon-button"
          aria-label={`${active ? "Pause" : "Play"} ${music ? "music" : "nature sounds"}`}
          disabled={
            disabled ||
            timerPaused ||
            (music && !audio.settings.selectedTrackId)
          }
          onClick={() => (active ? audio.pause() : void audio.play())}
        >
          <Icon name={active ? "pause" : "play"} size={16} />
        </button>
        <button
          type="button"
          className="audio-icon-button"
          aria-label={`${audio.settings.muted ? "Unmute" : "Mute"} music`}
          aria-pressed={audio.settings.muted}
          disabled={disabled}
          onClick={audio.toggleMute}
        >
          <Icon name={audio.settings.muted ? "mute" : "sound"} size={16} />
        </button>
        <label className="sr-only" htmlFor={`${id}-volume`}>
          Music volume
        </label>
        <input
          id={`${id}-volume`}
          type="range"
          min="0"
          max="100"
          step="1"
          disabled={disabled}
          value={Math.round(audio.settings.volume * 100)}
          onChange={(event) =>
            audio.setVolume(Number(event.target.value) / 100)
          }
        />
        <output htmlFor={`${id}-volume`}>
          {Math.round(audio.settings.volume * 100)}%
        </output>
      </div>
      <div className="audio-footer">
        <button
          type="button"
          className="text-button"
          disabled={disabled}
          onClick={() => fileInput.current?.click()}
        >
          <Icon name="plus" size={13} />
          {audio.busy ? "Saving…" : "Import Music"}
        </button>
        <span role="status">
          {timerPaused
            ? "Paused with timer"
            : audio.starting
              ? "Loading…"
              : audio.playing
                ? "Playing · loops"
                : "Paused"}
        </span>
      </div>
      <input
        ref={fileInput}
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.aif,.aiff,.webm"
        aria-label="Import audio files"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void audio.importTrack(file);
        }}
      />
      {audio.error && (
        <p className="audio-error" role="alert">
          {audio.error}
        </p>
      )}
      {!audio.loaded && audio.error && (
        <button
          type="button"
          className="text-button"
          onClick={() => void audio.hydrate()}
        >
          Retry music library
        </button>
      )}
    </section>
  );
}
