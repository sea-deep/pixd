"""
Vocal Chopper for Brazilian Funk / Montagem Remix Engine.

Detects vocal activity and syllable onsets in the separated vocal stem.
Extracts transient-aligned micro-slices (100–300ms) with anti-click envelopes.
Schedules authentic Brazilian phonk / montagem vocal chops:
  - 16th-note stutter fills leading into turnaround bars (steps 12, 13, 14, 15).
  - 8-step build-up rolls on 8-bar phrase endings (steps 8 to 15).
  - Syncopated offbeat stabs (call-and-response against the tamborzão kick/clap).
Applies highpass filtering (180 Hz) and soft saturation so chops punch through without low-end mud.
"""

from dataclasses import dataclass
from typing import List, Tuple, Optional
import numpy as np


@dataclass
class VocalChop:
    data: np.ndarray        # Stereo slice (samples, 2)
    duration_sec: float
    energy: float


def detect_vocal_slices(
    vocals: np.ndarray,
    sr: int = 48000,
    target_slice_sec: float = 0.20,
    min_energy_threshold: float = 0.02,
) -> List[VocalChop]:
    """
    Scans the vocal stem for prominent, clean vocal transients and slices them
    with smooth anti-click attack/decay envelopes.
    """
    if vocals is None or len(vocals) == 0:
        return []

    # Convert to mono for energy analysis
    if vocals.ndim == 2:
        mono = np.mean(vocals, axis=1)
    else:
        mono = vocals
        vocals = np.stack([vocals, vocals], axis=1)

    # Frame-wise RMS energy (20ms window, 10ms hop)
    frame_len = int(0.020 * sr)
    hop_len = int(0.010 * sr)
    if len(mono) < frame_len:
        return []

    num_frames = (len(mono) - frame_len) // hop_len
    rms = np.zeros(num_frames, dtype=np.float32)
    for i in range(num_frames):
        start = i * hop_len
        window = mono[start : start + frame_len]
        rms[i] = np.sqrt(np.mean(window ** 2))

    max_rms = np.max(rms) if len(rms) > 0 else 0.0
    if max_rms < min_energy_threshold:
        # Instrumental or silence
        return []

    # Onset energy differential (half-wave rectified flux)
    diff = np.maximum(0.0, rms[1:] - rms[:-1])
    onset_threshold = max(min_energy_threshold * 1.5, float(np.percentile(diff, 80)))

    candidate_onsets: List[int] = []
    min_distance_samples = int(0.18 * sr)  # Minimum 180ms between candidate syllable onsets
    last_sample_idx = -min_distance_samples

    for i in range(1, len(diff) - 1):
        if diff[i] > onset_threshold and diff[i] >= diff[i - 1] and diff[i] >= diff[i + 1]:
            sample_idx = i * hop_len
            if sample_idx - last_sample_idx >= min_distance_samples:
                candidate_onsets.append(sample_idx)
                last_sample_idx = sample_idx

    if not candidate_onsets:
        # Fallback: take highest RMS peaks
        peak_frame_indices = np.argsort(rms)[-8:]
        for fi in sorted(peak_frame_indices):
            sample_idx = int(fi * hop_len)
            if sample_idx - last_sample_idx >= min_distance_samples:
                candidate_onsets.append(sample_idx)
                last_sample_idx = sample_idx

    slice_samples = int(target_slice_sec * sr)
    attack_samples = int(0.004 * sr)   # 4ms attack
    decay_samples = int(0.025 * sr)    # 25ms release envelope

    envelope = np.ones(slice_samples, dtype=np.float32)
    if slice_samples > attack_samples + decay_samples:
        envelope[:attack_samples] = np.linspace(0.0, 1.0, attack_samples)
        envelope[-decay_samples:] = np.linspace(1.0, 0.0, decay_samples)
    else:
        envelope = np.hanning(slice_samples)

    chops: List[VocalChop] = []
    for onset in candidate_onsets:
        end = onset + slice_samples
        if end > len(vocals):
            continue

        slice_data = vocals[onset:end].copy()
        slice_rms = np.sqrt(np.mean(slice_data ** 2))
        if slice_rms < min_energy_threshold:
            continue

        # Apply anti-click envelope
        slice_data[:, 0] *= envelope
        slice_data[:, 1] *= envelope

        # Normalize peak level
        peak = np.max(np.abs(slice_data))
        if peak > 0.01:
            slice_data = slice_data * (0.85 / peak)

        chops.append(VocalChop(
            data=slice_data,
            duration_sec=target_slice_sec,
            energy=float(slice_rms),
        ))

    # Sort chops by energy, select top diverse candidates
    chops.sort(key=lambda c: c.energy, reverse=True)
    return chops[:8]


