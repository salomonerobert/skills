---
name: argon-mg-video
description: >-
  Produces high-energy, code-rendered motion-graphics videos (launch sizzles,
  product announcements, kinetic-typography promos) at motion-studio quality
  with HyperFrames (HTML/CSS + GSAP SplitText/MorphSVG/DrawSVG/MotionPath),
  in-composition masked transitions, multi-font animated type, beat-locked
  Lyria music and procedural SFX, plus a strict self-review loop. Use when
  asked to make a launch video, announcement/sizzle reel, motion-graphics
  promo, kinetic typography video, or "animated video with fancy transitions"
  without narration or generative video. Don't use for narrated explainers
  (use a narration-focused explainer workflow), Veo/generative footage, editing existing footage, or
  slide decks.
---

# Motion Graphics Video (launch sizzle) — runbook

Follow the steps in order. Each one ends with a **Done when** check. This
skill was distilled from 8 creative-director review rounds on a 30 s
"Gemini 4 Argon is GA" video (`examples/gemini-4-argon/`). Every rule below
exists because breaking it was visible on screen. Read
[craft-standards.md](references/craft-standards.md) before you storyboard,
and re-read it before every handoff.

Tooling decisions:
- **Engine:** HyperFrames (`hyperframes@0.8.91`, Apache-2.0) with GSAP 3.14
  (all plugins free). Remotion is source-available and needs a paid company
  license at Google's size, so don't use it unless the user explicitly says
  they have one.
- **Media:** no narration, no Veo, no stock footage. Everything is vector +
  type. Music is one Lyria instrumental, and SFX are synthesized.

```
S=/path/to/argon-mg-video   # the folder containing this SKILL.md
PY=~/.cache/argon-mg-video/venv/bin/python
```

## 0. Setup (once per machine)

```bash
bash $S/scripts/setup.sh
```

This creates the venv (librosa/scipy/fonttools), vendors GSAP, builds the
font cache (Google Sans, subset variable Google Sans Flex < 2 MB, Instrument
Serif, Big Shoulders Display, Anton, JetBrains Mono) and pre-fetches
HyperFrames.
**Done when:** it prints `setup OK`.

## 1. Brief

