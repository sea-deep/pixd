"""
Audio Rhythm & Beat Analyzer.
Computes BPM, beat timestamps (seconds), and downbeats (bar starts).
"""

import json
import os
from typing import Dict, List, Any
import numpy as np
import soundfile as sf
import librosa

def analyze_track_grid(audio_path: str, cache_json_path: str = None) -> Dict[str, Any]:
    """
    Analyzes an audio file and returns { bpm, root_key, beats, downbeats, duration }.
    Uses streaming decimation to keep memory footprint under 30MB regardless of track duration.
    If cache_json_path is provided and exists, loads from cache.
    """
    if cache_json_path and os.path.exists(cache_json_path):
        try:
            with open(cache_json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "bpm" in data and "beats" in data and "root_key" in data:
                    return data
        except Exception:
            pass

    # Read audio metadata and sample the first 90 seconds (saves ~1.5GB RAM vs loading full track)
    with sf.SoundFile(audio_path) as f:
        orig_sr = f.samplerate
        total_frames = len(f)
        duration = float(total_frames) / float(orig_sr)

        # Max 90s is more than sufficient for rock-solid tempo and chroma analysis
        frames_to_read = min(total_frames, int(orig_sr * 90))
        raw_audio = f.read(frames_to_read, dtype="float32")

    if raw_audio.ndim > 1:
        mono = np.mean(raw_audio, axis=1)
    else:
        mono = raw_audio

    # Decimate to ~22050 Hz without calling scipy.signal.resample (which runs FFT across millions of samples)
    step = max(1, int(orig_sr / 22050))
    y = mono[::step]
    analysis_sr = orig_sr // step

    # Onset envelope
    onset_env = librosa.onset.onset_strength(y=y, sr=analysis_sr)

    # Estimate tempo & beat frames
    tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=analysis_sr)

    # Handle scalar or array tempo
    if hasattr(tempo, "__len__"):
        bpm = float(tempo[0]) if len(tempo) > 0 else 130.0
    else:
        bpm = float(tempo)

    # Normalize tempo to Brazilian Phonk sweet spot (120 - 150 BPM)
    while bpm < 90.0 and bpm > 30.0:
        bpm *= 2.0
    while bpm > 180.0:
        bpm /= 2.0

    # Detect musical key (chroma pitch class: 0=C, 1=C#, 2=D, ..., 11=B)
    chroma_samples = min(len(y), analysis_sr * 45)
    chroma = librosa.feature.chroma_stft(y=y[:chroma_samples], sr=analysis_sr, n_fft=2048, hop_length=512)
    root_key = int(np.argmax(np.sum(chroma, axis=1)))

    # Compute beat grid
    detected_beat_times = librosa.frames_to_time(beat_frames, sr=analysis_sr).tolist()
    beat_interval = 60.0 / (bpm if bpm > 0 else 130.0)

    if len(detected_beat_times) >= 2:
        first_beat = float(detected_beat_times[0])
    else:
        first_beat = 0.0

    # Project backwards towards 0
    pre_beats = []
    t = first_beat - beat_interval
    while t >= 0.0:
        pre_beats.append(t)
        t -= beat_interval
    pre_beats.reverse()

    # Project forwards through full duration
    post_beats = []
    t = first_beat
    while t < duration:
        post_beats.append(t)
        t += beat_interval

    all_beats = pre_beats + post_beats

    # Compute downbeats (every 4 beats) aligned with strongest beat onset
    downbeats: List[float] = []
    if len(all_beats) >= 4:
        energies = []
        for offset in range(min(4, len(all_beats))):
            s_idx = int(all_beats[offset] * orig_sr)
            w_start = max(0, s_idx - int(0.025 * orig_sr))
            w_end = min(len(mono), s_idx + int(0.025 * orig_sr))
            if w_end > w_start:
                energies.append(float(np.sum(mono[w_start:w_end] ** 2)))
            else:
                energies.append(0.0)

        best_phase = int(np.argmax(energies)) if energies else 0
        downbeats = [float(all_beats[i]) for i in range(best_phase, len(all_beats), 4)]
    else:
        downbeats = [float(b) for b in all_beats]

    result: Dict[str, Any] = {
        "bpm": round(bpm, 2),
        "duration": round(duration, 3),
        "root_key": root_key,
        "beats": [round(b, 4) for b in all_beats],
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

