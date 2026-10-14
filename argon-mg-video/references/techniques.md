# Technique recipes (copy-paste patterns)

All snippets assume the template's `tl`, `b(n)`, `F` (1 frame) and helpers
from `template/app.js`. The full production versions live in
`examples/gemini-4-argon/app.js` (search for the ids mentioned).

## Beat grid and timing

```js
const BEAT = 60 / 128;                 // 0.46875 s
const b = (n) => +(n * BEAT).toFixed(5);
// 16 bars = 64 beats = 30.000 s. Drop on b(8) = 3.75 s.
// Sub-shots: change shot on every downbeat (b(0), b(4), b(8) ...), 2-4 beat sub-shots inside.
```

Place every event with `b()`, never hand-typed seconds. Fractional beats are
fine: `b(7.25)`, or half-beats `b(52.5)` for fast stack builds.

## Shot skeleton (cut + base layer + entrance + exit)

```js
const t0 = b(16), t1 = b(20);
cut(t0, ["#scene2", "#s2-shotB"], ["#scene3", "#s3-shotA"]); // hide parent AND child shots
baseLayer("#s3-shotA", t0, t1);                // continuous push, no frozen frames
drift("#s3-rings", t0, t1, 40);                // secondary motion
const chars = maskReveal("#s3-word", t0, { swell: true });  // masked slide + wght swell
maskExit(chars, t1 - 0.24);                    // masked exit, not a fade
```

HTML for a masked line (the mask must be taller than the glyphs, and italic
serifs need extra bottom padding):

```html
<div class="center-block">
  <div class="line-mask"><div id="s3-word" class="font-flex hero-xl">Thinks</div></div>
  <div class="line-mask serif-mask"><div id="s3-accent" class="font-serif accent-xl">deeper.</div></div>
</div>
```

## Variable-font animation (Google Sans Flex: wght 100–900, wdth, slnt)

```js
tl.fromTo(chars, { fontVariationSettings: "'wght' 300, 'wdth' 85" },
  { fontVariationSettings: "'wght' 900, 'wdth' 100", duration: 0.4, stagger: 0.02, ease: "expo.out", immediateRender: false }, t);
// Kick-synced weight pulse on a held word:
for (let i = 9; i < 12; i++) tl.fromTo("#argon", { fontVariationSettings: "'wght' 900" },
  { fontVariationSettings: "'wght' 700", duration: BEAT * 0.9, ease: "power2.out", immediateRender: false }, b(i));
```

## Gradient-filled hero text with rim (no seams, smooth gradient)

Mask = white text, fill = one smooth `userSpaceOnUse` gradient, rim = outer
`feMorphology` filter on a wrapping `<g>` (see `template/index.html`, `#s2-hero-mask`).
Flow the gradient by tweening `attr:{x1,x2}`. Make the hero character (e.g. "4") the
hottest element with its own brighter gradient + double bloom.

## Sparkle iris into the drop (true window)

```js
cut(b(6), null, "#scene2");               // scene2 has style="clip-path:url(#iris-clip)" and the hero already placed
tl.fromTo("#iris-clip-path", { scale: 0.02, svgOrigin: "960 540" },
  { scale: 9, duration: b(8) - b(6) - 0.06, ease: "power2.in", immediateRender: false }, b(6));
tl.set("#scene2", { clipPath: "none" }, b(8));
cut(b(8), "#scene1", null);
tl.fromTo("#s2-shotA", { scale: 1.12 }, { scale: 1, duration: 0.3, ease: "expo.out", immediateRender: false }, b(8));
addImpactHit(b(8), 1);
```

An optional hollow stroked sparkle rim (`fill="none" stroke="#00E5FF"`) can
scale in sync on top so the window edge glows. Never use a filled shape that
covers the frame.

## Zoom-through-letter (O counter portal)

1. Build the word in SVG. The O is a compound `<path fill-rule="evenodd">`
   (outer contour + counter) whose counter is centered at the zoom origin
   (e.g. 1220,540 when the whole word is centered).
