export interface AudioTrackInfo {
  id: string;
  title: string;
  type: string;
  size: number;
  importedAt: number;
}

export interface AudioTrack extends AudioTrackInfo {
  blob: Blob;
}

export interface AudioSettings {
  id: "preferences";
  source: "nature" | "music";
  selectedTrackId: string | null;
  volume: number;
  muted: boolean;
}

export const defaultAudioSettings: AudioSettings = {
  id: "preferences",
  source: "nature",
  selectedTrackId: null,
  volume: 0.7,
  muted: false,
};
