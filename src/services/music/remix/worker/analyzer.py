"""
Audio Rhythm & Beat Analyzer.
Computes BPM, beat timestamps (seconds), and downbeats (bar starts).
"""

import json
import os
from typing import Dict, List, Any
import numpy as np
import librosa

def analyze_track_grid(audio_path: str, cache_json_path: str = None) -> Dict[str, Any]:
    """
    Analyzes an audio file and returns { bpm, beats, downbeats, duration }.
    If cache_json_path is provided and exists, loads from cache.
    """
    if cache_json_path and os.path.exists(cache_json_path):
        try:
            with open(cache_json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "bpm" in data and "beats" in data:
                    return data
        except Exception:
            pass

    # Load audio at 22050 Hz for fast, reliable beat tracking
    y, sr = librosa.load(audio_path, sr=22050, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    # Onset envelope
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    
    # Estimate tempo & beat frames
    tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
    
    # Handle scalar or array tempo
    if hasattr(tempo, "__len__"):
        bpm = float(tempo[0]) if len(tempo) > 0 else 130.0
    else:
        bpm = float(tempo)

    # Sanity bounds: if track is detected at half-time (e.g. 65 BPM), normalize toward 125-140 BPM
    if bpm < 90.0 and bpm > 40.0:
        bpm *= 2.0
    elif bpm > 180.0:
        bpm /= 2.0

    beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

    # If beat tracking returned sparse beats, synthesize beat grid from tempo
    if len(beat_times) < 4:
        beat_interval = 60.0 / (bpm if bpm > 0 else 130.0)
        beat_times = np.arange(0.0, duration, beat_interval).tolist()

    # Compute downbeats (every 4 beats)
    # Align starting phase with strongest beat onset
    downbeats: List[float] = []
    if len(beat_times) >= 4:
        # Check energy across the first 4 beat positions to find likely downbeat phase
        energies = []
        for offset in range(min(4, len(beat_times))):
            sample_idx = int(beat_times[offset] * sr)
            window = y[max(0, sample_idx - 1000): min(len(y), sample_idx + 1000)]
            energies.append(np.sum(window**2))
        best_phase = int(np.argmax(energies))

        for i in range(best_phase, len(beat_times), 4):
            downbeats.append(float(beat_times[i]))
    else:
        downbeats = [float(b) for b in beat_times]

    result: Dict[str, Any] = {
        "bpm": round(bpm, 2),
        "duration": round(duration, 3),
        "beats": [round(b, 4) for b in beat_times],
        "downbeats": [round(d, 4) for d in downbeats],
    }

    if cache_json_path:
        os.makedirs(os.path.dirname(os.path.abspath(cache_json_path)), exist_ok=True)
        try:
            with open(cache_json_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
        except Exception:
            pass

    return result
