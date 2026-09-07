"""
Stem Separator Subsystem using demucs-infer.
Separates audio into 4 stems: drums, bass, vocals, other.
Caches stems to disk to avoid duplicate computation.
"""

import os
import torch
import soundfile as sf
import numpy as np
from typing import Dict

# Global cached model instance to avoid re-loading weights for each job
_LOADED_MODEL = None
_LOADED_MODEL_NAME = None

def get_cached_demucs_model(model_name: str = "mdx_q"):
    global _LOADED_MODEL, _LOADED_MODEL_NAME
    if _LOADED_MODEL is not None and _LOADED_MODEL_NAME == model_name:
        return _LOADED_MODEL

    from demucs_infer.pretrained import get_model
    model = get_model(model_name)
    model.cpu()
    model.eval()
    _LOADED_MODEL = model
    _LOADED_MODEL_NAME = model_name
    return model

def separate_stems(
    audio_path: str,
    stems_dir: str,
    model_name: str = "mdx_q",
) -> Dict[str, str]:
    """
    Separates the given audio file into drums, bass, vocals, other.
    Returns dictionary mapping stem name -> absolute file path.
    """
    os.makedirs(stems_dir, exist_ok=True)
    expected_stems = ["drums", "bass", "vocals", "other"]
    stem_paths = {stem: os.path.join(stems_dir, f"{stem}.wav") for stem in expected_stems}

    # Check if all stems already exist in cache
    if all(os.path.exists(p) and os.path.getsize(p) > 1024 for p in stem_paths.values()):
        return stem_paths

    from demucs_infer.apply import apply_model
    import torchaudio

    model = get_cached_demucs_model(model_name)

    # Load audio tensor using soundfile for maximum cross-platform stability
    wav_np, sr = sf.read(audio_path, dtype="float32")
    if wav_np.ndim == 1:
        # Mono to stereo
        wav_np = np.stack([wav_np, wav_np], axis=1)
    # Shape: (channels, samples)
    wav_tensor = torch.from_numpy(wav_np.T)

    # Resample to model sample rate if needed
    if sr != model.samplerate:
        resampler = torchaudio.transforms.Resample(sr, model.samplerate)
        wav_tensor = resampler(wav_tensor)
        sr = model.samplerate

    # Add batch dimension: (1, channels, samples)
    wav_tensor = wav_tensor.unsqueeze(0)

    # Apply Demucs separation on CPU
    with torch.no_grad():
        # returns tensor of shape (batch, sources, channels, samples)
        sources = apply_model(model, wav_tensor, device="cpu", progress=False)

    # Model sources usually: ["drums", "bass", "other", "vocals"]
    source_names = model.sources

    for i, name in enumerate(source_names):
        if name in stem_paths:
            # Squeeze batch dimension -> (channels, samples) -> transpose to (samples, channels)
            stem_audio = sources[0, i].cpu().numpy().T
            sf.write(stem_paths[name], stem_audio, sr)

    return stem_paths
