import Dexie, { type Table } from "dexie";
import type { StudyData } from "../types/study";
import type { AudioSettings, AudioTrack } from "../types/audio";
import { seed } from "../lib/model";

export class StudyDatabase extends Dexie {
  snapshots!: Table<{ id: string; data: StudyData }, string>;
  audioTracks!: Table<AudioTrack, string>;
  audioSettings!: Table<AudioSettings, string>;
  constructor(name = "study-railway") {
    super(name);
    this.version(1).stores({ snapshots: "id" });
    // Audio is separate from journal snapshots and their localStorage recovery.
    // Dexie adds these tables without rewriting existing study data.
    this.version(2).stores({
      snapshots: "id",
      audioTracks: "id, importedAt",
      audioSettings: "id",
    });
  }
}
export const db = new StudyDatabase();
export async function loadData(database = db): Promise<StudyData> {
  return database.transaction("rw", database.snapshots, async () => {
    const row = await database.snapshots.get("journey");
    if (row) return row.data;
    const data = seed();
    await database.snapshots.put({ id: "journey", data });
    return data;
  });
}
export async function saveData(data: StudyData, database = db) {
  await database.snapshots.put({ id: "journey", data });
}
