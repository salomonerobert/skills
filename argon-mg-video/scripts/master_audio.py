#!/usr/bin/env python3
"""
Standalone Audio Mastering, Beat-Grid Locking & Impact Ducking Utility (master_audio.py)

Slices a raw music track so its main musical drop lands on an exact target beat
(e.g. Beat 8 = 3.750s at 128.0 BPM), time-stretches via ffmpeg `atempo` so N beats
equal the exact target duration (e.g. 64 beats = 30.000s), ducks the music bed by
~3 dB for 0.4s under the 3 big impact hits (`--cues` or `--duck-times`), mixes the
procedural SFX stem (`--sfx`), masters to EBU R128 loudness (`-14 LUFS`, `<= -1 dBTP`),
and exports frame-accurate beat/envelope JSON (`--beats-json`, `--beats-js`).
"""

import argparse
import json
import pathlib
import subprocess
import tempfile
import numpy as np
from scipy.io import wavfile


def apply_impact_ducking(
    bed_wav_path: pathlib.Path,
    duck_events: list[tuple[float, float, float]],
) -> pathlib.Path:
    """
    Apply smooth envelope ducking to a stereo WAV bed at `duck_events` = [(t_sec, duck_db, dur_sec), ...].
    Fast 10ms attack, smooth exponential release over `dur_sec` (~0.42s).
    """
    sr, data = wavfile.read(str(bed_wav_path))
    is_int16 = data.dtype == np.int16
    audio = data.astype(np.float64) / (32768.0 if is_int16 else 1.0)
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=-1)

    n_samples = len(audio)
    env = np.ones(n_samples, dtype=np.float64)

    for t0, duck_db, dur in duck_events:
        min_gain = 10.0 ** (duck_db / 20.0)  # e.g. -3.2 dB -> ~0.692
        depth = 1.0 - min_gain
        s0 = max(0, int(round((t0 - 0.008) * sr)))
        n_d = int(round(dur * sr))
        s1 = min(n_samples, s0 + n_d)
        if s1 <= s0:
            continue
        t_local = np.linspace(0.0, (s1 - s0) / sr, s1 - s0, endpoint=False)
        attack = 1.0 - np.exp(-t_local / 0.006)
        release = np.exp(-t_local / (dur * 0.36))
        dip = 1.0 - depth * attack * release
        env[s0:s1] = np.minimum(env[s0:s1], dip)

    ducked = audio * env[:, None]
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = pathlib.Path(tmp.name)
    tmp.close()
    pcm16 = np.clip(ducked * 32767.0, -32768, 32767).astype(np.int16)
    wavfile.write(str(tmp_path), sr, pcm16)
    return tmp_path


