# Gemini 4 Argon GA — 30.0s Launch Video Storyboard (v6)

- **Tempo**: `128.000 BPM` (`1 beat = 0.46875s`, `1 bar = 1.8750s`, `16 bars = 64 beats = 30.000s`)
- **Resolution / FPS**: `1920×1080`, `60 fps`, `H.264 yuv420p`, mastered Lyria bed + 84-cue procedural SFX stem (`-14.1 LUFS`, `-1.5 dBTP`)
- **v5 & v6 Pro-Polish Layer (from review rounds 5 & 6)**:
  1. **Hero Drop On Screen at `3.750s` Downbeat (`3.48–3.85s`)**:
     - At `3.328s` (`b(7.1)`), the `18 / Ar` tile outline morphs (`MorphSVG`) into a hollow glowing 4-point Gemini sparkle rim (`#s1-iris-sparkle`, `fill="none" stroke="#00E5FF"`).
     - From `3.530s` to `3.750s`, the sparkle iris opens as a true `<clipPath id="s2-iris-clip">` window revealing Scene 2 (`GEMINI 4` already in position inside it — zero flat mauve frames!), culminating in a 2-frame hot white flash (`3.717–3.750s`) and landing on `GEMINI 4` 100% fully formed on the exact `3.750s` downbeat with a `1.12 -> 1.0` (`expo.out`, `0.30s`) scale punch + expanding cyan shockwave ring.
  2. **Smooth Multi-Stop Plasma Gradients + Soft-Light Noise + Zero `'E'` Seam**:
     - Replaced abutting color rects with smooth 6–7 stop linear gradients (`#s2GeminiSmooth`, `#s2FourSmooth`, `#s2ArgonSmooth`, stops spaced `16–20%` apart) animated across `x`, layered with `<filter id="plasmaNoiseFilter">` (`mix-blend-mode: soft-light`).
     - Replaced the stroked `<text>` rim on `GEMINI` and `ARGON` with `<filter id="cleanOuterRim">` (`feMorphology operator="dilate"` composited behind `SourceGraphic`), eliminating the internal variable-font contour seam inside `'E'`.
     - Placed `#s2a-lockup-wrap` at `z-index: 10` in front of all background rings, with outer-only burst rays that clear within `0.28s` so no ray ever crosses the hero type.
  3. **O-Portal Counter Window (`5.859–6.92s`)**:
     - Kept `"Thinks"` masked (`yPercent: 118`) until `6.916s` (after the `'O'` portal expands wide) and placed `#s3-portal-cluster` (glowing neural thought-tree nodes, radiating synaptic lines, and pulsing core light) at `(1220, 540)` inside the `'O'` counter hole during `5.859–6.916s` so zero cropped text fragments ever appear in the counter.
  4. **Title-Safe Margin on `"Something new"` (`0.94–1.88s`)**:
     - Sized `#s1-text-line1` (`"Something new"`) to `182px` with variable width `'wdth' 85 -> 100` (`~73%` of frame width, well inside `<= 85%` title-safe).
  5. **Zero Opacity Cross-Fades, Centered Availability Stack (`24.375–26.25s`), Separated End Lockup (`26.25–30.00s`), & 84-Cue Procedural SFX Layer (`sfx.py`)**.
  1. **Hero Typography Scale Restored to `65–85%` Frame Width (`1250–1630px`)**:
     - `Something new / is here.`: `212px` / `260px` (`~77%` width)
     - `ELEMENT 18 / NOBLE GAS`: `285px` Big Shoulders Display (`~74%` width)
     - `Ar` Tile: `520×580px` (`18` at `64px`, `39.948` at `50px`, `Ar` at `260px`, `ARGON` at `60px`)
     - Drop Lockup (`3.75–5.85s`): `GEMINI 4` (`270px` + `310px` sculptural `4`, `~82%` width) + `ARGON` (`330px`, `~79%` width) holding together for `1.55s`
     - `ARGON` Portal (`5.85–7.50s`): Full-frame centered `ARGON` (`520px`, `~80%` width, `O` at `(1220, 540)` panning to `(960, 540)` during the `6.65–7.50s` Zoom-Through-`O` with `"Thinks"` inside the counter)
     - `Thinks` (`380px`, `~74%` width) -> vertical camera dive -> `deeper.` (`430px` Instrument Serif Italic, `~72%` width)
     - `CODES` (`310px` Google Sans Flex Black 900 between `< / >` brackets, `~82%` width) -> morphs to `» CODES FASTER_` (`215px` + `210px` mono, `~86%` width)
     - `Sees` (`460px` on inverted `#F8FAFC` card, `~68%` text / `82%` with aperture) -> Giant Eye opens around single-line `Sees everything.` (`245px` + `285px` italic, `~80%` width) -> Eye blinks shut
     - `PLANS.` (`440px`, `~72%` width) -> `ACTS.` (`420px` + chevrons, `~84%` width) -> Inverted `SHIPS.` (`390px` + launch fins, `~84%` width)
     - `Generally available.` (`285px` + `320px` italic, `~75%` width)
     - Centered Availability Stack (`24.375–26.25s`): 4 centered rows filling `~72%` of frame height (`138–150px` type, zero HUD micro-labels), each landing on the beat with a scale/position punch and progressive camera push
     - End Card (`26.25–30.00s`): `Gemini 4 Argon` (`205px` + `230px` italic = `~73%` frame width), large `Available now` (`104px` Instrument Serif Italic with drawn gradient underline, no button pill), and `Google` (`68px` crisp white)
  2. **Zero Text Under `48px`**: Removed all `01 // CONSUMER` micro-labels and small `<pre>` code text (replaced with vector code-stream bars).
  3. **Continuous Motion (Zero Frozen Frames)**: Every shot container has a continuous `ease: "none"` camera push/drift (`scale: 0.96 -> 1.05`) + continuous `ease: "none"` rotation/drift on rings, rays, and sparkles across its entire active duration.
  4. **Section-Hued Ambient Light Fields & Visible Film Grain**: Removed opaque black backgrounds on dark scenes so large drifting radial light blobs (`25–35%` alpha, shifting hue per section) and visible SVG film grain (`opacity: 0.11`) shine across the whole piece.
  5. **Crisp 2-Frame Hot Drop Flash (`3.75–3.78s`)**: Replaced the long alpha-white fade with a 2-frame hot cyan/white/violet burst flash (`>= 88%` luminance) that cuts cleanly to the lockup with zero muddy gray mid-tone frames.