2. During the hold, put **imagery** (glowing nodes, light) inside the
   counter, never text from the next scene.
3. Zoom:

```js
tl.to("#portal-group", { scale: 26, x: -260, svgOrigin: "1220 540", duration: 0.6, ease: "expo.in" }, tZoom);
tl.fromTo("#scene3", { clipPath: "ellipse(48px 94px at 1220px 540px)" },
  { clipPath: "ellipse(2200px 2200px at 960px 540px)", duration: 0.6, ease: "expo.in", immediateRender: false }, tZoom);
blurDuring("#portal-group", "blurZoom", tZoom + 0.35, tZoom + 0.6);
// reveal the incoming headline only after the counter is wider than it
```

## Stacked color-band wipe

The HTML has 3–4 `.band-strip` divs in brand colors inside a hidden
`.band-wipe-group`. Then:

```js
bandWipe("#wipe-bands-a", ".ba-strip", b(24) - 0.25, (tCover) => cut(tCover, "#scene3", "#scene4"));
```

Variants: horizontal bands (`scaleX`, `transformOrigin "0% 50%"`), diagonal
(`skewX(-18deg)` strips), vertical curtain. Use a different variant each time.

## Eye blink transition

An eye outline built as two lid paths (upper and lower). Close them to a line
with `MorphSVG` or `scaleY: 0.02` over 0.2 s (`power3.in`) on the last beat
of the shot, cut on the closed frame, and pair it with a whoosh. A thin
horizontal line remains on the closed frame.

## Camera dive (z-depth)

Wrap 3 layers (far/mid/near) in a shot. Tween `y` by different amounts
(near 1.0×, mid 0.6×, far 0.3×), toggle `blurV` only during the fastest
~15 frames, and land the next word with a gravity overshoot (`back.out(1.6)`).

## Impact hit (drop, slam, final hit)

`addImpactHit(t, seed)` gives a 7-frame decaying shake on `#stage`, a 3-frame
RGB split on `#camera`, and a shockwave that starts at the outer perimeter
(scale 1.45→4.2) and stays **hidden until t**. Add a hero scale punch
(1.0→1.04→1.0, 0.35 s) and an impact SFX at the same time.

## Center-of-mass stack build (rows arriving per beat)

```js
const rowH = 224, rows = ["#r1", "#r2", "#r3", "#r4"];
rows.forEach((r, i) => {
  const t = b(52 + i * 0.5);
  tl.to("#stack", { y: (rows.length - 1 - i) * rowH / 2 - 0, duration: 0.3, ease: "expo.out" }, t); // keep visual center at 540
  tl.fromTo(r, { scale: 1.16 }, { scale: 1, duration: 0.3, ease: "expo.out", immediateRender: false }, t);
  tl.set(r, { autoAlpha: 1 }, t);
});
// start #stack at y = 1.5 * rowH so row 1 lands centered; hold all rows >= 0.6 s before the exit wipe
```

## Specular sweep, grain, vignette

- `specularSweep("#hero-spec", t)`: a skewed white gradient bar with
  `mix-blend-mode:overlay`, clipped to the hero (put it inside the hero's
  masked group for a through-the-letters sweep).
- Grain: an `feTurbulence` rect at `opacity ~0.11`, `mix-blend-mode:overlay`,
  shifted per frame in the timeline `onUpdate` (deterministic).
- Vignette: `box-shadow: inset 0 0 210px rgba(0,0,0,.78)` on `#bg-canvas`
  (never an overlay above text).

## Inverted shots

For 1–2 big hits, use a full-bleed `#F8FAFC` (or gradient) shot background
with `#05060A` type and pastel drifting blobs. Cut into and out of it hard,
on the beat.

## Things that looked bad (don't)

- Rings that appear but mask nothing. Thin hairline polygons with no meaning.
- Lines crossing in front of hero type.
- Opacity fades on text, gray flash frames, flat color frames.
- The same layout or text formula three times in a row.
- Production metadata on screen (BPM, timecode, "ELEMENT // MODEL 04").
