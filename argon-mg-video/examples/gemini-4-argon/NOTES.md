# Gemini 4 Argon GA — Motion Graphics Production Notes & Gotchas

## If I started over

The 14 architectural rules, reusable helpers, self-review checks, and audio pipeline steps below would get any HyperFrames + GSAP motion-graphics project to `v6`/`v7` quality on the **very first render**:

1. **Audio Pipeline First — Lock the Beat Grid Before Writing a Single Line of Animation**:
   - Follow this exact audio pipeline order before building visuals:
     1. Generate raw instrumental track via `music.py` and convert `.mp3` -> `44.1 kHz` stereo `.wav` (`audio/raw_music.wav`).
     2. Run `python3 analyze_music.py --input audio/raw_music.wav` (`librosa.beat.beat_track` + 4-phase onset scoring + per-bar RMS profile) to locate the true tempo and the exact timestamp of the biggest musical drop (e.g. `~61.98s`).
     3. Run `python3 master_audio.py --input audio/raw_music.wav --bed-out audio/music_bed_only.wav --drop-hint 61.98 --drop-beat 8 --total-beats 64 --duration 30.0 --bpm 128.0` to slice 8 beats before the drop and apply `ffmpeg atempo` (`~1.0079x`) so **64 beats = 30.0000s (`128.000 BPM`, `1 beat = 0.46875s`)** and the drop lands on the exact downbeat **`b(8) = 3.7500s`**.
     4. Synthesize deterministic procedural SFX (`python3 sfx.py --cues audio/sfx_cues.json --out audio/sfx_stem.wav`) locked to the `b(n)` timestamps in `app.js`, then mix `sfx_stem.wav` (`0.38` gain) with `music_bed_only.wav` (`0.88` gain) through `loudnorm=I=-14.0:TP=-1.5:LRA=9.0` via `master_audio.py --sfx audio/sfx_stem.wav --out audio/music_30s.wav`.
2. **Master Composition Architecture (`#root > #stage > #camera > .scene-layer > .shot-layer`)**:
   - Use a single 30.0s master composition (`#root[data-start="0"][data-duration="30"] > #stage.clip[data-start="0"][data-duration="30"] > #camera`) so every transition (`clipPath` iris windows, zoom-through-letter portals, multi-band staggered wipes) happens *inside* the composition with zero external ffmpeg crossfades.
   - Keep `#stage` dedicated to deterministic impact camera shakes (`x`, `y`, `rotation`) and the final fade-out, and `#camera` dedicated to beat-locked kick micro-punches (`scale: 1.012 -> 1.0`) and 3-frame chromatic split filters (`filter: url(#rgbImpactSplit)`).
3. **Strict `autoAlpha: 0` Initialization on Every Scene & Sub-Shot (Never Bare `visibility`)**:
   - In CSS, `visibility: visible` on a child `.shot-layer` overrides `visibility: hidden` on a parent `.scene-layer`. Furthermore, calling `tl.set(child, { visibility: "visible" }, tStart)` when the parent was just made visible causes GSAP to record `startValue = "visible"` for the child when seeking backward to `t < tStart`.
   - **Rule**: Put `style="visibility:hidden;"` on every non-initial `.scene-layer` and `.shot-layer` in `index.html`, AND at `t = 0` in `app.js` run a single `gsap.set([...allNonInitialScenesAndShots], { autoAlpha: 0 })` before adding any tweens. Always toggle shots on/off with `autoAlpha: 1` / `autoAlpha: 0` (`opacity` + `visibility` together), and explicitly turn off both the parent `.scene-layer` and all child `.shot-layer`s at scene handoffs.
4. **100% Masked / Clip-Path / Scale-from-0 Text Reveals (Zero `opacity: 0 -> 1` Text Fades)**:
   - Animating `opacity: 0 -> 1` on headlines over `0.35s` produces 15–20 half-transparent "ghost" frames on freeze-frame inspection and trips `hyperframes check` contrast rules.
   - **Rule**: Keep `opacity: 1` on all text from frame 1. Wrap every headline line in `<div style="overflow:hidden; padding:12px 24px;">`, initialize all `SplitText` chars/lines at `{ yPercent: 118, opacity: 1 }` at `t = 0`, and reveal with `yPercent: 118 -> 0` (`ease: "expo.out"`, `duration: 0.34–0.40s`, `stagger: 0.02s`), `clipPath: "inset(100% 0% 0% 0%) -> inset(0% 0% 0% 0%)"`, or `scale: 0 -> 1.0` (`back.out(1.9)`).
5. **Iris & Portal Transitions Must Be True Windows, Never Full-Screen Color Wash Dissolves**:
   - Never transition into a major drop (`3.750s`) with a solid-filled shape or a multi-frame white/lavender opacity dissolve—any frame sampled at `3.70–3.80s` will look like a flat low-contrast wash.
   - **Rule**: Make the iris (`#s1-iris-sparkle`) a hollow glowing stroke rim (`fill="none" stroke="#00E5FF"`) paired with an identical `<clipPath id="s2-iris-clip">` on the incoming scene (`#scene2`), centered on the incoming hero lockup (`960, 340`). Open the window with `ease: "power2.in"` (not `expo.in`, which stays tiny for 70% of its duration) and complete expansion `40–60ms` *before* the downbeat (`3.69s`) so the hero lockup slams at 100% contrast on the exact `3.750s` downbeat with a `1.14 -> 1.0` scale punch and expanding shockwave ring.
6. **Zero-Drift Compound-Path Zoom-Through-Letter (`O` in `ARGON`) with Dedicated Portal Cluster**:
   - Build any zoom-through letter (`O`) as an explicit compound SVG `<path fill-rule="evenodd" d="M ... Z M ... Z">` so the counter hole is a true transparent window. Center the full word (`ARGON`) horizontally during the hold (`O` at `1220, 540`), set `svgOrigin: "1220 540"`, and pan `{ x: -260, scale: 32, ease: "power2.in" }` while animating the incoming scene's `clipPath` from `ellipse(64px 136px at 1220px 540px)` to `ellipse(2200px 2200px at 960px 540px)`.
   - **Rule**: Keep the incoming scene's headline (`"Thinks"`) hidden at `yPercent: 118` inside its mask until the `'O'` counter hole has expanded wider than the word (`>= 1500px` wide at `7.12s`), and place a dedicated glowing vector illustration (`#s3-portal-cluster`) centered at `(1220, 540)` inside the `'O'` counter during the hold and zoom (`5.86–7.12s`) so a cropped letter fragment (`"k"`) never appears inside the `'O'`.
