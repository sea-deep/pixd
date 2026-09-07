import type { AudioFilter } from "./types.js";

export interface FilterDefinition {
  name: AudioFilter;
  label: string;
  emoji: string;
  description: string;
  ffmpegArgs: string[] | null;
}

export const AUDIO_FILTERS: Record<AudioFilter, FilterDefinition> = {
  off: {
    name: "off",
    label: "Off",
    emoji: "➡️",
    description: "Original direct playback with no audio modification.",
    ffmpegArgs: null,
  },
  bassboost: {
    name: "bassboost",
    label: "Bass Boost",
    emoji: "🔊",
    description: "Deep, punchy 60-100Hz sub-bass enhancement with lookahead peak protection.",
    ffmpegArgs: [
      "-af",
      "bass=g=12:f=100:w=0.6,equalizer=f=60:width_type=h:width=50:g=8,alimiter=limit=0.95",
    ],
  },
  slowed: {
    name: "slowed",
    label: "Slowed + Reverb",
    emoji: "🌌",
    description: "Chopped & screwed pitch-drop (0.85x) with atmospheric multi-tap reverb.",
    ffmpegArgs: [
      "-af",
      "asetrate=48000*0.85,aresample=48000,aecho=0.8:0.7:60|90:0.3|0.25,equalizer=f=100:width_type=h:width=60:g=4,alimiter=limit=0.95",
    ],
  },
  sped: {
    name: "sped",
    label: "Sped Up",
    emoji: "⚡",
    description: "Nightcore tempo & pitch lift (1.20x) with boosted highs and tight bass.",
    ffmpegArgs: [
      "-af",
      "asetrate=48000*1.20,aresample=48000,equalizer=f=80:width_type=h:width=50:g=3,equalizer=f=8000:width_type=h:width=1000:g=2,alimiter=limit=0.95",
    ],
  },
  phonk: {
    name: "phonk",
    label: "Phonk Remix",
    emoji: "🚗💨",
    description: "Drift Phonk aesthetic: distorted 808s, Memphis cowbell harmonics, pitch drop, tape crunch, and aggressive sidechain-style pumping.",
    ffmpegArgs: [
      "-af",
      "asetrate=48000*0.94,aresample=48000,bass=g=14:f=80:w=0.7,equalizer=f=2200:width_type=h:width=1200:g=6,acrusher=level_in=1:level_out=0.9:bits=14:mode=log:aa=1,acompressor=threshold=-18dB:ratio=6:attack=10:release=100:makeup=3dB,alimiter=limit=0.95",
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
  if (["phonk", "drift", "driftphonk", "memphis", "cowbell"].includes(norm)) {
    return "phonk";
  }

  return null;
}
