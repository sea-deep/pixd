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
    emoji: "",
    description: "Default playback without audio processing.",
    ffmpegArgs: null,
  },
  bassboost: {
    name: "bassboost",
    label: "Bass Boost",
    emoji: "",
    description: "Sub-bass boost at 60-100Hz with dynamic leveling.",
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
    ffmpegArgs: [
      "-af",
      "asetrate=48000*1.18,aresample=48000,bass=g=4:f=100,treble=g=2:f=6000,dynaudnorm=f=150",
    ],
  },
  phonk: {
    name: "phonk",
    label: "Phonk",
    emoji: "",
    description: "Brazilian automotivo mix: fast tempo, aggressive clipped low-end, forward metallic mids, and dense compression.",
    ffmpegArgs: [
      "-af",
      "asetrate=48000*1.05,aresample=48000,highpass=f=45,equalizer=f=95:width_type=h:width=40:g=8,equalizer=f=250:width_type=h:width=120:g=-4,equalizer=f=1800:width_type=h:width=800:g=4.5,equalizer=f=3800:width_type=h:width=1200:g=5,equalizer=f=8000:width_type=h:width=2500:g=2.5,acompressor=threshold=0.09:ratio=8:attack=4:release=50:makeup=2:knee=1,asoftclip=type=cubic:threshold=0.8:output=1.1,alimiter=limit=0.96",
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
  if (["phonk", "brazilian", "automotivo", "montagem", "brazilianphonk", "drift", "driftphonk", "memphis", "cowbell"].includes(norm)) {
    return "phonk";
  }

  return null;
}
