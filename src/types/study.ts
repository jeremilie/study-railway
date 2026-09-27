export type Biome = "forest" | "mountains" | "village" | "coast" | "tundra";
export interface Subject {
  id: string;
  name: string;
  color: string;
  biome: Biome;
}
export interface Station {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  target: number;
  completed: number;
  manualComplete: boolean;
}
export interface Session {
  id: string;
  subjectId: string;
  stationId: string;
  subjectName: string;
  stationTitle: string;
  color: string;
  seconds: number;
  endedAt: number;
}
export interface Settings {
  focus: number;
  break: number;
  lighting: "sunrise" | "afternoon" | "evening";
  view: "3d" | "2d";
}
export interface Timer {
  id: string;
  kind: "focus" | "break";
  subjectId: string;
  stationId: string;
  duration: number;
  elapsed: number;
  deadline: number | null;
  status: "running" | "paused";
}
export interface StudyData {
  /** Additive optional field so existing version-1 snapshots remain valid. */
  trainProgress?: Record<string, number>;
  subjects: Subject[];
  stations: Station[];
  sessions: Session[];
  settings: Settings;
  selectedSubject: string;
  selectedStation: string;
  timer: Timer | null;
  breakReady: boolean;
}
