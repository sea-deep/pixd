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

# Standard note-spacing vocabulary around ~130 BPM (in milliseconds):
# 58 ms   = 1/32 very fast ornament
# 115 ms  = 1/16 normal rapid movement
# 173 ms  = dotted 1/16-ish
# 231 ms  = 1/8 breathing space
# 346 ms  = dotted 1/8-ish
# 462 ms  = 1/4 strong pause / phrase reset

# Motif item format: (semitone_from_root, delay_ms, velocity, octave_jump)

# 1. Signature MATADORA Motif:
# 1 (115ms) -> b2 (115ms) -> 1 (231ms) -> b2 (115ms) -> b3 (115ms) -> b2 (231ms) -> 1 (462ms)
MATADORA_MAIN = [
    (0, 115, 1.0, 0),        # 1
    (1, 115, 0.95, 0),       # b2
    (0, 231, 1.0, 0),        # 1 (breathing space)
    (1, 115, 0.95, 0),       # b2
    (3, 115, 1.05, 12),      # b3 (+12 octave jump scream!)
    (1, 231, 0.95, 0),       # b2 (breathing space)
    (0, 462, 1.0, 0),        # 1 (strong pause / phrase reset)
]

# 2. More Frantic Version (with fast 58ms ornaments):
# 1 (115) -> b2 (58) -> 1 (58) -> b2 (115) -> 1 (115) -> b3 (115) -> b2 (115) -> 1 (231)
MATADORA_FRANTIC = [
    (0, 115, 1.0, 0),        # 1
    (1, 58, 0.92, 0),        # b2 (58ms fast ornament)
    (0, 58, 0.88, 0),        # 1 (58ms fast ornament)
    (1, 115, 0.95, 0),       # b2
    (0, 115, 0.90, 0),       # 1
    (3, 115, 1.05, 12),      # b3 (+12 octave jump!)
    (1, 115, 0.95, 0),       # b2
    (0, 231, 1.0, 0),        # 1 (breathing space)
]

# 3. Nasty Syncopated Feel: 115, 58, 58, 231, 115, 115, 231
MATADORA_SYNCOPATED = [
    (0, 115, 1.0, 0),        # 1
    (1, 58, 0.92, 0),        # b2 (58ms)
    (0, 58, 0.88, 0),        # 1 (58ms)
    (10, 231, 1.0, 0),       # b7 (231ms breathing space)
    (0, 115, 0.90, 0),       # 1
    (3, 115, 1.05, 12),      # b3 (+12 octave jump)
    (0, 231, 1.0, 0),        # 1 (breathing space)
]

# 4. Melodic Minor Variation: 1 - b3 - 5 - b3 with phrase reset
MATADORA_MELODIC = [
    (0, 115, 1.0, 0),        # 1
    (3, 115, 0.95, 12),      # b3 (+12)
    (7, 231, 1.0, 0),        # 5 (breathing space)
    (3, 115, 0.90, 12),      # b3 (+12)
    (0, 115, 0.95, 0),       # 1
    (7, 231, 1.0, 0),        # 5
    (0, 462, 1.0, 12),       # 1 (+12 phrase reset)
]


def generate_synth_voice(
    freq_hz: float,
    duration_sec: float = 0.22,
    decay_rate: float = 12.0,
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

    # Fast transient pitch punch (pitch drops 28% in first 20ms for heavy mechanical knock)
    freq_env = freq_hz * (1.0 + 0.28 * np.exp(-t * 90.0, dtype=np.float32))
    phase = 2.0 * np.pi * np.cumsum(freq_env) / sr

    # Detuned dual saws for thick abrasive body
    saw1 = 2.0 * ((phase / (2.0 * np.pi)) % 1.0) - 1.0
    saw2 = 2.0 * (((phase * 1.008) / (2.0 * np.pi)) % 1.0) - 1.0

    # Square harmonic for gritty bite
    sqr = np.sign(np.sin(phase)).astype(np.float32)

    lead = (0.45 * saw1 + 0.35 * saw2 + 0.20 * sqr).astype(np.float32)

    # Attack (1.5ms) and adaptive decay envelope
    attack_samples = max(1, int(0.0015 * sr))
    env = np.exp(-t * decay_rate, dtype=np.float32)
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
    Renders a dynamic Brazilian phonk lead track with authentic ~130 BPM MATADORA-ish
    timing vocabulary (58ms, 115ms, 173ms, 231ms, 346ms, 462ms).
    Synchronized to detected bars, with high-pass filtering (280Hz) and Haas stereo widening.
    """
    track_mono = np.zeros(total_samples, dtype=np.float32)
    root_hz = ROOT_FREQS.get(root_idx % 12, 349.23)

    for bar_idx, (bar_start, bar_end) in enumerate(bars):
        bar_dur = bar_end - bar_start
        if bar_dur <= 0.2:
            continue

        # Scale factor based on bar duration relative to 130 BPM (1.846s per 4/4 bar)
        tempo_scale = bar_dur / 1.84615

        cycle_8 = bar_idx % 8
        cycle_16 = bar_idx % 16

        # Arrangement dynamics:
        # Bar 0, 1: Drum intro / build (lead silent)
        # Bar 2, 3: Signature MATADORA Motif (1 -> b2 -> 1 -> b2 -> b3 -> b2 -> 1)
        # Bar 4, 5: Frantic ornamented variation (with fast 58ms ornaments)
        # Bar 6: Nasty syncopated bounce (115, 58, 58, 231, 115, 115, 231)
        # Bar 7: Turnaround fill (lead silent for drum roll and vocal chant impact!)
        if cycle_8 in [0, 1] and cycle_16 < 8:
            continue
        elif cycle_8 == 7:
            # Turnaround silence lets the drum roll and vocal chant punch hard
            continue
        elif cycle_8 in [2, 3]:
            pattern = MATADORA_MAIN
        elif cycle_8 in [4, 5]:
            pattern = MATADORA_FRANTIC + MATADORA_FRANTIC
        elif cycle_8 == 6:
            pattern = MATADORA_SYNCOPATED + MATADORA_SYNCOPATED
        else:
            pattern = MATADORA_MELODIC

        current_time = bar_start
        for semi, delay_ms, vel, oct_jump in pattern:
            if current_time >= bar_end:
                break

            step_sec = (delay_ms / 1000.0) * tempo_scale

            # Adaptive note articulation based on timing vocabulary:
            # 58ms ornament: fast staccato (decay 24.0, dur 48ms)
            # 115ms rapid: articulate punch (decay 14.0, dur 95ms)
            # 231ms breathing: fuller ring (decay 10.0, dur 180ms)
            # 462ms reset: sustained ring (decay 7.0, dur 250ms)
            if delay_ms <= 60:
                sound_dur = min(0.048, step_sec * 0.85)
                decay = 24.0
            elif delay_ms <= 120:
                sound_dur = min(0.095, step_sec * 0.82)
                decay = 14.0
            elif delay_ms <= 240:
                sound_dur = min(0.180, step_sec * 0.78)
                decay = 10.0
            else:
                sound_dur = min(0.250, step_sec * 0.65)
                decay = 7.0

            freq = root_hz * (2.0 ** ((semi + oct_jump) / 12.0))
            note = generate_synth_voice(freq, duration_sec=sound_dur, decay_rate=decay, sr=sr) * vel * 0.45

            start_idx = int(current_time * sr)
            if start_idx < total_samples:
                end_idx = min(total_samples, start_idx + len(note))
                track_mono[start_idx:end_idx] += note[:end_idx - start_idx]

            current_time += step_sec

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

