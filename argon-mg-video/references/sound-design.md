# Sound design: music bed + procedural SFX, beat-locked

Order matters: **lock the beat grid before writing any animation**, because
every visual event is placed with `b(n)`.

## 1. Music bed (Lyria)

Default to a **simple, understated bed**. The user found the original EDM
anthem ("punchy four-on-the-floor, risers and big drops") too distracting. The
approved replacement:

```bash
cd PROJECT
python3 tools/music.py \
  --prompt "Simple elegant instrumental, 128 bpm, plucked guitar and soft mallet-like synth arpeggio, soft kick on every beat, subtle shaker, warm sub bass, airy and spacious, light and optimistic, no EDM drops, no heavy synths, no vocals" \
  --out audio/raw_music.wav
# music.py writes audio/raw_music.mp3 (~3 min) regardless of the extension; convert:
ffmpeg -nostdin -y -i audio/raw_music.mp3 -ar 44100 -ac 2 audio/raw_music.wav
```

- Generate 2–3 candidates in parallel (`&` + `wait`; ~1 min each). Pick
  with numbers, not guesses. Run `analyze_music.py` and a librosa pass:
  - "less EDM / simpler" = spectral centroid ≈ 1.1 kHz (the EDM bed was
    2.7 kHz) and HPSS percussive ratio ≤ 0.1
  - keep a **steady soft beat** (beat-interval CV ≤ 0.035) so the cuts
    still feel locked
  - a clear energy lift between two bars to use as the "drop"
- Alternatives that also worked: felt piano + warm pads + brushed
  percussion; gentle staccato strings + piano ostinato (most cinematic,
  least percussive, but with uneven bar-to-bar dynamics).
- **Minimal R&B / hip-hop ("Apple-commercial") style** (user-requested
  option): ask for **64 bpm half-time** so it lands natively on the 128 bpm
  visual grid (Lyria returned ~128/64 with no stretch needed). Don't name
  brands in prompts. Good prompt: `"Minimal R&B hip-hop instrumental, 64 bpm
  half-time groove, deep warm 808 bass, crisp finger snaps and soft clap on
  the backbeat, tight minimal drum pattern, sparse Rhodes electric piano
  chords, lots of space, cool and confident, sleek modern tech commercial
  vibe, no vocals"`. A "128 bpm with half-time feel" prompt came back at
  ~96 bpm (unusable without a 34% stretch), so always check the tempo first.
  The beat tracker often locks to half-time on sparse beats (fewer beats,
  ~20 ms grid error), so trust `master_audio.py`'s drop-section tempo.
