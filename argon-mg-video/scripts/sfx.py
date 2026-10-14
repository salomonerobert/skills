#!/usr/bin/env python3
"""
Deterministic Procedural SFX Synthesizer for Motion Graphics Videos (sfx.py)

Extracts `window.__sfxCues` directly from `app.js` (via `--from-js`) or reads a JSON cue list
(`--cues`) and synthesizes a stereo WAV SFX stem tuned to the music bed's key (F minor / Ab major,
F minor pentatonic: F, Ab, Bb, C, Eb), routed through a shared 0.78s stereo velvet-noise reverb bus.

Supported sound families:
  - impact:    Sub-bass F1/F2 pitch drop + crisp transient + F-minor body (used ONLY on the 3 big hits)
  - shockwave: Outward resonant bandpass air wave + glassy F-minor harmonic ring
  - accent:    Medium section-downbeat body transient + warm pentatonic tone (no sub boom)
  - tickroll:  Staggered micro-tick sequence (>2 kHz high-passed) panned L->R across masked char reveals
  - swell:     Warm filtered F-minor chord swell matching variable-font weight expansion
  - pluck:     2-operator FM pentatonic pluck with elastic octave overshoot for back.out scale pops
  - glide:     Dual-oscillator phase-locked pitch + formant glide for MorphSVG shape morphs
  - zip:       Bandpass-swept silk noise + harmonic tracer for DrawSVG stroke animations
  - swish:     Multi-band staggered aerodynamic swishes panned & detuned per wipe strip
  - suck:      Reverse-envelope vacuum swell + portal exit burst for the Zoom-Through-O transition
  - doppler:   Downward pitch + filter whoosh with stereo widening for the vertical camera dive
  - shutter:   Soft low-mid eyelid closure whoosh + damped mechanical/organic latch click for the eye blink
  - shimmer:   High-harmonic crystalline F-minor pentatonic shimmer sweeping L->R with specular bars
  - thud:      Fast bar-wipe zip + pitched F-minor tonal lock thud for the 4 availability rows
  - sting:     Resolved F minor add9 chord sting + bell shimmer with clean tail decay before 29.8s
"""

import argparse
import json
import pathlib
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt


