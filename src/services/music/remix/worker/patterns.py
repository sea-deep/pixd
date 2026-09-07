"""
Brazilian Funk / Montagem / Tamborzão Pattern Library and Bar Scheduler.

Rhythmic structure is defined on a 16-step grid per bar (16th notes in 4/4 time).
Subdivisions: 0, 1, 2, ..., 15.
Beat 1 = 0, Beat 2 = 4, Beat 3 = 8, Beat 4 = 12.
"""

from dataclasses import dataclass
from typing import List, Dict, Tuple
import random

@dataclass
class DrumHit:
    step: float          # 0.0 to 15.99 subdivision of the bar
    sample: str          # "kick", "clap", "tom_low", "tom_high", "perc", "hat"
    velocity: float      # 0.0 to 1.0
    micro_offset_ms: float = 0.0  # Subtle humanization offset

# Signature Brazilian Funk (Tamborzão) Patterns
# Note: 0=1, 4=2, 8=3, 12=4 in beats
TAMBORZAO_A: List[DrumHit] = [
    # Syncopated Kick rhythm (Boom ... cha-boom ... cha-boom)
    DrumHit(0.0, "kick", 1.0),
    DrumHit(3.0, "kick", 0.9, micro_offset_ms=4.0),
    DrumHit(6.0, "kick", 0.95, micro_offset_ms=-2.0),
    DrumHit(8.0, "kick", 1.0),
    DrumHit(11.0, "kick", 0.9, micro_offset_ms=3.0),
    DrumHit(14.0, "kick", 0.95, micro_offset_ms=-2.0),
    # Snappy Claps
    DrumHit(4.0, "clap", 1.0),
    DrumHit(12.0, "clap", 1.0),
    # Toms conversation
    DrumHit(2.0, "tom_low", 0.75),
    DrumHit(5.0, "tom_high", 0.8),
    DrumHit(10.0, "tom_low", 0.7),
    DrumHit(13.0, "tom_high", 0.85),
    # Hats groove
    DrumHit(2.0, "hat", 0.6),
    DrumHit(6.0, "hat", 0.6),
    DrumHit(10.0, "hat", 0.6),
    DrumHit(14.0, "hat", 0.6),
]

TAMBORZAO_B: List[DrumHit] = [
    # Double kick variation
    DrumHit(0.0, "kick", 1.0),
    DrumHit(1.5, "kick", 0.75, micro_offset_ms=3.0),
    DrumHit(3.0, "kick", 0.9),
    DrumHit(6.0, "kick", 0.95),
    DrumHit(8.0, "kick", 1.0),
    DrumHit(11.0, "kick", 0.9),
    DrumHit(13.0, "kick", 0.8),
    DrumHit(14.0, "kick", 0.95),
    # Claps
    DrumHit(4.0, "clap", 1.0),
    DrumHit(10.0, "clap", 0.85),
    DrumHit(12.0, "clap", 1.0),
    # Toms and Perc
    DrumHit(5.0, "tom_high", 0.85),
    DrumHit(7.0, "perc", 0.8),
    DrumHit(9.0, "tom_low", 0.8),
    DrumHit(15.0, "perc", 0.9),
    # Hats
    DrumHit(0.0, "hat", 0.5),
    DrumHit(4.0, "hat", 0.6),
    DrumHit(8.0, "hat", 0.5),
    DrumHit(12.0, "hat", 0.6),
    # Vocal accent
    DrumHit(4.0, "vox_hey", 0.85),
]

AUTOMOTIVO_HARD: List[DrumHit] = [
    # Driving Montagem / Automotivo kick
    DrumHit(0.0, "kick", 1.0),
    DrumHit(3.0, "kick", 0.95),
    DrumHit(6.0, "kick", 1.0),
    DrumHit(8.0, "kick", 0.9),
    DrumHit(10.0, "kick", 0.95),
    DrumHit(12.0, "kick", 1.0),
    DrumHit(14.5, "kick", 0.9),
    # Hard claps on backbeats and accents
    DrumHit(4.0, "clap", 1.0),
    DrumHit(7.0, "clap", 0.8),
    DrumHit(12.0, "clap", 1.0),
    # Abrasive percussion
    DrumHit(2.0, "perc", 0.85),
    DrumHit(5.0, "tom_high", 0.9),
    DrumHit(9.0, "tom_low", 0.9),
    DrumHit(13.0, "tom_high", 0.9),
    # Steady running hats
    DrumHit(1.0, "hat", 0.55),
    DrumHit(3.0, "hat", 0.55),
    DrumHit(5.0, "hat", 0.55),
    DrumHit(7.0, "hat", 0.55),
    DrumHit(9.0, "hat", 0.55),
    DrumHit(11.0, "hat", 0.55),
    DrumHit(13.0, "hat", 0.55),
    DrumHit(15.0, "hat", 0.55),
    # Vocal stabs
    DrumHit(4.0, "vox_hey", 0.8),
    DrumHit(12.0, "vox_hey", 0.85),
]

