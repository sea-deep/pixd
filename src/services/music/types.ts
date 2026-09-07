export type MusicSource = "auto" | "youtube" | "soundcloud" | "bandcamp" | "spotify" | "custom";

export interface MusicTrack {
  id: string;
  url: string;
  title: string;
  author: string;
  durationMs: number;
  thumbnail?: string;
  requesterId: string;
  source?: MusicSource;
  fallbackUrl?: string;
}

export interface ResolveResult {
  tracks: MusicTrack[];
  playlistName?: string;
  source?: MusicSource;
}

export type LoopMode = "off" | "track" | "queue";

export type AudioFilter = "off" | "bassboost" | "slowed" | "sped";