7. **Variable Font Masking & SVG `filter`-Wraps-`mask` Rule (Zero `'E'` Seam, Smooth Gradients)**:
   - Variable fonts (`Google Sans Flex`) build glyphs like `'E'` from overlapping contours; putting `stroke="#F8FAFC"` directly on `<text>` strokes the internal overlap box inside `'E'`. Furthermore, in the SVG spec, placing `mask` and `filter` on the *same* `<g>` evaluates `filter` *before* `mask` (clipping off any dilated outer rim).
   - **Rule**: Use solid white `<text fill="#FFFFFF">` inside `<mask id="s2-gemini-mask">`, apply the mask to an inner `<g mask="url(#s2-gemini-mask)">` containing a smooth 6-stop `<linearGradient gradientUnits="userSpaceOnUse">` (`#4285F4` blue → `#8AB4F8`/cyan → `#9B72CB` violet → `#D96570` coral, stops `16–22%` apart, gently flowing so all 4 hues remain visible across the word) + `<filter id="plasmaNoiseFilter">` (`mix-blend-mode: soft-light`, zero negative color offset), and wrap that masked group inside an outer `<g filter="url(#cleanOuterRim)">` (`feMorphology in="SourceAlpha" operator="dilate" radius="2.4"`).
8. **Strict Z-Index Hierarchy & Title-Safe Scale (`70–84%` Width, `>= 7.5%` Margins)**:
   - Keep all decorative rings, grids, and burst rays in a background SVG (`z-index: 1`) *behind* the hero typography wrapper (`z-index: 10`), and restrict burst rays to the outer margin (`drawSVG: "0% 45%" -> "100% 100%"`, clearing to `opacity: 0` in `0.28s`) so no line ever crosses hero letters.
   - Size every hero headline and lockup to occupy **`70–84%` of frame width (`1340–1610px`)** so it commands the 1920×1080 canvas while staying inside the `85%` title-safe zone (`>= 140px` left/right margin).
9. **Dynamic Center-of-Mass Tracking for Sequential Stack Builds**:
   - When revealing a 4-row vertical stack one beat at a time (`height: 896px`, `224px` per row), never start Row 1 at the top of the frame with 70% empty space below. Start `#s7b-stack` at `y = +336px` (`1.5 * rowHeight`) on the first beat so Row 1 lands dead-center at `y = 540px`, then step `y` up by `-112px` (`0.5 * rowHeight`) on each beat (`336 -> 224 -> 112 -> 0`, `expo.out`) so the visual center of mass stays locked to `y = 540px`.
10. **Zero-Frozen-Frame Guarantee Across All 1800 Frames**:
    - Pair every fast entrance tween (`0.30–0.40s`, `expo.out` / `back.out`) with an unbroken full-shot-duration linear push-in (`scale: 0.96 -> 1.05`, `ease: "none"`) on the `.shot-layer` AND a continuous rotation/drift tween (`ease: "none"`) on background rings, sparkles, and ambient aurora orbs (`#bg-orb-1..3`).
11. **Reusable Deterministic Helpers Worth Copying Into Every Project**:
    - `const BEAT = 60 / BPM; const b = (n) => +(n * BEAT).toFixed(5);` — beat-grid timestamp helper.
    - `addImpactHit(tHit, seed, rimHook)` — deterministic 7-frame decaying camera shake (`14 -> 0px` + `±0.5°` rotation jitter on `#stage`) + 3-frame R/B chromatic aberration split (`#rgbImpactSplit` on `#camera`) + 1-frame white/cyan glyph rim flash on major musical hits (`3.750s`, `21.328s`, `28.125s`).
    - Deterministic `window.renderAt(t)` grain shifter (`gx = -100 + ((frameIdx * 37) % 180)`).
12. **Vendor All JS & Subset Variable Fonts Under 2 MB Before First Check**:
    - Vendor `gsap.min.js`, `SplitText.min.js`, `DrawSVGPlugin.min.js`, `MorphSVGPlugin.min.js`, `MotionPathPlugin.min.js`, `CustomEase.min.js`, `ScrambleTextPlugin.min.js` locally in `vendor/`.
    - Subset variable fonts (`GoogleSansFlex.ttf`) under HyperFrames' **2 MB inline limit** using `fonttools varLib.instancer` (pinning unused `GRAD=0 ROND=0 opsz=72` axes while keeping `wght`, `wdth`, `slnt` live) + `pyftsubset`.
13. **Always Run `hyperframes check` and Fix All Occlusion/Overflow Annotations**:
    - Always invoke HyperFrames with `CI=1 pnpm dlx hyperframes@0.8.91 check </dev/null` so pnpm never hangs on stdin.
    - Put `data-layout-allow-occlusion="true"` on transient wipe bars, grain overlays, and flash layers so `hyperframes check` passes with `0 errors, 0 warnings`.
14. **Pre-Positioned Impact Elements (`shockwave`, `burst`, `flash`, `specular-bar`) & `tl.fromTo` `immediateRender: false` Gotcha**:
    - In GSAP `tl.fromTo(targets, fromVars, toVars, position)`, `immediateRender: false` is a tween configuration property and **MUST be placed inside `toVars` (the 3rd argument)**, NOT `fromVars` (the 2nd argument). Placing `immediateRender: false` inside `fromVars` is silently ignored by GSAP, causing `fromTo` to immediately apply `fromVars` (e.g. `scale: 0.28, opacity: 0.95` on `#s8-final-shockwave`) at `t = 0`, which leaves a small ~60px cyan ring sitting over the hero typography for seconds before the hit!
    - **Rule**: Put `style="visibility:hidden;"` and `opacity="0"` on every shockwave, burst, flash, and specular-bar element in `index.html`, initialize them with `gsap.set([...], { autoAlpha: 0, scale: 0 })` at `t = 0` and at scene entry, only set `autoAlpha: 1` at the exact hit timestamp (`tHit`), start shockwave rings from outside the typography perimeter (`scale: 1.45 -> 4.2`) so no small circle ever sits on top of letters on the hit frame, and **always extract check frames `0.5s` *before* every impact (`3.25s`, `20.83s`, `27.60s`)** to confirm zero pre-visible impact elements.
15. **Mandatory Self-Review Protocol Before Every Handoff**:
    - After rendering `out/vN.mp4` (`60fps`, `h264 yuv420p`, `aac 192k`, `30.000000s`), ALWAYS run:
      1. `ffprobe` spec verification + `ffmpeg -filter_complex ebur128=peak=true` loudness check (`-14 LUFS`, `<= -1 dBTP`).
      2. Contact sheets: `ffmpeg -y -i out/vN.mp4 -vf "fps=2,scale=384:-1,tile=4x4" frames/vN_sheet_%02d.jpg` (4 sheets = 60 tiles across 30.0s).
      3. High-res (`1280px–1600px`) single-frame extractions `0.5s` *before* every impact (`3.25s, 20.83s, 27.60s`), on the impact frames (`3.75s, 3.77s, 21.33s, 21.35s, 28.12s, 28.15s`), at transition midpoints, hero holds (`4.50s, 5.00s`), portal zoom (`6.10s, 6.45s, 7.05s, 7.25s`), and availability stack (`24.50s, 25.50s, 25.90s`), viewing them directly with `read_file` before posting.