DROP_HEAVY: List[DrumHit] = [
    # Ultra-punchy drop section
    DrumHit(0.0, "kick", 1.0),
    DrumHit(2.0, "kick", 0.85),
    DrumHit(3.5, "kick", 0.9),
    DrumHit(6.0, "kick", 1.0),
    DrumHit(8.0, "kick", 1.0),
    DrumHit(10.0, "kick", 0.85),
    DrumHit(11.5, "kick", 0.9),
    DrumHit(14.0, "kick", 1.0),
    # Claps
    DrumHit(4.0, "clap", 1.0),
    DrumHit(8.0, "clap", 0.7),
    DrumHit(12.0, "clap", 1.0),
    # Toms
    DrumHit(1.0, "tom_low", 0.8),
    DrumHit(5.0, "tom_high", 0.85),
    DrumHit(9.0, "tom_low", 0.8),
    DrumHit(13.0, "tom_high", 0.9),
    # Perc
    DrumHit(7.0, "perc", 0.9),
    DrumHit(15.0, "perc", 0.95),
]

FILL_A: List[DrumHit] = [
    # 4-beat rolling tom/snare fill into the drop
    DrumHit(0.0, "kick", 1.0),
    DrumHit(3.0, "kick", 0.9),
    DrumHit(4.0, "clap", 0.9),
    DrumHit(6.0, "tom_high", 0.85),
    DrumHit(8.0, "tom_low", 0.9),
    DrumHit(9.0, "tom_high", 0.9),
    DrumHit(10.0, "clap", 0.9),
    DrumHit(11.0, "clap", 0.95),
    DrumHit(12.0, "clap", 1.0),
    DrumHit(13.0, "tom_high", 1.0),
    DrumHit(14.0, "tom_low", 1.0),
    DrumHit(10.0, "vox_hey", 0.9),
    # Step 15 left silent as a dynamic pre-drop gap!
]

FILL_B: List[DrumHit] = [
    # Accelerating roll fill
    DrumHit(0.0, "kick", 1.0),
    DrumHit(4.0, "clap", 0.9),
    DrumHit(6.0, "tom_low", 0.85),
    DrumHit(8.0, "clap", 0.9),
    DrumHit(10.0, "clap", 0.9),
    DrumHit(11.0, "clap", 0.95),
    DrumHit(12.0, "clap", 1.0),
    DrumHit(12.5, "clap", 1.0),
    DrumHit(13.0, "clap", 1.0),
    DrumHit(13.5, "clap", 1.0),
    DrumHit(14.0, "tom_high", 1.0),
    DrumHit(14.5, "tom_low", 1.0),
    DrumHit(8.0, "vox_chant", 0.95),
    # Half-beat drop gap at end of bar
]

def get_pattern_for_bar(bar_idx: int, rng: random.Random) -> List[DrumHit]:
    """
    Deterministic variation hierarchy across musical bars.
    Every 4 bars has a fill, every 8/16 bars has an intensity drop shift.
    """
    cycle_16 = bar_idx % 16
    cycle_8 = bar_idx % 8
    cycle_4 = bar_idx % 4

    # Every 8th bar (bar 7, 15) is a major turnaround fill
    if cycle_8 == 7:
        return FILL_B
    # Every 4th bar (bar 3, 11) is a fill
    if cycle_4 == 3:
        return FILL_A

    # Build arrangement energy
    if cycle_16 in [0, 1]:
        return TAMBORZAO_A
    elif cycle_16 in [2]:
        return TAMBORZAO_B
    elif cycle_16 in [4, 5]:
        return AUTOMOTIVO_HARD
    elif cycle_16 in [6]:
        return DROP_HEAVY
    elif cycle_16 in [8, 9, 10]:
        return DROP_HEAVY
    elif cycle_16 in [12, 13]:
        return AUTOMOTIVO_HARD
    else:
        return TAMBORZAO_B

def schedule_drum_timeline(
    downbeats: List[float],
    beats: List[float],
    seed: int = 42,
) -> List[Tuple[float, str, float]]:
    """
    Maps pattern hits onto real-time seconds according to the detected beat/downbeat grid.
    Returns: List of (timestamp_seconds, sample_name, velocity)
    """
    rng = random.Random(seed)
    events: List[Tuple[float, str, float]] = []

    if len(beats) < 4:
        return events

    # If downbeats (bar starts) are provided, use them to anchor each bar
    # Otherwise group beats into 4-beat bars
    bars: List[Tuple[float, float]] = []
    if len(downbeats) >= 2:
        for i in range(len(downbeats) - 1):
            bars.append((downbeats[i], downbeats[i+1]))
    else:
        # Fallback: each bar = 4 beats
        for i in range(0, len(beats) - 4, 4):
            bars.append((beats[i], beats[i+4]))

    for bar_idx, (bar_start, bar_end) in enumerate(bars):
        bar_duration = bar_end - bar_start
        if bar_duration <= 0.2:  # Sanity check
            continue

        step_duration = bar_duration / 16.0
        pattern = get_pattern_for_bar(bar_idx, rng)

        for hit in pattern:
            # Calculate exact time in seconds
            event_time = bar_start + (hit.step * step_duration) + (hit.micro_offset_ms / 1000.0)
            # Ensure event falls within the bar boundaries
            if bar_start <= event_time < bar_end + 0.01:
                events.append((event_time, hit.sample, hit.velocity))

    events.sort(key=lambda e: e[0])
    return events
