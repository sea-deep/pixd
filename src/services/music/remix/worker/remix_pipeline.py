"""
Brazilian Funk / Montagem Remix Pipeline CLI.
Coordinates audio decoding, stem separation, beat analysis, rhythm scheduling, and rendering.
"""

import argparse
import json
import os
import sys
import time
import hashlib

from analyzer import analyze_track_grid
from separator import separate_stems
from patterns import schedule_drum_timeline
from renderer import render_brazilian_remix

def run_pipeline(
    input_path: str,
    output_path: str,
    cache_dir: str,
    track_id: str,
    model_name: str = "mdx_q",
) -> dict:
    start_time = time.time()
    timings = {}

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input audio file not found: {input_path}")

    # Canonical directory for this track's stems & analysis
    track_hash = hashlib.sha256(f"{track_id}".encode()).hexdigest()[:16]
    track_cache_dir = os.path.join(cache_dir, track_hash)
    os.makedirs(track_cache_dir, exist_ok=True)

    analysis_cache = os.path.join(track_cache_dir, "analysis.json")
    stems_dir = os.path.join(track_cache_dir, "stems")
    assets_dir = os.path.join(os.path.dirname(__file__), "assets")

    # 1. Beat & Rhythm Analysis
    t0 = time.time()
    analysis = analyze_track_grid(input_path, cache_json_path=analysis_cache)
    timings["analysis_sec"] = round(time.time() - t0, 2)

    bpm = analysis["bpm"]
    beats = analysis["beats"]
    downbeats = analysis["downbeats"]
    duration = analysis["duration"]

    # 2. Stem Separation (Demucs)
    t0 = time.time()
    stem_paths = separate_stems(input_path, stems_dir, model_name=model_name)
    timings["separation_sec"] = round(time.time() - t0, 2)

    # 3. Schedule Brazilian Funk Rhythmic Timeline
    t0 = time.time()
    seed = int(hashlib.md5(track_id.encode()).hexdigest()[:8], 16)
    events = schedule_drum_timeline(downbeats, beats, seed=seed)
    timings["scheduling_sec"] = round(time.time() - t0, 2)

    # 4. Render and Master Remix
    t0 = time.time()
    render_brazilian_remix(
        stem_paths=stem_paths,
        events=events,
        assets_dir=assets_dir,
        output_path=output_path,
        target_sr=48000,
        expected_duration=duration,
        beats=beats,
        downbeats=downbeats,
        seed=seed,
    )
    timings["render_sec"] = round(time.time() - t0, 2)
    timings["total_sec"] = round(time.time() - start_time, 2)

    output_size_mb = round(os.path.getsize(output_path) / (1024 * 1024), 2)

    metrics = {
        "status": "success",
        "track_id": track_id,
        "bpm": bpm,
        "duration": duration,
        "event_count": len(events),
        "output_path": output_path,
        "output_size_mb": output_size_mb,
        "timings": timings,
    }

    return metrics

def main():
    parser = argparse.ArgumentParser(description="Brazilian Funk / Montagem Remix Engine")
    parser.add_argument("--input", required=True, help="Input source audio file")
    parser.add_argument("--output", required=True, help="Output destination WAV path")
    parser.add_argument("--cache-dir", default=".cache/remixes", help="Cache directory")
    parser.add_argument("--track-id", default="default", help="Unique track ID")
    parser.add_argument("--model", default="dsp", help="Separation model (dsp or demucs)")

    args = parser.parse_args()

    try:
        metrics = run_pipeline(
            input_path=args.input,
            output_path=args.output,
            cache_dir=args.cache_dir,
            track_id=args.track_id,
            model_name=args.model,
        )
        print(json.dumps(metrics))
        sys.exit(0)
    except Exception as e:
        error_res = {
            "status": "error",
            "error": str(e),
            "track_id": args.track_id,
        }
        print(json.dumps(error_res), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
