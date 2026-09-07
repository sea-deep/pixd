import type { AudioFilter } from "./types.js";

export type AudioFilterKind = "live-filter" | "remix";

export interface FilterDefinition {
  name: AudioFilter;
  label: string;
  emoji: string;
  description: string;
  kind: AudioFilterKind;
  ffmpegArgs: string[] | null;
}

export const AUDIO_FILTERS: Record<AudioFilter, FilterDefinition> = {
  off: {
    name: "off",
    label: "Off",
    emoji: "",
    description: "Default playback without audio processing.",
    kind: "live-filter",
    ffmpegArgs: null,
  },
  bassboost: {
    name: "bassboost",
    label: "Bass Boost",
    emoji: "",
    description: "Sub-bass boost at 60-100Hz with dynamic leveling.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "equalizer=f=60:width_type=h:width=50:g=9,bass=g=7:f=100,dynaudnorm=f=150:g=15",
    ],
  },
  slowed: {
    name: "slowed",
    label: "Slowed + Reverb",
    emoji: "",
    description: "0.86x pitch drop with atmospheric room reverb and high-cut.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "asetrate=48000*0.86,aresample=48000,lowpass=f=9000,aecho=0.8:0.75:60|90:0.3|0.2,dynaudnorm=f=150",
    ],
  },
  sped: {
    name: "sped",
    label: "Sped Up",
    emoji: "",
    description: "1.18x tempo and pitch lift with bass and treble balance.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "asetrate=48000*1.18,aresample=48000,bass=g=4:f=100,treble=g=2:f=6000,dynaudnorm=f=150",
    ],
  },
};

export function parseAudioFilter(raw: string | null | undefined): AudioFilter | null {
  if (!raw || !raw.trim()) return null;
  const norm = raw.trim().toLowerCase();

  if (["off", "disable", "stop", "clear", "reset", "none", "0"].includes(norm)) {
    return "off";
  }
  if (["bassboost", "bass", "bb", "boost", "bassboosted"].includes(norm)) {
    return "bassboost";
  }
  if (["slowed", "slow", "reverb", "slowedreverb", "chopped", "ambient"].includes(norm)) {
    return "slowed";
  }
  if (["sped", "spedup", "speed", "speedup", "nightcore", "fast"].includes(norm)) {
    return "sped";
  }

  return null;
}
