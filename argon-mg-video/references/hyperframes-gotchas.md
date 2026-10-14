# HyperFrames + GSAP technical gotchas

Each item below cost at least one failed render or a visible defect during
the Gemini 4 Argon build (hyperframes@0.8.91, GSAP 3.14.2, headless Chrome).

## Tooling

1. **Always** run HyperFrames as
   `CI=1 pnpm dlx hyperframes@0.8.91 <cmd> </dev/null`.
   Without `CI=1` and closed stdin, pnpm waits on an invisible prompt
   forever. Same for background ffmpeg: use `-nostdin` or `</dev/null`.
2. Render: `render --fps 60 --quality high --workers 4 -o out/vN_silent.mp4 .`
   (~4–8 min for 30 s at 1080p60 on 8 cores). Then mux audio with
   `ffmpeg -i out/vN_silent.mp4 -i audio/master.wav -c:v copy -c:a aac -b:a 192k -shortest -t 30.0 out/vN.mp4`.
   `scripts/render.sh` does check → render → mux → ffprobe → contact sheets.
3. `music.py --out x.wav` actually writes **`x.mp3`** (~3 min,
   44.1 kHz) and prints the real path. Convert it to WAV before analysis.
4. Vendor GSAP locally (no CDN at render time):
   `https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/{gsap,SplitText,DrawSVGPlugin,MorphSVGPlugin,MotionPathPlugin,CustomEase,ScrambleTextPlugin}.min.js`.
   All plugins are free since 3.13. Register all of them once.
   Never leave backup copies such as `index.v9.html` in the project root:
   `hyperframes check` fails with `multiple_root_compositions`. Keep backups
   in a `backup/` subfolder.
5. **Fonts:** every `font-family` needs an `@font-face` pointing at a file in
   the project (`font_family_without_font_face` otherwise). System fonts in
   `~/.local/share/fonts` are `0444`, so `chmod u+w` after copying.
   - **2 MB inline limit:** `GoogleSansFlex[...].ttf` is 4.5 MB and won't be
     inlined. Pin the unused axes and subset it:
     `fonttools varLib.instancer GoogleSansFlex[...].ttf GRAD=0 ROND=0 opsz=72 -o tmp.ttf && pyftsubset tmp.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2190-21FF,U+25A0-27BF" --output-file=fonts/GoogleSansFlex.ttf`
     This keeps `wght`/`wdth`/`slnt` animatable. `setup.sh` does it once and
     caches the result.
   - OFL fonts come from `https://github.com/google/fonts/raw/main/ofl/<family>/<File>.ttf`
     (instrumentserif, bigshouldersdisplay, anton, jetbrainsmono,
     spacemono).

## Composition structure

6. `hyperframes check` statically looks for
   `window.__timelines["main"] = tl` **inside `index.html`**. If the
   assignment lives only in external `app.js` you get
   `missing_timeline_registry`. Create and register `tl` in an inline
   `<script>`, then call `window.buildTimeline(tl)` from `app.js`.
7. Timed elements (`class="clip"`, unique `id`, `data-start`,
   `data-duration`) must be direct children of `#root`. For one 30 s
   master composition, use `#root > #stage.clip[0..30] > #camera > .scene-layer > .shot-layer`
   and orchestrate visibility with GSAP:
   - `#stage` owns impact shakes and the final fade
   - `#camera` owns kick micro-punches and the chromatic-split filter
8. **Determinism:** HyperFrames seeks the paused timeline frame by frame.
   CSS `@keyframes`, `requestAnimationFrame`, `setInterval` and
   `Math.random()` at render time all break. Drive particles, grain,
   variable-font axes and canvases from timeline tweens
   (`tl.to(state,{t:30,duration:30,ease:"none",onUpdate:()=>draw(tl.time())},0)`)
   with seeded PRNGs.

## Visibility (the #1 source of "ghost" bugs)

9. In CSS, `visibility: visible` on a child **overrides** `hidden` on its
   parent. GSAP also records `startValue="visible"` for a child set at the
   same time its parent becomes visible, so seeking backwards leaves it
   showing in earlier scenes. Rules:
   - put `style="visibility:hidden"` on every non-initial `.scene-layer`,
     `.shot-layer`, and every impact/flash/shockwave element in the HTML
   - `gsap.set([...all non-initial], {autoAlpha:0})` at t=0 before adding
     tweens
   - toggle with `autoAlpha`, and turn off parent **and** children at
     handoffs
