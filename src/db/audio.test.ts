import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { StudyDatabase, loadData } from "./db";
import {
  deleteAudioTrack,
  importAudioTrack,
  loadAudioLibrary,
  saveAudioSettings,
} from "./audio";

const databases: StudyDatabase[] = [];
function database(name = `audio-test-${crypto.randomUUID()}`) {
  const result = new StudyDatabase(name);
  databases.push(result);
  return result;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

describe("audio persistence", () => {
  it("upgrades a v1 journal without altering its saved snapshot", async () => {
    const name = `audio-migration-${crypto.randomUUID()}`;
    const original = new Dexie(name);
    original.version(1).stores({ snapshots: "id" });
    const snapshot = { subjects: [], marker: "preserve this exact journal" };
    await original.table("snapshots").put({ id: "journey", data: snapshot });
    original.close();
    const upgraded = database(name);
    expect(await loadData(upgraded)).toEqual(snapshot);
    expect(upgraded.tables.map((table) => table.name)).toEqual(
      expect.arrayContaining(["snapshots", "audioTracks", "audioSettings"]),
    );
  });

  it("persists real Blob bytes and selected track across closing and reopening", async () => {
    const db = database();
    const file = new File(
      [new Uint8Array([73, 68, 51, 0, 255, 127])],
      "Quiet morning.mp3",
      { type: "audio/mpeg" },
    );
    const track = await importAudioTrack(file, db);
    await saveAudioSettings(
      { source: "music", selectedTrackId: track.id, volume: 0.31, muted: true },
      db,
    );
    db.close();
    await db.open();
    const library = await loadAudioLibrary(db);
    expect(library.tracks).toEqual([
      expect.objectContaining({
        id: track.id,
        title: "Quiet morning.mp3",
        size: 6,
      }),
    ]);
    expect(library.settings).toMatchObject({
      source: "music",
      selectedTrackId: track.id,
      volume: 0.31,
      muted: true,
    });
    const saved = await db.audioTracks.get(track.id);
    expect(saved?.blob).toBeInstanceOf(Blob);
    expect(Array.from(new Uint8Array(await saved!.blob.arrayBuffer()))).toEqual(
      [73, 68, 51, 0, 255, 127],
    );
    expect(library.tracks[0]).not.toHaveProperty("blob");
  });

  it("deletes the stored blob and clears only the deleted selection", async () => {
    const db = database();
    const first = await importAudioTrack(new File(["one"], "One.mp3"), db);
    const second = await importAudioTrack(new File(["two"], "Two.wav"), db);
    await saveAudioSettings(
      { source: "music", selectedTrackId: second.id, volume: 0.4 },
      db,
    );
    await deleteAudioTrack(first.id, db);
    expect((await loadAudioLibrary(db)).settings.selectedTrackId).toBe(
      second.id,
    );
    await deleteAudioTrack(second.id, db);
    expect(await db.audioTracks.count()).toBe(0);
    expect((await loadAudioLibrary(db)).settings).toMatchObject({
      source: "nature",
      selectedTrackId: null,
      volume: 0.4,
    });
  });

  it("provides safe defaults and repairs a missing selected track", async () => {
    const db = database();
    expect((await loadAudioLibrary(db)).settings).toMatchObject({
      source: "nature",
      selectedTrackId: null,
      volume: 0.7,
    });
    await db.audioSettings.put({
      id: "preferences",
      source: "music",
      selectedTrackId: "missing",
      volume: NaN,
      muted: false,
    });
    expect((await loadAudioLibrary(db)).settings).toMatchObject({
      source: "nature",
      selectedTrackId: null,
      volume: 0.7,
    });
  });

  it("rejects empty and non-audio files without storing them", async () => {
    const db = database();
    await expect(
      importAudioTrack(new File([], "Empty.mp3"), db),
    ).rejects.toThrow();
    await expect(
      importAudioTrack(
        new File(["text"], "Notes.txt", { type: "text/plain" }),
        db,
      ),
    ).rejects.toThrow();
    expect(await db.audioTracks.count()).toBe(0);
  });
});
