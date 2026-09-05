export interface MusicTrack {
  id: string;
  url: string;
  title: string;
  author: string;
  durationMs: number;
  thumbnail?: string;
  requesterId: string;
}

export interface ResolveResult {
  tracks: MusicTrack[];
  playlistName?: string;
}

export type LoopMode = "off" | "track" | "queue";
