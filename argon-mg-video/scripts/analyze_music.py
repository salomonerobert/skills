#!/usr/bin/env python3
"""
Standalone Music Beat Grid & Downbeat Energy Analyzer (analyze_music.py)

Analyzes an input audio file with librosa to detect:
  1. Tempo (BPM) and median beat interval
  2. Best 4/4 downbeat phase (0..3) based on onset strength
  3. Per-bar RMS energy profile to locate musical drops and transitions
  4. Optional JSON output of detected beats, downbeats, and bar RMS energy
"""

import argparse
import json
import pathlib
import numpy as np


def analyze_audio(
    input_path: str,
    sr: int = 44100,
    hop_length: int = 512,
    start_bpm: float = 128.0,
    tightness: float = 100.0,
    max_bars: int = 40,
    json_out: str | None = None,
) -> dict:
    import librosa

    wav_path = pathlib.Path(input_path)
    y, sr = librosa.load(str(wav_path), sr=sr, mono=True)
    duration = len(y) / sr
    print(f"Loaded {wav_path.name}: {duration:.2f}s @ {sr}Hz")

    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop_length)
    tempo, beat_frames = librosa.beat.beat_track(
        onset_envelope=onset_env,
        sr=sr,
        hop_length=hop_length,
        start_bpm=start_bpm,
        tightness=tightness,
    )
    tempo_val = float(np.atleast_1d(tempo)[0])
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop_length)

    intervals = np.diff(beat_times) if len(beat_times) > 1 else np.array([60.0 / start_bpm])
    median_interval = float(np.median(intervals))
    median_bpm = 60.0 / median_interval if median_interval > 0 else tempo_val

    print(f"Detected tempo: {tempo_val:.2f} BPM, total beats: {len(beat_times)}")
    print(f"Median beat interval: {median_interval:.5f}s ({median_bpm:.2f} BPM)")
    print("First 16 beats (s):", [round(float(t), 4) for t in beat_times[:16]])

    rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop_length)

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop_length)
    pitch_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
    chroma_means = np.mean(chroma, axis=1)
    top_pitches = [pitch_names[idx] for idx in np.argsort(chroma_means)[::-1][:5]]
    print("Top 5 pitch classes (chroma_cqt):", ", ".join(f"{pitch_names[i]}={chroma_means[i]:.3f}" for i in np.argsort(chroma_means)[::-1][:5]))

    best_phase = 0
    best_score = -1.0
    for phase in range(min(4, len(beat_frames))):
        idx = beat_frames[phase::4]
        score = float(np.mean(onset_env[idx]))
        print(f"Phase {phase} mean onset strength: {score:.4f} (first beat={beat_times[phase]:.3f}s)")
        if score > best_score:
            best_score = score
            best_phase = phase

    downbeats = beat_times[best_phase::4]
    bars_report = []
    print(f"\nSelected downbeat phase {best_phase}. First {min(max_bars, len(downbeats))} bar downbeats:")
    for i, db in enumerate(downbeats[:max_bars]):
        next_db = float(downbeats[i + 1]) if i + 1 < len(downbeats) else float(duration)
        mask = (rms_times >= db) & (rms_times < next_db)
        bar_rms = float(np.mean(rms[mask])) if np.any(mask) else 0.0
        bars_report.append(
            {
                "bar": i,
                "start_sec": round(float(db), 4),
                "end_sec": round(next_db, 4),
                "rms": round(bar_rms, 5),
            }
        )
        print(f"  Bar {i:02d}: {db:6.3f}s - {next_db:6.3f}s | RMS: {bar_rms:.4f} {'#' * int(bar_rms * 150)}")

    result = {
        "duration_sec": round(float(duration), 4),
        "sample_rate": sr,
        "detected_bpm": round(tempo_val, 3),
        "median_bpm": round(median_bpm, 3),
        "median_beat_sec": round(median_interval, 5),
        "downbeat_phase": best_phase,
        "beats": [round(float(t), 4) for t in beat_times],
        "downbeats": [round(float(t), 4) for t in downbeats],
        "bars": bars_report,
    }

    if json_out:
        out_p = pathlib.Path(json_out)
        out_p.parent.mkdir(parents=True, exist_ok=True)
        out_p.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"Wrote analysis JSON to {out_p}")

    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze an audio track with librosa to find BPM, beat grid, 4/4 downbeat phase, and per-bar RMS energy."
    )
    parser.add_argument("--input", "-i", default="audio/raw_music.wav", help="Path to input WAV/MP3 audio file")
    parser.add_argument("--sr", type=int, default=44100, help="Target analysis sample rate (Hz)")
    parser.add_argument("--hop-length", type=int, default=512, help="STFT hop length in samples")
    parser.add_argument("--start-bpm", type=float, default=128.0, help="Prior tempo estimate in BPM")
    parser.add_argument("--tightness", type=float, default=100.0, help="Beat tracker tightness around tempo")
    parser.add_argument("--max-bars", type=int, default=40, help="Maximum number of bars to print in energy profile")
    parser.add_argument("--json-out", default=None, help="Optional path to write beat/bar analysis JSON")
    args = parser.parse_args()

    analyze_audio(
        input_path=args.input,
        sr=args.sr,
        hop_length=args.hop_length,
        start_bpm=args.start_bpm,
        tightness=args.tightness,
        max_bars=args.max_bars,
        json_out=args.json_out,
    )


if __name__ == "__main__":
    main()
