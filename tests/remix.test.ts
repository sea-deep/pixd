import { describe, expect, it } from "vitest";
import remixService, { REMIX_VERSION } from "../src/services/music/remix/RemixService.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { existsSync } from "node:fs";

const execFileAsync = promisify(execFile);
const venvPythonPath = path.resolve(process.cwd(), ".venv", "bin", "python");
const hasVenv = existsSync(venvPythonPath);
const pythonExec = hasVenv ? venvPythonPath : (process.env.PYTHON_PATH || "python3");

describe("Brazilian Funk Remix Subsystem", () => {
  describe("RemixService Caching & Hashes", () => {
    it("computes deterministic canonical hash using trackId and version", () => {
      const hash1 = remixService.getCanonicalHash("track123");
      const hash2 = remixService.getCanonicalHash("track123");
      const hash3 = remixService.getCanonicalHash("track999");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1.length).toBe(24);
    });

    it("returns null for uncached remix path", () => {
      expect(remixService.getRemixPath("non_existent_track_999999")).toBeNull();
      expect(remixService.isRemixCached("non_existent_track_999999")).toBe(false);
    });
  });

  describe("Python Rhythm Scheduler & Timeline Verification", () => {
    it("generates authentic, beat-locked Brazilian funk patterns at multiple tempos", async () => {
      const testScript = `
import json
from patterns import schedule_drum_timeline

results = {}
for bpm in [100.0, 120.0, 130.0, 140.0, 150.0]:
    beat_interval = 60.0 / bpm
    beats = [i * beat_interval for i in range(16)] # 4 bars of 4 beats
    downbeats = [beats[i] for i in range(0, 16, 4)]
    events = schedule_drum_timeline(downbeats, beats, seed=42)
    results[int(bpm)] = {
        "event_count": len(events),
        "samples": list(set(s for _, s, _ in events)),
        "first_event": events[0],
        "last_event": events[-1],
    }

print(json.dumps(results))
`;
      const { stdout } = await execFileAsync(pythonExec, ["-c", testScript], {
        cwd: path.resolve(process.cwd(), "src", "services", "music", "remix", "worker"),
      });

      const parsed = JSON.parse(stdout.trim());
      for (const bpm of ["100", "120", "130", "140", "150"]) {
        const res = parsed[bpm];
        expect(res.event_count).toBeGreaterThan(20);
        expect(res.samples).toContain("kick");
        expect(res.samples).toContain("clap");
        expect(res.samples).toContain("tom_high");
        expect(res.first_event[0]).toBe(0.0); // Starts on downbeat 0.0
      }
    });

    it.runIf(hasVenv)("verifies duration preservation within 50ms tolerance", async () => {
      const testScript = `
import soundfile as sf
import numpy as np
import tempfile
import os
from renderer import render_brazilian_remix

sr = 48000
duration = 4.0
samples = int(sr * duration)
sig = np.zeros((samples, 2), dtype=np.float32)

with tempfile.TemporaryDirectory() as tmpdir:
    stem_paths = {}
    for name in ["drums", "bass", "vocals", "other"]:
        p = os.path.join(tmpdir, f"{name}.wav")
        sf.write(p, sig, sr)
        stem_paths[name] = p

    events = [(0.0, "kick", 1.0), (1.0, "clap", 1.0)]
    out_wav = os.path.join(tmpdir, "remix.wav")
    assets_dir = os.path.abspath("assets")

    render_brazilian_remix(
        stem_paths=stem_paths,
        events=events,
        assets_dir=assets_dir,
        output_path=out_wav,
        target_sr=sr,
        expected_duration=duration,
    )

    out_info = sf.info(out_wav)
    print(out_info.duration)
`;
      const { stdout } = await execFileAsync(venvPythonPath, ["-c", testScript], {
        cwd: path.resolve(process.cwd(), "src", "services", "music", "remix", "worker"),
      });

      const outputDuration = parseFloat(stdout.trim());
      expect(Math.abs(outputDuration - 4.0)).toBeLessThan(0.05);
    });

    it.runIf(hasVenv)("extracts vocal chops and schedules montagem stutters without distortion", async () => {
      const testScript = `
import json
import numpy as np
from vocal_chopper import generate_vocal_chops

sr = 48000
duration = 8.0
t = np.linspace(0, duration, int(sr * duration), endpoint=False)
voc = np.zeros((len(t), 2), dtype=np.float32)

# Add synthetic vocal syllables
for st in [0.2, 0.8, 1.4, 2.5, 3.2, 4.1, 5.0, 6.3]:
    idx = int(st * sr)
    blen = int(0.25 * sr)
    bt = np.linspace(0, 0.25, blen, endpoint=False)
    burst = (np.sin(2 * np.pi * 450 * bt) + 0.5 * np.sin(2 * np.pi * 1100 * bt)) * np.exp(-7 * bt)
    voc[idx:idx+blen, 0] += burst
    voc[idx:idx+blen, 1] += burst

beats = [i * 0.5 for i in range(16)] # 120 BPM
downbeats = [i * 2.0 for i in range(4)]
chops = generate_vocal_chops(voc, beats, downbeats, sr=sr, seed=42)

res = {
    "is_none": chops is None,
    "shape": list(chops.shape) if chops is not None else [],
    "max_val": float(np.max(np.abs(chops))) if chops is not None else 0.0,
    "has_nan": bool(np.isnan(chops).any()) if chops is not None else True,
}
print(json.dumps(res))
`;
      const { stdout } = await execFileAsync(venvPythonPath, ["-c", testScript], {
        cwd: path.resolve(process.cwd(), "src", "services", "music", "remix", "worker"),
      });

      const res = JSON.parse(stdout.trim());
      expect(res.is_none).toBe(false);
      expect(res.shape[0]).toBe(48000 * 8);
      expect(res.shape[1]).toBe(2);
      expect(res.max_val).toBeGreaterThan(0.05);
      expect(res.has_nan).toBe(false);
    });
  });
});

