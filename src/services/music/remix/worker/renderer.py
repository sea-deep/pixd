"""
Remix Audio Renderer.
Synthesizes Brazilian funk rhythm onto the separated stems, applies bass ducking,
attenuates original kick, and masters to 48kHz stereo WAV matching exact source duration.
"""

import os
import soundfile as sf
import numpy as np
from typing import Dict, List, Tuple

def load_drum_kit(assets_dir: str, target_sr: int = 48000) -> Dict[str, np.ndarray]:
    kit: Dict[str, np.ndarray] = {}
    samples = ["kick", "clap", "tom_low", "tom_high", "perc", "hat"]

    for name in samples:
        path = os.path.join(assets_dir, f"{name}.wav")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Missing drum asset: {path}")

        data, sr = sf.read(path, dtype="float32")
        # Ensure stereo
        if data.ndim == 1:
            data = np.stack([data, data], axis=1)

        # Resample if sample rate doesn't match target_sr
        if sr != target_sr:
            from scipy.signal import resample
            new_len = int(len(data) * target_sr / sr)
            data = resample(data, new_len, axis=0)

        kit[name] = data
    return kit

def render_drum_track(
    events: List[Tuple[float, str, float]],
    total_samples: int,
    sr: int,
    drum_kit: Dict[str, np.ndarray],
) -> np.ndarray:
    """
    Renders scheduled drum events onto a stereo buffer of length total_samples.
    """
    track = np.zeros((total_samples, 2), dtype=np.float32)

    for time_sec, sample_name, velocity in events:
        if sample_name not in drum_kit:
            continue

        sample_data = drum_kit[sample_name] * velocity
        start_idx = int(time_sec * sr)
        if start_idx >= total_samples:
            continue

        end_idx = min(total_samples, start_idx + len(sample_data))
        length = end_idx - start_idx
        track[start_idx:end_idx] += sample_data[:length]

    return track

def apply_kick_sidechain_to_bass(
    bass: np.ndarray,
    kick_events: List[float],
    sr: int,
) -> np.ndarray:
    """
    Ducks bass stem during new kick transients for clean impact and pumping automotivo groove.
    """
    ducking_envelope = np.ones(len(bass), dtype=np.float32)
    # Duck curve: drop to 0.15 over 5ms, recover over 90ms
    attack_samples = int(0.005 * sr)
    decay_samples = int(0.090 * sr)
    total_duck_samples = attack_samples + decay_samples

    duck_curve = np.ones(total_duck_samples, dtype=np.float32)
    duck_curve[:attack_samples] = np.linspace(1.0, 0.15, attack_samples)
    duck_curve[attack_samples:] = np.linspace(0.15, 1.0, decay_samples)

    for kick_time in kick_events:
        idx = int(kick_time * sr)
        if idx >= len(bass):
            continue
        end = min(len(bass), idx + total_duck_samples)
        length = end - idx
        ducking_envelope[idx:end] = np.minimum(ducking_envelope[idx:end], duck_curve[:length])

    # Multiply envelope across all channels
    return bass * ducking_envelope[:, np.newaxis]

def attenuate_original_drums(drums: np.ndarray, sr: int) -> np.ndarray:
    """
    High-passes and attenuates the original drum stem to remove clashing kicks
    while preserving auxiliary hi-hats, cymbals, and shakers.
    """
    from scipy.signal import butter, sosfilt
    # 2nd order Butterworth high-pass at 220Hz
    sos = butter(2, 220.0, btype="highpass", fs=sr, output="sos")
    filtered_drums = np.zeros_like(drums)
    for ch in range(drums.shape[1]):
        filtered_drums[:, ch] = sosfilt(sos, drums[:, ch])
    # Attenuate remaining level to sit neatly behind new Brazilian percussion
    return filtered_drums * 0.45

def render_brazilian_remix(
    stem_paths: Dict[str, str],
    events: List[Tuple[float, str, float]],
    assets_dir: str,
    output_path: str,
    target_sr: int = 48000,
    expected_duration: float = None,
) -> str:
    """
    Renders the complete Brazilian funk / montagem remix:
    1. Loads stems & resamples to 48kHz.
    2. Renders new Brazilian funk drum events.
    3. Sidechains bass against replacement kick.
    4. Attenuates original drum kicks.
    5. Masters with soft-clipping and peak limiting.
    6. Verifies exact duration match.
    """
    # Load all stems
    stems = {}
    max_len = 0
    for name in ["drums", "bass", "vocals", "other"]:
        data, sr = sf.read(stem_paths[name], dtype="float32")
        if data.ndim == 1:
            data = np.stack([data, data], axis=1)
        if sr != target_sr:
            from scipy.signal import resample
            new_len = int(len(data) * target_sr / sr)
            data = resample(data, new_len, axis=0)
        stems[name] = data
        max_len = max(max_len, len(data))

    # Pad all stems to uniform max length
    for name in stems:
        if len(stems[name]) < max_len:
            pad = np.zeros((max_len - len(stems[name]), 2), dtype=np.float32)
            stems[name] = np.vstack([stems[name], pad])

    total_samples = max_len
    if expected_duration is not None and expected_duration > 0:
        expected_samples = int(expected_duration * target_sr)
        if total_samples < expected_samples:
            pad = np.zeros((expected_samples - total_samples, 2), dtype=np.float32)
            for name in stems:
                stems[name] = np.vstack([stems[name], pad])
            total_samples = expected_samples
        elif total_samples > expected_samples:
            for name in stems:
                stems[name] = stems[name][:expected_samples]
            total_samples = expected_samples

    # Load drum kit
    drum_kit = load_drum_kit(assets_dir, target_sr=target_sr)

    # Render new Brazilian funk drums
    brazilian_drums = render_drum_track(events, total_samples, target_sr, drum_kit)

    # Extract kick timestamps for sidechaining
    kick_times = [t for t, s, _ in events if s == "kick"]

    # Process stems
    ducked_bass = apply_kick_sidechain_to_bass(stems["bass"], kick_times, target_sr)
    processed_orig_drums = attenuate_original_drums(stems["drums"], target_sr)
    vocals = stems["vocals"]
    other = stems["other"]

    # Sum stems
    # automotivo balance: loud punchy kick & clap, heavy sub bass, forward vocals
    mix = (
        (processed_orig_drums * 0.35) +
        (brazilian_drums * 1.10) +
        (ducked_bass * 1.20) +
        (vocals * 1.00) +
        (other * 0.85)
    )

    # Mastering:
    # 1. Soft-clipping with cubic curve for aggressive automotivo character
    # formula: x - (x^3 / 3) for |x| < 1, saturated beyond
    mastered = np.tanh(1.25 * mix)

    # 2. Peak limiting to -0.35 dB (0.96) to prevent DAC inter-sample clipping in Discord
    peak = np.max(np.abs(mastered))
    if peak > 0.96:
        mastered = mastered * (0.96 / peak)

    # Write output 48kHz stereo WAV (16-bit PCM for universal Discord/FFmpeg compatibility)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    sf.write(output_path, mastered, target_sr, subtype="PCM_16")

    return output_path