---

## Environment & Tooling Gotchas
1. **HyperFrames CLI hangs without `CI=1` and closed stdin**:
   - Always invoke `hyperframes@0.8.91` with `CI=1 pnpm dlx hyperframes@0.8.91 <cmd> </dev/null`.
2. **Lyria music output extension (`music.py`)**:
   - Even when passing `--out audio/raw_music.wav`, `music.py` writes `audio/raw_music.mp3` (44.1kHz stereo MP3, ~178s duration) and prints the actual `.mp3` output path. Convert to WAV via `ffmpeg -y -i audio/raw_music.mp3 -ar 44100 -ac 2 audio/raw_music.wav` before analysis/mastering.
3. **Font permissions & bundling in HyperFrames**:
   - System fonts in `~/.local/share/fonts/` are `0444` (read-only); after copying to `fonts/`, run `chmod u+w fonts/*.ttf` so subsequent scripts can overwrite if needed.
   - HyperFrames requires every `font-family` used in CSS/SVG to have an explicit `@font-face` pointing to a local file in `fonts/`.
   - **2 MB Font Inline Limit Gotcha**: `GoogleSansFlex[GRAD,ROND,opsz,slnt,wdth,wght].ttf` is 4.5 MB, which triggers `[HyperFrames] Not inlining "fonts/GoogleSansFlex.ttf" (4.4 MB exceeds the 2 MB inline limit)`. Fix by pinning unused axes (`GRAD=0 ROND=0 opsz=72`) with `fonttools varLib.instancer` and subsetting to Latin/symbols with `pyftsubset`, keeping `wght`, `wdth`, `slnt` variable while shrinking the file well under 2 MB.
   - **StaticGuard `window.__timelines` Check Gotcha**: `hyperframes check` runs a static AST/regex check (`StaticGuard`) on `index.html` looking for `window.__timelines["main"] = tl`. If `window.__timelines` is only assigned inside an external `<script src="app.js">`, `StaticGuard` fails with `missing_timeline_registry`. Fix: create `const tl = gsap.timeline({ paused: true })` and register `window.__timelines["main"] = tl` inside an inline `<script>` tag in `index.html`, calling `window.buildArgonTimeline(tl)` defined in `app.js`.
   - Bundled fonts in `fonts/`:
     - `GoogleSansFlex.ttf` (`Google Sans Flex`, variable font with `wght`, `wdth`, `slnt`, `GRAD`, `ROND`, `opsz` axes)
     - `GoogleSans-Bold.ttf`, `GoogleSans-Regular.ttf`
     - `InstrumentSerif-Italic.ttf`, `InstrumentSerif-Regular.ttf` (elegant editorial contrast)
     - `BigShouldersDisplay.ttf` / `Anton-Regular.ttf` (condensed punchy display)
     - `JetBrainsMono.ttf` / `SpaceMono-Bold.ttf` (technical HUD / code / telemetry mono)
4. **GSAP 3.14.2 Plugins (All Free, Vendored Locally)**:
   - Vendored in `vendor/`: `gsap.min.js`, `SplitText.min.js`, `DrawSVGPlugin.min.js`, `MorphSVGPlugin.min.js`, `MotionPathPlugin.min.js`, `CustomEase.min.js`, `ScrambleTextPlugin.min.js`.
   - Never load from CDN at render time; load via `<script src="vendor/gsap.min.js"></script>` etc., and call `gsap.registerPlugin(SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, CustomEase, ScrambleTextPlugin)`.
5. **Deterministic Frame Capture in HyperFrames**:
   - HyperFrames captures frames by seeking `window.__timelines["main"].seek(t)`.
   - Never use CSS `@keyframes`, `requestAnimationFrame`, or `setInterval` for animation—they do not advance deterministically when seeking.
   - Drive all continuous secondary motion, canvas/SVG particle systems, variable-font axes (`fontVariationSettings`), and audio-reactive glows via GSAP timeline tweens or a master `tl.to(state, { t: 30, duration: 30, ease: "none", onUpdate: () => renderTick(tl.time()) }, 0)`.
6. **HyperFrames Checker Rules & Runtime Gotchas**:
   - Never fade text with `opacity: 0` if running `hyperframes check` (mid-fade frames can trip the `< 3:1` contrast check); use `clip-path`, `scale`, `y` mask reveals (`overflow: hidden`), or instant visibility switches at transition boundaries.
   - **Foreground Vignette / Overlay Occlusion (`text_occluded`)**: Never place a full-screen `div` with a `radial-gradient` or background color above text layers (even with `pointer-events: none`), or `hyperframes check`'s layout audit will flag every text element on the page with `text_occluded`. Instead, draw the vignette on the background `<canvas>` or add `data-layout-allow-occlusion="true"` on transient transition overlays.
   - **`MotionPathPlugin` `<ellipse>` / `<circle>` Crash (`Cannot access 'sx' before initialization`)**: Passing an SVG `<ellipse>` or `<circle>` selector directly to `motionPath: { path: "#id" }` without converting it to a `<path>` causes GSAP `MotionPathPlugin` to log `Expecting a <path> element or an SVG path data string` and throw `TypeError: Cannot read properties of undefined (reading '0')` during initial seek. That uncaught exception aborts HyperFrames' runtime bootstrap before `window.__renderReady = true` and leaves an internal `let sx` variable uninitialized in the Temporal Dead Zone (`ReferenceError: Cannot access 'sx' before initialization`). Always use `<path d="M ... A ...">` (or `MotionPathPlugin.convertToPath(...)`) for motion paths.
   - Timed elements (`class="clip"`, unique `id`, `data-start`, `data-duration`) must be direct children of `#root`. For a single master composition with overlapping scene handoffs, keep `#root` at `data-start="0" data-duration="30.0"` and orchestrate scene layers inside `#stage` with the master GSAP timeline.
7. **GSAP SVG `transform="translate(x, y)"` + Rotation/Scale Gotcha**:
   - If an SVG `<g id="rig" transform="translate(1220, 540)">` has an inline `transform="translate(...)"` attribute AND you animate `scale`/`rotation` on `#rig` via GSAP without repeating `x: 1220, y: 540`, GSAP's SVG transform matrix can overwrite or drift the translation origin across the tween.
   - **Fix**: Wrap the animated `<g id="rig">` inside a static parent `<g transform="translate(1220, 540)"><g id="rig">...</g></g>`, keep `#rig` centered at `(0, 0)` in local space, and pass `svgOrigin: "0 0"` to GSAP.
