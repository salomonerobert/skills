# Craft standards: what separates "pro motion studio" from "template video"

These are the creative-director rules, distilled from 7 review rounds of the
Gemini 4 Argon launch video. Every rule exists because a version broke it and
it was visible. Treat them as acceptance criteria: check each one on your own
frames before you hand off.

## 1. Scale is energy

- **One idea per shot, and that idea owns the frame.** Hero words and phrases
  rest at **65–85% of frame width** (1250–1630 px at 1080p). In v1 every
  headline was about 10% of frame height in a dark void. It read as a polite
  explainer, not a launch.
- Title-safe margins apply to **resting states**: ≥ 96 px left/right and
  ≥ 54 px top/bottom. Deliberate crops are fine **only during fast motion**,
  like a zoom-through or giant type sliding past. Two versions regressed here
  ("Something new" edge to edge, end lockup at 97% width).
- Check scale after every structural rewrite. v3 rebuilt the scenes and
  silently shrank everything back to 35–55% width.
- End lockup at ~70–75% width. The sign-off ("Google") at ≥ 84 px.
  The secondary line ("Available now") at 90–110 px, never a small UI pill.

## 2. No HUD clutter (no micro text)

- **If text is smaller than ~48 px at 1080p, it doesn't exist.** Delete
  corner labels, "BAR 03 // 128 BPM // 00:05:20" counters, frame brackets,
  EQ bars, "NEXT-GEN ARCHITECTURE" pills, telemetry captions and
  "01 // CONSUMER" row tags. They read as noise, and production/debug data
  must never be shown to viewers.
- Mono type is for short, *large* accents only (`> faster_` at 90–140 px).
- Micro labels creep back during rewrites. Grep the HTML for small
  `font-size` values before every render.

## 3. Pacing: more shots, cut on the grid

- 30 s needs **20–28 shots**. At 128 bpm one bar is 1.875 s: change the shot on
  every downbeat at minimum, and use 2–4 beat-length sub-shots (word swaps,
  scale punches, camera snaps, color flips) inside each section.
- A new visual event at least every ~0.5 s.
- Each key phrase stays fully legible for ≥ 0.6 s (holds of 1.5–2 s are fine
  if the base layer keeps moving, see §4).
- The hero (product name) needs a real moment: the full name together for
  ≥ 1.2 s, landing **on** the drop downbeat frame, not 3 frames after it.

## 4. Always alive: base layer + beat accents

- Motion analysis of v3 showed a stutter: things moved on the beat, then
  froze until the next one. Every shot needs a **continuous base layer** for
  its whole duration:
  - a slow camera push on the shot container (`scale 0.95→1.06`, `ease:"none"`)
  - slowly rotating/drifting secondary vectors (rings, sparkles, rays)
  - drifting background light fields
- **Beat accents** sit on top: kick-synced stage micro-punch
  (1.0→1.03→1.0 over 2–3 frames) in drop sections, word swaps, color floods.
- **No frozen frames.** `review.py stats` must report
  `static stretches >=0.5s start at: none`. The end card must keep moving
  until the final fade (push-in, sweep, rotating sparkles).
- With the **subtle background** (§9), the stage no longer supplies motion.
  A push-in on mostly dark frames measures as static (verified: the template
  demo failed until rotating orbits/sparkles and kick punches were added).
  The foreground secondary layer has to carry the "alive" feeling.

## 5. Reveals: masks, not dissolves

- **Opacity cross-fades on text read amateur** at high energy (ghosted
  half-transparent letters). Reveal with:
  - per-line `overflow:hidden` slide-up (`yPercent 118→0`, `expo.out`,
    0.34–0.5 s, chars staggered 0.02–0.03 s)
  - `clip-path: inset()` wipes
  - scale pops from 0 with `back.out` overshoot
  - variable-font weight swells (`wght 100→900`)
- Opacity is allowed only as a ≤ 4-frame assist alongside a mask, scale or
  blur move. Exits work the same way: mask out or cut, don't fade.
- **No double exposure:** outgoing type is gone (or masked away) by the
  frame the incoming hero lands.

## 6. Transitions must actually transition