Confirm these (ask only for what the user hasn't given):
- product/announcement
- the 3–5 claims to show (**qualitative**: never invent benchmark numbers
  or stats)
- availability surfaces / CTA
- sign-off brand
- length (default 30 s)
- aspect (default 16:9 1920×1080 @ 60 fps)
- palette (default: hero colors Gemini blue #4285F4 → cyan #00E5FF →
  violet #9B72CB → coral #D96570 on a **subtle** charcoal-navy stage, see
  craft-standards §9)

Pick a **visual motif** tied to the product name (e.g. "Argon" means element
18, the Ar tile, noble-gas plasma glow). The motif carries the whole video.
**Done when:** the brief fits in 6 lines in `plan/storyboard.md`.

## 2. Scaffold

```bash
python3 $S/scripts/new_project.py ~/videos/<slug> --title "Gemini 4 Argon" --hero "GEMINI 4" --signoff Google --bpm 128 --duration 30
```

This copies `template/` (master-composition architecture + helpers:
`b()`, `cut`, `baseLayer`, `drift`, `maskReveal`, `maskExit`, `pop`,
`bandWipe`, `flash`, `addImpactHit`, `kickPunches`, `specularSweep`,
`blurDuring`), the vendored GSAP, the fonts, and links `tools/` to this
skill's scripts. The demo timeline already renders. Use it as the pattern
and replace it.
**Done when:** `bash tools/render.sh . v0 --draft` produces `out/v0.mp4`.

## 3. Audio first: lock the beat grid

Follow [sound-design.md](references/sound-design.md) §1–2: generate the Lyria
bed, run `analyze_music.py` to find the drop, then run `master_audio.py` so
64 beats = 30.000 s and the drop lands on `b(8) = 3.75 s`.
**Done when:** `audio/master.wav` is 30.000 s, and you know the drop beat
and the final-hit beat (e.g. b(60) = 28.125 s).

## 4. Storyboard (beat-timed shot list)

Write `plan/storyboard.md` as a table:

`beats | time | shot | visual + motif | type (family, size, % width) | reveal | transition out | SFX`

Hard requirements (reviewers rejected versions for each):
- **20–28 shots in 30 s.** Change the shot on every downbeat (1.875 s) at
  minimum, with 2–4 beat sub-shots inside sections.
- **Structure (30 s @ 128 bpm):**
  - 0–3.75 s: cold open from black, spark on frame 1, tension build
  - 3.75 s: **drop** — hero product name *on* the downbeat frame, full name
    held ≥ 1.2 s
  - 7.5–22.5 s: capability montage, one section per claim
  - 22.5–26.25 s: availability
  - 26.25–30 s: end card with a final hit at ~28.1 s, fading by 30.0 s
- **Every section gets its own composition and choreography.** No repeated
  layout. The WORD → word → small recombined line formula at most twice.
- **≥ 6 distinct in-composition transitions**, no two consecutive alike: sparkle
  iris, zoom-through-letter, stacked color bands, eye blink, camera dive,
  split curtain, glitch slice (recipes in
  [techniques.md](references/techniques.md)).
- **≥ 3 font families with intent:**
  - heavy geometric sans (Google Sans Flex, animate `wght`/`wdth`)
  - italic serif accent words (Instrument Serif)
  - condensed display slams (Big Shoulders/Anton)
  - large mono accents
- **1–2 inverted shots** (light background, black type) on big hits.
  The background stays a quiet stage: one desaturated key light at 8–14%
  alpha whose tint shifts per section. Color lives in the type.
- **Scale:** hero text rests at 65–85% of frame width. Nothing < 48 px.
  Title-safe ≥ 96 px L/R, ≥ 54 px T/B.

**Done when:** every row has a beat, a % width and a transition, and the
storyboard passes the checklist above.

## 5. Build

Edit `index.html` (one `.scene-layer` per section, `.shot-layer` per
sub-shot, all non-initial ones `style="visibility:hidden"`) and `app.js`
(one section at a time, all times via `b()`). Rules of thumb:
- Every shot: `baseLayer()` + at least one `drift()` (continuous motion),
  then beat accents on top.
- Text: `maskReveal()` / `pop()` / weight swell only. **No opacity
  fades.** Exits: `maskExit()` or a cut.
- Decorative lines behind type. Imagery (not text fragments) inside portals.
- Impact/flash/shockwave elements stay hidden until their hit frame.
- Iterate with `bash tools/render.sh . vN --draft` (30 fps, ~2–3 min).

Technical traps (visibility inheritance, `immediateRender` placement, the 2 MB
font limit, SVG mask/filter order, `<tspan>` spacing, motionPath on circles,
etc.) are in [hyperframes-gotchas.md](references/hyperframes-gotchas.md).
Read it before writing code.
**Done when:** the draft plays start to finish with every storyboard row
present.

## 6. Sound design

Declare `window.__sfxCues` in `app.js` from the same time variables as the
tweens. Follow the hierarchy (≤ 3 impacts with music ducking, 3–5 downbeat
accents, everything else light, ~35–60 cues) and give each animation the
family that matches its motion (tick-roll, pluck, glide, zip, per-band swish,
suck, Doppler, shutter, shimmer, thud, sting), tuned to the music's key. Then
run `sfx.py --from-js app.js` and master per
[sound-design.md](references/sound-design.md) §3–4.
**Done when:** `audio/master.wav` is −14 LUFS ±0.5 and ≤ −1 dBTP, every
cut has a sound, and no family is spammed.

## 7. Self-review loop (mandatory before every handoff)

Final render: `bash tools/render.sh . vN` (60 fps, high; ~5–8 min). It runs
`review.py lint`, `hyperframes check`, the render, the mux, ffprobe,
contact sheets (`frames/vN/sheet_*.jpg`) and `review.py stats`. Then look at
the frames yourself (≤ 1600 px wide, ≤ 20 images per turn):

```bash
python3 tools/review.py strip out/vN.mp4 frames/vN/drop.jpg --start 3.6 --end 3.95 --n 8   # drop lands on the downbeat
python3 tools/review.py frames out/vN.mp4 frames/vN/pre --t 3.25 20.85 27.6               # 0.5 s before each hit: no stray rings
python3 tools/review.py frame out/vN.mp4 frames/vN/hero.jpg --t 5.0                       # hero at full res: gradient smooth, no seams
# + a strip across every transition, and the end card at 29.0
```

Acceptance checklist (each item caused a rejected version):
1. `stats`:
   - `static stretches >=0.5s start at: none`
   - duration 30.000, 1920x1080, 60/1, h264 yuv420p, aac
   - −14 LUFS, true peak ≤ −1 dBTP
2. `lint`: 0 errors. `hyperframes check`: passes.
3. Every hero rests at 65–85% width inside title-safe. No text under 48 px.
   No HUD/debug labels.
4. No ghosted half-transparent text, no double exposure, no gray/flat-color
   frames, no lines crossing hero type.
5. The drop frame shows the hero (not an empty or flash frame). The full
   product name is held ≥ 1.2 s.
6. No stray impact elements before their hit. Every transition actually
   reveals the next shot.
7. Gradients are smooth (no hard bands). No stroke seams inside glyphs. Word
   spacing is correct at font switches.
8. Layouts and text formulas vary across sections. 1–2 inverted shots.
   The background is subtle (one soft tinted key light; the hero pops more
   than the background).
9. End card: lockup 70–75% width, CTA 90–110 px (no pill), sign-off ≥ 84 px,
   still moving until the fade.
10. Every cut has an audio accent. ≤ 3 impacts. SFX are tuned to the key
    and timed from `window.__sfxCues`.

**Done when:** all 10 pass. Fix and re-render rather than explaining issues
away.

## 8. Deliver

Report the path to `out/vN.mp4`, specs, loudness and a short shot summary.
Keep `NOTES.md` in the project with any new gotcha (command, error, fix).
If a gotcha is general, add it to this skill's references.

## Files

- `scripts/setup.sh`: one-time environment (venv, GSAP vendor, fonts,
  HyperFrames prefetch)
- `scripts/new_project.py`: scaffold a project from `template/`
- `scripts/render.sh`: lint → check → render → mux → verify → sheets → stats
- `scripts/review.py`: `lint`, `sheets`, `strip`, `frame`, `frames`, `stats`
- `scripts/music.py`: Lyria music-bed generator (Gemini API, `$GEMINI_API_KEY`)
- `scripts/analyze_music.py`, `scripts/master_audio.py`: beat grid, drop
  lock, mastering
- `scripts/sfx.py`: deterministic whoosh/impact/riser/tick/shimmer synth from
  a JSON cue list
- `template/`: master composition + helper library (start here)
- `examples/gemini-4-argon/`: the approved v8 project (index.html, app.js,
  common.css, storyboard, 84-cue SFX list, NOTES.md with "If I started over")
- `references/craft-standards.md`: the creative-director rules (the "why")
- `references/techniques.md`: code recipes for each transition/effect
- `references/hyperframes-gotchas.md`: 28 technical traps and fixes
- `references/sound-design.md`: Lyria → grid lock → SFX → master