8. **Complementary `clipPath` Wipes on Transparent Scene Layers**:
   - Because `.scene-layer` wrappers have transparent backgrounds (so the shared `#bg-canvas` starfield, grid, and audio-reactive EQ bars shine through from behind), wiping an incoming scene in via `clipPath: polygon(...)` or `inset(...)` while leaving the outgoing scene unclipped underneath causes outgoing and incoming typography to briefly double-expose.
   - **Fix**: Always animate the complementary `clipPath` on the outgoing `.scene-layer` simultaneously (e.g., as `#scene7` wipes in from `0% -> 135%`, `#scene6` wipes out from `0%..135% -> 135%..135%`) or cut the outgoing scene at the exact peak of a transition overlay (slats / glitch slices / shockwave ring).
9. **CSS `visibility: visible` on Child Sub-Shots Overrides `visibility: hidden` on Parent Scene**:
   - In CSS, if a child sub-shot (`#s2-shot-argon`, `#s4-shot-lockup`, etc.) has `style="visibility: visible"` set by `tl.set(child, { visibility: "visible" }, t1)`, and later you only hide the parent container (`tl.set("#scene2", { visibility: "hidden" }, t2)`), the child remains visible on screen for the rest of the video because explicit `visibility: visible` on a descendant overrides `visibility: hidden` on an ancestor!
   - **Fix**: Always explicitly hide the active child sub-shot alongside the parent scene (`tl.set(["#s2-shot-argon", "#scene2"], { visibility: "hidden" }, t2)`), and initialize hidden child elements with `style="visibility:hidden"` in HTML before registering later `tl.set(child, { visibility: "hidden" }, tEnd)` calls.
10. **True Zoom-Through-Letter Counter Transition (`O` in `ARGON`)**:
    - Measure the exact bounding box of the target letter (`const rect = splitArgon.chars[3].getBoundingClientRect()`) at initialization before timeline transforms run, set `transformOrigin: "${oCenterX}px ${oCenterY}px"` on the outgoing shot, pan `(oCenterX, oCenterY)` to screen center `(960, 540)`, and scale the outgoing shot to `26x` while simultaneously expanding `clipPath: "ellipse(38px 68px at 50% 50%)" -> "ellipse(1500px 1800px at 50% 50%)"` on the incoming scene using the exact same `CustomEase`. This keeps the incoming scene strictly inside the expanding counter hole of the letter `O`.

11. **Compound SVG Path (`fill-rule="evenodd"`) for Zero-Drift, Zero-Blowout Zoom-Through-`O`**:
    - Scaling HTML glyph text to `26x–30x` around an estimated letter center often causes the white glyph stroke to sweep across `(960, 540)` (creating a 0.3s solid-white blowout) or drift relative to the incoming scene's `clipPath: ellipse(...)`.
    - **Fix**: Build the zoom-through portal word (`ARGON`) in an SVG `<g id="s2b-portal-group">` where the `O` is an explicit compound `<path fill-rule="evenodd" d="M ... Z M ... Z">` whose outer contour and inner counter hole (`rx=68, ry=132`) are centered at exact `(960, 540)` from frame 1 of the portal sub-shot. Because `fill-rule="evenodd"` makes the inner counter contour a 100% transparent hole centered at `(960, 540)` and `svgOrigin: "960 540"` scales the entire `<g>` concentrically around `(960, 540)`, the white strokes expand strictly *outward* away from `(960, 540)` while the incoming scene's `clipPath: ellipse(46px 92px at 960px 540px) -> ellipse(2200px 2200px at 960px 540px)` expands concentrically from inside the hole—zero white blowout and 0.0px drift.
12. **GSAP `scale` Overwrites CSS `transform: translate(-50%, -50%)` Without `xPercent` / `yPercent`**:
    - If an element is centered in CSS with `left: 960px; top: 540px; transform: translate(-50%, -50%)` and you animate `{ left: "650px", scale: 0.78 }` in GSAP without passing `xPercent: -50, yPercent: -50`, GSAP replaces the CSS `translate(-50%, -50%)` with `translate(0px, 0px) scale(0.78)`, shifting the element's anchor from its center to its top-left corner and causing `content_overlap` with neighboring words. Always pass `xPercent: -50, yPercent: -50` explicitly in GSAP tweens on centered elements.
13. **`Instrument Serif Italic` Descender Clearance Inside Masked `.surf-row` Containers**:
    - `Instrument Serif Italic` has deep descenders (`g`, `p`, `y`) that extend ~22% below the baseline. Inside an `overflow: hidden` row container (`height: 170px`), `134px` `Instrument Serif Italic` ("Google AI Studio") triggers `text_box_overflow` by ~29px at the bottom. Increasing `.surf-row` height to `196px` and sizing `Instrument Serif Italic` at `118px` (`line-height: 1.05`) keeps the full descender inside the mask.
14. **Selective Directional & Radial Motion Blur (`<feGaussianBlur>`) on Peak Velocity Frames**:
    - Leaving `<feGaussianBlur>` active on static holds hurts legibility and costs CPU raster time, whereas toggling `attr: { filter: "url(#blurV)" }` or `"url(#blurZoom)"` via `tl.set(...)` strictly during the 15–20 peak-velocity frames of a camera dive (`9.48–9.80s`) or zoom-through-letter (`7.12–7.50s`) and resetting `attr: { filter: "none" }` immediately on settle gives authentic motion blur with razor-sharp holds.

15. **GSAP `tl.fromTo` Shared Flash Overlay `immediateRender: true` Gotcha**:
    - Calling `tl.fromTo("#flash-overlay", { opacity: maxOpacity }, { opacity: 0, duration: dur }, time)` multiple times across a timeline on the same `#flash-overlay` element without `immediateRender: false` causes GSAP's default `immediateRender: true` to leave `#flash-overlay` stuck at the last call's `maxOpacity` (`0.34`) from `t = 0.000s` until the first scheduled flash tween (`0.9375s`), washing out the opening shot with a grey veil.
    - **Fix**: Always pass `immediateRender: false` inside helper functions that schedule multiple `fromTo` tweens on a shared overlay element, and explicitly set `tl.set("#flash-overlay", { opacity: 0 }, 0)` at the start of the timeline.
16. **Opaque `.scene-layer` / `.shot-layer` Backgrounds Hide Shared `#bg-canvas` Light Fields**:
    - Setting `background: #05060A` on individual dark `.scene-layer` or `.shot-layer` containers blocks the underlying `<canvas id="bg-canvas">` (`z-index: 2`). Keeping dark `.scene-layer` and `.shot-layer` containers transparent (`background: transparent`) allows the shared `#bg-canvas` (3 large `1300×1300px` drifting radial light blobs at `35–46%` peak alpha with section-specific hue palettes, perspective grid, and ambient particles) to illuminate every dark scene without duplicating DOM nodes.