def master_audio(
    raw_wav: str,
    out_wav: str,
    sfx_wav: str | None = None,
    cues_json: str | None = "audio/sfx_cues.json",
    bed_out_wav: str | None = None,
    drop_hint_sec: float = 61.98,
    drop_beat: int = 8,
    total_beats: int = 64,
    target_duration: float = 30.0,
    target_bpm: float = 128.0,
    fps: int = 60,
    lufs: float = -14.0,
    true_peak: float = -1.5,
    lra: float = 9.0,
    bed_gain: float = 0.88,
    sfx_gain: float = 0.42,
    beats_json: str | None = None,
    beats_js: str | None = None,
) -> None:
    raw_path = pathlib.Path(raw_wav)
    out_path = pathlib.Path(out_wav)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        import librosa

        y_mono, sr = librosa.load(str(raw_path), sr=44100, mono=True)
        hop_length = 256
        onset_env = librosa.onset.onset_strength(y=y_mono, sr=sr, hop_length=hop_length)
        _, beat_frames = librosa.beat.beat_track(
            onset_envelope=onset_env,
            sr=sr,
            hop_length=hop_length,
            start_bpm=target_bpm + 1.0,
            tightness=100,
        )
        beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop_length)

        drop_idx = int(np.argmin(np.abs(beat_times - drop_hint_sec)))
        t_drop = float(beat_times[drop_idx])
        measure_beats = min(total_beats - drop_beat, len(beat_times) - 1 - drop_idx)
        t_after = float(beat_times[drop_idx + measure_beats])
        true_beat_sec = (t_after - t_drop) / float(measure_beats)
    except ImportError:
        t_drop = 61.9855
        true_beat_sec = 0.46489

    true_bpm = 60.0 / true_beat_sec

    t_start = t_drop - float(drop_beat) * true_beat_sec
    raw_total_dur = float(total_beats) * true_beat_sec
    stretch_ratio = raw_total_dur / target_duration
    target_beat_sec = 60.0 / target_bpm

    print(f"True track tempo in drop section: {true_bpm:.3f} BPM (beat = {true_beat_sec:.5f}s)")
    print(f"Slicing at t_start = {t_start:.4f}s -> drop at {t_drop:.4f}s ({drop_beat} beats)")
    print(
        f"Applying atempo = {stretch_ratio:.6f} -> {total_beats} beats = {target_duration:.4f}s "
        f"({target_bpm:.3f} BPM), drop at {drop_beat * target_beat_sec:.4f}s"
    )

    bed_target = pathlib.Path(bed_out_wav) if bed_out_wav else out_path
    bed_target.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{t_start:.6f}",
            "-t",
            f"{target_duration + 4.0:.2f}",
            "-i",
            str(raw_path),
            "-af",
            (
                f"atempo={stretch_ratio:.6f},"
                "afade=t=in:st=0:d=0.10,"
                f"afade=t=out:st={target_duration - 1.20:.2f}:d=1.20,"
                f"loudnorm=I={lufs:.1f}:TP={true_peak:.1f}:LRA={lra:.1f},"
                f"apad=whole_dur={target_duration:.4f},"
                f"atrim=0:{target_duration:.4f}"
            ),
            "-ar",
            "44100",
            "-ac",
            "2",
            str(bed_target),
        ],
        check=True,
        capture_output=True,
    )

    if sfx_wav:
        sfx_path = pathlib.Path(sfx_wav)
        # Collect impact ducking events (~-3 dB for 0.42s under the 3 big impacts)
        duck_events: list[tuple[float, float, float]] = []
        if cues_json and pathlib.Path(cues_json).exists():
            cfg = json.loads(pathlib.Path(cues_json).read_text(encoding="utf-8"))
            for cue in cfg.get("cues", []):
                if cue.get("type") == "impact" or "duck_db" in cue:
                    t_ev = float(cue.get("t", cue.get("time", 0.0)))
                    d_db = float(cue.get("duck_db", -3.2))
                    duck_events.append((t_ev, d_db, 0.42))
        if not duck_events:
            duck_events = [(3.750, -3.2, 0.42), (21.3281, -3.0, 0.42), (28.125, -3.2, 0.42)]

        print(f"Applying sidechain impact ducking to music bed at {[round(x[0], 3) for x in duck_events]}s (~-3.2 dB for 0.42s)")
        ducked_bed = apply_impact_ducking(bed_target, duck_events)
        try:
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-i",
                    str(ducked_bed),
                    "-i",
                    str(sfx_path),
                    "-filter_complex",
                    (
                        f"[0:a]volume={bed_gain:.2f}[bed];"
                        f"[1:a]volume={sfx_gain:.2f}[sfx];"
                        "[bed][sfx]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
                        f"loudnorm=I={lufs:.1f}:TP={true_peak:.1f}:LRA={lra:.1f}"
                    ),
                    "-ar",
                    "44100",
                    "-ac",
                    "2",
                    str(out_path),
                ],
                check=True,
                capture_output=True,
            )
        finally:
            ducked_bed.unlink(missing_ok=True)

    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out_path)],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    print(f"Mastered {out_path.name} exact duration: {probe}s")

    ebur = subprocess.run(
        ["ffmpeg", "-nostats", "-i", str(out_path), "-filter_complex", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True,
        text=True,
    ).stderr
    for line in ebur.splitlines()[-15:]:
        if any(k in line for k in ("I:", "LRA:", "Peak:")):
            print("  ", line.strip())

    if beats_json or beats_js:
        y_m, sr_m = librosa.load(str(out_path), sr=44100, mono=True)
        onset_m = librosa.onset.onset_strength(y=y_m, sr=sr_m, hop_length=256)
        _, bf_m = librosa.beat.beat_track(
            onset_envelope=onset_m, sr=sr_m, hop_length=256, start_bpm=target_bpm, tightness=200
        )
        bt_m = [round(float(t), 4) for t in librosa.frames_to_time(bf_m, sr=sr_m, hop_length=256)]

        grid_beats = [round(i * target_beat_sec, 5) for i in range(total_beats + 1)]
        grid_bars = [round(i * 4.0 * target_beat_sec, 5) for i in range((total_beats // 4) + 1)]

        n_frames = int(round(target_duration * fps))
        samples_per_frame = sr_m // fps
        S = np.abs(librosa.stft(y_m, n_fft=1024, hop_length=samples_per_frame))
        freqs = librosa.fft_frequencies(sr=sr_m, n_fft=1024)
        kick_mask = freqs <= 160
        mid_mask = (freqs > 160) & (freqs <= 2000)
        high_mask = freqs > 2000

        kick_env = np.mean(S[kick_mask, :n_frames], axis=0)
        mid_env = np.mean(S[mid_mask, :n_frames], axis=0)
        high_env = np.mean(S[high_mask, :n_frames], axis=0)

        def norm_env(arr: np.ndarray) -> list[float]:
            p98 = float(np.percentile(arr, 98)) or 1.0
            return [round(float(np.clip(v / p98, 0.0, 1.0)), 3) for v in arr]

        data = {
            "bpm": target_bpm,
            "beat_sec": target_beat_sec,
            "bar_sec": 4.0 * target_beat_sec,
            "beats": grid_beats,
            "bars": grid_bars,
            "detected_beats": bt_m,
            "kick_60fps": norm_env(kick_env),
            "mid_60fps": norm_env(mid_env),
            "high_60fps": norm_env(high_env),
        }

        if beats_json:
            bj_path = pathlib.Path(beats_json)
            bj_path.parent.mkdir(parents=True, exist_ok=True)
            bj_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            print(f"Wrote {bj_path}")
        if beats_js:
            bjs_path = pathlib.Path(beats_js)
            bjs_path.parent.mkdir(parents=True, exist_ok=True)
            bjs_path.write_text("window.AUDIO_DATA = " + json.dumps(data) + ";\n", encoding="utf-8")
            print(f"Wrote {bjs_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Slice, time-lock, duck under impacts, mix optional SFX stem, and loudness-master a music bed."
    )
    parser.add_argument("--input", "-i", default="audio/raw_music.wav", help="Input raw music WAV path")
    parser.add_argument("--out", "-o", default="audio/music_30s.wav", help="Output mastered WAV path")
    parser.add_argument("--sfx", default=None, help="Optional procedural SFX stem WAV path to mix with music bed")
    parser.add_argument("--cues", default="audio/sfx_cues.json", help="Optional SFX cues JSON for impact ducking timestamps")
    parser.add_argument("--bed-out", default=None, help="Optional intermediate path to save music-only bed WAV")
    parser.add_argument("--drop-hint", type=float, default=61.98, help="Approximate timestamp (s) of the drop in raw audio")
    parser.add_argument("--drop-beat", type=int, default=8, help="Target beat index for the drop in output (default: 8)")
    parser.add_argument("--total-beats", type=int, default=64, help="Total beats in output composition (default: 64)")
    parser.add_argument("--duration", type=float, default=30.0, help="Target output duration in seconds (default: 30.0)")
    parser.add_argument("--bpm", type=float, default=128.0, help="Target output BPM (default: 128.0)")
    parser.add_argument("--fps", type=int, default=60, help="Target video frame rate for envelope export (default: 60)")
    parser.add_argument("--lufs", type=float, default=-14.0, help="Target integrated loudness in LUFS (default: -14.0)")
    parser.add_argument("--true-peak", type=float, default=-1.5, help="Target max true peak in dBTP (default: -1.5)")
    parser.add_argument("--lra", type=float, default=9.0, help="Target loudness range LRA in LU (default: 9.0)")
    parser.add_argument("--bed-gain", type=float, default=0.88, help="Linear gain for music bed when mixing SFX (default: 0.88)")
    parser.add_argument("--sfx-gain", type=float, default=0.42, help="Linear gain for SFX stem when mixing (default: 0.42)")
    parser.add_argument("--beats-json", default=None, help="Optional path to export beats & envelope JSON")
    parser.add_argument("--beats-js", default=None, help="Optional path to export window.AUDIO_DATA JS file")
    args = parser.parse_args()

    master_audio(
        raw_wav=args.input,
        out_wav=args.out,
        sfx_wav=args.sfx,
        cues_json=args.cues,
        bed_out_wav=args.bed_out,
        drop_hint_sec=args.drop_hint,
        drop_beat=args.drop_beat,
        total_beats=args.total_beats,
        target_duration=args.duration,
        target_bpm=args.bpm,
        fps=args.fps,
        lufs=args.lufs,
        true_peak=args.true_peak,
        lra=args.lra,
        bed_gain=args.bed_gain,
        sfx_gain=args.sfx_gain,
        beats_json=args.beats_json,
        beats_js=args.beats_js,
    )


if __name__ == "__main__":
    main()