def pan_stereo(mono: np.ndarray, pan_curve: np.ndarray | float) -> np.ndarray:
    """Constant-power stereo panning from pan_curve in [-1.0, +1.0]."""
    if np.ndim(pan_curve) == 0:
        pan_arr = np.full(len(mono), float(pan_curve), dtype=np.float64)
    else:
        pan_arr = np.asarray(pan_curve, dtype=np.float64)
    angle = (np.clip(pan_arr, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    left = mono * np.cos(angle)
    right = mono * np.sin(angle)
    return np.stack([left, right], axis=-1)


def time_varying_bandpass(noise: np.ndarray, sr: int, f_curve: np.ndarray, q: float = 2.8) -> np.ndarray:
    """Chunked time-varying 2nd-order Butterworth bandpass filter following f_curve."""
    out = np.zeros_like(noise)
    hop = 256
    nyq = 0.5 * sr
    zi = None
    for i in range(0, len(noise), hop):
        chunk = noise[i : i + hop]
        fc = float(np.clip(f_curve[min(i, len(f_curve) - 1)], 70.0, nyq * 0.88))
        bw = max(fc / q, 55.0)
        low = max(35.0, fc - 0.5 * bw) / nyq
        high = min(0.94, (fc + 0.5 * bw) / nyq)
        if high <= low + 0.005:
            high = min(0.95, low + 0.02)
        sos = butter(2, [low, high], btype="bandpass", output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2), dtype=np.float64)
        filtered, zi = sosfilt(sos, chunk, zi=zi)
        out[i : i + hop] = filtered
    return out


def extract_cues_from_js(js_path: str, json_out_path: str, sr: int = 44100, duration: float = 30.0) -> dict:
    """Evaluate timeline constants and `window.__sfxCues` from `app.js` using Node.js and write JSON."""
    js_code = pathlib.Path(js_path).read_text(encoding="utf-8")
    if "window.__sfxCues" not in js_code:
        raise RuntimeError(f"window.__sfxCues not found in {js_path}")

    node_script = """
const fs = require('fs');
const src = fs.readFileSync(process.argv[1], 'utf8');
const windowObj = {};
// Any gsap/timeline method call returns the same chainable stub, so app.js runs headless.
const chain = new Proxy(function () {}, { get: () => chain, apply: () => chain, construct: () => chain });
const fakeGsap = chain;
const fakeSplit = function() { return { chars: [], words: [], lines: [] }; };
const fakeDoc = { getElementById: () => ({ setAttribute: () => {}, getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }) }), querySelectorAll: () => [], querySelector: () => null };
const fn = new Function(
  'window', 'document', 'gsap', 'SplitText', 'MorphSVGPlugin', 'DrawSVGPlugin', 'MotionPathPlugin', 'ScrambleTextPlugin', 'CustomEase',
  src
);
fn(windowObj, fakeDoc, fakeGsap, fakeSplit, {}, {}, {}, {}, {});
process.stdout.write(JSON.stringify(windowObj.__sfxCues || [], null, 2));
"""
    res = subprocess.run(
        ["node", "-e", node_script, str(js_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    raw_cues = json.loads(res.stdout)
    cues_sorted = sorted(raw_cues, key=lambda c: float(c.get("t", c.get("time", 0.0))))
    payload = {
        "key": "F minor / Ab major (F minor pentatonic: F, Ab, Bb, C, Eb)",
        "bpm": 128.0,
        "sample_rate": sr,
        "duration": duration,
        "cues": cues_sorted,
    }
    out_p = pathlib.Path(json_out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    out_p.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Extracted {len(cues_sorted)} cues from {js_path} -> {json_out_path}")
    return payload


def synth_impact(sr: int, duration: float, root_freq: float, pan: float, rng: np.random.Generator) -> np.ndarray:
    """Big cinematic impact (used ONLY 3 times): F1/F2 sub drop + crisp transient + F-minor chord body."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    f_sub = 43.65  # F1
    f_drop = f_sub + (root_freq * 1.5 - f_sub) * np.exp(-9.0 * tn)
    phase = 2.0 * np.pi * np.cumsum(f_drop) / sr
    sub = (0.78 * np.sin(phase) + 0.34 * np.sin(2.0 * phase)) * (1.0 - np.exp(-t / 0.003)) * np.exp(-3.4 * tn)

    # Warm F-minor body (F2, C3, F3, Ab3)
    chord_freqs = [root_freq, root_freq * 1.4983, root_freq * 2.0, root_freq * 2.3784]
    chord_amps = [0.24, 0.18, 0.14, 0.10]
    body = np.zeros(n, dtype=np.float64)
    for cf, ca in zip(chord_freqs, chord_amps):
        body += ca * np.sin(2.0 * np.pi * cf * t) * (1.0 - np.exp(-t / 0.004)) * np.exp(-5.2 * tn)

    # Crisp layered mid/high transient punch
    noise = rng.standard_normal(n)
    sos_mid = butter(2, [380.0 / (0.5 * sr), 3600.0 / (0.5 * sr)], btype="bandpass", output="sos")
    sos_hi = butter(2, [3600.0 / (0.5 * sr), 9200.0 / (0.5 * sr)], btype="bandpass", output="sos")
    punch = sosfilt(sos_mid, noise) * np.exp(-t / 0.016) * 0.42
    snap = sosfilt(sos_hi, noise) * np.exp(-t / 0.006) * 0.28

    mono = sub + body + punch + snap
    mono = np.tanh(1.32 * (mono / (np.max(np.abs(mono)) + 1e-8)))
    return pan_stereo(mono, pan)


def synth_shockwave(sr: int, duration: float, base_freq: float, pan: float, rng: np.random.Generator) -> np.ndarray:
    """Expanding vector shockwave ring: outward bandpass air wave + glassy F-minor harmonic ring."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    noise = rng.standard_normal(n)
    f_curve = 320.0 + 1850.0 * (np.sin(np.pi * (tn ** 0.72)) ** 1.3)
    air = time_varying_bandpass(noise, sr, f_curve, q=3.0)
    env = (1.0 - np.exp(-t / 0.008)) * np.exp(-3.6 * tn)

    # Glassy F-minor upper ring (F4, Ab4, C5, F5) widening in stereo
    ratios = [2.0, 2.3784, 2.9966, 4.0]
    amps = [0.26, 0.22, 0.18, 0.12]
    left = air * env * 1.35
    right = np.roll(air, 19) * env * 1.35
    for idx, (r, a) in enumerate(zip(ratios, amps)):
        f = base_freq * r
        tone_env = (1.0 - np.exp(-t / 0.006)) * np.exp(-4.2 * tn)
        left += a * np.sin(2.0 * np.pi * f * t + idx * 0.3) * tone_env
        right += a * np.sin(2.0 * np.pi * (f * 1.002) * t - idx * 0.3) * tone_env
    stereo = np.stack([left, right], axis=-1)
    return stereo / (np.max(np.abs(stereo)) + 1e-8)


def synth_accent(sr: int, duration: float, freq: float, pan: float, rng: np.random.Generator) -> np.ndarray:
    """Medium section-downbeat accent: crisp warm body transient + F-minor fifth (no deep sub boom)."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    f_curve = freq * (1.0 + 0.35 * np.exp(-18.0 * tn))
    phase = 2.0 * np.pi * np.cumsum(f_curve) / sr
    tone = (0.65 * np.sin(phase) + 0.35 * np.sin(1.4983 * phase)) * (1.0 - np.exp(-t / 0.003)) * np.exp(-7.5 * tn)
    noise = rng.standard_normal(n)
    sos = butter(2, [500.0 / (0.5 * sr), 4800.0 / (0.5 * sr)], btype="bandpass", output="sos")
    click = sosfilt(sos, noise) * np.exp(-t / 0.009) * 0.32
    mono = tone + click
    sos_hp = butter(2, 95.0 / (0.5 * sr), btype="highpass", output="sos")
    mono = sosfilt(sos_hp, mono)
    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    return pan_stereo(mono, pan)


def synth_tickroll(
    sr: int,
    count: int,
    stagger: float,
    base_freq: float,
    pan_start: float,
    pan_end: float,
    rng: np.random.Generator,
) -> np.ndarray:
    """Soft, high-passed (>2 kHz) musical micro-tick roll panned L->R across per-character masked slide-ups."""
    total_dur = max(0.08, (count - 1) * stagger + 0.045)
    n_total = int(sr * total_dur)
    stereo = np.zeros((n_total, 2), dtype=np.float64)
    pentatonic_ratios = [1.0, 1.1892, 1.3348, 1.4983, 1.7818, 2.0, 2.3784, 2.6697]
    nyq = 0.5 * sr
    sos_hp = butter(4, 2100.0 / nyq, btype="highpass", output="sos")
    sos_lp = butter(2, 9500.0 / nyq, btype="lowpass", output="sos")

    tick_dur = 0.018
    n_tick = int(sr * tick_dur)
    t_tick = np.linspace(0.0, tick_dur, n_tick, endpoint=False)

    for i in range(count):
        idx0 = int(round(i * stagger * sr))
        if idx0 >= n_total:
            break
        ratio = pentatonic_ratios[i % len(pentatonic_ratios)] * (1.0 + 0.08 * (i // len(pentatonic_ratios)))
        f_tone = min(7200.0, max(2200.0, base_freq * 6.0 * ratio))
        env = (1.0 - np.exp(-t_tick / 0.0008)) * np.exp(-t_tick / 0.0032)
        pip = 0.68 * np.sin(2.0 * np.pi * f_tone * t_tick) + 0.28 * np.sin(2.0 * np.pi * (f_tone * 1.4983) * t_tick)
        velvet = rng.standard_normal(n_tick) * 0.28
        raw = (pip + velvet) * env
        filtered = sosfilt(sos_lp, sosfilt(sos_hp, raw))
        # Taper gain slightly across the roll so it feels organic, never machine-gun harsh
        vel_gain = 0.85 + 0.15 * np.sin(np.pi * (i / max(1, count - 1)))
        pan_i = pan_start + (pan_end - pan_start) * (i / max(1, count - 1))
        clip_st = pan_stereo(filtered * vel_gain, pan_i)
        end_idx = min(n_total, idx0 + n_tick)
        stereo[idx0:end_idx] += clip_st[: end_idx - idx0]

    peak = np.max(np.abs(stereo)) + 1e-8
    return stereo / peak


def synth_swell(sr: int, duration: float, base_freq: float, pan: float, rng: np.random.Generator) -> np.ndarray:
    """Warm filtered F-minor chord swell matching variable-font weight expansion (wght 300 -> 900)."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    # F-minor triad + 9th: 1.0 (F), 1.1892 (Ab), 1.4983 (C), 2.0 (F), 2.2449 (G)
    ratios = [1.0, 1.1892, 1.4983, 2.0, 2.2449]
    amps = [0.34, 0.28, 0.26, 0.18, 0.12]
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)
    env = (np.sin(np.pi * (tn ** 0.78)) ** 1.35) * (1.0 - np.exp(-t / 0.015))
    for idx, (r, a) in enumerate(zip(ratios, amps)):
        f = base_freq * r
        det = 1.0 + (idx - 2) * 0.0022
        left += a * np.sin(2.0 * np.pi * f * t + idx * 0.4) * env
        right += a * np.sin(2.0 * np.pi * (f * det) * t - idx * 0.4) * env

    # Subtle filtered air breath opening with the font weight
    f_curve = 320.0 + 1800.0 * (np.sin(np.pi * (tn ** 0.8)) ** 1.4)
    breath = time_varying_bandpass(rng.standard_normal(n), sr, f_curve, q=3.2) * env * 0.22
    stereo = np.stack([left + breath, right - breath], axis=-1)
    stereo = stereo / (np.max(np.abs(stereo)) + 1e-8)
    angle = (np.clip(pan, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    stereo[:, 0] *= np.cos(angle) * 1.35
    stereo[:, 1] *= np.sin(angle) * 1.35
    return stereo


def synth_pluck(sr: int, freq: float, pan: float, rng: np.random.Generator) -> np.ndarray:
    """Short 2-operator FM pentatonic pluck with elastic octave overshoot for back.out scale pops."""
    duration = 0.24
    n = int(sr * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)
    # Slight elastic pitch overshoot (back.out feel)
    f_curve = freq * (1.0 + 0.06 * np.exp(-t / 0.014) * np.cos(2.0 * np.pi * 28.0 * t))
    mod_env = 2.2 * np.exp(-t / 0.018)
    mod_phase = 2.0 * np.pi * (2.0 * freq) * t
    car_phase = 2.0 * np.pi * np.cumsum(f_curve) / sr
    fm = np.sin(car_phase + mod_env * np.sin(mod_phase))
    fifth = 0.26 * np.sin(1.4983 * car_phase) * np.exp(-t / 0.045)
    octave_pop = 0.22 * np.sin(2.0 * car_phase) * (1.0 - np.exp(-t / 0.004)) * np.exp(-t / 0.028)
    amp_env = (1.0 - np.exp(-t / 0.002)) * np.exp(-t / 0.062)
    mono = (fm + fifth + octave_pop) * amp_env
    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    return pan_stereo(mono, pan)


def synth_glide(
    sr: int, duration: float, f0: float, f1: float, pan: float, rng: np.random.Generator
) -> np.ndarray:
    """Two-oscillator phase-locked pitch/formant glide for MorphSVG shape morphs."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    # Smooth exponential-out morph trajectory
    curve = 1.0 - (1.0 - tn) ** 2.6
    f_curve = f0 * ((f1 / f0) ** curve)
    phase1 = 2.0 * np.pi * np.cumsum(f_curve) / sr
    phase2 = 2.0 * np.pi * np.cumsum(f_curve * 1.4983) / sr  # Perfect 5th
    phase3 = 2.0 * np.pi * np.cumsum(f_curve * 2.0) / sr
    env = (1.0 - np.exp(-t / 0.008)) * np.sin(np.pi * (tn ** 0.72)) ** 1.25
    osc = (0.55 * np.sin(phase1) + 0.30 * np.sin(phase2) + 0.18 * np.sin(phase3)) * env
    air = time_varying_bandpass(rng.standard_normal(n), sr, f_curve * 2.0, q=3.6) * env * 0.45
    mono = osc + air
    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    pan_curve = np.linspace(pan, pan * 0.25, n)
    return pan_stereo(mono, pan_curve)


def synth_zip(
    sr: int, duration: float, f0: float, f1: float, pan: float, rng: np.random.Generator
) -> np.ndarray:
    """Bandpass-swept silk noise + harmonic tracer for DrawSVG line/ray/underline strokes."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    curve = 1.0 - (1.0 - tn) ** 2.2
    f_curve = f0 + (f1 - f0) * curve
    swept = time_varying_bandpass(rng.standard_normal(n), sr, f_curve, q=4.2)
    phase = 2.0 * np.pi * np.cumsum(f_curve) / sr
    tracer = 0.24 * np.sin(phase) + 0.12 * np.sin(1.4983 * phase)
    env = (1.0 - np.exp(-t / 0.005)) * (np.sin(np.pi * (tn ** 0.75)) ** 1.45)
    mono = (swept * 2.2 + tracer) * env
    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    pan_curve = np.linspace(pan - 0.18, pan + 0.18, n)
    return pan_stereo(mono, pan_curve)


def synth_swish(
    sr: int,
    bands: int,
    stagger: float,
    duration: float,
    base_freq: float,
    pan_start: float,
    pan_end: float,
    rng: np.random.Generator,
) -> np.ndarray:
    """Multi-band staggered silk swishes panned & detuned per band for color-band wipes."""
    total_dur = duration + max(0, bands - 1) * stagger
    n_total = max(1, int(sr * total_dur))
    stereo = np.zeros((n_total, 2), dtype=np.float64)
    n_band = max(1, int(sr * duration))
    tn = np.linspace(0.0, 1.0, n_band, endpoint=False)
    pent_ratios = [1.0, 1.1892, 1.4983, 1.7818, 2.0]

    for b_idx in range(bands):
        idx0 = int(round(b_idx * stagger * sr))
        if idx0 >= n_total:
            break
        ratio = pent_ratios[b_idx % len(pent_ratios)]
        f_peak = base_freq * 3.2 * ratio
        f_curve = base_freq * 0.9 + (f_peak - base_freq * 0.9) * (np.sin(np.pi * (tn ** 0.82)) ** 1.45)
        swept = time_varying_bandpass(rng.standard_normal(n_band), sr, f_curve, q=2.8)
        phase = 2.0 * np.pi * np.cumsum(f_curve * 0.5) / sr
        silk_tone = 0.22 * np.sin(phase) + 0.12 * np.sin(phase * 1.4983)
        env = np.sin(np.pi * (tn ** 0.8)) ** 1.6
        mono = (swept * 2.1 + silk_tone) * env
        p0 = pan_start + (pan_end - pan_start) * (b_idx / max(1, bands))
        p1 = pan_end - (pan_end - pan_start) * 0.15 * (b_idx / max(1, bands))
        clip_st = pan_stereo(mono, np.linspace(p0, p1, n_band))
        end_idx = min(n_total, idx0 + n_band)
        stereo[idx0:end_idx] += clip_st[: end_idx - idx0]

    return stereo / (np.max(np.abs(stereo)) + 1e-8)


def synth_suck(
    sr: int,
    duration: float,
    f0: float,
    f1: float,
    pan_start: float,
    pan_end: float,
    rng: np.random.Generator,
) -> np.ndarray:
    """Zoom-Through-O transition: reverse-envelope vacuum swell + low-pass opening + portal exit air burst."""
    n_suck = max(1, int(sr * duration))
    n_burst = int(sr * 0.22)
    n_total = n_suck + n_burst
    tn = np.linspace(0.0, 1.0, n_suck, endpoint=False)

    # Accelerating power2.in vacuum curve matching the O portal zoom (1.04 -> 32x)
    curve = tn ** 2.35
    f_curve = f0 * ((f1 / f0) ** curve)
    swept = time_varying_bandpass(rng.standard_normal(n_suck), sr, f_curve * 2.4, q=3.2)
    phase1 = 2.0 * np.pi * np.cumsum(f_curve) / sr
    phase2 = 2.0 * np.pi * np.cumsum(f_curve * 1.4983) / sr
    phase3 = 2.0 * np.pi * np.cumsum(f_curve * 2.0) / sr
    env_suck = (tn ** 2.1) * (1.0 - np.exp(-((1.0 - tn) * duration) / 0.008))
    suck_mono = (swept * 1.9 + 0.36 * np.sin(phase1) + 0.24 * np.sin(phase2) + 0.16 * np.sin(phase3)) * env_suck
    suck_st = pan_stereo(suck_mono, np.linspace(pan_start, pan_end, n_suck))

    # Crisp stereo air burst as we emerge inside Scene 3's neural thought-tree at 7.200s
    t_b = np.linspace(0.0, 0.22, n_burst, endpoint=False)
    tn_b = np.linspace(0.0, 1.0, n_burst, endpoint=False)
    f_burst = np.linspace(1800.0, 420.0, n_burst)
    burst_air = time_varying_bandpass(rng.standard_normal(n_burst), sr, f_burst, q=2.2)
    burst_tone = 0.28 * np.sin(2.0 * np.pi * f1 * t_b) * np.exp(-t_b / 0.055)
    burst_env = (1.0 - np.exp(-t_b / 0.004)) * np.exp(-5.0 * tn_b)
    burst_l = (burst_air * 1.6 + burst_tone) * burst_env
    burst_r = (np.roll(burst_air, 17) * 1.6 + burst_tone) * burst_env
    burst_st = np.stack([burst_l, burst_r], axis=-1)

    stereo = np.zeros((n_total, 2), dtype=np.float64)
    stereo[:n_suck] += suck_st
    stereo[n_suck - int(0.02 * sr) : n_suck - int(0.02 * sr) + n_burst] += burst_st * 0.82
    return stereo / (np.max(np.abs(stereo)) + 1e-8)


def synth_doppler(sr: int, duration: float, f0: float, f1: float, rng: np.random.Generator) -> np.ndarray:
    """Vertical camera dive (9.375s): downward Doppler pitch + filter whoosh with stereo widening."""
    n = max(1, int(sr * duration))
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    # S-curve matching power4.inOut camera dive velocity (peak speed right at the midpoint)
    s_curve = 0.5 * (1.0 - np.cos(np.pi * tn))
    f_curve = f0 * ((f1 / f0) ** s_curve)
    vel_env = np.sin(np.pi * tn) ** 1.35

    swept_l = time_varying_bandpass(rng.standard_normal(n), sr, f_curve * 2.2, q=2.6)
    swept_r = time_varying_bandpass(rng.standard_normal(n), sr, f_curve * 2.15, q=2.6)
    phase1 = 2.0 * np.pi * np.cumsum(f_curve) / sr
    phase2 = 2.0 * np.pi * np.cumsum(f_curve * 1.4983) / sr
    tonal_l = 0.38 * np.sin(phase1) + 0.22 * np.sin(phase2)
    tonal_r = 0.38 * np.sin(phase1 + 0.35 * tn) + 0.22 * np.sin(phase2 - 0.35 * tn)

    left = (swept_l * 1.9 + tonal_l) * vel_env
    right = (swept_r * 1.9 + tonal_r) * vel_env
    stereo = np.stack([left, right], axis=-1)
    return stereo / (np.max(np.abs(stereo)) + 1e-8)


def synth_shutter(sr: int, duration: float, base_freq: float, rng: np.random.Generator) -> np.ndarray:
    """Giant eye blink shut (18.422 -> 18.750s): soft eyelid closure whoosh + damped tonal thump & latch click."""
    n_close = max(1, int(sr * duration))
    n_tail = int(sr * 0.08)
    n_total = n_close + n_tail
    mono = np.zeros(n_total, dtype=np.float64)

    # 1. Soft accelerating eyelid sweep during closure (expo.in)
    tn = np.linspace(0.0, 1.0, n_close, endpoint=False)
    f_curve = 920.0 - 620.0 * (tn ** 2.2)
    lid_whoosh = time_varying_bandpass(rng.standard_normal(n_close), sr, f_curve, q=2.8)
    lid_env = (tn ** 1.65) * np.sin(np.pi * (tn ** 0.85))
    mono[:n_close] += lid_whoosh * lid_env * 0.95

    # 2. Damped low-mid eyelid meet thump + crisp iris latch click right at closure (t = duration - 0.015s)
    idx_latch = max(0, n_close - int(0.015 * sr))
    n_latch = n_total - idx_latch
    t_l = np.linspace(0.0, n_latch / sr, n_latch, endpoint=False)
    f_thump = base_freq * (0.75 + 0.65 * np.exp(-t_l / 0.012))
    ph_thump = 2.0 * np.pi * np.cumsum(f_thump) / sr
    thump = 0.65 * np.sin(ph_thump) * (1.0 - np.exp(-t_l / 0.002)) * np.exp(-t_l / 0.028)

    sos_click = butter(2, [1800.0 / (0.5 * sr), 6800.0 / (0.5 * sr)], btype="bandpass", output="sos")
    click = sosfilt(sos_click, rng.standard_normal(n_latch)) * np.exp(-t_l / 0.0045) * 0.48
    pip = 0.32 * np.sin(2.0 * np.pi * (base_freq * 4.0) * t_l) * np.exp(-t_l / 0.009)
    mono[idx_latch:] += thump + click + pip

    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    return pan_stereo(mono, 0.0)


def synth_shimmer(
    sr: int,
    duration: float,
    base_freq: float,
    pan_start: float,
    pan_end: float,
    rng: np.random.Generator,
) -> np.ndarray:
    """High-harmonic crystalline F-minor pentatonic shimmer sweeping L->R with specular light bars."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    # F-minor pentatonic crystalline ratios: F, Ab, C, Eb, F(oct), Ab(oct)
    ratios = [1.0, 1.1892, 1.4983, 1.7818, 2.0, 2.3784]
    amps = [0.32, 0.28, 0.24, 0.18, 0.14, 0.10]
    mono = np.zeros(n, dtype=np.float64)
    env = (np.sin(np.pi * (tn ** 0.78)) ** 1.35) * (1.0 - np.exp(-t / 0.012))
    for idx, (r, a) in enumerate(zip(ratios, amps)):
        f = base_freq * r
        if f >= 0.46 * sr:
            continue
        shimmer_mod = 1.0 + 0.18 * np.sin(2.0 * np.pi * (5.5 + idx * 1.3) * t)
        mono += a * np.sin(2.0 * np.pi * f * t + idx * 0.5) * env * shimmer_mod

    # High-passed velvet air sparkle (> 2.6 kHz)
    velvet = rng.choice([-1.0, 0.0, 1.0], size=n, p=[0.016, 0.968, 0.016])
    sos = butter(2, [2600.0 / (0.5 * sr), 9800.0 / (0.5 * sr)], btype="bandpass", output="sos")
    air = sosfilt(sos, velvet) * env * 0.26
    mono = mono + air
    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    return pan_stereo(mono, np.linspace(pan_start, pan_end, n))


def synth_thud(sr: int, freq: float, pan: float, rng: np.random.Generator) -> np.ndarray:
    """Scene 7B availability row landing: 40ms bar-wipe zip + warm pitched F-minor tonal lock thud."""
    duration = 0.30
    n = int(sr * duration)
    t = np.linspace(0.0, duration, n, endpoint=False)

    # Part 1 (0 -> 45ms): Fast colored bar wipe-in zip
    n_zip = int(0.048 * sr)
    t_z = np.linspace(0.0, 0.048, n_zip, endpoint=False)
    f_z = np.linspace(freq * 1.5, freq * 4.0, n_zip)
    zip_noise = time_varying_bandpass(rng.standard_normal(n_zip), sr, f_z, q=3.5)
    zip_env = np.sin(np.pi * (t_z / 0.048)) ** 1.2
    mono = np.zeros(n, dtype=np.float64)
    mono[:n_zip] += zip_noise * zip_env * 0.55

    # Part 2 (at +40ms): Content locks in at 100% brightness with pitched F-minor marimba/synth thud
    idx_lock = int(0.040 * sr)
    n_lock = n - idx_lock
    t_l = np.linspace(0.0, n_lock / sr, n_lock, endpoint=False)
    f_drop = freq * (1.0 + 0.18 * np.exp(-t_l / 0.009))
    phase = 2.0 * np.pi * np.cumsum(f_drop) / sr
    fundamental = 0.68 * np.sin(phase) * (1.0 - np.exp(-t_l / 0.0018)) * np.exp(-t_l / 0.075)
    fifth = 0.28 * np.sin(1.4983 * phase) * (1.0 - np.exp(-t_l / 0.002)) * np.exp(-t_l / 0.055)
    octave = 0.22 * np.sin(2.0 * phase) * (1.0 - np.exp(-t_l / 0.0015)) * np.exp(-t_l / 0.038)
    wood_click = 0.18 * np.sin(4.0 * phase) * np.exp(-t_l / 0.006)
    mono[idx_lock:] += fundamental + fifth + octave + wood_click

    mono = mono / (np.max(np.abs(mono)) + 1e-8)
    return pan_stereo(mono, pan)


def synth_sting(sr: int, duration: float, root_freq: float, rng: np.random.Generator) -> np.ndarray:
    """Resolved F minor add9 chord sting + bell shimmer on the Scene 8 End Card, decaying cleanly."""
    n = max(1, int(sr * duration))
    t = np.linspace(0.0, duration, n, endpoint=False)
    tn = np.linspace(0.0, 1.0, n, endpoint=False)
    # F minor add9 voicing: F3 (1.0), C4 (1.4983), F4 (2.0), G4 (2.2449), Ab4 (2.3784), C5 (2.9966), F5 (4.0)
    ratios = [1.0, 1.4983, 2.0, 2.2449, 2.3784, 2.9966, 4.0]
    amps = [0.34, 0.28, 0.26, 0.18, 0.22, 0.16, 0.11]
    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)

    # Smooth cosine tail window over the last 22% so it reaches exact 0.000 before clip end
    tail_win = np.ones(n, dtype=np.float64)
    fade_start = int(0.78 * n)
    tail_win[fade_start:] = 0.5 * (1.0 + np.cos(np.pi * np.linspace(0.0, 1.0, n - fade_start)))

    for idx, (r, a) in enumerate(zip(ratios, amps)):
        f = root_freq * r
        det = 1.0 + (idx - 3) * 0.0016
        attack = 0.005 + idx * 0.002
        decay = duration * (0.58 - 0.04 * idx)
        env = (1.0 - np.exp(-t / attack)) * np.exp(-t / max(0.18, decay)) * tail_win
        left += a * np.sin(2.0 * np.pi * f * t + idx * 0.35) * env
        right += a * np.sin(2.0 * np.pi * (f * det) * t - idx * 0.35) * env

    stereo = np.stack([left, right], axis=-1)
    return stereo / (np.max(np.abs(stereo)) + 1e-8)


def build_stereo_reverb_ir(sr: int, rt60: float = 0.78, seed: int = 9018) -> np.ndarray:
    """Synthesize a smooth 0.78s stereo velvet-noise + early-reflection impulse response."""
    rng = np.random.default_rng(seed)
    n = int(sr * rt60)
    t = np.linspace(0.0, rt60, n, endpoint=False)
    decay = np.exp(-6.9078 * t / rt60)

    # Decorrelated stereo velvet noise + diffuse Gaussian tail
    vel_l = rng.choice([-1.0, 0.0, 1.0], size=n, p=[0.025, 0.95, 0.025]) + 0.35 * rng.standard_normal(n)
    vel_r = rng.choice([-1.0, 0.0, 1.0], size=n, p=[0.025, 0.95, 0.025]) + 0.35 * rng.standard_normal(n)

    # Add distinct early reflections (8ms..52ms)
    er_ms = [8.3, 14.7, 21.2, 29.5, 38.1, 47.6]
    er_gains = [0.45, -0.36, 0.30, -0.25, 0.21, -0.18]
    for idx, (ms, g) in enumerate(zip(er_ms, er_gains)):
        s_idx = int((ms / 1000.0) * sr)
        if s_idx < n:
            if idx % 2 == 0:
                vel_l[s_idx] += g * 4.0
                vel_r[min(n - 1, s_idx + 19)] += g * 3.2
            else:
                vel_r[s_idx] += g * 4.0
                vel_l[min(n - 1, s_idx + 23)] += g * 3.2

    sos_bp = butter(2, [220.0 / (0.5 * sr), 7200.0 / (0.5 * sr)], btype="bandpass", output="sos")
    ir_l = sosfilt(sos_bp, vel_l * decay)
    ir_r = sosfilt(sos_bp, vel_r * decay)
    ir = np.stack([ir_l, ir_r], axis=-1)
    energy = np.sqrt(np.sum(ir ** 2) / 2.0) + 1e-8
    return ir / energy


def build_sfx_stem(cues_path: str, out_path: str, seed: int = 42018, from_js: str | None = None) -> None:
    if from_js:
        cfg = extract_cues_from_js(from_js, cues_path)
    else:
        with open(cues_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)

    sr = int(cfg.get("sample_rate", 44100))
    total_dur = float(cfg.get("duration", 30.0))
    total_samples = int(sr * total_dur)
    dry_bus = np.zeros((total_samples, 2), dtype=np.float64)
    rev_send = np.zeros((total_samples, 2), dtype=np.float64)
    rng = np.random.default_rng(seed)

    # Per-family reverb send levels so every SFX sits in a cohesive studio room
    reverb_sends = {
        "impact": 0.20,
        "shockwave": 0.34,
        "accent": 0.22,
        "tickroll": 0.14,
        "swell": 0.30,
        "pluck": 0.26,
        "glide": 0.26,
        "zip": 0.22,
        "swish": 0.24,
        "suck": 0.28,
        "doppler": 0.28,
        "shutter": 0.18,
        "shimmer": 0.36,
        "thud": 0.22,
        "sting": 0.38,
    }

    sos_rev_hp = butter(2, 200.0 / (0.5 * sr), btype="highpass", output="sos")
    counts_by_type: dict[str, int] = {}

    for cue in cfg["cues"]:
        ctype = cue["type"]
        t0 = float(cue.get("t", cue.get("time", 0.0)))
        gain = float(cue.get("gain", 0.4))
        pan = float(cue.get("pan", 0.0))
        start_idx = max(0, int(round(t0 * sr)))
        if start_idx >= total_samples:
            continue

        if ctype == "impact":
            clip = synth_impact(sr, float(cue.get("dur", 0.62)), float(cue.get("freq", 87.31)), pan, rng)
        elif ctype == "shockwave":
            clip = synth_shockwave(sr, float(cue.get("dur", 0.46)), float(cue.get("freq", 174.61)), pan, rng)
        elif ctype == "accent":
            clip = synth_accent(sr, float(cue.get("dur", 0.28)), float(cue.get("freq", 174.61)), pan, rng)
        elif ctype == "tickroll":
            clip = synth_tickroll(
                sr,
                int(cue.get("count", 6)),
                float(cue.get("stagger", 0.020)),
                float(cue.get("freq", 349.23)),
                float(cue.get("pan_start", -0.3)),
                float(cue.get("pan_end", 0.3)),
                rng,
            )
        elif ctype == "swell":
            clip = synth_swell(sr, float(cue.get("dur", 0.50)), float(cue.get("freq", 174.61)), pan, rng)
        elif ctype == "pluck":
            clip = synth_pluck(sr, float(cue.get("freq", 349.23)), pan, rng)
        elif ctype == "glide":
            clip = synth_glide(
                sr,
                float(cue.get("dur", 0.35)),
                float(cue.get("f0", 261.63)),
                float(cue.get("f1", 523.25)),
                pan,
                rng,
            )
        elif ctype == "zip":
            clip = synth_zip(
                sr,
                float(cue.get("dur", 0.42)),
                float(cue.get("f0", 415.30)),
                float(cue.get("f1", 1046.50)),
                pan,
                rng,
            )
        elif ctype == "swish":
            clip = synth_swish(
                sr,
                int(cue.get("bands", 3)),
                float(cue.get("stagger", 0.028)),
                float(cue.get("dur", 0.40)),
                float(cue.get("freq", 415.30)),
                float(cue.get("pan_start", -0.4)),
                float(cue.get("pan_end", 0.4)),
                rng,
            )
        elif ctype == "suck":
            clip = synth_suck(
                sr,
                float(cue.get("dur", 0.64)),
                float(cue.get("f0", 174.61)),
                float(cue.get("f1", 523.25)),
                float(cue.get("pan_start", 0.28)),
                float(cue.get("pan_end", 0.0)),
                rng,
            )
        elif ctype == "doppler":
            clip = synth_doppler(
                sr,
                float(cue.get("dur", 0.54)),
                float(cue.get("f0", 523.25)),
                float(cue.get("f1", 130.81)),
                rng,
            )
        elif ctype == "shutter":
            clip = synth_shutter(sr, float(cue.get("dur", 0.33)), float(cue.get("freq", 174.61)), rng)
        elif ctype == "shimmer":
            clip = synth_shimmer(
                sr,
                float(cue.get("dur", 1.0)),
                float(cue.get("freq", 698.46)),
                float(cue.get("pan_start", -0.45)),
                float(cue.get("pan_end", 0.45)),
                rng,
            )
        elif ctype == "thud":
            clip = synth_thud(sr, float(cue.get("freq", 174.61)), pan, rng)
        elif ctype == "sting":
            clip = synth_sting(sr, float(cue.get("dur", 1.65)), float(cue.get("freq", 174.61)), rng)
        else:
            continue

        counts_by_type[ctype] = counts_by_type.get(ctype, 0) + 1
        end_idx = min(total_samples, start_idx + len(clip))
        seg = clip[: end_idx - start_idx] * gain
        dry_bus[start_idx:end_idx] += seg
        send_amt = reverb_sends.get(ctype, 0.22)
        rev_send[start_idx:end_idx] += seg * send_amt

    # Convolve stereo reverb send bus with shared 0.78s velvet-noise impulse response
    ir = build_stereo_reverb_ir(sr, rt60=0.78, seed=seed + 7)
    rev_send_hp = np.stack(
        [sosfilt(sos_rev_hp, rev_send[:, 0]), sosfilt(sos_rev_hp, rev_send[:, 1])],
        axis=-1,
    )
    wet_l = fftconvolve(rev_send_hp[:, 0], ir[:, 0], mode="full")[:total_samples]
    wet_r = fftconvolve(rev_send_hp[:, 1], ir[:, 1], mode="full")[:total_samples]
    stem = dry_bus + np.stack([wet_l, wet_r], axis=-1) * 0.42

    # Clean fade-out over the final 0.22s (29.78 - 30.00s) so no tail ever clips at 30.00s
    fade_samples = int(0.22 * sr)
    fade_curve = np.linspace(1.0, 0.0, fade_samples)[:, None]
    stem[-fade_samples:] *= fade_curve

    # Soft-knee limiter on the SFX stem so peak stays clean around -1.5 dBFS
    peak = np.max(np.abs(stem)) + 1e-8
    stem = np.tanh(1.18 * (stem / peak)) * 0.84
    out_p = pathlib.Path(out_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    pcm16 = np.clip(stem * 32767.0, -32768, 32767).astype(np.int16)
    wavfile.write(str(out_p), sr, pcm16)
    summary = ", ".join(f"{k}:{v}" for k, v in sorted(counts_by_type.items()))
    print(f"Wrote {out_path} ({len(cfg['cues'])} cues [{summary}], {total_dur:.2f}s @ {sr}Hz)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Synthesize deterministic F-minor-tuned procedural SFX stem with shared stereo reverb bus."
    )
    parser.add_argument("--from-js", default=None, help="Optional path to app.js to extract window.__sfxCues into --cues")
    parser.add_argument("--cues", "-c", default="audio/sfx_cues.json", help="Path to input/output JSON cue list")
    parser.add_argument("--out", "-o", default="audio/sfx_stem.wav", help="Path to output stereo WAV stem")
    parser.add_argument("--seed", "-s", type=int, default=42018, help="Deterministic RNG seed (default: 42018)")
    args = parser.parse_args()
    build_sfx_stem(args.cues, args.out, seed=args.seed, from_js=args.from_js)