17. **Eliminating Muddy Mid-Tone Gray Frames on Drop Flashes (`3.75s`)**:
    - Fading a solid `#FFFFFF` overlay from `opacity: 0.7 -> 0` over `0.34s` (20 frames at 60 fps) over a dark `#05060A` scene produces ~15 washed-out mid-tone gray frames (`3.77s`).
    - **Fix**: Use a 2-frame (`0.034s`) hot cyan/white/violet radial gradient burst (`#drop-flash-375`, `opacity: 0.95 -> 0.88 -> 0`) so the flash stays above `88%` luminance for exactly 2 frames and cuts cleanly to the full-contrast lockup on frame 3.
18. **Horizontally Centered `ARGON` with Off-Center `O` (`x=1220`) Zoom-Through-Letter**:
    - If `O` is placed at `x = 960` so the zoom is centered from frame 1, the word `ARGON` looks lopsided (`ARG` takes `900px` on the left while `N` takes `320px` on the right).
    - **Fix**: Center the full word `ARGON` horizontally across `1920px` during the hold (`x = 195..1725px`, `79.7%` width, which places the `O` counter hole at `(1220, 540)`), set `svgOrigin: "1220 540"` on `#s2b-portal-group`, and animate `{ x: -260, scale: 26 }` during the zoom (`6.65–7.50s`) while simultaneously animating `#scene3`'s `clipPath` from `ellipse(48px 94px at 1220px 540px)` to `ellipse(2200px 2200px at 960px 540px)` with the exact same `CustomEase`.
19. **Zero-Frozen-Frame Guarantee Across All 1800 Frames**:
    - Fast `0.35s` entrance tweens (`expo.out`) settle to 99.9% completion within `0.3s`, which leaves the remaining `0.6–1.5s` of a hold completely static unless continuous motion is layered underneath.
    - **Fix**: Attach a full-shot-duration linear camera push-in (`scale: 0.95 -> 1.06`, `ease: "none"`) to every `.shot-layer` AND a continuous `ease: "none"` rotation/drift tween to at least one prominent graphic layer in every shot (aperture rings, starbursts, orbital paths, pastel light blobs on light cards, and `#bg-canvas` aurora orbs on dark cards).
20. **SVG `objectBoundingBox` Gradient Disappears on Perfectly Horizontal/Vertical `<path>`**:
    - Per the SVG specification, a `<path d="M 20 12 L 600 12">` with `y1 == y2` has a bounding box height of `0`, which causes `stroke="url(#gradient)"` (with default `gradientUnits="objectBoundingBox"`) to fail to compute a bounding-box transform and render completely invisible.
    - **Fix**: Add a tiny `0.2px` vertical delta (`d="M 20 12 L 600 12.2"`) or set `gradientUnits="userSpaceOnUse"` so the bounding box is non-zero and the gradient stroke renders at full brightness.
21. **Eliminating Ghosted Mid-Fade Text Frames (100% Masked / Clip-Path / Scale-from-0 Reveals)**:
    - Animating `opacity: 0 -> 1` on hero headlines (`duration: 0.35s`) produces ~15 frames where the letters look half-transparent/ghosted (`1.04s`, `4.25s`, `18.77s`, `26.32s`).
    - **Fix**: Keep `opacity: 1` on all text from frame 1, wrap each line in `<div style="overflow:hidden; padding:12px 24px;">`, and animate `yPercent: 118 -> 0` (`expo.out`, `0.34–0.42s`, chars staggered `0.02s`), `clipPath: "inset(100% 0% 0% 0%)" -> "inset(0% 0% 0% 0%)"`, or `scale: 0 -> 1.0` (`back.out`). Initialize future elements with `visibility: "hidden"` until their exact entrance timestamp rather than `opacity: 0`.
22. **SVG `<tspan>` Kerning Collision Across Font-Family Changes Inside `text-anchor="middle"`**:
    - Combining `Google Sans Flex` (`letter-spacing="-6"`) and `Instrument Serif Italic` (`font-style="italic"`, whose italic `'A'` overhangs left of its origin) inside a single `<text text-anchor="middle"><tspan>Gemini 4</tspan><tspan dx="26">Argon</tspan></text>` causes Chromium/SVG text layout to collapse `dx` across the font switch so `'4'` touches `'A'`.
    - **Fix**: Use two separate `<text>` elements with explicit coordinates: `<text x="955" y="198" text-anchor="end">Gemini 4</text>` and `<text x="1020" y="198" text-anchor="start">Argon</text>`, guaranteeing a hard `65px` (`~0.32em`) word space and allowing the mask color split (`x="988"`) to sit cleanly inside the gap.
23. **Dynamic Center-of-Mass Vertical Tracking for Sequential Stack Builds (`24.375–26.25s`)**:
    - When building a 4-row vertical stack (`height: 816px`, `204px` per row), placing Row 1 at its final top position (`y = 234px`) leaves the bottom 70% of the frame empty on Beat 52.
    - **Fix**: Start the stack container `#s7b-stack` at `y: +306px` on Beat 52 (so Row 1 lands dead-center at `y = 540px`), then push `#s7b-stack` up by `-102px` (`half-row height`) on each subsequent beat (`y: 306 -> 204 -> 102 -> 0`, `expo.out`), keeping the visual center of mass of all visible rows at `y = 540px` at every moment.
24. **Deterministic Procedural Sound-Design Layer (`sfx.py` + `audio/sfx_cues.json`)**:
    - Synthesize phase-aligned stereo SFX stems deterministically in Python (`numpy` + `scipy.signal`, seeded with `np.random.default_rng(42018)`) via `python3 sfx.py --cues audio/sfx_cues.json --out audio/sfx_stem.wav`:
      - `whoosh`: chunked time-varying 2nd-order Butterworth bandpass filter (`220 Hz -> f_peak -> 260 Hz`) + tonal air layer + constant-power stereo pan trajectory (`pan_start -> pan_end`).
      - `impact`: exponential sub-bass sine pitch-drop (`55–60 Hz -> 28–32 Hz`, `0.45–0.88s` decay) + band-passed noise transient click (`350–4200 Hz`, `18ms` decay) with soft `tanh` saturation.
      - `riser`: accelerating exponential filter/pitch sweep (`150 Hz -> 1800 Hz` over `1.875–2.75s`) + dual harmonic sines leading into the `3.75s` and `26.25s` drops.
      - `tick`: `12ms` band-passed mechanical/digital transient pips synced to per-char decodes and stack-row landings.
      - `shimmer`: 6-partial Lydian/major-9th sine cluster + velvet-noise high-air stereo tail (`2.4–9.0 kHz`) on sparkle pops and specular sweeps.
    - Mix `audio/sfx_stem.wav` `~7.3 dB` under `audio/music_bed_only.wav` and master to `-14.1 LUFS` integrated / `-1.6 dBTP` true peak:
      `ffmpeg -y -i audio/music_bed_only.wav -i audio/sfx_stem.wav -filter_complex "[0:a]volume=0.88[bed];[1:a]volume=0.38[sfx];[bed][sfx]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-14.0:TP=-1.5:LRA=9.0" -ar 44100 -ac 2 audio/master_v5.wav && cp -f audio/master_v5.wav audio/music_30s.wav`