10. **Pre-positioned impact elements leak.** A shockwave ring created at its
    small start scale sat visibly over the end-card "4" for 1.8 s before its
    hit. Keep every burst/flash/shockwave hidden until its hit frame, and
    check a frame 0.5 s **before** every hit.
11. `tl.fromTo()` defaults to `immediateRender:true`. Several fromTo calls on
    one shared `#flash-overlay` left it stuck at the last call's start
    opacity from t=0 (gray veil over the opening). Pass
    `immediateRender:false` in helpers and `tl.set(el,{opacity:0},0)`.
12. Delayed `tl.from(el,{x:…})` without `scale:0`/hidden leaves the
    element visibly offset from t=0 until its beat.

## Layout and checker

13. A full-screen overlay `div` (vignette, gradient) **above** text makes
    `hyperframes check` flag every text element as `text_occluded`. Draw the
    vignette on the background canvas, or mark transient overlays with
    `data-layout-allow-occlusion="true"`.
14. Mid-fade text frames can fail the 3:1 contrast check. That's another
    reason to use masked reveals, not opacity fades.
15. GSAP replaces CSS `transform: translate(-50%,-50%)` when you tween
    `scale`. On centered elements always pass `xPercent:-50, yPercent:-50`.
16. Instrument Serif Italic descenders reach ~22% below the baseline. Make
    `overflow:hidden` line masks ≥ 1.25× the font size tall, or the
    descenders clip (`text_box_overflow`).

## SVG

17. `MotionPathPlugin` with a `<circle>`/`<ellipse>` path throws during the
    initial seek. That aborts the HyperFrames bootstrap
    (`Cannot access 'sx' before initialization`, and `__renderReady` never
    set). Use a `<path d="M… A…">` or `MotionPathPlugin.convertToPath()`.
18. An SVG `<g transform="translate(...)">` animated with `scale`/`rotation`
    drifts. Wrap it in a static translated parent, center the animated
    group at (0,0), and use `svgOrigin:"0 0"`.
19. A perfectly horizontal or vertical `<path>` has a zero-height bbox, so
    `stroke="url(#grad)"` with `objectBoundingBox` units renders
    **invisible**. Use `gradientUnits="userSpaceOnUse"` (or a 0.2 px delta).
20. `mask` and `filter` on the **same** `<g>`: the filter is applied before
    the mask and clips the outer rim. Put the mask on an inner `<g>` and the
    rim/glow filter on an outer `<g>`.
21. Stroking variable-font `<text>` strokes its internal overlapping
    contours (a rectangle appears inside "E"). For outlines, use an
    `feMorphology operator="dilate"` rim filter on `SourceAlpha` merged
    behind the glyphs.
22. `<tspan dx>` spacing collapses across font-family switches (italic "A"
    overhang): "4Argon" collided. Use two `<text>` elements with explicit
    `text-anchor="end"` / `"start"` x positions and a ~0.3 em gap.
23. Gradients built from abutting `<rect>` color blocks band hard. Use one
    `<linearGradient gradientUnits="userSpaceOnUse">` with 5–7 stops 15–22%
    apart spanning the actual glyph extent, and animate `x1/x2` or
    `gradientTransform`.

## Transitions

24. A transparent incoming `.scene-layer` clip-wiped over an unclipped
    outgoing layer double-exposes text. Animate the complementary clip on
    the outgoing layer, or cut it at the peak of an opaque transition
    element.
25. **Iris into a drop:** a filled shape that overshoots the frame produces
    a flat color frame. Use a hollow stroked rim + an identical
    `<clipPath>` on the incoming scene with the hero already in place. Open
    it with `power2.in` (`expo.in` stays tiny for 70% of its duration) and
    finish 40–60 ms **before** the downbeat.
26. **Zoom-through-letter:** don't scale HTML glyphs 26× around an
    estimated center (drift plus a white blowout). Build the word in SVG
    with the O as a compound `fill-rule="evenodd"` path whose counter is
    centered on the zoom origin. Scale with `svgOrigin` at the counter, and
    expand the incoming scene's `clip-path: ellipse(...)` from the counter
    size with the **same** ease. Keep incoming text hidden until the
    counter is wider than the word, and put imagery (not text fragments)
    inside the counter during the hold.
27. Motion blur: toggle `attr:{filter:"url(#blurV)"}` (or `#blurZoom`) via
    `tl.set` only during the ~15–20 peak-velocity frames, then
    `filter:"none"` on settle. Holds stay sharp and the raster cost stays
    low.
28. Drop flashes: a white overlay fading 0.7→0 over 20 frames makes ~15
    muddy gray frames. Use a 2-frame ≥ 88%-luminance burst, then hard
    reveal.
