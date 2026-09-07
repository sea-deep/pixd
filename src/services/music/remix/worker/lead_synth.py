"""
Brazilian Phonk / Montagem Lead Synth Generator.
Synthesizes dark, aggressive, distorted Brazilian phonk synth leads based on authentic
minor/Phrygian motifs with octave jumps, punchy transients, and saturation.
"""

import numpy as np
from scipy.signal import butter, sosfilt
from typing import List, Tuple

# Note frequencies for octave 4 (cutting, gritty range for phonk / montagem leads)
ROOT_FREQS = {
    0: 261.63,  # C4
    1: 277.18,  # C#4
    2: 293.66,  # D4
    3: 311.13,  # D#4
    4: 329.63,  # E4
    5: 349.23,  # F4
    6: 369.99,  # F#4
    7: 392.00,  # G4
    8: 415.30,  # G#4
    9: 440.00,  # A4
    10: 466.16, # A#4
    11: 493.88, # B4
}

# Scale degree intervals in semitones (Natural Minor / Phrygian)
# 1 = 0, b2 = 1, 2 = 2, b3 = 3, 4 = 5, 5 = 7, b6 = 8, b7 = 10
# Octave jumps: +12 (e.g. b3 + 12 = 15)

# Shape 1: 1 - 1 - b3 - 1 | b7 - 1 - 5 - b3 (with octave jumps on b3)
MOTIF_1 = [
    (0.0, 0, 1.0),
    (2.0, 0, 0.85),
    (4.0, 15, 1.05),   # b3 + 12
    (6.0, 0, 0.85),
    (8.0, 10, 0.95),   # b7
    (10.0, 0, 0.85),
    (12.0, 7, 1.0),    # 5
    (14.0, 15, 1.05),  # b3 + 12
]

# Shape 2: 1 - b3 - 5 - b3 | 1 - b3 - 5 - 1(+12)
MOTIF_2 = [
    (0.0, 0, 1.0),
    (3.0, 3, 0.9),     # b3
    (6.0, 7, 1.0),     # 5
    (8.0, 3, 0.85),    # b3
    (10.0, 0, 0.9),    # 1
    (12.0, 7, 1.0),    # 5
    (14.0, 12, 1.0),   # 1 + 12 (octave root)
]

# Shape 3: 1 - 1 - b7 - b3 | 1 - 1 - 5 - b3
MOTIF_3 = [
    (0.0, 0, 1.0),
    (2.0, 0, 0.85),
    (4.0, 10, 0.95),   # b7
    (6.0, 15, 1.05),   # b3 + 12
    (8.0, 0, 1.0),
    (10.0, 0, 0.85),
    (12.0, 7, 0.95),   # 5
    (14.0, 3, 0.9),    # b3
]

# Shape 4: 1 - b2 - 1 - b3 | 1 - b2 - 1 - b7 (Evil Phrygian Montagem)
MOTIF_EVIL = [
    (0.0, 0, 1.0),
    (2.0, 1, 0.95),    # b2 (half-step dissonance)
    (4.0, 0, 0.9),
    (6.0, 15, 1.05),   # b3 + 12
    (8.0, 0, 1.0),
    (10.0, 1, 0.95),   # b2
    (12.0, 0, 0.9),
    (14.0, 10, 1.0),   # b7
]