18. **GSAP `tl.set({ visibility: "visible" })` + CSS Child-Overrides-Parent `visibility` Gotcha**:
    - In CSS, `visibility: visible` on a child element overrides `visibility: hidden` on its parent container!
    - If a parent scene (`#scene5`) is set to `tl.set("#scene5", { visibility: "visible" }, tS5)` and on the next line a child sub-shot (`#s5-shotA`) without inline `style="visibility:hidden;"` is set to `tl.set("#s5-shotA", { visibility: "visible" }, tS5)`, GSAP evaluates `getComputedStyle(s5ShotA).visibility` at `tS5` (when `#scene5` is already `"visible"`) and records `startValue = "visible"` for `#s5-shotA`. When the timeline later seeks backward to `t < tS5`, `#scene5` reverts to `visibility: "hidden"`, while `#s5-shotA` is set to `style="visibility: visible;"`—making `#s5-shotA` visible during earlier scenes!
    - **Fix**: Put `style="visibility:hidden;"` on every non-initial `.shot-layer` in `index.html`, AND explicitly run `gsap.set([...allScenesAndShots], { autoAlpha: 0 })` and `gsap.set([...allMaskedText], { yPercent: 118, opacity: 1 })` at `t = 0` before building `tl`.
19. **Variable Font Internal Contour Seam (`'E'` in `Google Sans Flex`), SVG Filter-After-Mask Order & Smooth Multi-Stop Plasma Gradients**:
    - Variable fonts like `Google Sans Flex` build glyphs such as `'E'` from overlapping contours (the middle horizontal crossbar overlaps inside the vertical stem). Putting `fill="none" stroke="#F8FAFC" stroke-width="4"` on `<text font-family="Google Sans Flex">GEMINI</text>` strokes the internal overlap seam inside `'E'`, producing an unwanted white rectangle inside the stem.
    - **Fix**: Remove the duplicate stroked `<text>` element and instead apply `<filter id="cleanOuterRim">` (`feMorphology in="SourceAlpha" operator="dilate" radius="2.4"` flooded with `#F8FAFC` and composited *behind* `SourceGraphic` via `feMerge`) on an outer `<g filter="url(#cleanOuterRim)">` wrapping `<g mask="url(#s2-gemini-mask)">`. (**Critical SVG Spec Gotcha**: If `mask` and `filter` are placed on the *same* `<g>`, SVG evaluates `filter` *before* `mask`, which dilates the unmasked full-bleed `<rect>` and then clips off the dilated outer rim! Wrapping `<g mask="...">` inside an outer `<g filter="url(#cleanOuterRim)">` masks the solid text silhouette first and then dilates its outer contour with zero internal seams.)
    - For plasma fills inside `"GEMINI"`, `"4"`, and `"ARGON"`, discrete abutting `<rect>`s produce visible hard blocks/stripes. Use `<linearGradient gradientUnits="userSpaceOnUse">` with 6–7 stops spaced `16–20%` apart (`#s2GeminiSmooth`, `#s2FourSmooth`, `#s2ArgonSmooth`) animated smoothly across `x`, layered with `<filter id="plasmaNoiseFilter">` (`feTurbulence type="fractalNoise" baseFrequency="0.018 0.032" numOctaves="3"` with `mix-blend-mode: soft-light`).

## Subtle Background Architecture (`v9`) & Thoughtful Musical Sound-to-Motion Mapping (`window.__sfxCues` -> `sfx.py`)

### 1. Subtle Atmospheric Background Rules (`index.html` + `app.js`)
- **Base Canvas (`#bg-canvas`)**: Deep, near-monochrome charcoal-navy vertical gradient (`background: linear-gradient(180deg, #07080D 0%, #0B0E18 100%)`) with a soft `0.55` vignette (`box-shadow: inset 0 0 260px rgba(0,0,0,0.55)`).
- **Single Soft Radial Key Light (`#bg-key-light`)**: Replaces multi-orb saturated aurora blobs (`36–46%` alpha) with **one** `1760×1520px` soft radial key light (`rx="880" ry="760"`) at **`10–12%` alpha** (`stop-opacity="0.11"` at center -> `0.045` at 48% -> `0` at 100%).
- **Desaturated Section Tint Cross-Fades**: Each section's key-light hue is blended ~70% cool slate + ~30% section hue (`saturation <= 25%`, never pink + blue + violet together) and cross-faded smoothly over `0.50s` (`ease: "sine.inOut"`):
  - Cold Open (`0.00s`): `#6C728E` / `#5E647E` (cool slate-indigo)
  - Drop (`3.75s`): `#64748E` / `#586882` (slate-cobalt)
  - Thinks deeper (`7.50s`): `#6A708D` / `#5C627D` (deep slate-violet)
  - Codes faster (`11.25s`): `#627A8A` / `#566C7B` (slate-teal)
  - Sees everything Eye (`16.41s`): `#786C82` / `#685E72` (warm slate-plum)
  - Plans / Acts (`18.75s`): `#65758E` / `#596880` (slate-royal)
  - Availability & End Card (`22.50s`): `#68748C` / `#5A657C` (balanced slate-blue)
- **Calm Breathing Drift & Reverse Grid Parallax**: `#bg-key-light` drifts `<= 36px` (`x: -18 -> 18, y: -12 -> 12`) and `<= 2.4%` scale (`0.988 -> 1.012`), paired with a `3.8%` opacity hairline + micro-dot grid (`#bg-subtle-grid`) drifting slowly in reverse parallax (`x: 18 -> -18, y: 10 -> -10` over `30.0s`) and `5.5%` deterministic film grain (`#grain-svg`).
- **Inverted `#F8FAFC` Paper Cards (`#s5-shotA`, `#s6-shotC`)**: Single `8%` alpha near-neutral slate tint (`rgba(96,108,128,0.08)`) with `<= 22px` drift so the `#05060A` black type commands 100% of visual focus.

### 2. Thoughtful Musical Sound-to-Motion Mapping Table (`window.__sfxCues` -> `audio/sfx_cues.json` -> `audio/sfx_stem.wav`)
- **Musical Key**: Detected via `librosa.feature.chroma_cqt` on `audio/music_bed_only.wav` as **F minor / Ab major** (`Ab=0.652, Bb=0.611, G=0.596, F=0.585, C=0.573`). All pitched SFX are tuned to the **F minor pentatonic scale** (`F, Ab, Bb, C, Eb`: `F2=87.31, C3=130.81, F3=174.61, Ab3=207.65, Bb3=233.08, C4=261.63, Eb4=311.13, F4=349.23, Ab4=415.30, Bb4=466.16, C5=523.25, Eb5=622.25, F5=698.46, Ab5=830.61, C6=1046.50 Hz`).
- **Dynamic Hierarchy & Shared Stereo Reverb Bus**:
  - **ONLY 3 `impact` hits** in the entire 30s video (`3.750s`, `21.328s`, `28.125s`), each ducking the music bed by **`-3.2 dB` for `0.42s`** in `master_audio.py` so they punch through cleanly without limiter pumping.
  - **4 medium `accent` hits** on section downbeats (`7.500s`, `11.250s`, `15.000s`, `18.750s`, high-passed `> 95 Hz`).
  - **Shared `0.78s` Stereo Velvet-Noise Reverb Bus** (`fftconvolve` in `sfx.py`) glues all **60 cues across 15 families** into one acoustic room.

