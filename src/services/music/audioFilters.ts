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
    description: "+5 dB low shelf @ 90Hz with 2:1 RMS dynamic compression and peak limiting.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "highpass=f=28:p=2, bass=f=90:t=q:w=0.7:g=5, equalizer=f=250:t=q:w=1:g=-1.5, acompressor=threshold=0.22:ratio=2:attack=30:release=120:makeup=1.08:knee=2.8:link=maximum:detection=rms, alimiter=limit=0.95:attack=5:release=60:level=0",
    ],
  },
  slowed: {
    name: "slowed",
    label: "Slowed + Reverb",
    emoji: "",
    description: "0.88x speed & pitch with high-cut, warmth, dual echoes, and peak limiting.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "aresample=48000, asetrate=42240, aresample=48000, highpass=f=25:p=2, lowpass=f=11500:p=2, bass=f=110:t=q:w=0.7:g=1.5, treble=f=6500:t=q:w=0.7:g=-1.5, aecho=0.90:0.85:80|160:0.16|0.08, alimiter=limit=0.95:attack=5:release=80:level=0",
    ],
  },
  sped: {
    name: "sped",
    label: "Sped Up",
    emoji: "",
    description: "1.18x WSOLA tempo scaling with pitch preserved and tonal correction.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "atempo=1.18, highpass=f=25:p=2, bass=f=100:t=q:w=0.7:g=0.8, treble=f=6500:t=q:w=0.7:g=0.8, alimiter=limit=0.95:attack=3:release=50:level=0",
    ],
  },
  nightcore: {
    name: "nightcore",
    label: "Nightcore",
    emoji: "",
    description: "1.20x speed & pitch (+3.2 semitones) with low/high balance and presence boost.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "aresample=48000, asetrate=57600, aresample=48000, bass=f=110:t=q:w=0.7:g=1, treble=f=6000:t=q:w=0.7:g=1.2, equalizer=f=2500:t=q:w=1:g=0.8, alimiter=limit=0.95:attack=3:release=50:level=0",
    ],
  },
  vaporwave: {
    name: "vaporwave",
    label: "Vaporwave",
    emoji: "",
    description: "0.82x speed & pitch with tape wow vibrato, dual echoes, stereo width, and tanh softclipping.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "aresample=48000, asetrate=39360, aresample=48000, highpass=f=25:p=2, lowpass=f=9500:p=2, bass=f=120:t=q:w=0.7:g=2, treble=f=5500:t=q:w=0.7:g=-2, vibrato=f=0.35:d=0.06, aecho=0.90:0.82:110|220:0.14|0.07, extrastereo=m=1.10:c=0, asoftclip=type=tanh:threshold=0.92:output=0.95:param=1:oversample=2, alimiter=limit=0.95:attack=5:release=100:level=0",
    ],
  },
  "8d": {
    name: "8d",
    label: "8D Audio",
    emoji: "",
    description: "Slow sine autopanning (11s orbit cycle) with 180° phase offset and wide stereo.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "apulsator=mode=sine:amount=0.80:offset_l=0:offset_r=0.5:timing=hz:hz=0.09, extrastereo=m=1.15:c=0, aecho=0.90:0.92:24:0.05, alimiter=limit=0.95:attack=3:release=50:level=0",
    ],
  },
  karaoke: {
    name: "karaoke",
    label: "Karaoke",
    emoji: "",
    description: "Center vocal phase cancellation with bass preservation below 120Hz.",
    kind: "live-filter",
    ffmpegArgs: [
      "-filter_complex",
      "[0:a]asplit=2[orig][side]; [orig]lowpass=f=120:p=2,volume=0.85[low]; [side]highpass=f=120:p=2, pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0[sc]; [low][sc]amix=inputs=2:weights=1 1:normalize=0, alimiter=limit=0.95:attack=5:release=60:level=0[out]",
      "-map",
      "[out]",
    ],
  },
  distorted: {
    name: "distorted",
    label: "Distorted",
    emoji: "",
    description: "+6.8 dB overdrive into 10-bit crusher and 4x oversampled tanh softclipping.",
    kind: "live-filter",
    ffmpegArgs: [
      "-af",
      "volume=2.2, highpass=f=30:p=2, bass=f=90:t=q:w=0.8:g=2, equalizer=f=2800:t=q:w=1:g=2, acrusher=bits=10:mix=0.15:mode=log:aa=0.7:samples=1, asoftclip=type=tanh:threshold=0.65:output=0.78:param=1:oversample=4, alimiter=limit=0.93:attack=1:release=40:level=0",
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
  if (["sped", "spedup", "speed", "speedup", "fast"].includes(norm)) {
    return "sped";
  }
  if (["nightcore", "nc"].includes(norm)) {
    return "nightcore";
  }
  if (["vaporwave", "vw", "vapor"].includes(norm)) {
    return "vaporwave";
  }
  if (["8d", "8daudio", "pan", "autopan"].includes(norm)) {
    return "8d";
  }
  if (["karaoke", "vocal", "vocals", "instrumental", "removevocals"].includes(norm)) {
    return "karaoke";
  }
  if (["distorted", "distort", "distortion", "crush", "earrape"].includes(norm)) {
    return "distorted";
  }

  return null;
}
