import type { StudyData, Timer, Subject } from "../types/study";
export function seed(): StudyData {
  const subjects: Subject[] = [
    { id: "math", name: "Math", color: "#b28c53", biome: "mountains" },
    { id: "biology", name: "Biology", color: "#54866a", biome: "forest" },
    { id: "history", name: "History", color: "#8b81a9", biome: "village" },
    { id: "coding", name: "Coding", color: "#578f9d", biome: "coast" },
  ];
  const titles: Record<string, string[]> = {
    math: [
      "The language of algebra",
      "Functions & graphs",
      "A little calculus",
    ],
    biology: [
      "The world of cells",
      "Genetics & inheritance",
      "A living ecosystem",
    ],
    history: ["Ancient civilizations", "The Renaissance", "The modern world"],
    coding: [
      "JavaScript foundations",
      "Thinking in components",
      "Build something small",
    ],
  };
  return {
    subjects,
    stations: subjects.flatMap((subject) =>
      titles[subject.id].map((title, i) => ({
        id: `${subject.id}-${i}`,
        subjectId: subject.id,
        title,
        description:
          subject.id === "biology" && i === 0
            ? "Explore the tiny building blocks of life. Review cell structures, organelles, and how they work together."
            : "",
        target: [4, 3, 5][i],
        completed: 0,
        manualComplete: false,
      })),
    ),
    sessions: [],
    settings: { focus: 25, break: 5, lighting: "afternoon", view: "3d" },
    selectedSubject: "biology",
    selectedStation: "biology-0",
    timer: null,
    breakReady: false,
  };
}
export function remaining(timer: Timer, now: number): number {
  return Math.max(
    0,
    Math.min(
      timer.duration,
      timer.status === "running" && timer.deadline !== null
        ? (timer.deadline - now) / 1000
        : timer.duration - timer.elapsed,
    ),
  );
}
export function start(
  data: StudyData,
  kind: "focus" | "break",
  now: number,
): StudyData {
  if (data.timer) return data;
  if (
    kind === "focus" &&
    (!data.subjects.some((s) => s.id === data.selectedSubject) ||
      !data.stations.some(
        (s) =>
          s.id === data.selectedStation && s.subjectId === data.selectedSubject,
      ))
  )
    return data;
  const duration = data.settings[kind] * 60;
  if (!Number.isFinite(duration) || duration < 60) return data;
  return {
    ...data,
    breakReady: false,
    timer: {
      id: crypto.randomUUID(),
      kind,
      subjectId: data.selectedSubject,
      stationId: data.selectedStation,
      duration,
      elapsed: 0,
      deadline: now + duration * 1000,
      status: "running",
    },
  };
}
export function pause(data: StudyData, now: number): StudyData {
  if (!data.timer || data.timer.status !== "running") return data;
  return {
    ...data,
    timer: {
      ...data.timer,
      elapsed: data.timer.duration - remaining(data.timer, now),
      deadline: null,
      status: "paused",
    },
  };
}
export function resume(data: StudyData, now: number): StudyData {
  if (!data.timer || data.timer.status !== "paused") return data;
  return {
    ...data,
    timer: {
      ...data.timer,
      deadline: now + remaining(data.timer, now) * 1000,
      status: "running",
    },
  };
}
export function finish(data: StudyData, now: number): StudyData {
  const timer = data.timer;
  if (!timer) return data;
  if (timer.kind === "break")
    return { ...data, timer: null, breakReady: false };
  const seconds = Math.floor(timer.duration - remaining(timer, now));
  if (seconds < 1) return data;
  const subject = data.subjects.find((s) => s.id === timer.subjectId);
  const station = data.stations.find((s) => s.id === timer.stationId);
  const endedAt =
    timer.deadline !== null && now > timer.deadline ? timer.deadline : now;
  return {
    ...data,
    timer: null,
    breakReady: true,
    stations: data.stations.map((s) =>
      s.id === timer.stationId ? { ...s, completed: s.completed + 1 } : s,
    ),
    sessions: [
      {
        id: timer.id,
        subjectId: timer.subjectId,
        stationId: timer.stationId,
        subjectName: subject?.name ?? "Archived line",
        stationTitle: station?.title ?? "Archived station",
        color: subject?.color ?? "#54866a",
        seconds,
        endedAt,
      },
      ...data.sessions,
    ],
  };
}
export function removeSubject(data: StudyData, id: string): StudyData {
  if (data.timer) return data;
  const subjects = data.subjects.filter((s) => s.id !== id);
  const stations = data.stations.filter((s) => s.subjectId !== id);
  const selectedSubject =
    data.selectedSubject === id
      ? (subjects[0]?.id ?? "")
      : data.selectedSubject;
  const selectedStation = stations.some((s) => s.id === data.selectedStation)
    ? data.selectedStation
    : (stations.find((s) => s.subjectId === selectedSubject)?.id ?? "");
  return { ...data, subjects, stations, selectedSubject, selectedStation };
}
export function dailyStats(data: StudyData, now: number) {
  const day = new Date(now).toDateString();
  const sessions = data.sessions.filter(
    (s) => new Date(s.endedAt).toDateString() === day,
  );
  return {
    minutes: Math.round(sessions.reduce((sum, s) => sum + s.seconds, 0) / 60),
    sessions: sessions.length,
    subjects: new Set(sessions.map((s) => s.subjectId)).size,
  };
}
export function isComplete(station: {
  completed: number;
  target: number;
  manualComplete: boolean;
}) {
  return station.manualComplete || station.completed >= station.target;
}