| Cue Time (s) | Beat | Family | Pitch / Key Note | Pan | Gain | Visual Animation Paired in `app.js` |
|---:|---:|---|---|---|---:|---|
| `0.0000` | `0.00` | `pluck` | `261.63 Hz (C4)` | `0.00` | `0.40` | `#s1-core-spark` Frame 1 ignition scale pop (`back.out(2.0)`) |
| `0.0200` | `0.04` | `zip` | `C5 -> F6` | `-0.18->+0.18` | `0.30` | `.s1-ray` + `#s1-ring1` cold-open `DrawSVG` ignition strokes |
| `0.9375` | `2.00` | `tickroll` | `261.63 Hz (C4)` | `-0.35->+0.35` | `0.30` | `"Something new"` 12-char masked slide-up (`stagger: 0.020s`, `>2 kHz`) |
| `0.9375` | `2.00` | `swell` | `174.61 Hz (F3)` | `0.00` | `0.34` | `"Something new"` variable-font weight swell (`wght 300 -> 900`) |
| `0.9375` | `2.00` | `pluck` | `311.13 Hz (Eb4)` | `-0.20` | `0.32` | `.s1b-sp` sparkles scale pop (`back.out(2.5)`) |
| `1.2891` | `2.75` | `tickroll` | `311.13 Hz (Eb4)` | `-0.25->+0.25` | `0.28` | `"is here."` 7-char masked italic slide-up (`stagger: 0.024s`) |
| `1.8750` | `4.00` | `tickroll` | `349.23 Hz (F4)` | `-0.30->+0.30` | `0.28` | `"ELEMENT 18 / NOBLE GAS"` masked 2-line slide-up |
| `1.8750` | `4.00` | `zip` | `Ab4 -> C6` | `-0.03->+0.33` | `0.28` | `#s1c-arc1` / `#s1c-arc2` orbital `DrawSVG` arcs |
| `2.8125` | `6.00` | `pluck` | `349.23 Hz (F4)` | `0.00` | `0.44` | `#s1-ar-tile` Periodic Table tile `"18 / Ar"` scale pop (`back.out(1.9)`) |
| `3.2578` | `6.95` | `glide` | `C4 -> F5` | `0.00` | `0.44` | `Ar` tile `MorphSVG` into 4-point sparkle iris & window expansion |
| `3.7500` | `8.00` | `impact` | `87.31 Hz (F2->F1)` | `0.00` | `0.96` | **BIG IMPACT #1 (Drop)**: `"GEMINI 4"` downbeat slam + shake + RGB split (`-3.2 dB` duck) |
| `3.7500` | `8.00` | `shockwave` | `174.61 Hz (F3)` | `0.00` | `0.44` | `#s2a-shockwave` expanding vector ring (`scale: 1.45 -> 4.2`) |
| `4.0000` | `8.53` | `shimmer` | `698.46 Hz (F5)` | `-0.45->+0.45` | `0.28` | `#s2-gem-spec` specular light bar sweeping L->R across `"GEMINI"` |
| `4.2188` | `9.00` | `tickroll` | `349.23 Hz (F4)` | `-0.35->+0.35` | `0.34` | `"ARGON"` (`#s2a-argon-svg`) Beat 9 clip-path wipe slam |
| `4.2588` | `9.09` | `zip` | `C5 -> F6` | `-0.18->+0.18` | `0.30` | `#s2a-wing-l` / `#s2a-wing-r` `DrawSVG` wing lines |
| `4.4388` | `9.47` | `shimmer` | `830.61 Hz (Ab5)` | `-0.45->+0.45` | `0.28` | `#s2-argon-spec` specular light bar sweeping L->R across `"ARGON"` |
| `6.5625` | `14.00` | `suck` | `F3 -> C5` | `+0.28->0.00` | `0.48` | **Zoom-Through-`O`**: reverse vacuum swell (`6.56–7.12s`) + portal exit burst (`7.12–7.20s`) |
| `6.6425` | `14.17` | `pluck` | `415.30 Hz (Ab4)` | `+0.15` | `0.32` | `.s3-node` neural cluster pop open (`back.out(2.0)`) |
| `7.1200` | `15.19` | `tickroll` | `349.23 Hz (F4)` | `-0.30->+0.30` | `0.32` | `"Thinks"` 6-char masked slide-up (`stagger: 0.018s`) |
| `7.1200` | `15.19` | `swell` | `207.65 Hz (Ab3)` | `0.00` | `0.36` | `"Thinks"` variable-font weight + width + slant swell (`wght 400->900`) |
| `7.5000` | `16.00` | `accent` | `130.81 Hz (C3)` | `0.00` | `0.44` | **Scene 3 Downbeat Accent** (Beat 16 canopy lock) |
| `7.5000` | `16.00` | `zip` | `F4 -> Ab5` | `-0.33->+0.03` | `0.30` | `.s3-trunk` / `.s3-branch` thought-tree `DrawSVG` strokes |
| `9.3750` | `20.00` | `doppler` | `C5 -> C3` | `stereo wide` | `0.48` | **Vertical Camera Dive**: `power4.inOut` downward plunge through 3-layer thought-tree |
| `9.5550` | `20.38` | `tickroll` | `415.30 Hz (Ab4)` | `-0.30->+0.30` | `0.32` | `"deeper."` 7-char masked italic slide-up (`stagger: 0.022s`) |
| `10.9688` | `23.40` | `swish` | `349.23 Hz (F4)` | `+0.45->-0.45` | `0.42` | **Transition 3->4**: 4-band staggered horizontal Gemini color wipe (`stagger: 0.032s`) |
| `11.2500` | `24.00` | `accent` | `174.61 Hz (F3)` | `0.00` | `0.46` | **Scene 4 Downbeat Accent** (Beat 24) |
| `11.2500` | `24.00` | `pluck` | `466.16 Hz (Bb4)` | `0.00` | `0.38` | `< / >` code brackets + `"CODES"` snap open (`back.out(2.0)`) |
| `12.6562` | `27.00` | `glide` | `F4 -> C5` | `-0.22->-0.05` | `0.42` | `< / >` brackets `MorphSVG` into `»` chevrons as `"CODES"` slides left |
| `12.7362` | `27.17` | `tickroll` | `523.25 Hz (C5)` | `+0.05->+0.45` | `0.34` | `"FASTER_"` `ScrambleTextPlugin` 8-tick decode roll |
| `15.0000` | `32.00` | `accent` | `207.65 Hz (Ab3)` | `0.00` | `0.44` | **Scene 5A Downbeat Accent** (Beat 32 inverted paper card) |
| `15.0000` | `32.00` | `tickroll` | `415.30 Hz (Ab4)` | `-0.25->+0.25` | `0.30` | `"Sees"` 4-char masked slide-up (`stagger: 0.024s`) |
| `16.4062` | `35.00` | `pluck` | `523.25 Hz (C5)` | `0.00` | `0.42` | `#s5b-iris-outer` / `#s5b-pupil` giant eye iris pop open |
| `16.4062` | `35.00` | `zip` | `Ab4 -> C6` | `-0.18->+0.18` | `0.30` | `#s5b-lid-upper` / `#s5b-lid-lower` eyelid `DrawSVG` |
| `16.4662` | `35.13` | `tickroll` | `466.16 Hz (Bb4)` | `-0.38->+0.38` | `0.30` | `"Sees everything."` 10-char masked slide-up (`stagger: 0.018s`) |
| `18.4219` | `39.30` | `shutter` | `174.61 Hz (F3)` | `0.00` | `0.46` | **Giant Eye Blinks Shut**: soft eyelid sweep + damped tonal thump & latch click |
| `18.7500` | `40.00` | `accent` | `174.61 Hz (F3)` | `0.00` | `0.46` | **Scene 6A Downbeat Accent** (Beat 40) |
| `18.7500` | `40.00` | `tickroll` | `349.23 Hz (F4)` | `-0.30->+0.30` | `0.32` | `"PLANS."` 6-char masked slide-up (`stagger: 0.022s`) |
| `18.7500` | `40.00` | `zip` | `Bb4 -> D6` | `-0.36->0.00` | `0.30` | `.s6a-path` strategic blueprint Bezier `DrawSVG` |
| `19.9453` | `42.55` | `swish` | `415.30 Hz (Ab4)` | `-0.42->+0.42` | `0.40` | **Transition 6A->6B**: 3-band diagonal color wipe (`stagger: 0.025s`) |
| `20.1562` | `43.00` | `tickroll` | `415.30 Hz (Ab4)` | `-0.28->+0.28` | `0.32` | `"ACTS."` 5-char masked slide-up (`stagger: 0.020s`) |
| `20.1562` | `43.00` | `pluck` | `622.25 Hz (Eb5)` | `0.00` | `0.38` | `#s6b-chev-l1/r1` twin kinetic chevrons pop open |
| `21.3281` | `45.50` | `impact` | `87.31 Hz (F2->F1)` | `0.00` | `0.90` | **BIG IMPACT #2 (`SHIPS.`)**: inverted white slam + shake + RGB split (`-3.0 dB` duck) |
| `21.3281` | `45.50` | `tickroll` | `523.25 Hz (C5)` | `-0.30->+0.30` | `0.34` | `"SHIPS."` high-velocity 6-char masked slide-up (`stagger: 0.012s`) |
| `22.2422` | `47.45` | `swish` | `466.16 Hz (Bb4)` | `-0.35->+0.35` | `0.42` | **Transition 6C->7**: 4-band vertical color curtain (`stagger: 0.030s`) |
| `22.5300` | `48.06` | `tickroll` | `415.30 Hz (Ab4)` | `-0.35->+0.35` | `0.30` | `"Generally available."` masked 2-line slide-up |
| `22.5400` | `48.09` | `zip` | `C5 -> F6` | `0.00->+0.36` | `0.30` | `.s7a-ray` radial burst `DrawSVG` strokes |
| `24.1641` | `51.55` | `swish` | `523.25 Hz (C5)` | `-0.15->+0.15` | `0.28` | `"Generally available."` masked slide-up exit |
| `24.3750` | `52.00` | `thud` | `174.61 Hz (F3)` | `-0.18` | `0.46` | **Row 1 (`GEMINI API`)**: bar wipe zip + pitched F3 lock thud |
| `24.6094` | `52.50` | `thud` | `207.65 Hz (Ab3)` | `-0.06` | `0.46` | **Row 2 (`AI STUDIO`)**: bar wipe zip + pitched Ab3 lock thud |
| `24.8438` | `53.00` | `thud` | `261.63 Hz (C4)` | `+0.06` | `0.48` | **Row 3 (`VERTEX AI`)**: bar wipe zip + pitched C4 lock thud |
| `25.0781` | `53.50` | `thud` | `349.23 Hz (F4)` | `+0.18` | `0.50` | **Row 4 (`GEMINI APP`)**: bar wipe zip + pitched F4 lock thud |
| `26.1300` | `55.74` | `swish` | `523.25 Hz (C5)` | `-0.25->+0.25` | `0.32` | 4-row availability stack `scaleY: 1 -> 0` wipe-shut into Scene 8 |
| `26.2500` | `56.00` | `pluck` | `698.46 Hz (F5)` | `0.00` | `0.40` | `#s8-sparkle` hero crest scale pop (`back.out(1.7)`) |
| `26.2500` | `56.00` | `sting` | `174.61 Hz (Fm add9)` | `0.00` | `0.42` | **End Card Arrival Sting**: resolved F minor add9 chord (`F3-C4-F4-G4-Ab4-C5-F5`) |
| `26.3500` | `56.21` | `shimmer` | `698.46 Hz (F5)` | `-0.45->+0.45` | `0.28` | `#s8-specular-bar` first sweep across `"Gemini 4 Argon"` |
| `26.4100` | `56.34` | `zip` | `C5 -> C6` | `-0.18->+0.18` | `0.34` | `#s8-underline` `"Available now"` gradient underline `DrawSVG` |
| `28.1250` | `60.00` | `impact` | `87.31 Hz (F2->F1)` | `0.00` | `0.94` | **BIG IMPACT #3 (Beat 60 Final Hit)**: lockup scale punch + shake + RGB split (`-3.2 dB` duck) |
| `28.1250` | `60.00` | `shockwave` | `207.65 Hz (Ab3)` | `0.00` | `0.42` | `#s8-final-shockwave` expanding cyan vector ring (`scale: 1.45 -> 4.0`) |
| `28.1250` | `60.00` | `shimmer` | `1046.50 Hz (C6)` | `-0.45->+0.45` | `0.32` | `#s8-specular-bar` final sweep across `"Gemini 4 Argon"` |
| `28.1250` | `60.00` | `sting` | `174.61 Hz (Fm add9)` | `0.00` | `0.48` | **Final Resolution Chord Tail**: F minor add9 chord decaying cleanly to zero by `29.75s` |