- The API key is `$GEMINI_API_KEY` (or `~/.config/argon-mg-video/.env`).
- Lyria blocks some words (`keynote`, `marimba`, so `PROHIBITED_CONTENT`).
- **Changing the music after SFX exist:** detect the new key (chroma +
  Krumhansl) and pitch-shift the SFX stem to match instead of retuning cues:
  `ffmpeg -i audio/sfx_stem.wav -af "rubberband=pitch=1.189207:transients=crisp" sfx_shift.wav`
  (factor = 2^(semitones/12); F minor → G# minor = +3). Then re-run
  `master_audio.py --sfx sfx_shift.wav --cues audio/sfx_cues.json`. On a
  soft bed, lower `--sfx-gain` to ~0.36.

## 2. Find the drop and lock the grid

```bash
PY=~/.cache/argon-mg-video/venv/bin/python
$PY tools/analyze_music.py --input audio/raw_music.wav --json-out audio/analysis.json
#  prints tempo, downbeat phase, per-bar RMS; pick the biggest energy jump = the drop (e.g. 61.98 s)
$PY tools/master_audio.py --input audio/raw_music.wav --bed-out audio/music_bed_only.wav \
  --out audio/master.wav --drop-hint 61.98 --drop-beat 8 --total-beats 64 --duration 30.0 --bpm 128 \
  --beats-json audio/beats.json
```

`master_audio.py` slices `drop_beat` beats before the drop, time-stretches
with `atempo` so that 64 beats equal exactly 30.000 s (the drop lands on
`b(8) = 3.750 s`), fades the tail, and masters to −14 LUFS / ≤ −1.5 dBTP.

## 3. Design the SFX (after the animation timing exists)

Sound should **describe the motion it accompanies**. v8 used 84 cues
(15 impacts, 33 ticks), which read as clutter; the user asked for
"thoughtful sound effects to accentuate the animations". The approved v9 has
60 cues across 15 families.

**Hierarchy:**
- **≤ 3 `impact`s** in the whole video (drop, slam, final hit), each with
  `duck_db: -3` (music ducks ~0.4 s under it)
- 3–5 `accent`s on section downbeats (body transient, no sub boom)
- everything else light (gain 0.25–0.45)

**Key:** find it with chroma (`analyze_music.py`, or
`librosa.feature.chroma_cqt` + Krumhansl profiles) and give every pitched cue
a `freq` from that key's pentatonic. The Argon bed was F minor: F2 87.31,
C3 130.81, F3 174.61, Ab3 207.65, Bb3 233.08, C4 261.63, Eb4 311.13,
F4 349.23, Ab4 415.30, C5 523.25, F5 698.46.

| Animation | Family | Notes |
|---|---|---|
| masked per-char slide-up | `tickroll` | `count` = chars, `stagger` = the GSAP stagger, pan L→R, high-passed > 2 kHz |
| variable-font weight swell | `swell` | filter opens over the tween |
| `back.out` scale pops | `pluck` | step **up** the pentatonic across a sequence |
| MorphSVG morph | `glide` | `f_start→f_end` follows the morph |
| DrawSVG strokes | `zip` | `dur` = draw duration |
| color-band wipe | `swish` | one swish per band, detuned, panned to each band |
| zoom-through-letter | `suck` | reverse swell into the counter + exit burst |
| camera dive | `doppler` | descending pitch |
| eye blink | `shutter` | soft thump + latch click on the closed frame |
| shockwave ring | `shockwave` | resonant air + glassy ring |
| specular sweep | `shimmer` | pan follows the sweep direction |
| stacked rows landing | `thud` | ascending tuned notes (F3, Ab3, C4, F4) |
| end card | `sting` | resolved chord in key, tail decays before the fade |

All cues go through one shared ~0.8 s stereo reverb inside `sfx.py`, so the
stem sounds like one space rather than dry synth beeps.

**Cues come from the animation code.** Declare `window.__sfxCues = [...]`
in `app.js` using the **same** `b()` and time variables as the tweens (see
`template/app.js` and `examples/gemini-4-argon/app.js`), then:

```bash
$PY tools/sfx.py --from-js app.js --cues audio/sfx_cues.json --out audio/sfx_stem.wav
```

`--from-js` evaluates app.js headlessly in Node (gsap stubbed) and writes the
JSON. Cue fields: `t`, `type`, `gain`, `pan` or `pan_start`/`pan_end`,
`freq` or `f_start`/`f_end`, `dur`, `count`/`stagger` (tickroll), `duck_db`
(impact), `label`. Retime an animation and the sound follows.

## 4. Mix and master

```bash
$PY tools/master_audio.py --input audio/raw_music.wav --sfx audio/sfx_stem.wav --cues audio/sfx_cues.json \
  --out audio/master.wav --drop-hint 61.98 --drop-beat 8 --total-beats 64 --duration 30.0 --bpm 128
```

(Run `master_audio.py --help` for the exact flags; it applies the impact
ducking from the cues, mixes, and masters to −14 LUFS / ≤ −1.5 dBTP.)
Verify with `review.py stats out/vN.mp4`.

## 5. Verify alignment

Onset-detect the stem and compare it against the visual cut list printed by
`review.py stats` ("hard cuts/flashes"). Each cut should have an SFX onset
within ±1 frame (impacts) or ±0.1 s (whooshes lead the cut).
