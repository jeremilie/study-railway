import { create } from "zustand";
import { db } from "../db/db";
import {
  deleteAudioTrack,
  importAudioTrack,
  loadAudioLibrary,
  saveAudioSettings,
} from "../db/audio";
import { AudioPlayback } from "../lib/audio";
import {
  defaultAudioSettings,
  type AudioSettings,
  type AudioTrackInfo,
} from "../types/audio";
import { useStudyStore } from "./useStudyStore";

interface AudioStore {
  tracks: AudioTrackInfo[];
  settings: AudioSettings;
  loaded: boolean;
  busy: boolean;
  playing: boolean;
  starting: boolean;
  error: string;
  hydrate: () => Promise<void>;
  attach: () => () => void;
  selectSource: (source: AudioSettings["source"]) => void;
  selectTrack: (id: string) => void;
  importTrack: (file: File) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => {
  const player = new AudioPlayback();
  let hydration: Promise<void> | null = null;
  let writes: Promise<unknown> = Promise.resolve();
  let playbackRequest = 0;
  let resumeTimerId: string | null = null;
  let owners = 0;
  let unsubscribe: (() => void) | null = null;

  // One write queue prevents a slow volume save from restoring a deleted selection.
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = writes.catch(() => {}).then(operation);
    writes = result.catch(() => {});
    return result;
  }
  function preferences(patch: Partial<AudioSettings>) {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    player.setVolume(settings.volume, settings.muted);
    void enqueue(() => saveAudioSettings(settings)).catch(() => {
      set({
        error:
          "Music preferences could not be saved. Check browser storage and try again.",
      });
    });
  }
  function stop() {
    playbackRequest++;
    resumeTimerId = null;
    player.dispose();
    set({ playing: false, starting: false });
  }
  function pausePlayback() {
    playbackRequest++;
    // A pending play promise must not bring sound back after a pause.
    if (get().starting) player.dispose();
    else player.pause();
    set({ playing: false, starting: false });
  }

  return {
    tracks: [],
    settings: { ...defaultAudioSettings },
    loaded: false,
    busy: false,
    playing: false,
    starting: false,
    error: "",
    hydrate: () => {
      if (get().loaded) return Promise.resolve();
      if (hydration) return hydration;
      hydration = loadAudioLibrary()
        .then(({ tracks, settings }) => {
          set({ tracks, settings, loaded: true, error: "" });
          player.setVolume(settings.volume, settings.muted);
          // Playback intent is deliberately never persisted or restored.
        })
        .catch(() => {
          set({
            error:
              "Your music library could not be opened. Enable browser storage and retry.",
          });
        })
        .finally(() => {
          hydration = null;
        });
      return hydration;
    },
    attach: () => {
      owners++;
      if (!unsubscribe) {
        // Observe the timer without changing the study store's ownership or snapshots.
        unsubscribe = useStudyStore.subscribe((current, previous) => {
          const timer = current.data.timer;
          const before = previous.data.timer;
          if (before && before.id !== timer?.id) {
            stop();
            return;
          }
          if (timer?.status === "paused" && before?.status !== "paused") {
            resumeTimerId =
              timer.kind === "focus" && (get().playing || get().starting)
                ? timer.id
                : null;
            pausePlayback();
          } else if (
            timer?.kind === "focus" &&
            timer.status === "running" &&
            before?.status === "paused" &&
            resumeTimerId === timer.id
          ) {
            resumeTimerId = null;
            void get().play();
          }
        });
      }
      void get().hydrate();
      let attached = true;
      return () => {
        if (!attached) return;
        attached = false;
        if (--owners === 0) {
          unsubscribe?.();
          unsubscribe = null;
          // Page changes (and StrictMode remounts) must never restart old playback.
          stop();
        }
      };
    },
    selectSource: (source) => {
      if (!get().loaded || get().busy || source === get().settings.source)
        return;
      stop();
      set({ error: "" });
      const selectedTrackId =
        get().settings.selectedTrackId ?? get().tracks[0]?.id ?? null;
      preferences({ source, selectedTrackId });
    },
    selectTrack: (id) => {
      if (
        !get().loaded ||
        get().busy ||
        !get().tracks.some((track) => track.id === id)
      )
        return;
      stop();
      set({ error: "" });
      preferences({ source: "music", selectedTrackId: id });
    },
    importTrack: async (file) => {
      if (!get().loaded || get().busy) return;
      set({ busy: true, error: "" });
      try {
        const track = await enqueue(() => importAudioTrack(file));
        stop();
        set({ tracks: [...get().tracks, track] });
        preferences({ source: "music", selectedTrackId: track.id });
      } catch (error) {
        set({
          error:
            error instanceof Error && /empty|Choose an MP3/.test(error.message)
              ? error.message
              : "This track could not be saved. Check available browser storage and try again.",
        });
      } finally {
        set({ busy: false });
      }
    },
    deleteTrack: async (id) => {
      if (!get().loaded || get().busy) return;
      set({ busy: true, error: "" });
      // Stop before deleting, including any pending read/play, and never play a fallback.
      if (get().settings.selectedTrackId === id) stop();
      try {
        await enqueue(() => deleteAudioTrack(id));
        set({ tracks: get().tracks.filter((track) => track.id !== id) });
        if (get().settings.selectedTrackId === id) {
          preferences({ source: "nature", selectedTrackId: null });
        }
      } catch {
        set({ error: "This track could not be deleted. Please try again." });
      } finally {
        set({ busy: false });
      }
    },
    play: async () => {
      if (
        !owners ||
        !get().loaded ||
        get().busy ||
        get().playing ||
        get().starting ||
        useStudyStore.getState().data.timer?.status === "paused"
      )
        return;
      const settings = get().settings;
      if (settings.source === "music" && !settings.selectedTrackId) return;
      const request = ++playbackRequest;
      resumeTimerId = null;
      set({ starting: true, error: "" });
      const failed = () => {
        if (request !== playbackRequest) return;
        stop();
        set({
          error:
            "This audio could not play. Try Play again or choose another audio file.",
        });
      };
      try {
        const track =
          settings.source === "music"
            ? await db.audioTracks.get(settings.selectedTrackId!)
            : null;
        if (request !== playbackRequest) return;
        if (settings.source === "music" && !track)
          throw new Error("Track is missing");
        await player.play(track ?? null, failed);
        if (request === playbackRequest)
          set({ playing: true, starting: false });
      } catch {
        failed();
      }
    },
    pause: () => {
      resumeTimerId = null;
      pausePlayback();
    },
    setVolume: (volume) => {
      if (!get().loaded || !Number.isFinite(volume)) return;
      preferences({ volume: Math.min(1, Math.max(0, volume)) });
    },
    toggleMute: () => {
      if (get().loaded) preferences({ muted: !get().settings.muted });
    },
  };
});