- Use ≥ 6 distinct types, each motivated, with no two consecutive transitions
  of the same type, all designed **in-composition** (not ffmpeg crossfades).
  Proven set:
  1. **Sparkle-shaped iris** (`<clipPath>` star growing to reveal the next
     shot already in position)
  2. **Zoom-through-letter**: camera dives into the O's counter, and the next
     scene is visible *only inside* the counter (an `evenodd` compound path
     centered on the zoom origin)
  3. **Stacked color-band wipe** (3–4 solid brand-color bands, 2–3 frame
     stagger, the last band reveals)
  4. **Eye blink** (the eye shape's lids close to a line, then cut)
  5. **Chromatic glitch slice** on a drop
  6. **Split curtain / slat shutter**
  7. **Camera dive** with vertical motion blur and z-parallax layers
- A ring/circle that *appears* but masks nothing is not a transition (v1/v2
  used it twice).
- **No flat mid-tone frames.** An iris that overshoots into a solid
  lavender frame, or a white overlay fading over dark (gray wash), reads as a
  render bug. A flash is 2 frames at ≥ 85% luminance, then a hard reveal.
- Every scene change gets an audio accent (whoosh/hit). No silent cuts.

## 7. Vector work with meaning

- Hairline strokes and abstract polygons (pentagon, diamond) are filler.
  Add bold **filled** shape animation:
  - stacked color bands
  - shape bursts on hits (radial lines, dots, filled sparkles that pop with
    overshoot and clear within 0.3 s)
  - morph chains with meaning (sparkle → 4 → Ar tile; brackets → chevrons;
    eye; branching tree for "plans"; rocket/arrow for "ships")
- Decorative lines go **behind** hero type (z-order). Foreground elements
  only when deliberate, big and brief.
- Don't put a cropped fragment of the next scene's *text* inside a portal
  (it reads as a glyph bug). Show imagery (glowing nodes, light) instead.

## 8. Break the template

- Repeating one layout (number + headline top-left, illustration right)
  across capability scenes reads as a template by the third repeat.
- Same for text formulas: WORD → second word → both words smaller together.
  Use it at most twice. Give each section its own choreography:
  - centered giant word with the graph growing through it
  - a camera dive (depth)
  - a word revealed inside a pupil that blinks shut
  - three hard-cut full-frame words (PLANS. / ACTS. / SHIPS.) with no
    recombine line

## 9. Color, light, finish

- **The background is a quiet stage; color lives in the hero type and
  vectors.** The user rejected the v8 background (three saturated blue,
  violet and coral orbs at 36–46% alpha, all visible at once) as too loud.
  The approved v9 stage:
  - charcoal-navy vertical gradient `#07080D → #0B0E18` (not flat black,
    not colorful)
  - **one** soft radial key light behind the hero zone, 1600–1800 px,
    **8–14% alpha**, tinted with a *desaturated* section hue (~70% slate +
    ~30% hue, saturation ≤ 25%), cross-faded over 0.5 s at section
    boundaries. Never more than one tinted light at once.
  - drift ≤ 40 px and ≤ 3% scale per shot (it breathes, it doesn't move)
  - optional hairline/dot grid at 3–5% opacity in slow reverse parallax
  - grain ~0.055, vignette `inset 0 0 260px rgba(0,0,0,.55)`
- Pure flat black everywhere looks dead (v3 regression); saturated orbs look
  loud (v8). Stay between the two.
- At least 1–2 **inverted shots** (white background with black type) on big
  hits for contrast, with pastel tints ≤ 10% alpha.
- Gradients must be **smooth**: no abutting hard-edged color blocks, no
  "flag stripes", stops ≥ 15–20% apart, flowing via `gradientTransform`.
  Hero glyph = the brightest, most saturated element.
- Glow: two-layer bloom (tight sharp glow + wide soft glow at low opacity) so
  edges stay crisp. Avoid stroked duplicate text (it strokes internal contour
  seams of variable fonts, e.g. a rectangle inside "E"). Use an
  `feMorphology dilate` rim filter instead.
- Subtle film grain (visible on a 960 px frame, ~0.08–0.12 overlay) and a soft
  vignette on the background canvas.
- Motion blur only during peak-velocity frames (zoom-through, dive, whip).
  Toggle the filter on for those ~15–20 frames and off on settle.

## 10. Impact

- On the 2–3 biggest hits (drop, slam, final hit): deterministic camera
  shake (6–8 frames, 14→0 px, ±0.5°), a 2–3 frame chromatic split, and a
  scale punch on the hero. Sync each with an impact SFX.

## 11. Typography

- ≥ 3 families used with intent:
  - geometric sans, heavy, for heroes (Google Sans / Google Sans Flex with
    live `wght`/`wdth` axes)
  - an elegant italic serif for accent words ("is here.", "deeper.",
    "available.", "Argon"): Instrument Serif Italic
  - a condensed display for slams (Big Shoulders Display / Anton)
  - a mono for short code accents (JetBrains Mono / Space Mono)
- Proper word spacing at font switches (~0.25–0.32 em). Use two separately
  anchored `<text>` elements; `<tspan dx>` collapses across font changes.
- Italic serif descenders need ~22% extra mask height.

## 12. Sound

- Music bed (Lyria) beat-locked to an exact grid, **plus** a designed SFX
  layer. Sound should **describe the motion it accompanies**, not decorate
  every frame. The user asked for "thoughtful sound effects to accentuate the
  animations" after v8's 84-cue stem (15 impacts, 33 ticks), which read as
  clutter.
- **Hierarchy:**
  - ≤ 3 big impacts in 30 s (drop, slam, final hit), each ducking the music
    bed 2–4 dB for ~0.4 s
  - 3–5 medium accents on section downbeats
  - everything else light and detailed
  - ~35–60 cues total. Space between sounds is fine.
- Match family to motion (tick-roll for char reveals, pluck for scale pops,
  glide for morphs, zip for line draws, per-band swish for band wipes, suck
  for zoom-throughs, Doppler for dives, shutter for blinks, shimmer for
  specular sweeps, tuned thuds for stacked rows, chord sting for the end
  card). Make each SFX as long as its motion, with the transient on the
  contact frame.
- **Musical:** tune pitched SFX to the music's key (pentatonic of the
  detected key), glue everything with one short shared reverb, high-pass
  ticks at ~2 kHz so they never mask the kick.
- Cue times come from the same `b()` variables as the animation
  (`window.__sfxCues` → `sfx.py --from-js`), so sound can't drift from
  picture.
- Master: −14 LUFS integrated, ≤ −1 dBTP, fade by 30.0 s.
