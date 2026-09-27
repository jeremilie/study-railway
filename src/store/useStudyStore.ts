import { create } from "zustand";
import type { StudyData, Subject, Station, Settings } from "../types/study";
import {
  seed,
  start,
  pause,
  resume,
  finish,
  remaining,
  removeSubject,
} from "../lib/model";
import { loadData, saveData } from "../db/db";

interface Store {
  data: StudyData;
  loaded: boolean;
  saveStatus: "saved" | "saving" | "error";
  error: string;
  notice: string;
  hydrate: () => Promise<void>;
  retrySave: () => void;
  selectSubject: (id: string) => void;
  selectStation: (id: string) => void;
  saveSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  saveStation: (station: Station) => void;
  deleteStation: (id: string) => void;
  moveStation: (id: string, direction: -1 | 1) => void;
  completeStation: (id: string) => void;
  settings: (settings: Partial<Settings>) => void;
  start: (kind: "focus" | "break") => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  finish: () => void;
  tick: () => void;
}
let writeQueue: Promise<void> = Promise.resolve();
let revision = 0;
const recoveryKey = "study-railway-pending-v1";
function writeRecovery(data: StudyData) {
  try {
    localStorage.setItem(recoveryKey, JSON.stringify(data));
  } catch {
    /* IndexedDB remains the primary store when localStorage is unavailable. */
  }
}
function clearRecovery() {
  try {
    localStorage.removeItem(recoveryKey);
  } catch {
    /* Storage may be blocked. */
  }
}
function readRecovery(): StudyData | null {
  try {
    const raw = localStorage.getItem(recoveryKey);
    if (!raw) return null;
    const data = JSON.parse(raw) as StudyData;
    return Array.isArray(data.subjects) &&
      Array.isArray(data.stations) &&
      Array.isArray(data.sessions) &&
      data.settings
      ? data
      : null;
  } catch {
    return null;
  }
}
export const useStudyStore = create<Store>((set, get) => {
  let hydration: Promise<void> | null = null;
  function persist(data: StudyData) {
    const current = ++revision;
    set({ saveStatus: "saving" });
    // Synchronous recovery protects a user who reloads before the async IDB write commits.
    writeRecovery(data);
    writeQueue = writeQueue
      .catch(() => {})
      .then(() => saveData(data))
      .then(() => {
        if (current === revision) {
          clearRecovery();
          set({ saveStatus: "saved", error: "" });
        }
      })
      .catch(() => {
        if (current === revision)
          set({
            saveStatus: "error",
            error:
              "Your latest changes could not be saved on this device. Keep this tab open and retry.",
          });
      });
  }
  function change(fn: (data: StudyData) => StudyData, notice?: string) {
    if (!get().loaded) return;
    const old = get().data;
    const data = fn(old);
    if (data === old) return;
    set({ data, ...(notice ? { notice } : {}) });
    persist(data);
  }
  return {
    data: seed(),
    loaded: false,
    saveStatus: "saved",
    error: "",
    notice: "",
    hydrate: () => {
      if (hydration) return hydration;
      if (get().loaded) return Promise.resolve();
      hydration = (async () => {
        try {
          const recovery = readRecovery();
          const stored = await loadData();
          const data = recovery ?? stored;
          if (recovery) {
            await saveData(recovery);
            clearRecovery();
          }
          set({ data, loaded: true, error: "" });
          get().tick();
        } catch {
          set({
            error:
              "We could not open your local study journal. Enable browser storage and try again.",
          });
        } finally {
          hydration = null;
        }
      })();
      return hydration;
    },
    retrySave: () => {
      if (get().loaded) persist(get().data);
      else void get().hydrate();
    },
    selectSubject: (id) =>
      change((d) => {
        if (d.timer || !d.subjects.some((s) => s.id === id)) return d;
        return {
          ...d,
          selectedSubject: id,
          selectedStation: d.stations.find((s) => s.subjectId === id)?.id ?? "",
        };
      }),
    selectStation: (id) =>
      change((d) => {
        const station = d.stations.find((s) => s.id === id);
        return d.timer || !station
          ? d
          : { ...d, selectedStation: id, selectedSubject: station.subjectId };
      }),
    saveSubject: (subject) =>
      change((d) => {
        if (
          d.timer ||
          !subject.name.trim() ||
          !/^#[\da-f]{6}$/i.test(subject.color)
        )
          return d;
        const exists = d.subjects.some((s) => s.id === subject.id);
        return {
          ...d,
          subjects: exists
            ? d.subjects.map((s) =>
                s.id === subject.id
                  ? { ...subject, name: subject.name.trim().slice(0, 40) }
                  : s,
              )
            : [...d.subjects, subject],
          selectedSubject: subject.id,
          selectedStation: exists
            ? (d.stations.find((s) => s.subjectId === subject.id)?.id ?? "")
            : "",
        };
      }, "Your railway line is ready."),
    deleteSubject: (id) =>
      change(
        (d) => removeSubject(d, id),
        "Railway line deleted. Your journal is preserved.",
      ),
    saveStation: (station) =>
      change((d) => {
        if (
          d.timer ||
          !station.title.trim() ||
          !Number.isInteger(station.target) ||
          station.target < 1 ||
          station.target > 100 ||
          !d.subjects.some((s) => s.id === station.subjectId)
        )
          return d;
        return {
          ...d,
          stations: d.stations.some((s) => s.id === station.id)
            ? d.stations.map((s) => (s.id === station.id ? station : s))
            : [...d.stations, station],
          selectedSubject: station.subjectId,
          selectedStation: station.id,
        };
      }, "Destination saved."),
    deleteStation: (id) =>
      change((d) => {
        if (d.timer) return d;
        const stations = d.stations.filter((s) => s.id !== id);
        return {
          ...d,
          stations,
          selectedStation:
            d.selectedStation === id
              ? (stations.find((s) => s.subjectId === d.selectedSubject)?.id ??
                "")
              : d.selectedStation,
        };
      }, "Station deleted. Your journal is preserved."),
    moveStation: (id, direction) =>
      change((d) => {
        if (d.timer) return d;
        const station = d.stations.find((s) => s.id === id);
        if (!station) return d;
        const route = d.stations.filter(
          (s) => s.subjectId === station.subjectId,
        );
        const index = route.findIndex((s) => s.id === id);
        const next = route[index + direction];
        if (!next) return d;
        const stations = [...d.stations];
        const a = stations.findIndex((s) => s.id === id);
        const b = stations.findIndex((s) => s.id === next.id);
        [stations[a], stations[b]] = [stations[b], stations[a]];
        return { ...d, stations };
      }),
    completeStation: (id) =>
      change(
        (d) =>
          d.timer
            ? d
            : {
                ...d,
                stations: d.stations.map((s) =>
                  s.id === id ? { ...s, manualComplete: !s.manualComplete } : s,
                ),
              },
        "Station progress updated.",
      ),
    settings: (settings) =>
      change((d) => {
        if (
          d.timer &&
          (settings.focus !== undefined || settings.break !== undefined)
        )
          return d;
        const next = { ...d.settings, ...settings };
        if (
          !Number.isInteger(next.focus) ||
          next.focus < 1 ||
          next.focus > 180 ||
          !Number.isInteger(next.break) ||
          next.break < 1 ||
          next.break > 60
        )
          return d;
        return { ...d, settings: next };
      }),
    start: (kind) =>
      change(
        (d) => start(d, kind, Date.now()),
        kind === "focus"
          ? "Your focus journey has started."
          : "Take a breath. Your break has started.",
      ),
    pause: () => {
      get().tick();
      change((d) => pause(d, Date.now()), "Journey paused. Take your time.");
    },
    resume: () =>
      change(
        (d) => resume(d, Date.now()),
        "Welcome back. Your journey continues.",
      ),
    cancel: () => {
      const timer = get().data.timer;
      if (timer?.status === "running" && remaining(timer, Date.now()) <= 0) {
        get().finish();
        return;
      }
      change(
        (d) => (d.timer ? { ...d, timer: null } : d),
        "Session canceled. No study time was recorded.",
      );
    },
    finish: () =>
      change(
        (d) => finish(d, Date.now()),
        get().data.timer?.kind === "break"
          ? "Rested and ready for a fresh start."
          : "A little further! Your focus session is complete.",
      ),
    tick: () => {
      const timer = get().data.timer;
      if (timer?.status === "running" && remaining(timer, Date.now()) <= 0)
        get().finish();
    },
  };
});
