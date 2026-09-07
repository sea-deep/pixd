import { describe, expect, it, vi } from "vitest";
import remixService, { REMIX_VERSION } from "../src/services/music/remix/RemixService.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

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
      const venvPython = path.resolve(process.cwd(), ".venv", "bin", "python");
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
      const { stdout } = await execFileAsync(venvPython, ["-c", testScript], {
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

    it("verifies duration preservation within 50ms tolerance", async () => {
      const venvPython = path.resolve(process.cwd(), ".venv", "bin", "python");
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
      const { stdout } = await execFileAsync(venvPython, ["-c", testScript], {
        cwd: path.resolve(process.cwd(), "src", "services", "music", "remix", "worker"),
      });

      const outputDuration = parseFloat(stdout.trim());
      expect(Math.abs(outputDuration - 4.0)).toBeLessThan(0.05);
    });
  });
});