def generate_synth_voice(
    freq_hz: float,
    duration_sec: float = 0.22,
    sr: int = 48000,
    drive: float = 4.2,
) -> np.ndarray:
    """
    Synthesizes an aggressive dual-saw + square wave phonk lead with transient pitch envelope,
    punchy exponential decay, and asymmetrical saturation.
    """
    n_samples = int(duration_sec * sr)
    if n_samples <= 0:
        return np.zeros(0, dtype=np.float32)

    t = np.linspace(0, duration_sec, n_samples, endpoint=False, dtype=np.float32)

    # Fast transient pitch punch (pitch drops 25% in first 20ms for heavy mechanical knock)
    freq_env = freq_hz * (1.0 + 0.28 * np.exp(-t * 90.0, dtype=np.float32))
    phase = 2.0 * np.pi * np.cumsum(freq_env) / sr

    # Detuned dual saws for thick, abrasive body
    saw1 = 2.0 * ((phase / (2.0 * np.pi)) % 1.0) - 1.0
    saw2 = 2.0 * (((phase * 1.008) / (2.0 * np.pi)) % 1.0) - 1.0

    # Square harmonic for gritty bite
    sqr = np.sign(np.sin(phase)).astype(np.float32)

    lead = (0.45 * saw1 + 0.35 * saw2 + 0.20 * sqr).astype(np.float32)

    # Fast attack (1.5ms) and punchy exponential decay
    attack_samples = max(1, int(0.0015 * sr))
    env = np.exp(-t * 11.5, dtype=np.float32)
    env[:attack_samples] = np.linspace(0.0, env[attack_samples - 1], attack_samples, dtype=np.float32)

    # Asymmetrical soft-clipping + hard-clip saturation for authentic montagem grit
    driven = lead * env * drive
    distorted = np.tanh(driven) + 0.15 * np.clip(driven, -0.85, 0.85)
    return distorted.astype(np.float32)


def render_phonk_lead_track(
    bars: List[Tuple[float, float]],
    root_idx: int = 5,  # Default F (idx 5)
    total_samples: int = 0,
    sr: int = 48000,
) -> np.ndarray:
    """
    Renders a dynamic Brazilian phonk lead track synchronized to detected bars.
    Applies high-pass filtering (280Hz) to keep sub-bass clean and stereo Haas widening.
    """
    track_mono = np.zeros(total_samples, dtype=np.float32)
    root_hz = ROOT_FREQS.get(root_idx % 12, 349.23)

    for bar_idx, (bar_start, bar_end) in enumerate(bars):
        bar_dur = bar_end - bar_start
        if bar_dur <= 0.2:
            continue

        step_dur = bar_dur / 16.0
        cycle_8 = bar_idx % 8
        cycle_16 = bar_idx % 16

        # Arrangement dynamics:
        # Bar 0, 1: Drum intro / build (lead silent)
        # Bar 2, 3: Motif 1 enters (1 - 1 - b3 - 1)
        # Bar 4, 5: Evil Phrygian Montagem (1 - b2 - 1 - b3)
        # Bar 6: Motif 3 (1 - 1 - b7 - b3)
        # Bar 7: Turnaround fill (lead silent for drum fill impact)
        if cycle_8 in [0, 1] and cycle_16 < 8:
            continue
        elif cycle_8 == 7:
            # Silence on turnaround bar allows drum roll and vocal chant to punch
            continue
        elif cycle_8 in [2, 3]:
            pattern = MOTIF_1
        elif cycle_8 in [4, 5]:
            pattern = MOTIF_EVIL
        elif cycle_8 == 6:
            pattern = MOTIF_3
        else:
            pattern = MOTIF_2

        for step, semi, vel in pattern:
            event_time = bar_start + (step * step_dur)
            if event_time >= bar_end:
                continue

            freq = root_hz * (2.0 ** (semi / 12.0))
            note = generate_synth_voice(freq, duration_sec=0.20, sr=sr) * vel * 0.45

            start_idx = int(event_time * sr)
            if start_idx >= total_samples:
                continue

            end_idx = min(total_samples, start_idx + len(note))
            track_mono[start_idx:end_idx] += note[:end_idx - start_idx]

    # High-pass filter lead at 280 Hz to leave room for the sub kick & 808
    sos_hp = butter(2, 280.0, btype="highpass", fs=sr, output="sos")
    track_hp = sosfilt(sos_hp, track_mono).astype(np.float32)

    # Stereo widening via Haas delay (9ms delay on right channel)
    delay_samples = int(0.009 * sr)
    left_ch = track_hp
    right_ch = np.roll(track_hp, delay_samples)
    right_ch[:delay_samples] = 0.0

    stereo_lead = np.stack([left_ch, right_ch], axis=1)
    return stereo_lead

