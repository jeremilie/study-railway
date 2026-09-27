import type { StudyData } from "../types/study";
import { remaining } from "./model";

/** One unit is the leg from the previous station to the next station.
 * Session progress is divided by the goal's target before entering that leg.
 * The persisted high-water mark prevents cancel/target edits from reversing travel.
 */
export function trainUnits(
  data: StudyData,
  subjectId: string,
  now: number,
): number {
  const stations = data.stations.filter((s) => s.subjectId === subjectId);
  if (!stations.length) return 0;
  let units = data.trainProgress?.[subjectId] ?? 0;
  for (let index = 0; index < stations.length; index++) {
    const station = stations[index];
    const target = Math.max(1, station.target);
    const timer =
      data.timer?.kind === "focus" &&
      data.timer.subjectId === subjectId &&
      data.timer.stationId === station.id
        ? data.timer
        : null;
    const fraction = timer
      ? Math.max(0, 1 - remaining(timer, now) / timer.duration)
      : 0;
    if (station.completed > 0 || station.manualComplete || timer) {
      units = Math.max(
        units,
        index +
          (station.manualComplete
            ? 1
            : Math.min(1, (station.completed + fraction) / target)),
      );
    }
  }
  return Math.min(stations.length, Math.max(0, units));
}

export function checkpointJourney(data: StudyData, now: number): StudyData {
  const trainProgress = Object.fromEntries(
    data.subjects.map((s) => [s.id, trainUnits(data, s.id, now)]),
  );
  return { ...data, trainProgress };
}
