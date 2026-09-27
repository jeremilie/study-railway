export const MAX_STATIONS = 10;
export const INITIAL_STATIONS = 3;
/** Existing scenery stays at 0–4; additional landmarks unlock at 5, 7 and 9. */
export function landmarkCount(stations: number) {
  return Math.max(
    0,
    Math.min(3, Math.floor((stations - INITIAL_STATIONS) / 2)),
  );
}
export function stationStyle(id: string): 0 | 1 | 2 {
  return (Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    3) as 0 | 1 | 2;
}