def pitch_shift_slice(data: np.ndarray, semitones: float) -> np.ndarray:
    """
    Shifts pitch by resampling (simulates tape-style / sampler-style pitch shift).
    """
    if abs(semitones) < 0.01:
        return data

    rate = 2.0 ** (semitones / 12.0)
    orig_len = len(data)
    new_len = int(orig_len / rate)
    if new_len < 10:
        return data

    from scipy.signal import resample
    shifted = resample(data, new_len, axis=0)
    # Match original duration by padding or trimming with fade
    if len(shifted) < orig_len:
        pad = np.zeros((orig_len - len(shifted), data.shape[1]), dtype=np.float32)
        return np.vstack([shifted, pad])
    else:
        return shifted[:orig_len]


def generate_vocal_chops(
    vocals: np.ndarray,
    beats: List[float],
    downbeats: List[float],
    sr: int = 48000,
    seed: int = 42,
) -> Optional[np.ndarray]:
    """
    Generates a synchronized vocal chop layer over the entire track duration.
    Returns stereo np.ndarray of shape (len(vocals), 2), or None if vocals are absent.
    """
    if vocals is None or len(vocals) == 0:
        return None

    # Step 1: Detect candidate syllable chops
    chops = detect_vocal_slices(vocals, sr=sr)
    if not chops:
        return None

    total_samples = len(vocals)
    chop_track = np.zeros((total_samples, 2), dtype=np.float32)

    import random
    rng = random.Random(seed)

    # Estimate average bar duration
    if len(downbeats) >= 2:
        bar_durations = [downbeats[i+1] - downbeats[i] for i in range(len(downbeats)-1)]
        avg_bar_sec = float(np.median(bar_durations))
    elif len(beats) >= 4:
        avg_bar_sec = float(beats[3] - beats[0])
    else:
        avg_bar_sec = 60.0 / 130.0 * 4.0

    # Process bar by bar
    num_bars = len(downbeats)
    for bar_idx in range(num_bars):
        bar_start = downbeats[bar_idx]
        if bar_idx + 1 < num_bars:
            bar_end = downbeats[bar_idx + 1]
            bar_sec = bar_end - bar_start
        else:
            bar_sec = avg_bar_sec

        step_sec = bar_sec / 16.0  # 16th-note subdivision
        selected_chop = chops[bar_idx % len(chops)]

        # 1. Major Turnaround (every 8th bar, bar_idx % 8 == 7):
        # 8-hit rising stutter roll leading into the drop
        if bar_idx % 8 == 7:
            # Steps 8, 9, 10, 11, 12, 13, 14, 15
            for i, step in enumerate(range(8, 16)):
                hit_time = bar_start + (step * step_sec)
                vel = 0.55 + (i * 0.06)  # Ramp 0.55 -> 0.97
                pitch_semitone = -2.0 + (i * 0.5)  # Pitch riser from -2 to +1.5 semitones
                slice_data = pitch_shift_slice(selected_chop.data, pitch_semitone) * vel

                start_idx = int(hit_time * sr)
                if start_idx >= total_samples:
                    continue
                end_idx = min(total_samples, start_idx + len(slice_data))
                length = end_idx - start_idx
                chop_track[start_idx:end_idx] += slice_data[:length]

        # 2. Regular Turnaround (every 4th bar, bar_idx % 4 == 3):
        # 4-hit rapid stutter on the last 4 16th notes (steps 12, 13, 14, 15)
        elif bar_idx % 4 == 3:
            for i, step in enumerate(range(12, 16)):
                hit_time = bar_start + (step * step_sec)
                vel = 0.70 + (i * 0.09)  # Ramp 0.70 -> 0.97
                slice_data = selected_chop.data * vel

                start_idx = int(hit_time * sr)
                if start_idx >= total_samples:
                    continue
                end_idx = min(total_samples, start_idx + len(slice_data))
                length = end_idx - start_idx
                chop_track[start_idx:end_idx] += slice_data[:length]

        # 3. Groove Bars (bars % 2 == 1):
        # Syncopated call-and-response stab answering the clap (step 6 and step 14)
        elif bar_idx % 2 == 1 and rng.random() > 0.25:
            for step, vel in [(6.0, 0.85), (14.0, 0.90)]:
                hit_time = bar_start + (step * step_sec)
                slice_data = selected_chop.data * vel

                start_idx = int(hit_time * sr)
                if start_idx >= total_samples:
                    continue
                end_idx = min(total_samples, start_idx + len(slice_data))
                length = end_idx - start_idx
                chop_track[start_idx:end_idx] += slice_data[:length]

    # Clean up low frequencies: 2nd order Butterworth high-pass at 180Hz
    from scipy.signal import butter, sosfilt
    sos = butter(2, 180.0, btype="highpass", fs=sr, output="sos")
    for ch in range(2):
        chop_track[:, ch] = sosfilt(sos, chop_track[:, ch])

    # Add aggressive montagem saturation
    chop_track = np.tanh(1.20 * chop_track)

    return chop_track
