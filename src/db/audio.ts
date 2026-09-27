import { db } from "./db";
import {
  defaultAudioSettings,
  type AudioSettings,
  type AudioTrackInfo,
} from "../types/audio";

function normalizeSettings(value?: Partial<AudioSettings>): AudioSettings {
  return {
    id: "preferences",
    source: value?.source === "music" ? "music" : "nature",
    selectedTrackId:
      typeof value?.selectedTrackId === "string" ? value.selectedTrackId : null,
    volume:
      typeof value?.volume === "number" && Number.isFinite(value.volume)
        ? Math.min(1, Math.max(0, value.volume))
        : defaultAudioSettings.volume,
    muted: value?.muted === true,
  };
}

export async function loadAudioLibrary(database = db) {
  return database.transaction(
    "r",
    database.audioTracks,
    database.audioSettings,
    async () => {
      const rows = await database.audioTracks.orderBy("importedAt").toArray();
      const settings = normalizeSettings(
        await database.audioSettings.get("preferences"),
      );
      if (!rows.some((track) => track.id === settings.selectedTrackId)) {
        settings.selectedTrackId = null;
        if (settings.source === "music") settings.source = "nature";
      }
      // Keep large blobs out of reactive state; load only the track being played.
      const tracks: AudioTrackInfo[] = rows.map(
        ({ blob: _blob, ...info }) => info,
      );
      return { tracks, settings };
    },
  );
}

export async function saveAudioSettings(
  value: Partial<AudioSettings>,
  database = db,
) {
  await database.transaction("rw", database.audioSettings, async () => {
    const previous = await database.audioSettings.get("preferences");
    await database.audioSettings.put(
      normalizeSettings({ ...previous, ...value }),
    );
  });
}

export async function importAudioTrack(
  file: File,
  database = db,
): Promise<AudioTrackInfo> {
  if (!file.size) throw new Error("This audio file is empty.");
  if (
    !file.type.startsWith("audio/") &&
    !/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|aif|aiff|webm)$/i.test(file.name)
  ) {
    throw new Error("Choose an MP3 or another audio file.");
  }
  const info: AudioTrackInfo = {
    id: crypto.randomUUID(),
    title: file.name.trim() || "Untitled audio",
    type: file.type,
    size: file.size,
    importedAt: Date.now(),
  };
  // File.slice produces a plain Blob that is structured-cloned by IndexedDB.
  await database.audioTracks.add({
    ...info,
    blob: file.slice(0, file.size, file.type),
  });
  return info;
}

export async function deleteAudioTrack(id: string, database = db) {
  await database.transaction(
    "rw",
    database.audioTracks,
    database.audioSettings,
    async () => {
      await database.audioTracks.delete(id);
      const settings = normalizeSettings(
        await database.audioSettings.get("preferences"),
      );
      if (settings.selectedTrackId === id) {
        await database.audioSettings.put({
          ...settings,
          source: "nature",
          selectedTrackId: null,
        });
      }
    },
  );
}
