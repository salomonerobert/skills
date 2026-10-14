/* global gsap, CustomEase, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, ScrambleTextPlugin */

(function () {
  "use strict";

  gsap.registerPlugin(
    CustomEase,
    SplitText,
    DrawSVGPlugin,
    MorphSVGPlugin,
    MotionPathPlugin,
    ScrambleTextPlugin
  );

  // Beat grid constants: 128.000 BPM -> 1 beat = 0.46875s, 1 bar = 1.875s, 64 beats = 30.0s
  const BEAT = 0.46875;
  const b = (n) => +(n * BEAT).toFixed(5);

  // SplitText instances for per-char kinetic typography
  const splitS1Line1 = new SplitText("#s1-text-line1", { type: "chars" });
  const splitS1Line2 = new SplitText("#s1-text-line2", { type: "chars" });
  const splitS3Thinks = new SplitText("#s3-word-thinks", { type: "chars" });
  const splitS3Deeper = new SplitText("#s3-word-deeper", { type: "chars" });
  const splitS5Sees = new SplitText("#s5-word-sees", { type: "chars" });
  const splitS5Everything = new SplitText("#s5b-inline-everything", { type: "chars" });
  const splitS6Plans = new SplitText("#s6-word-plans", { type: "chars" });
  const splitS6Acts = new SplitText("#s6-word-acts", { type: "chars" });
  const splitS6Ships = new SplitText("#s6-word-ships", { type: "chars" });

  // Explicitly initialize all scenes, sub-shots, and masked text states at t=0
  // using autoAlpha:0 (opacity:0 + visibility:hidden) on inactive containers so no child can ever bleed through!
  gsap.set(
    [
      "#scene2", "#scene3", "#scene4", "#scene5", "#scene6", "#scene7", "#scene8",
      "#s1-shotB", "#s1-shotC", "#s1-shotD", "#s1-iris-sparkle",
      "#s2-shotA", "#s2a-argon-svg", "#s2-shotB",
      "#s2a-shockwave", "#s2a-burst-group", "#s2-gem-spec", "#s2-argon-spec",
      "#s3-portal-cluster",
      "#s4-faster-wrap",
      "#s5-shotA", "#s5-shotB",
      "#s6-shotA", "#s6-shotB", "#s6-shotC",
      "#s7-shotA", "#s7-shotB",
      "#s7b-content1", "#s7b-content2", "#s7b-content3", "#s7b-content4",
      "#s8-final-shockwave", "#s8-specular-bar",
      "#wipe-bands-3to4", "#wipe-bands-6a-6b", "#wipe-bands-6to7",
      "#flash-overlay"
    ],
    { autoAlpha: 0 }
  );
  gsap.set(["#s2a-shockwave", "#s8-final-shockwave"], { scale: 0, svgOrigin: "960 540" });
  gsap.set(
    [
      splitS1Line1.chars, splitS1Line2.chars,
      "#s1c-line1", "#s1c-line2",
      splitS3Thinks.chars, "#s3-context-thinks", splitS3Deeper.chars,
      splitS5Sees.chars, "#s5b-inline-sees", splitS5Everything.chars,
      splitS6Plans.chars, splitS6Acts.chars, splitS6Ships.chars,
      "#s7a-line1", "#s7a-line2",
      "#s8-title-svg", "#s8-cta-text", "#s8-google"
    ],
    { yPercent: 118, opacity: 1 }
  );

  const tl = gsap.timeline({ paused: true });

  // ============================================================================
  // SUBTLE ATMOSPHERIC BACKGROUND (DEEP CHARCOAL-NAVY + SINGLE SOFT KEY LIGHT + 3.8% GRID)
  // ============================================================================
  // Slow breathing drift on the single soft key light (<= 36px drift, <= 2.4% scale change)
  tl.fromTo(
    "#bg-key-light",
    { x: -18, y: -12, scale: 0.988, svgOrigin: "960 540" },
    { x: 18, y: 12, scale: 1.012, duration: 15, ease: "sine.inOut", yoyo: true, repeat: 1 },
    0
  );
  // Subtle reverse-parallax drift on the 3.8% hairline + dot grid (opposite to camera push-in)
  tl.fromTo(
    "#bg-subtle-grid",
    { x: 18, y: 10 },
    { x: -18, y: -10, duration: 30, ease: "none" },
    0
  );

  // Smooth 0.50s cross-fades across desaturated slate tints (~70% slate + ~30% section hue, saturation <= 25%)
  // Cold Open (0 - 3.75s): Cool Slate-Indigo
  tl.set("#bg-key-stop0", { attr: { "stop-color": "#6C728E" } }, 0);
  tl.set("#bg-key-stop1", { attr: { "stop-color": "#5E647E" } }, 0);
  // Drop (3.75 - 7.50s): Slate-Cobalt
  tl.to("#bg-key-stop0", { attr: { "stop-color": "#64748E" }, duration: 0.50, ease: "sine.inOut" }, b(8));
  tl.to("#bg-key-stop1", { attr: { "stop-color": "#586882" }, duration: 0.50, ease: "sine.inOut" }, b(8));
  // Thinks deeper (7.50 - 11.25s): Deep Slate-Violet
  tl.to("#bg-key-stop0", { attr: { "stop-color": "#6A708D" }, duration: 0.50, ease: "sine.inOut" }, b(16));
  tl.to("#bg-key-stop1", { attr: { "stop-color": "#5C627D" }, duration: 0.50, ease: "sine.inOut" }, b(16));
  // Codes faster (11.25 - 15.00s): Slate-Teal
  tl.to("#bg-key-stop0", { attr: { "stop-color": "#627A8A" }, duration: 0.50, ease: "sine.inOut" }, b(24));
  tl.to("#bg-key-stop1", { attr: { "stop-color": "#566C7B" }, duration: 0.50, ease: "sine.inOut" }, b(24));
  // Sees everything Eye (16.40 - 18.75s): Warm Slate-Plum
  tl.to("#bg-key-stop0", { attr: { "stop-color": "#786C82" }, duration: 0.50, ease: "sine.inOut" }, b(35));
  tl.to("#bg-key-stop1", { attr: { "stop-color": "#685E72" }, duration: 0.50, ease: "sine.inOut" }, b(35));
  // Plans / Acts (18.75 - 22.50s): Slate-Royal
  tl.to("#bg-key-stop0", { attr: { "stop-color": "#65758E" }, duration: 0.50, ease: "sine.inOut" }, b(40));
  tl.to("#bg-key-stop1", { attr: { "stop-color": "#596880" }, duration: 0.50, ease: "sine.inOut" }, b(40));
  // Availability & End Card (22.50 - 30.00s): Balanced Slate-Blue
  tl.to("#bg-key-stop0", { attr: { "stop-color": "#68748C" }, duration: 0.50, ease: "sine.inOut" }, b(48));
  tl.to("#bg-key-stop1", { attr: { "stop-color": "#5A657C" }, duration: 0.50, ease: "sine.inOut" }, b(48));

  // Beat-locked kick micro-punch + continuous subtle camera drift so #camera never freezes
  for (let beatIdx = 0; beatIdx < 64; beatIdx++) {
    const tBeat = b(beatIdx);
    const isDrop = beatIdx === 8 || beatIdx === 9 || beatIdx === 16 || beatIdx === 24 || beatIdx === 32 || beatIdx === 40 || beatIdx === 48 || beatIdx === 56 || beatIdx === 60;
    const amp = isDrop ? 1.028 : (beatIdx >= 8 ? 1.012 : 1.008);
    tl.fromTo(
      "#camera",
      { scale: amp },
      { scale: 1.0, duration: BEAT * 0.96, ease: "power2.out", immediateRender: false, overwrite: "auto" },
      tBeat
    );
  }

  tl.set("#flash-overlay", { opacity: 0 }, 0);

  // Reusable deterministic impact helper for the three biggest hits:
  //   1. 7-frame seeded camera shake on #stage (decaying 14 -> 0 px + ±0.5° -> 0° rotation jitter)
  //   2. 3-frame chromatic split (±6px -> ±4px -> ±2px R/B offset via #rgbImpactSplit)
  //   3. 1-frame white/cyan rim flash on the hero glyph edges
  function addImpactHit(tHit, seed, rimHook) {
    const dt = 1 / 60;
    const angles = [0.65, 2.75, 4.45, 1.35, 3.85, 5.55, 2.15];
    for (let f = 0; f < 7; f++) {
      const decay = (7 - f) / 7;
      const amp = 14.0 * decay;
      const ang = angles[f] + seed * 1.17;
      const dx = +(Math.cos(ang) * amp).toFixed(2);
      const dy = +(Math.sin(ang) * amp).toFixed(2);
      const rotSign = (f + seed) % 2 === 0 ? 1 : -1;
      const rot = +(0.5 * decay * rotSign).toFixed(3);
      tl.set("#stage", { x: dx, y: dy, rotation: rot }, +(tHit + f * dt).toFixed(5));
    }
    tl.set("#stage", { x: 0, y: 0, rotation: 0 }, +(tHit + 7 * dt).toFixed(5));

    // 3-frame chromatic aberration split (±6px -> ±4px -> ±2px -> off)
    tl.set("#camera", { filter: "url(#rgbImpactSplit)" }, tHit);
    tl.set("#rgb-red-off", { attr: { dx: -6, dy: -2 } }, tHit);
    tl.set("#rgb-blue-off", { attr: { dx: 6, dy: 2 } }, tHit);
    tl.set("#rgb-red-off", { attr: { dx: -4, dy: -1.5 } }, +(tHit + 1 * dt).toFixed(5));
    tl.set("#rgb-blue-off", { attr: { dx: 4, dy: 1.5 } }, +(tHit + 1 * dt).toFixed(5));
    tl.set("#rgb-red-off", { attr: { dx: -2, dy: -0.5 } }, +(tHit + 2 * dt).toFixed(5));
    tl.set("#rgb-blue-off", { attr: { dx: 2, dy: 0.5 } }, +(tHit + 2 * dt).toFixed(5));
    tl.set("#camera", { filter: "none" }, +(tHit + 3 * dt).toFixed(5));

    if (typeof rimHook === "function") {
      rimHook(tHit, dt);
    }
  }

  // ============================================================================
  // SCENE 1 (0.000 - 3.750s, Beats 0 - 8): COLD OPEN — ARGON IGNITION & Ar TILE
  // ============================================================================
  tl.set("#scene1", { autoAlpha: 1 }, 0);
  tl.set("#s1-shotA", { autoAlpha: 1 }, 0);

  // Sub-shot 1A (0.000 - 0.9375s, Beats 0 - 2): Continuous camera push + active Frame 1 ignition!
  tl.fromTo("#s1-shotA", { scale: 0.95 }, { scale: 1.06, duration: b(2), ease: "none" }, 0);
  tl.fromTo(
    "#s1-core-spark",
    { scale: 0.45, rotation: -45, opacity: 1, svgOrigin: "960 540" },
    { scale: 1.32, rotation: 15, opacity: 1, duration: b(2), ease: "back.out(2.0)" },
    0
  );
  tl.fromTo(
    ".s1-ray",
    { drawSVG: "0% 25%" },
    { drawSVG: "20% 100%", duration: b(2), stagger: 0.012, ease: "power2.out" },
    0
  );
  tl.fromTo("#s1-rays", { rotation: 0, svgOrigin: "960 540" }, { rotation: 28, duration: b(2), ease: "none" }, 0);
  tl.fromTo(
    ".s1-b-sp",
    { scale: 0.3, opacity: 0.9, svgOrigin: "960 540" },
    { scale: 1.2, opacity: 1, duration: b(2), stagger: 0.02, ease: "back.out(2.2)" },
    0
  );
  tl.fromTo("#s1-sparkle-burst", { rotation: 0, svgOrigin: "960 540" }, { rotation: -35, duration: b(2), ease: "none" }, 0);
  tl.fromTo(
    "#s1-ring1",
    { drawSVG: "0% 35%", rotation: -90, svgOrigin: "960 540" },
    { drawSVG: "0% 100%", rotation: 90, duration: b(2), ease: "none" },
    0
  );
  tl.fromTo(
    "#s1-ring2",
    { scale: 0.5, rotation: 0, svgOrigin: "960 540" },
    { scale: 1.15, rotation: 110, duration: b(2), ease: "none" },
    0
  );

  // Sub-shot 1B (0.9375 - 1.875s, Beats 2 - 4): "Something new / is here." (~77% width, 100% MASKED slide-up, ZERO opacity fade!)
  const t1B = b(2);
  tl.set("#s1-shotA", { autoAlpha: 0 }, t1B);
  tl.set("#s1-shotB", { autoAlpha: 1 }, t1B);
  tl.fromTo("#s1-shotB", { scale: 0.96, immediateRender: false }, { scale: 1.055, duration: b(2), ease: "none" }, t1B);
  tl.fromTo("#s1b-ring", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: 65, duration: b(2), ease: "none" }, t1B);
  tl.fromTo("#s1b-sparkles", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: -32, duration: b(2), ease: "none" }, t1B);

  tl.fromTo(
    ".s1b-sp",
    { scale: 0, rotation: -60, transformOrigin: "50% 50%" },
    { scale: 1.25, rotation: 0, duration: 0.4, stagger: 0.04, ease: "back.out(2.5)", immediateRender: false },
    t1B
  );
  // Masked per-char slide-up + variable-font weight swell (yPercent 118 -> 0 inside overflow:hidden, opacity: 1 always, <= 85% title-safe width!)
  tl.set(splitS1Line1.chars, { yPercent: 118, opacity: 1 }, t1B);
  tl.set(splitS1Line2.chars, { yPercent: 118, opacity: 1 }, t1B);
  tl.fromTo(
    splitS1Line1.chars,
    { yPercent: 118, fontVariationSettings: "'wght' 300, 'wdth' 85, 'slnt' 0" },
    { yPercent: 0, fontVariationSettings: "'wght' 900, 'wdth' 100, 'slnt' 0", duration: 0.4, stagger: 0.02, ease: "expo.out", immediateRender: false },
    t1B
  );
  tl.fromTo(
    splitS1Line2.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.38, stagger: 0.024, ease: "expo.out", immediateRender: false },
    b(2.75)
  );

  // Sub-shot 1C (1.875 - 2.8125s, Beats 4 - 6): "ELEMENT 18 / NOBLE GAS" (~74% width, 100% MASKED slide-up!)
  const t1C = b(4);
  tl.set("#s1-shotB", { autoAlpha: 0 }, t1C);
  tl.set("#s1-shotC", { autoAlpha: 1 }, t1C);
  tl.fromTo("#s1-shotC", { scale: 0.96, immediateRender: false }, { scale: 1.06, duration: b(2), ease: "none" }, t1C);

  tl.fromTo(
    ["#s1c-arc1", "#s1c-arc2"],
    { drawSVG: "35% 65%" },
    { drawSVG: "0% 100%", duration: b(2), ease: "power2.out", immediateRender: false },
    t1C
  );
  tl.set(["#s1c-line1", "#s1c-line2"], { yPercent: 118, opacity: 1 }, t1C);
  tl.fromTo(
    "#s1c-line1",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.34, ease: "expo.out", immediateRender: false },
    t1C
  );
  tl.fromTo(
    "#s1c-line2",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.36, ease: "expo.out", immediateRender: false },
    t1C + 0.06
  );

  // Sub-shot 1D (2.8125 - 3.750s, Beats 6 - 8): Periodic Table Tile "18 / Ar" (520x580px) -> Sparkle Iris!
  const t1D = b(6);
  tl.set("#s1-shotC", { autoAlpha: 0 }, t1D);
  tl.set("#s1-shotD", { autoAlpha: 1 }, t1D);
  tl.fromTo("#s1-shotD", { scale: 0.96, immediateRender: false }, { scale: 1.06, duration: b(2), ease: "none" }, t1D);

  // Scale pop from 0 with overshoot (opacity: 1 always!)
  tl.fromTo(
    "#s1-ar-tile",
    { scale: 0, rotation: -8, opacity: 1 },
    { scale: 1.0, rotation: 0, opacity: 1, duration: 0.34, ease: "back.out(1.9)", immediateRender: false },
    t1D
  );
  tl.fromTo(
    ["#s1d-ring1", "#s1d-ring2", "#s1d-elecs"],
    { scale: 0.65, rotation: 0, svgOrigin: "960 540" },
    { scale: 1.12, rotation: 150, duration: b(2), ease: "none", immediateRender: false },
    t1D
  );

  // Transition 1 -> 2 (3.258 - 3.710s): Ar Tile Morphs (MorphSVG) into Hollow Glowing 4-Point Sparkle Window Rim,
  // opening as a true window centered on GEMINI 4 (960, 340) that completes by 3.69s ->
  // "GEMINI 4" 100% fully formed on the exact downbeat (3.750s) with scale punch (1.14 -> 1.0, expo.out, 0.3s) + shockwave!
  const tIrisMorph = b(6.95); // 3.258s
  const tIrisOpen = b(7.25); // 3.398s
  const tIrisDone = 3.690; // Completes before 3.70s!
  const tDrop = b(8); // 3.750s

  tl.set("#s1-ar-tile", { autoAlpha: 0 }, tIrisMorph);
  tl.set("#s1-iris-sparkle", { autoAlpha: 1, scale: 1, rotation: 0, svgOrigin: "960 340" }, tIrisMorph);
  tl.to(
    "#s1-iris-sparkle",
    {
      morphSVG: "M 960 0 C 994 270 1030 306 1300 340 C 1030 374 994 410 960 680 C 926 410 890 374 620 340 C 890 306 926 270 960 0 Z",
      duration: 0.14,
      ease: "back.out(2.0)"
    },
    tIrisMorph
  );

  // At tIrisOpen (3.398s), Scene 2 ("GEMINI 4") is ALREADY in position inside the expanding 4-point sparkle window!
  tl.set("#scene2", { autoAlpha: 1, zIndex: 26, clipPath: "url(#s2-iris-clip)" }, tIrisOpen);
  tl.set("#s2-shotA", { autoAlpha: 1 }, tIrisOpen);
  tl.set(["#s2a-argon-svg", "#s2a-shockwave", "#s2a-burst-group", "#s2-gem-spec", "#s2-argon-spec"], { autoAlpha: 0 }, tIrisOpen);
  tl.set("#s2a-shockwave", { scale: 0, svgOrigin: "960 540" }, tIrisOpen);
  tl.set(["#s2a-gemini-svg", "#s2-sculptural-4"], { autoAlpha: 1, clipPath: "none", y: 0, scale: 1, rotation: 0 }, tIrisOpen);

  tl.fromTo(
    "#s2-iris-clip-path",
    { scale: 1, rotation: 0, svgOrigin: "960 340" },
    { scale: 24, rotation: 45, svgOrigin: "960 340", duration: tIrisDone - tIrisOpen, ease: "power2.in", immediateRender: false },
    tIrisOpen
  );
  tl.to(
    "#s1-iris-sparkle",
    {
      scale: 24,
      rotation: 45,
      svgOrigin: "960 340",
      duration: tIrisDone - tIrisOpen,
      ease: "power2.in"
    },
    tIrisOpen
  );

  // Iris completes by 3.690s (before 3.70s!) with full-contrast dark #scene2 canvas & zero lavender wash!
  tl.set(["#scene1", "#s1-shotA", "#s1-shotB", "#s1-shotC", "#s1-shotD", "#s1-iris-sparkle"], { autoAlpha: 0 }, tIrisDone);
  tl.set("#scene2", { autoAlpha: 1, zIndex: 20, clipPath: "none" }, tIrisDone);

  // ============================================================================
  // SCENE 2 (3.750 - 7.500s, Beats 8 - 16): THE DROP — UNIFIED "GEMINI 4 + ARGON"
  // HERO LOCKUP ON SCREEN AT 3.750s WITH SCALE PUNCH (1.14 -> 1.0, expo.out, 0.3s) + SHOCKWAVE + IMPACT SHAKE/RGB SPLIT!
  // ============================================================================
  addImpactHit(tDrop, 1, (t0, dt) => {
    tl.set("#clean-rim-morph", { attr: { radius: 6.0 } }, t0);
    tl.set("#s2-four-body", { attr: { "stroke-width": 12 } }, t0);
    tl.set("#clean-rim-morph", { attr: { radius: 2.4 } }, +(t0 + dt).toFixed(5));
    tl.set("#s2-four-body", { attr: { "stroke-width": 6.5 } }, +(t0 + dt).toFixed(5));
  });

  // Downbeat Scale Punch (1.14 -> 1.0, expo.out, 0.30s) at 3.750s, then continuous gentle push-in (1.0 -> 1.048)
  tl.fromTo(
    "#s2a-lockup-wrap",
    { scale: 1.14, transformOrigin: "960px 340px" },
    { scale: 1.0, duration: 0.30, ease: "expo.out", immediateRender: false },
    tDrop
  );
  tl.fromTo(
    "#s2a-lockup-wrap",
    { scale: 1.0, transformOrigin: "960px 540px" },
    { scale: 1.048, duration: b(12.5) - (tDrop + 0.30), ease: "none", immediateRender: false },
    tDrop + 0.30
  );

  // Expanding vector shockwave ring on the Drop (hidden until 3.750s, starts at outer perimeter scale 1.45 so no small circle ever sits below GEMINI!)
  tl.set(["#s2a-shockwave", "#s2a-burst-group"], { autoAlpha: 1 }, tDrop);
  tl.fromTo(
    "#s2a-shockwave",
    { scale: 1.45, opacity: 0.92, attr: { "stroke-width": 28 }, svgOrigin: "960 540" },
    { scale: 4.2, opacity: 0, attr: { "stroke-width": 2 }, duration: 0.46, ease: "expo.out", immediateRender: false },
    tDrop
  );
  tl.set("#s2a-shockwave", { autoAlpha: 0, scale: 0 }, tDrop + 0.47);

  // Continuous background ring rotation across Sub-shot 2A
  tl.fromTo(
    ["#s2a-ring1", "#s2a-ring2"],
    { rotation: 0, svgOrigin: "960 540" },
    { rotation: 140, duration: b(4.5), ease: "none", immediateRender: false },
    tDrop
  );
  tl.fromTo(
    "#s2a-burst-group",
    { rotation: 0, svgOrigin: "960 540" },
    { rotation: -28, duration: b(4.5), ease: "none", immediateRender: false },
    tDrop
  );

  // Outer-only burst rays shoot outward and clear completely within 0.28s (hidden before 3.750s!)
  tl.fromTo(
    ".s2a-burst-ray",
    { drawSVG: "0% 45%", opacity: 1 },
    { drawSVG: "100% 100%", opacity: 0, duration: 0.28, stagger: 0.012, ease: "expo.out", immediateRender: false },
    tDrop
  );
  tl.fromTo(
    ".s2a-burst-sp",
    { scale: 0, rotation: -90, transformOrigin: "50% 50%" },
    { scale: 1.25, rotation: 0, duration: 0.42, stagger: 0.03, ease: "back.out(2.5)", immediateRender: false },
    tDrop
  );

  // Gently flowing full-spectrum Gemini gradients inside sculptural "4" and "GEMINI" (#4285F4 -> #00E5FF -> #A66BFF -> #FF6E7F!)
  tl.fromTo(
    "#s2-four-flow",
    { x: 0 },
    { x: -180, duration: 2.45, ease: "none", immediateRender: false },
    tIrisOpen
  );
  tl.to(
    "#s2-four-sparkle",
    {
      motionPath: {
        path: "#s2-four-orbit",
        align: "#s2-four-orbit",
        alignOrigin: [0.5, 0.5]
      },
      rotation: 360,
      duration: 1.35,
      ease: "power2.out"
    },
    tDrop
  );
  tl.fromTo(
    "#s2-flow-group",
    { x: 0 },
    { x: -280, duration: 2.45, ease: "none", immediateRender: false },
    tIrisOpen
  );
  tl.set("#s2-gem-spec", { autoAlpha: 1 }, tDrop + 0.25);
  tl.fromTo(
    "#s2-gem-spec",
    { x: -420 },
    { x: 2350, duration: 1.4, ease: "power2.inOut", immediateRender: false },
    tDrop + 0.25
  );
  tl.set("#s2-gem-spec", { autoAlpha: 0 }, tDrop + 1.66);

  // Beat 9 (4.219s): "ARGON" (~79% width!) slams in via clip-path wipe (ZERO ghost at 4.0s, opacity: 1 always!)
  const tArgonSlam = b(9); // 4.219s
  tl.set("#s2a-argon-svg", { autoAlpha: 1 }, tArgonSlam);
  tl.fromTo(
    "#s2a-argon-svg",
    { clipPath: "inset(100% 0% 0% 0%)", y: 85 },
    { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.32, ease: "expo.out", immediateRender: false },
    tArgonSlam
  );
  tl.fromTo(
    "#s2-argon-flow",
    { x: 0 },
    { x: -240, duration: 1.65, ease: "none", immediateRender: false },
    tArgonSlam
  );
  tl.fromTo(
    ["#s2a-wing-l", "#s2a-wing-r"],
    { drawSVG: "50% 50%" },
    { drawSVG: "0% 100%", duration: 0.38, ease: "expo.out", immediateRender: false },
    tArgonSlam + 0.04
  );
  tl.set("#s2-argon-spec", { autoAlpha: 1 }, tArgonSlam + 0.22);
  tl.fromTo(
    "#s2-argon-spec",
    { x: -420 },
    { x: 2350, duration: 1.25, ease: "power2.inOut", immediateRender: false },
    tArgonSlam + 0.22
  );
  tl.set("#s2-argon-spec", { autoAlpha: 0 }, tArgonSlam + 1.48);

  // Sub-shot 2B (5.859 - 7.200s, Beats 12.5 - 15.36): Centered Full-Width "ARGON" (~80% width = 1540px!)
  // with Compound-Path 'O' at (1220, 540) that pans to (960, 540) during the Zoom-Through-O!
  const t2B = b(12.5); // 5.859s
  const tZoomO = b(14.0); // 6.5625s
  const tZoomDone = 7.200; // Completes at 7.200s so 7.25s contact sheet tile is 100% full-bleed Thinks!
  tl.set(["#s2-shotA", "#s2a-argon-svg"], { autoAlpha: 0 }, t2B);
  tl.set("#s2-shotB", { autoAlpha: 1 }, t2B);

  tl.fromTo(
    "#s2b-portal-group",
    { x: 0, scale: 0.94, svgOrigin: "1220 540" },
    { x: 0, scale: 1.04, svgOrigin: "1220 540", duration: tZoomO - t2B, ease: "none", immediateRender: false },
    t2B
  );

  // Transition 2 -> 3 (6.5625 - 7.200s): Pan 'O' from (1220, 540) to (960, 540) while scaling 1.04 -> 32 around (1220, 540)!
  tl.to(
    "#s2b-portal-group",
    {
      x: -260,
      scale: 32,
      svgOrigin: "1220 540",
      duration: tZoomDone - tZoomO,
      ease: "power2.in"
    },
    tZoomO
  );
  tl.set("#s2b-portal-svg", { attr: { filter: "url(#blurZoom)" } }, 6.95);
  tl.set("#s2b-portal-svg", { attr: { filter: "none" } }, tZoomDone);

  // Scene 3 neural portal is visible inside the 'O' counter hole right from t2B (5.859s) at (1220, 540),
  // and pans with the 'O' to (960, 540) while expanding to full screen by 7.200s!
  tl.set("#scene3", { autoAlpha: 1, zIndex: 23, clipPath: "ellipse(58px 124px at 1220px 540px)" }, t2B);
  tl.fromTo(
    "#scene3",
    { clipPath: "ellipse(64px 136px at 1220px 540px)" },
    {
      clipPath: "ellipse(2200px 2200px at 960px 540px)",
      duration: tZoomDone - tZoomO,
      ease: "power2.in", immediateRender: false
    },
    tZoomO
  );
  tl.set(["#scene2", "#s2-shotA", "#s2a-argon-svg", "#s2-shotB"], { autoAlpha: 0 }, tZoomDone);
  tl.set("#scene3", { clipPath: "none" }, tZoomDone);

  // ============================================================================
  // SCENE 3 (7.200 - 11.250s, Beats 15.36 - 24): "Thinks deeper."
  // VERTICAL CAMERA DIVE THROUGH A 3-LAYER BRANCHING THOUGHT-TREE (~74% WIDTH!)
  // ============================================================================
  const tS3 = b(16); // 7.500s
  tl.set("#s3-world", { y: 0 }, t2B);

  // Continuous rotation on background neural rings throughout Scene 3 so no frame ever freezes
  tl.fromTo("#s3-bg-r1", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: 90, duration: 4.5, ease: "none" }, tZoomO);
  tl.fromTo("#s3-bg-r2", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: -75, duration: 4.5, ease: "none" }, tZoomO);
  tl.fromTo("#s3-bg-r3", { rotation: 0, svgOrigin: "960 1620", immediateRender: false }, { rotation: 110, duration: 4.5, ease: "none" }, tZoomO);
  tl.fromTo("#s3-bg-r4", { rotation: 0, svgOrigin: "960 1620", immediateRender: false }, { rotation: -95, duration: 4.5, ease: "none" }, tZoomO);

  tl.fromTo(
    ".s3-branch",
    { drawSVG: "0% 20%" },
    { drawSVG: "0% 100%", duration: 1.2, stagger: 0.035, ease: "power2.out", immediateRender: false },
    tZoomO
  );
  tl.fromTo(
    ".s3-trunk",
    { drawSVG: "0% 0%" },
    { drawSVG: "0% 100%", duration: 1.3, stagger: 0.04, ease: "power2.out", immediateRender: false },
    tS3
  );
  tl.fromTo(
    ".s3-node",
    { scale: 0.2, svgOrigin: "960 440" },
    { scale: 1.08, duration: 1.4, stagger: 0.025, ease: "back.out(2.0)", immediateRender: false },
    tZoomO + 0.08
  );
  tl.to(
    "#s3-pulse1",
    { motionPath: { path: "#s3-b1", align: "#s3-b1", alignOrigin: [0.5, 0.5] }, duration: 0.95, repeat: 2, ease: "none" },
    tZoomO + 0.2
  );
  tl.to(
    "#s3-pulse2",
    { motionPath: { path: "#s3-b2", align: "#s3-b2", alignOrigin: [0.5, 0.5] }, duration: 0.95, repeat: 2, ease: "none" },
    tZoomO + 0.3
  );
  tl.to(
    "#s3-pulse3",
    { motionPath: { path: "#s3-trunk3", align: "#s3-trunk3", alignOrigin: [0.5, 0.5] }, duration: 1.6, ease: "none" },
    tS3 + 0.4
  );

  // O-Portal Thought-Cluster (#s3-portal-cluster) glows, rotates & expands inside the 'O' counter hole during 5.859 - 7.12s,
  // while "Thinks" stays hidden (yPercent: 118) until the 'O' portal is full-screen at 7.12s (ZERO cropped 'k' fragment inside the 'O'!)
  const tThinksRise = 7.120;
  tl.set("#s3-portal-cluster", { autoAlpha: 1, scale: 0.85, rotation: 0, svgOrigin: "1220 540" }, t2B);
  tl.to(
    "#s3-portal-cluster",
    { scale: 1.35, rotation: 85, svgOrigin: "1220 540", duration: tZoomO - t2B, ease: "none" },
    t2B
  );
  tl.to(
    "#s3-portal-cluster",
    { x: -260, scale: 6.5, rotation: 210, svgOrigin: "1220 540", duration: tThinksRise - tZoomO, ease: "power2.in" },
    tZoomO
  );
  tl.set("#s3-portal-cluster", { autoAlpha: 0 }, tThinksRise);

  // "Thinks" (380px -> ~74% width!): stays masked (yPercent: 118) during the entire O-counter hold & zoom (5.86-7.12s),
  // then slides up cleanly once the O portal has expanded across the full frame (7.12s)!
  tl.set(splitS3Thinks.chars, { yPercent: 118, opacity: 1 }, t2B);
  tl.fromTo(
    splitS3Thinks.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.36, stagger: 0.018, ease: "expo.out", immediateRender: false },
    tThinksRise
  );
  tl.fromTo(
    "#s3-word-thinks",
    { scale: 0.94, fontVariationSettings: "'wght' 400, 'wdth' 92, 'slnt' 0" },
    { scale: 1.06, fontVariationSettings: "'wght' 900, 'wdth' 114, 'slnt' -6", duration: b(20) - tThinksRise, ease: "none", immediateRender: false },
    tThinksRise
  );

  // Beat 20 (9.375s): THE VERTICAL CAMERA DIVE DOWN THROUGH THE THOUGHT-TREE!
  const tDive = b(20); // 9.375s
  tl.to(
    "#s3-world",
    { y: -1080, duration: 0.54, ease: "power4.inOut" },
    tDive
  );
  tl.fromTo(
    "#s3-bg-parallax",
    { y: 0 },
    { y: 460, duration: 0.54, ease: "power4.inOut", immediateRender: false },
    tDive
  );
  tl.fromTo(
    "#s3-fg-parallax",
    { y: 0 },
    { y: -760, duration: 0.54, ease: "power4.inOut", immediateRender: false },
    tDive
  );
  tl.set("#s3-tree-svg", { attr: { filter: "url(#blurV)" } }, tDive + 0.1);
  tl.set("#s3-tree-svg", { attr: { filter: "none" } }, tDive + 0.42);

  // Deep Core Arrival (9.60 - 11.25s): Continuous Mandala Rotation + Masked "deeper." Slide-Up (opacity: 1 always!)
  tl.fromTo(
    "#s3-core-r1",
    { scale: 0.6, rotation: -90, svgOrigin: "960 1620" },
    { scale: 1.08, rotation: 110, duration: 1.65, ease: "none", immediateRender: false },
    tDive + 0.2
  );
  tl.fromTo(
    "#s3-core-r2",
    { scale: 0.65, rotation: 90, svgOrigin: "960 1620" },
    { scale: 1.06, rotation: -110, duration: 1.65, ease: "none", immediateRender: false },
    tDive + 0.2
  );
  tl.fromTo(
    "#s3-core-spokes",
    { rotation: -25, scale: 0.85, svgOrigin: "960 1620" },
    { rotation: 35, scale: 1.08, duration: 1.65, ease: "none", immediateRender: false },
    tDive + 0.2
  );
  tl.fromTo(
    "#s3-deeper-container",
    { scale: 0.94, transformOrigin: "50% 50%" },
    { scale: 1.065, duration: 1.65, ease: "none", immediateRender: false },
    tDive + 0.2
  );
  tl.set("#s3-context-thinks", { yPercent: 118, opacity: 1 }, t2B);
  tl.set(splitS3Deeper.chars, { yPercent: 118, opacity: 1 }, t2B);
  tl.fromTo(
    "#s3-context-thinks",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.36, ease: "expo.out", immediateRender: false },
    tDive + 0.2
  );
  tl.fromTo(
    splitS3Deeper.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.42, stagger: 0.022, ease: "expo.out", immediateRender: false },
    tDive + 0.18
  );

  // Transition 3 -> 4 (10.96 - 11.48s): 4-Band Horizontal Staggered Gemini Color Wipe (#wipe-bands-3to4)!
  const tWipe34 = b(23.4); // 10.969s
  tl.set("#wipe-bands-3to4", { autoAlpha: 1 }, tWipe34);
  tl.fromTo(
    ".b34-strip",
    { x: 1920 },
    { x: 0, duration: 0.26, stagger: 0.032, ease: "expo.in", immediateRender: false },
    tWipe34
  );
  const tS4 = b(24); // 11.250s
  tl.set("#scene3", { autoAlpha: 0 }, tS4);
  tl.set("#scene4", { autoAlpha: 1 }, tS4);
  tl.to(
    ".b34-strip",
    { x: -1920, duration: 0.26, stagger: 0.032, ease: "expo.out" },
    tS4 + 0.02
  );
  tl.set("#wipe-bands-3to4", { autoAlpha: 0 }, tS4 + 0.42);

  // ============================================================================
  // SCENE 4 (11.250 - 15.000s, Beats 24 - 32): "CODES" -> "» CODES FASTER_"
  // VECTOR CODE STREAM WALL + < / > BRACKETS MORPHING INTO » CHEVRONS (~89% WIDTH!)
  // ============================================================================
  tl.fromTo("#s4-code-wall", { y: 0, immediateRender: false }, { y: -860, duration: b(8), ease: "none" }, tS4);
  tl.fromTo(".s4-streak", { strokeDashoffset: 950, immediateRender: false }, { strokeDashoffset: -950, duration: b(8), ease: "none" }, tS4);
  tl.fromTo("#s4-stage-wrap", { scale: 0.96, immediateRender: false }, { scale: 1.055, duration: b(8), ease: "none" }, tS4);

  // Beats 24 - 27 (11.250 - 12.656s): Giant < / > Brackets snap open framing heavy bold "CODES" (scale pop + clipPath, opacity: 1 always!)
  tl.fromTo(
    "#s4-morph-left",
    { x: 320, scale: 0, opacity: 1, svgOrigin: "260 540" },
    { x: 0, scale: 1.0, opacity: 1, duration: 0.36, ease: "back.out(2.0)", immediateRender: false },
    tS4
  );
  tl.fromTo(
    "#s4-morph-right",
    { x: -320, scale: 0, opacity: 1, svgOrigin: "1660 540" },
    { x: 0, scale: 1.0, opacity: 1, duration: 0.36, ease: "back.out(2.0)", immediateRender: false },
    tS4
  );
  tl.fromTo(
    "#s4-slash",
    { drawSVG: "50% 50%", opacity: 0.38 },
    { drawSVG: "0% 100%", opacity: 0.38, duration: 0.34, ease: "expo.out", immediateRender: false },
    tS4
  );
  tl.fromTo(
    "#s4-word-codes",
    { left: "960px", xPercent: -50, yPercent: -50, scale: 0, clipPath: "inset(0% 50% 0% 50%)", opacity: 1 },
    { left: "960px", xPercent: -50, yPercent: -50, scale: 1.0, clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 0.34, ease: "back.out(1.8)", immediateRender: false },
    tS4 + 0.03
  );
  tl.set("#s4-faster-wrap", { autoAlpha: 0, xPercent: -50, yPercent: -50 }, tS4);
  tl.set(".s4-b-sp", { scale: 0 }, tS4);

  // Beat 27 (12.656s): < and > Brackets MORPH (MorphSVG) into Twin Forward Chevrons » on Left,
  // while "CODES" slides left and "FASTER_" wipes/decodes right beside it (~89% total width!)
  const tS4Morph = b(27); // 12.656s
  tl.to(
    "#s4-morph-left",
    {
      morphSVG: "M 95 425 L 190 540 L 95 655 L 145 655 L 240 540 L 145 425 Z",
      fill: "#00E5FF",
      duration: 0.3,
      ease: "expo.out"
    },
    tS4Morph
  );
  tl.to(
    "#s4-morph-right",
    {
      morphSVG: "M 195 425 L 290 540 L 195 655 L 245 655 L 340 540 L 245 425 Z",
      fill: "#4285F4",
      duration: 0.3,
      ease: "expo.out"
    },
    tS4Morph
  );
  tl.to("#s4-slash", { drawSVG: "50% 50%", duration: 0.2, ease: "expo.in" }, tS4Morph);

  // "CODES" slides left to x = 715px (scaled to 0.62 = 192px effective, spans x = 385..1045px)
  tl.to(
    "#s4-word-codes",
    {
      left: "715px",
      xPercent: -50,
      yPercent: -50,
      scale: 0.62,
      duration: 0.28,
      ease: "expo.out"
    },
    tS4Morph
  );

  // "FASTER_" wipes in beside "CODES" at x = 1455px via clipPath (opacity: 1 always!) and scrambles into place
  tl.set("#s4-faster-wrap", { autoAlpha: 1 }, tS4Morph + 0.08);
  tl.fromTo(
    "#s4-faster-wrap",
    { clipPath: "inset(0% 100% 0% 0%)", xPercent: -50, yPercent: -50, x: 40 },
    { clipPath: "inset(0% 0% 0% 0%)", xPercent: -50, yPercent: -50, x: 0, duration: 0.28, ease: "expo.out", immediateRender: false },
    tS4Morph + 0.08
  );
  tl.to(
    "#s4-word-faster",
    {
      scrambleText: { text: "FASTER", chars: "01<>/_#=", speed: 0.9 },
      duration: 0.32,
      ease: "none"
    },
    tS4Morph + 0.08
  );
  tl.fromTo(
    ".s4-b-sp",
    { scale: 0, rotation: -90, transformOrigin: "50% 50%" },
    { scale: 1.35, rotation: 45, duration: 2.1, stagger: 0.04, ease: "power1.out", immediateRender: false },
    b(28)
  );
  tl.fromTo(
    "#s4-cursor",
    { scaleY: 1 },
    { scaleY: 0.15, duration: 0.22, repeat: 8, yoyo: true, ease: "sine.inOut", immediateRender: false },
    tS4Morph + 0.35
  );

  // ============================================================================
  // SCENE 5 (15.000 - 18.750s, Beats 32 - 40): "Sees everything."
  // INVERTED PAPER CARD (460px "Sees" + CONTINUOUS MOTION!) -> GIANT EYE (~80% WIDTH!) -> EYE BLINKS SHUT!
  // ============================================================================
  const tS5 = b(32); // 15.000s
  tl.set(["#scene4", "#s4-faster-wrap"], { autoAlpha: 0 }, tS5);
  tl.set("#scene5", { autoAlpha: 1 }, tS5);
  tl.set("#s5-shotA", { autoAlpha: 1 }, tS5);

  // Sub-shot 5A (15.000 - 16.406s, Beats 32 - 35): Inverted Paper Card (#F8FAFC) + 460px "Sees" (100% masked slide-up!)
  tl.fromTo("#s5-shotA", { scale: 0.95, immediateRender: false }, { scale: 1.065, duration: b(3), ease: "none" }, tS5);
  tl.fromTo("#s5a-ring2", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: 110, duration: b(3), ease: "none" }, tS5);
  tl.fromTo("#s5a-blades", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: -65, duration: b(3), ease: "none" }, tS5);
  tl.fromTo("#s5a-light1", { x: -10, y: -6 }, { x: 12, y: 8, duration: b(3), ease: "none", immediateRender: false }, tS5);

  tl.set(splitS5Sees.chars, { yPercent: 118, opacity: 1 }, tS5);
  tl.fromTo(
    splitS5Sees.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.34, stagger: 0.024, ease: "expo.out", immediateRender: false },
    tS5
  );
  tl.fromTo(
    "#s5-word-sees",
    { scale: 0.96 },
    { scale: 1.06, duration: b(3), ease: "none", immediateRender: false },
    tS5
  );

  // Sub-shot 5B (16.406 - 18.750s, Beats 35 - 40): Giant Geometric Eye Opens Wide Around "Sees everything." (~80% width!)
  const tS5B = b(35); // 16.406s
  tl.set("#s5-shotA", { autoAlpha: 0 }, tS5B);
  tl.set("#s5-shotB", { autoAlpha: 1 }, tS5B);
  tl.set(["#s5-blink-top", "#s5-blink-bottom"], { y: (i) => (i === 0 ? -550 : 550) }, tS5B);

  tl.fromTo("#s5-shotB", { scale: 0.96, immediateRender: false }, { scale: 1.06, duration: b(5), ease: "none" }, tS5B);
  tl.fromTo("#s5b-iris-mid", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: 120, duration: b(5), ease: "none" }, tS5B);
  tl.fromTo(["#s5b-catchlight1", "#s5b-catchlight2"], { rotation: 0, transformOrigin: "50% 50%", immediateRender: false }, { rotation: 95, duration: b(5), ease: "none" }, tS5B);

  tl.fromTo(
    ["#s5b-lid-upper", "#s5b-lid-lower"],
    { drawSVG: "50% 50%", scaleY: 0.15, svgOrigin: "960 540" },
    { drawSVG: "0% 100%", scaleY: 1.0, duration: 0.44, ease: "back.out(1.8)", immediateRender: false },
    tS5B
  );
  tl.fromTo(
    ["#s5b-iris-outer", "#s5b-pupil"],
    { scale: 0.35, svgOrigin: "960 540" },
    { scale: 1.0, duration: 0.52, stagger: 0.04, ease: "expo.out", immediateRender: false },
    tS5B
  );

  // Single-Line Masked Reveal Inside the Eye: "Sees everything." (yPercent 118 -> 0 inside overflow:hidden, opacity: 1 always!)
  tl.set("#s5b-inline-sees", { yPercent: 118, opacity: 1 }, tS5B);
  tl.set(splitS5Everything.chars, { yPercent: 118, opacity: 1 }, tS5B);
  tl.fromTo(
    "#s5b-inline-sees",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.34, ease: "expo.out", immediateRender: false },
    tS5B + 0.03
  );
  tl.fromTo(
    splitS5Everything.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.38, stagger: 0.018, ease: "expo.out", immediateRender: false },
    tS5B + 0.06
  );

  // Transition 5 -> 6 (18.42 - 18.75s, Beat 39.3 -> 40): THE GIANT EYE BLINKS SHUT!
  const tBlink = b(39.3); // 18.422s
  tl.to(
    "#s5-blink-top",
    { y: 0, duration: b(40) - tBlink, ease: "expo.in" },
    tBlink
  );
  tl.to(
    "#s5-blink-bottom",
    { y: 0, duration: b(40) - tBlink, ease: "expo.in" },
    tBlink
  );
  tl.to(
    ["#s5b-lid-upper", "#s5b-lid-lower"],
    { scaleY: 0.02, svgOrigin: "960 540", duration: b(40) - tBlink, ease: "expo.in" },
    tBlink
  );

  // ============================================================================
  // SCENE 6 (18.750 - 22.500s, Beats 40 - 48): "PLANS." -> "ACTS." -> "SHIPS."
  // THREE FULL-FRAME HARD CUTS ONLY (~75-85% WIDTH, 100% MASKED REVEALS!)
  // ============================================================================
  const tS6A = b(40); // 18.750s
  tl.set(["#scene5", "#s5-shotA", "#s5-shotB"], { autoAlpha: 0 }, tS6A);
  tl.set("#scene6", { autoAlpha: 1 }, tS6A);
  tl.set("#s6-shotA", { autoAlpha: 1 }, tS6A);

  // Shot 6A (18.750 - 20.156s, Beats 40 - 43): "PLANS." (440px, masked slide-up, ZERO ghosted "PL" at 18.77s!)
  tl.fromTo("#s6-shotA", { scale: 0.95, immediateRender: false }, { scale: 1.06, duration: b(3), ease: "none" }, tS6A);
  tl.fromTo(
    ".s6a-path",
    { drawSVG: "0% 15%" },
    { drawSVG: "0% 100%", duration: 0.9, stagger: 0.06, ease: "power2.out", immediateRender: false },
    tS6A
  );
  tl.fromTo(
    ".s6a-node",
    { scale: 0, transformOrigin: "50% 50%" },
    { scale: 1.12, duration: b(3), stagger: 0.03, ease: "back.out(2.0)", immediateRender: false },
    tS6A + 0.04
  );
  tl.set(splitS6Plans.chars, { yPercent: 118, opacity: 1 }, tS6A);
  tl.fromTo(
    splitS6Plans.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.34, stagger: 0.022, ease: "expo.out", immediateRender: false },
    tS6A
  );

  // Transition 6A -> 6B (19.95 - 20.32s): 3-Band Diagonal Color Wipe (#wipe-bands-6a-6b)
  const tWipe6AB = b(42.55); // 19.945s
  const tS6B = b(43); // 20.156s
  tl.set("#wipe-bands-6a-6b", { autoAlpha: 1 }, tWipe6AB);
  tl.fromTo(
    ".b6ab-strip",
    { x: -2400 },
    { x: 0, duration: 0.2, stagger: 0.025, ease: "expo.in", immediateRender: false },
    tWipe6AB
  );
  tl.set("#s6-shotA", { autoAlpha: 0 }, tS6B);
  tl.set("#s6-shotB", { autoAlpha: 1 }, tS6B);
  tl.to(
    ".b6ab-strip",
    { x: 2400, duration: 0.22, stagger: 0.025, ease: "expo.out" },
    tS6B + 0.01
  );
  tl.set("#wipe-bands-6a-6b", { autoAlpha: 0 }, tS6B + 0.32);

  // Shot 6B (20.156 - 21.328s, Beats 43 - 45.5): "ACTS." (420px + Chevrons = 85% width, masked slide-up!)
  tl.fromTo("#s6-shotB", { scale: 0.95, immediateRender: false }, { scale: 1.065, duration: b(2.5), ease: "none" }, tS6B);
  tl.fromTo(
    ["#s6b-chev-l1", "#s6b-chev-l2"],
    { x: -160, scale: 0, svgOrigin: "260 540", opacity: 1 },
    { x: 25, scale: 1, opacity: 1, duration: b(2.5), stagger: 0.04, ease: "power2.out", immediateRender: false },
    tS6B
  );
  tl.fromTo(
    ["#s6b-chev-r1", "#s6b-chev-r2"],
    { x: 160, scale: 0, svgOrigin: "1660 540", opacity: 1 },
    { x: -25, scale: 1, opacity: 1, duration: b(2.5), stagger: 0.04, ease: "power2.out", immediateRender: false },
    tS6B
  );
  tl.fromTo(
    ".s6b-sp",
    { scale: 0.2, rotation: -90, transformOrigin: "50% 50%" },
    { scale: 1.3, rotation: 60, duration: b(2.5), stagger: 0.03, ease: "power1.out", immediateRender: false },
    tS6B
  );
  tl.set(splitS6Acts.chars, { yPercent: 118, opacity: 1 }, tS6B);
  tl.fromTo(
    splitS6Acts.chars,
    { yPercent: 118 },
    { yPercent: 0, duration: 0.3, stagger: 0.02, ease: "expo.out", immediateRender: false },
    tS6B
  );

  // Shot 6C (21.328 - 22.500s, Beats 45.5 - 48): INVERTED PURE WHITE SLAM "SHIPS." (390px, masked slide-up + Impact Shake/RGB Split!)
  const tS6C = b(45.5); // 21.328s
  tl.set("#s6-shotB", { autoAlpha: 0 }, tS6C);
  tl.set("#s6-shotC", { autoAlpha: 1 }, tS6C);
  tl.fromTo("#s6-shotC", { scale: 0.95, immediateRender: false }, { scale: 1.065, duration: b(2.5), ease: "none" }, tS6C);

  addImpactHit(tS6C, 2, (t0, dt) => {
    tl.set("#s6-word-ships", { filter: "drop-shadow(0px 0px 14px #00E5FF) drop-shadow(0px 0px 5px #4285F4)" }, t0);
    tl.set("#s6-word-ships", { filter: "none" }, +(t0 + dt).toFixed(5));
  });

  tl.fromTo(
    "#s6c-rocket-group",
    { y: 140, scale: 0.88, svgOrigin: "960 540" },
    { y: -65, scale: 1.08, duration: b(2.5), ease: "none", immediateRender: false },
    tS6C
  );
  tl.fromTo(
    "#s6c-rays line",
    { drawSVG: "0% 35%" },
    { drawSVG: "30% 100%", duration: b(2.5), stagger: 0.02, ease: "power1.out", immediateRender: false },
    tS6C
  );
  // High-velocity impact slam on "SHIPS." (outer-silhouette drop-shadow rim flash + zero char overlap!)
  tl.set(splitS6Ships.chars, { yPercent: 26, scale: 1.0, opacity: 1 }, tS6C);
  tl.fromTo(
    splitS6Ships.chars,
    { yPercent: 26 },
    { yPercent: 0, duration: 0.20, stagger: 0.01, ease: "expo.out", immediateRender: false },
    tS6C
  );

  // Transition 6C -> 7 (22.25 - 22.68s): 4-Band Vertical Staggered Color Curtain (#wipe-bands-6to7)
  const tWipe67 = b(47.45); // 22.242s
  const tS7 = b(48); // 22.500s
  tl.set("#wipe-bands-6to7", { autoAlpha: 1 }, tWipe67);
  tl.fromTo(
    ".b67-strip",
    { y: 1080 },
    { y: 0, duration: 0.24, stagger: 0.03, ease: "expo.in", immediateRender: false },
    tWipe67
  );
  tl.set(["#scene6", "#s6-shotA", "#s6-shotB", "#s6-shotC"], { autoAlpha: 0 }, tS7);
  tl.set("#scene7", { autoAlpha: 1 }, tS7);
  tl.set("#s7-shotA", { autoAlpha: 1 }, tS7);
  tl.to(
    ".b67-strip",
    { y: -1080, duration: 0.26, stagger: 0.03, ease: "expo.out" },
    tS7 + 0.02
  );
  tl.set("#wipe-bands-6to7", { autoAlpha: 0 }, tS7 + 0.42);

  // ============================================================================
  // SCENE 7 (22.500 - 26.250s, Beats 48 - 56): AVAILABILITY SCENE
  // BAR 13 (Beats 48-52): "Generally available." (~75% WIDTH, MASKED SLIDE-UP & EXIT!)
  // BAR 14 (Beats 52-56): DYNAMICALLY CENTERED 4-ROW STACK (Row 1 starts at y=540 center & pushes stack up as rows 2-4 land!)
  // ============================================================================
  tl.fromTo("#s7-shotA", { scale: 0.95, immediateRender: false }, { scale: 1.06, duration: b(4), ease: "none" }, tS7);
  tl.fromTo("#s7a-burst", { rotation: 0, svgOrigin: "960 540", immediateRender: false }, { rotation: 42, duration: b(4), ease: "none" }, tS7);

  tl.set(["#s7a-line1", "#s7a-line2"], { yPercent: 118, opacity: 1 }, tS7);
  tl.fromTo(
    "#s7a-line1",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.36, ease: "expo.out", immediateRender: false },
    tS7 + 0.03
  );
  tl.fromTo(
    "#s7a-line2",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.4, ease: "expo.out", immediateRender: false },
    tS7 + 0.1
  );
  tl.fromTo(
    ".s7a-ray",
    { drawSVG: "0% 25%" },
    { drawSVG: "45% 100%", duration: b(3.5), stagger: 0.025, ease: "power2.out", immediateRender: false },
    tS7 + 0.04
  );
  tl.fromTo(
    ".s7a-sp",
    { scale: 0, rotation: -90, transformOrigin: "50% 50%" },
    { scale: 1.35, rotation: 45, duration: b(3.5), stagger: 0.035, ease: "back.out(2.2)", immediateRender: false },
    tS7 + 0.06
  );

  // Masked slide-up exit of "Generally available." right before Beat 52 (24.16 - 24.375s, opacity: 1 always!)
  tl.to("#s7a-line1", { yPercent: -118, duration: 0.2, ease: "expo.in" }, b(51.55));
  tl.to("#s7a-line2", { yPercent: -118, duration: 0.2, ease: "expo.in" }, b(51.55));

  // Sub-shot 7B (Bar 14: 24.375 - 26.250s, Beats 52 - 56):
  // 1.2x scaled availability stack (4 rows x 224px = 896px) with center-of-mass tracking (336 -> 224 -> 112 -> 0)
  // so the visual center of mass is ALWAYS at frame center (y = 540px)!
  const tS7B = b(52); // 24.375s
  tl.set("#s7-shotA", { autoAlpha: 0 }, tS7B);
  tl.set("#s7-shotB", { autoAlpha: 1 }, tS7B);

  // Continuous scale push-in across #s7-shotB (0.98 -> 1.04) so every row lands with full presence
  tl.fromTo(
    "#s7-shotB",
    { scale: 0.98 },
    { scale: 1.04, duration: b(4), ease: "none", immediateRender: false },
    tS7B
  );

  // Dynamic Center-of-Mass vertical tracking on #s7b-stack (row height = 224px, stack height = 896px):
  // Half-beat staggers (beats 52, 52.5, 53, 53.5 -> 24.375s, 24.609s, 24.844s, 25.078s) so all 4 rows
  // finish by ~25.28s and hold at 100% brightness for ~0.85s (>= 0.6s!) before the 26.13 - 26.25s wipe-out!
  tl.set("#s7b-stack", { y: 336 }, tS7B);
  tl.to("#s7b-stack", { y: 224, duration: 0.24, ease: "expo.out" }, b(52.5));
  tl.to("#s7b-stack", { y: 112, duration: 0.24, ease: "expo.out" }, b(53.0));
  tl.to("#s7b-stack", { y: 0, duration: 0.24, ease: "expo.out" }, b(53.5));

  const surfRows = [
    { row: "#s7b-row1", bar: "#s7b-bar1", content: "#s7b-content1", beat: 52.0 },
    { row: "#s7b-row2", bar: "#s7b-bar2", content: "#s7b-content2", beat: 52.5 },
    { row: "#s7b-row3", bar: "#s7b-bar3", content: "#s7b-content3", beat: 53.0 },
    { row: "#s7b-row4", bar: "#s7b-bar4", content: "#s7b-content4", beat: 53.5 }
  ];

  surfRows.forEach((item) => {
    const tRow = b(item.beat);
    tl.set(item.row, { scaleY: 1, opacity: 1 }, tS7B - 0.05);
    tl.set(item.content, { autoAlpha: 0, y: 0, scale: 1.14 }, tS7B - 0.05);
    tl.set(item.bar, { scaleX: 0, transformOrigin: "0% 50%", opacity: 1 }, tS7B - 0.05);

    // Solid colored bar wipes in (0 -> 100% width) fast (0.05s)
    tl.to(
      item.bar,
      { scaleX: 1, duration: 0.05, ease: "expo.in" },
      tRow
    );
    // Content turns visible at 100% brightness beneath the bar and lands with a scale overshoot punch!
    tl.set(item.content, { autoAlpha: 1 }, tRow + 0.04);
    tl.to(
      item.content,
      { scale: 1.0, duration: 0.22, ease: "back.out(2.1)" },
      tRow + 0.04
    );
    // Solid colored bar wipes out to the right (100% -> 0% width)
    tl.set(item.bar, { transformOrigin: "100% 50%" }, tRow + 0.05);
    tl.to(
      item.bar,
      { scaleX: 0, duration: 0.12, ease: "expo.out" },
      tRow + 0.05
    );
  });

  // ============================================================================
  // SCENE 8 (26.250 - 30.000s, Beats 56 - 64): HERO END CARD LOCKUP
  // ~76.5% FRAME WIDTH ("Gemini 4" + 65px word space + "Argon"), LARGE "Available now" (106px + DRAWN UNDERLINE, NO PILL!),
  // "Google" AT 88px CRISP WHITE, 100% MASKED REVEALS, CONTINUOUS 5.8% PUSH-IN & ROTATING SPARKLES!
  // ============================================================================
  const tS8 = b(56); // 26.250s
  // Rows stay at 100% full brightness (ZERO dimming at 26.0s!) and wipe shut via scaleY right at 26.13 - 26.25s!
  tl.to(
    ["#s7b-row1", "#s7b-row2", "#s7b-row3", "#s7b-row4"],
    { scaleY: 0, duration: 0.12, ease: "expo.in" },
    tS8 - 0.12
  );
  tl.set(["#scene7", "#s7-shotA", "#s7-shotB", "#s7b-content1", "#s7b-content2", "#s7b-content3", "#s7b-content4"], { autoAlpha: 0 }, tS8);
  tl.set("#scene8", { autoAlpha: 1 }, tS8);
  // Explicitly keep #s8-final-shockwave hidden (autoAlpha: 0, scale: 0) until exactly 28.125s!
  tl.set("#s8-final-shockwave", { autoAlpha: 0, scale: 0, svgOrigin: "960 540" }, tS8);
  tl.set("#s8-specular-bar", { autoAlpha: 0 }, tS8);

  // Unbroken continuous 5.8% push-in on #s8-center (0.96 -> 1.018, ease: "none") from 26.25s to 30.00s!
  tl.fromTo(
    "#s8-center",
    { scale: 0.96, transformOrigin: "900px 470px" },
    { scale: 1.018, duration: 3.75, ease: "none", immediateRender: false },
    tS8
  );
  // Continuous rotation on the sparkle/ray field (#s8-burst-group) and ambient stars across 26.25 - 30.00s so NO frame ever freezes!
  tl.fromTo(
    "#s8-burst-group",
    { rotation: 0, svgOrigin: "960 540" },
    { rotation: 48, duration: 3.75, ease: "none", immediateRender: false },
    tS8
  );
  tl.fromTo(
    "#s8-ambient-stars",
    { rotation: 0, svgOrigin: "960 540" },
    { rotation: -36, duration: 3.75, ease: "none", immediateRender: false },
    tS8
  );

  // 16-Element Filled Sparkle + Tapered Ray Burst on Beat 56 (26.250s)
  tl.fromTo(
    ".s8-burst-ray",
    { scale: 0, opacity: 1, svgOrigin: "960 540" },
    { scale: 1.15, opacity: 0.45, duration: 1.6, stagger: 0.02, ease: "back.out(2.2)", immediateRender: false },
    tS8
  );
  tl.fromTo(
    ".s8-burst-sp",
    { scale: 0, rotation: -90, opacity: 1, transformOrigin: "50% 50%" },
    { scale: 1.25, rotation: 90, opacity: 0.9, duration: 1.6, stagger: 0.025, ease: "back.out(2.3)", immediateRender: false },
    tS8 + 0.02
  );

  // Hero Sparkle Crest + Masked Slide-Up of "Gemini 4 Argon", "Available now", and "Google" (opacity: 1 always — ZERO ghost fade at 26.32s!)
  tl.fromTo(
    "#s8-sparkle",
    { scale: 0, rotation: -120, opacity: 1 },
    { scale: 1.05, rotation: 90, opacity: 1, duration: 1.85, ease: "back.out(1.7)", immediateRender: false },
    tS8
  );
  tl.set(["#s8-title-svg", "#s8-cta-text", "#s8-google"], { yPercent: 118, opacity: 1 }, tS8);
  tl.set("#s8-underline", { drawSVG: "50% 50%" }, tS8);
  tl.fromTo(
    "#s8-title-svg",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.4, ease: "expo.out", immediateRender: false },
    tS8
  );
  // First Specular Light Sweep across "Gemini 4 Argon" (26.35 - 27.85s)
  tl.set("#s8-specular-bar", { autoAlpha: 1 }, tS8 + 0.1);
  tl.fromTo(
    "#s8-specular-bar",
    { x: -480 },
    { x: 1850, duration: 1.5, ease: "none", immediateRender: false },
    tS8 + 0.1
  );
  tl.set("#s8-specular-bar", { autoAlpha: 0 }, tS8 + 1.61);
  tl.fromTo(
    "#s8-cta-text",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.38, ease: "expo.out", immediateRender: false },
    tS8 + 0.08
  );
  tl.fromTo(
    "#s8-underline",
    { drawSVG: "50% 50%" },
    { drawSVG: "0% 100%", duration: 0.55, ease: "expo.out", immediateRender: false },
    tS8 + 0.16
  );
  tl.fromTo(
    "#s8-google",
    { yPercent: 118 },
    { yPercent: 0, duration: 0.38, ease: "expo.out", immediateRender: false },
    tS8 + 0.16
  );

  // Beat 60 (28.125s): Final Musical Hit — Lockup Scale Punch (1.0 -> 1.04 -> 1.0, 0.35s),
  // Deterministic Camera Shake + 3-Frame Chromatic Split + 1-Frame Rim Flash, and Bright Specular Sweep!
  const tFinalHit = b(60); // 28.125s
  addImpactHit(tFinalHit, 3, (t0, dt) => {
    tl.set(".s8-title-rim", { attr: { "stroke-width": 7.5, "stroke-opacity": 1.0 } }, t0);
    tl.set(".s8-title-rim", { attr: { "stroke-width": 2.0, "stroke-opacity": 0.72 } }, +(t0 + dt).toFixed(5));
  });

  // Lockup Scale Punch: 1.0 -> 1.04 -> 1.0 (0.35s total duration!)
  tl.set("#s8-lockup-punch", { scale: 1.0 }, tS8);
  tl.to(
    "#s8-lockup-punch",
    { scale: 1.04, duration: 0.08, ease: "power2.out" },
    tFinalHit
  );
  tl.to(
    "#s8-lockup-punch",
    { scale: 1.0, duration: 0.27, ease: "back.out(2.0)" },
    tFinalHit + 0.08
  );

  // Expanding cyan vector shockwave ring on the Final Hit (hidden until exactly 28.125s, expands from outer perimeter 1.45 -> 4.0!)
  tl.set("#s8-final-shockwave", { autoAlpha: 1 }, tFinalHit);
  tl.fromTo(
    "#s8-final-shockwave",
    { scale: 1.45, opacity: 0.92, attr: { "stroke-width": 26 }, svgOrigin: "960 540" },
    { scale: 4.0, opacity: 0, attr: { "stroke-width": 2 }, duration: 0.46, ease: "expo.out", immediateRender: false },
    tFinalHit
  );
  tl.set("#s8-final-shockwave", { autoAlpha: 0, scale: 0 }, tFinalHit + 0.47);

  tl.fromTo(
    "#s8-sparkle",
    { scale: 1.42, rotation: 90 },
    { scale: 1.05, rotation: 210, duration: 1.85, ease: "none", immediateRender: false },
    tFinalHit
  );
  tl.fromTo(
    ".s8-burst-ray",
    { scale: 0.45, opacity: 1, svgOrigin: "960 540" },
    { scale: 1.32, opacity: 0.35, duration: 1.75, stagger: 0.02, ease: "power1.out", immediateRender: false },
    tFinalHit
  );
  tl.fromTo(
    ".s8-burst-sp",
    { scale: 0.45, rotation: 90, opacity: 1, transformOrigin: "50% 50%" },
    { scale: 1.35, rotation: 240, opacity: 0.85, duration: 1.75, stagger: 0.02, ease: "power1.out", immediateRender: false },
    tFinalHit
  );
  tl.set("#s8-specular-bar", { autoAlpha: 1 }, tFinalHit);
  tl.fromTo(
    "#s8-specular-bar",
    { x: -360 },
    { x: 1820, duration: 0.80, ease: "none", immediateRender: false },
    tFinalHit
  );
  tl.set("#s8-specular-bar", { autoAlpha: 0 }, tFinalHit + 0.81);

  // Smooth Fade to Black over the last ~0.40s (29.60 - 30.00s) together with the music!
  tl.fromTo(
    "#stage",
    { opacity: 1 },
    { opacity: 0, duration: 0.40, ease: "power2.inOut", immediateRender: false },
    29.60
  );

  // ============================================================================
  // THOUGHTFUL MUSICAL SFX CUE SHEET (EXPORTED FROM GSAP TIMELINE CONSTANTS)
  // Key: F minor / Ab major (F minor pentatonic: F, Ab, Bb, C, Eb)
  // ============================================================================
  window.__sfxCues = [
    // --- 3 BIG IMPACTS ONLY (with -3 dB music ducking) ---
    { t: +tDrop.toFixed(4), type: "impact", freq: 87.31, gain: 0.96, pan: 0.0, duck_db: -3.2, label: "Scene 2 Drop — GEMINI 4 downbeat slam + shake + RGB split" },
    { t: +tS6C.toFixed(4), type: "impact", freq: 87.31, gain: 0.90, pan: 0.0, duck_db: -3.0, label: "Scene 6C — SHIPS. inverted white slam + shake + RGB split" },
    { t: +tFinalHit.toFixed(4), type: "impact", freq: 87.31, gain: 0.94, pan: 0.0, duck_db: -3.2, label: "Scene 8 Beat 60 — Final lockup hit + shake + RGB split" },

    // --- 2 SHOCKWAVE RINGS (resonant bandpass air + glassy F-minor harmonic ring) ---
    { t: +tDrop.toFixed(4), type: "shockwave", dur: 0.46, freq: 174.61, gain: 0.44, pan: 0.0, label: "Scene 2 Drop — #s2a-shockwave expanding vector ring" },
    { t: +tFinalHit.toFixed(4), type: "shockwave", dur: 0.46, freq: 207.65, gain: 0.42, pan: 0.0, label: "Scene 8 Beat 60 — #s8-final-shockwave expanding cyan ring" },

    // --- 4 MEDIUM SECTION-DOWNBEAT ACCENTS (crisp body transient, no sub boom) ---
    { t: +tS3.toFixed(4), type: "accent", freq: 130.81, gain: 0.44, pan: 0.0, label: "Scene 3 downbeat accent (Beat 16)" },
    { t: +tS4.toFixed(4), type: "accent", freq: 174.61, gain: 0.46, pan: 0.0, label: "Scene 4 downbeat accent (Beat 24)" },
    { t: +tS5.toFixed(4), type: "accent", freq: 207.65, gain: 0.44, pan: 0.0, label: "Scene 5 downbeat accent (Beat 32)" },
    { t: +tS6A.toFixed(4), type: "accent", freq: 174.61, gain: 0.46, pan: 0.0, label: "Scene 6A downbeat accent (Beat 40)" },

    // --- 13 MASKED PER-CHAR SLIDE-UP TICK-ROLLS (high-passed > 2 kHz, panned L->R) ---
    { t: +t1B.toFixed(4), type: "tickroll", count: 12, stagger: 0.020, freq: 261.63, pan_start: -0.35, pan_end: 0.35, gain: 0.30, label: "Scene 1B — 'Something new' masked char slide-up" },
    { t: +b(2.75).toFixed(4), type: "tickroll", count: 7, stagger: 0.024, freq: 311.13, pan_start: -0.25, pan_end: 0.25, gain: 0.28, label: "Scene 1B — 'is here.' masked char slide-up" },
    { t: +t1C.toFixed(4), type: "tickroll", count: 6, stagger: 0.022, freq: 349.23, pan_start: -0.30, pan_end: 0.30, gain: 0.28, label: "Scene 1C — 'ELEMENT 18 / NOBLE GAS' masked slide-up" },
    { t: +tArgonSlam.toFixed(4), type: "tickroll", count: 5, stagger: 0.018, freq: 349.23, pan_start: -0.35, pan_end: 0.35, gain: 0.34, label: "Scene 2A — 'ARGON' clip-path wipe slam" },
    { t: +tThinksRise.toFixed(4), type: "tickroll", count: 6, stagger: 0.018, freq: 349.23, pan_start: -0.30, pan_end: 0.30, gain: 0.32, label: "Scene 3 — 'Thinks' masked char slide-up" },
    { t: +(tDive + 0.18).toFixed(4), type: "tickroll", count: 7, stagger: 0.022, freq: 415.30, pan_start: -0.30, pan_end: 0.30, gain: 0.32, label: "Scene 3 — 'deeper.' masked char slide-up" },
    { t: +(tS4Morph + 0.08).toFixed(4), type: "tickroll", count: 8, stagger: 0.024, freq: 523.25, pan_start: 0.05, pan_end: 0.45, gain: 0.34, label: "Scene 4 — 'FASTER_' scramble/decode ticks" },
    { t: +tS5.toFixed(4), type: "tickroll", count: 4, stagger: 0.024, freq: 415.30, pan_start: -0.25, pan_end: 0.25, gain: 0.30, label: "Scene 5A — 'Sees' masked char slide-up" },
    { t: +(tS5B + 0.06).toFixed(4), type: "tickroll", count: 10, stagger: 0.018, freq: 466.16, pan_start: -0.38, pan_end: 0.38, gain: 0.30, label: "Scene 5B — 'Sees everything.' masked char slide-up" },
    { t: +tS6A.toFixed(4), type: "tickroll", count: 6, stagger: 0.022, freq: 349.23, pan_start: -0.30, pan_end: 0.30, gain: 0.32, label: "Scene 6A — 'PLANS.' masked char slide-up" },
    { t: +tS6B.toFixed(4), type: "tickroll", count: 5, stagger: 0.020, freq: 415.30, pan_start: -0.28, pan_end: 0.28, gain: 0.32, label: "Scene 6B — 'ACTS.' masked char slide-up" },
    { t: +tS6C.toFixed(4), type: "tickroll", count: 6, stagger: 0.012, freq: 523.25, pan_start: -0.30, pan_end: 0.30, gain: 0.34, label: "Scene 6C — 'SHIPS.' high-velocity masked slide-up" },
    { t: +(tS7 + 0.03).toFixed(4), type: "tickroll", count: 8, stagger: 0.022, freq: 415.30, pan_start: -0.35, pan_end: 0.35, gain: 0.30, label: "Scene 7A — 'Generally available.' masked slide-up" },

    // --- 2 VARIABLE-FONT WEIGHT SWELLS (warm filtered-chord swells) ---
    { t: +t1B.toFixed(4), type: "swell", dur: 0.45, freq: 174.61, gain: 0.34, pan: 0.0, label: "Scene 1B — 'Something new' wght 300->900 swell" },
    { t: +tThinksRise.toFixed(4), type: "swell", dur: 0.65, freq: 207.65, gain: 0.36, pan: 0.0, label: "Scene 3 — 'Thinks' wght 400->900 + wdth 92->114 swell" },

    // --- 8 SCALE POPS (ascending F-minor pentatonic FM plucks: C4 -> Eb4 -> F4 -> Ab4 -> Bb4 -> C5 -> Eb5 -> F5) ---
    { t: 0.0000, type: "pluck", freq: 261.63, gain: 0.40, pan: 0.0, label: "Scene 1A — #s1-core-spark Frame 1 ignition pop (C4)" },
    { t: +t1B.toFixed(4), type: "pluck", freq: 311.13, gain: 0.32, pan: -0.20, label: "Scene 1B — .s1b-sp sparkles pop (Eb4)" },
    { t: +t1D.toFixed(4), type: "pluck", freq: 349.23, gain: 0.44, pan: 0.0, label: "Scene 1D — #s1-ar-tile Periodic Table tile pop (F4)" },
    { t: +(tZoomO + 0.08).toFixed(4), type: "pluck", freq: 415.30, gain: 0.32, pan: 0.15, label: "Scene 3 — .s3-node neural cluster pop (Ab4)" },
    { t: +tS4.toFixed(4), type: "pluck", freq: 466.16, gain: 0.38, pan: 0.0, label: "Scene 4 — < / > brackets + 'CODES' snap open (Bb4)" },
    { t: +tS5B.toFixed(4), type: "pluck", freq: 523.25, gain: 0.42, pan: 0.0, label: "Scene 5B — #s5b-iris-outer / pupil pop open (C5)" },
    { t: +tS6B.toFixed(4), type: "pluck", freq: 622.25, gain: 0.38, pan: 0.0, label: "Scene 6B — twin kinetic chevrons pop (Eb5)" },
    { t: +tS8.toFixed(4), type: "pluck", freq: 698.46, gain: 0.40, pan: 0.0, label: "Scene 8 — #s8-sparkle hero crest pop (F5)" },

    // --- 2 MORPHSVG GLIDES (two-oscillator pitch/formant glides) ---
    { t: +tIrisMorph.toFixed(4), type: "glide", dur: 0.44, f0: 261.63, f1: 698.46, gain: 0.44, pan: 0.0, label: "Scene 1D->2 — Ar tile morphs into 4-point sparkle iris & opens" },
    { t: +tS4Morph.toFixed(4), type: "glide", dur: 0.32, f0: 349.23, f1: 523.25, gain: 0.42, pan: -0.22, label: "Scene 4 — < / > brackets morph into » chevrons + CODES slides left" },

    // --- 8 DRAWSVG ZIPS (bandpass-swept noise + harmonic overtone zips) ---
    { t: 0.0200, type: "zip", dur: 0.42, f0: 523.25, f1: 1396.91, gain: 0.30, pan: 0.0, label: "Scene 1A — .s1-ray + #s1-ring1 DrawSVG ignition strokes" },
    { t: +t1C.toFixed(4), type: "zip", dur: 0.42, f0: 415.30, f1: 1046.50, gain: 0.28, pan: 0.15, label: "Scene 1C — #s1c-arc1/2 orbital DrawSVG arcs" },
    { t: +(tArgonSlam + 0.04).toFixed(4), type: "zip", dur: 0.36, f0: 523.25, f1: 1396.91, gain: 0.30, pan: 0.0, label: "Scene 2A — #s2a-wing-l/r DrawSVG wing lines" },
    { t: +tS3.toFixed(4), type: "zip", dur: 0.55, f0: 349.23, f1: 830.61, gain: 0.30, pan: -0.15, label: "Scene 3 — .s3-trunk / .s3-branch thought-tree DrawSVG" },
    { t: +tS5B.toFixed(4), type: "zip", dur: 0.42, f0: 415.30, f1: 1046.50, gain: 0.30, pan: 0.0, label: "Scene 5B — #s5b-lid-upper/lower eyelid DrawSVG" },
    { t: +tS6A.toFixed(4), type: "zip", dur: 0.50, f0: 466.16, f1: 1174.66, gain: 0.30, pan: -0.18, label: "Scene 6A — .s6a-path blueprint Bezier DrawSVG" },
    { t: +(tS7 + 0.04).toFixed(4), type: "zip", dur: 0.48, f0: 523.25, f1: 1396.91, gain: 0.30, pan: 0.18, label: "Scene 7A — .s7a-ray radial burst DrawSVG" },
    { t: +(tS8 + 0.16).toFixed(4), type: "zip", dur: 0.52, f0: 523.25, f1: 1046.50, gain: 0.34, pan: 0.0, label: "Scene 8 — #s8-underline 'Available now' underline DrawSVG" },

    // --- 5 MULTI-BAND COLOR WIPES (staggered silk swishes panned & detuned per band) ---
    { t: +tWipe34.toFixed(4), type: "swish", bands: 4, stagger: 0.032, dur: 0.46, freq: 349.23, pan_start: 0.45, pan_end: -0.45, gain: 0.42, label: "Transition 3->4 — 4-band horizontal Gemini color wipe" },
    { t: +tWipe6AB.toFixed(4), type: "swish", bands: 3, stagger: 0.025, dur: 0.38, freq: 415.30, pan_start: -0.42, pan_end: 0.42, gain: 0.40, label: "Transition 6A->6B — 3-band diagonal color wipe" },
    { t: +tWipe67.toFixed(4), type: "swish", bands: 4, stagger: 0.030, dur: 0.46, freq: 466.16, pan_start: -0.35, pan_end: 0.35, gain: 0.42, label: "Transition 6C->7 — 4-band vertical color curtain" },
    { t: +b(51.55).toFixed(4), type: "swish", bands: 2, stagger: 0.020, dur: 0.22, freq: 523.25, pan_start: -0.15, pan_end: 0.15, gain: 0.28, label: "Scene 7A — 'Generally available.' masked slide-up exit" },
    { t: +(tS8 - 0.12).toFixed(4), type: "swish", bands: 4, stagger: 0.015, dur: 0.18, freq: 523.25, pan_start: -0.25, pan_end: 0.25, gain: 0.32, label: "Transition 7B->8 — 4-row availability stack wipe-shut" },

    // --- 3 SIGNATURE CAMERA / PORTAL / EYE TRANSITIONS ---
    { t: +tZoomO.toFixed(4), type: "suck", dur: 0.64, f0: 174.61, f1: 523.25, pan_start: 0.28, pan_end: 0.0, gain: 0.48, label: "Transition 2->3 — Zoom-Through-O reverse vacuum swell + portal burst" },
    { t: +tDive.toFixed(4), type: "doppler", dur: 0.54, f0: 523.25, f1: 130.81, gain: 0.48, pan: 0.0, label: "Scene 3 Beat 20 — Vertical camera dive down thought-tree" },
    { t: +tBlink.toFixed(4), type: "shutter", dur: 0.33, freq: 174.61, gain: 0.46, pan: 0.0, label: "Transition 5->6 — Giant eye blinks shut (eyelid thump + iris latch click)" },

    // --- 4 SPECULAR LIGHT SWEEPS (high-harmonic crystalline F-minor shimmer panned L->R) ---
    { t: +(tDrop + 0.25).toFixed(4), type: "shimmer", dur: 1.10, freq: 698.46, pan_start: -0.45, pan_end: 0.45, gain: 0.28, label: "Scene 2A — #s2-gem-spec specular sweep across GEMINI (F5)" },
    { t: +(tArgonSlam + 0.22).toFixed(4), type: "shimmer", dur: 1.00, freq: 830.61, pan_start: -0.45, pan_end: 0.45, gain: 0.28, label: "Scene 2A — #s2-argon-spec specular sweep across ARGON (Ab5)" },
    { t: +(tS8 + 0.10).toFixed(4), type: "shimmer", dur: 1.25, freq: 698.46, pan_start: -0.45, pan_end: 0.45, gain: 0.28, label: "Scene 8 — #s8-specular-bar first sweep across Gemini 4 Argon (F5)" },
    { t: +tFinalHit.toFixed(4), type: "shimmer", dur: 0.80, freq: 1046.50, pan_start: -0.45, pan_end: 0.45, gain: 0.32, label: "Scene 8 Beat 60 — #s8-specular-bar final sweep across Gemini 4 Argon (C6)" },

    // --- 4 AVAILABILITY STACK ROWS (ascending F-minor chord tones: F3 -> Ab3 -> C4 -> F4) ---
    { t: +b(52.0).toFixed(4), type: "thud", freq: 174.61, pan: -0.18, gain: 0.46, label: "Scene 7B Row 1 — GEMINI API bar wipe + lock (F3)" },
    { t: +b(52.5).toFixed(4), type: "thud", freq: 207.65, pan: -0.06, gain: 0.46, label: "Scene 7B Row 2 — AI STUDIO bar wipe + lock (Ab3)" },
    { t: +b(53.0).toFixed(4), type: "thud", freq: 261.63, pan: 0.06, gain: 0.48, label: "Scene 7B Row 3 — VERTEX AI bar wipe + lock (C4)" },
    { t: +b(53.5).toFixed(4), type: "thud", freq: 349.23, pan: 0.18, gain: 0.50, label: "Scene 7B Row 4 — GEMINI APP bar wipe + lock (F4)" },

    // --- 2 END-CARD CHORD STINGS (resolved F minor add9 chord + bell shimmer, decaying cleanly by 29.75s) ---
    { t: +tS8.toFixed(4), type: "sting", dur: 1.85, freq: 174.61, gain: 0.42, pan: 0.0, label: "Scene 8 Beat 56 — End card arrival F minor add9 chord sting" },
    { t: +tFinalHit.toFixed(4), type: "sting", dur: 1.62, freq: 174.61, gain: 0.48, pan: 0.0, label: "Scene 8 Beat 60 — Final resolved F minor add9 chord + long tail" }
  ];

  // Deterministic per-frame film grain shift + timeline seeking for HyperFrames headless capture
  const grainRect = document.getElementById("grain-rect");
  window.__argonTimeline = tl;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;

  window.renderAt = function (t) {
    tl.seek(t, false);
    if (grainRect) {
      const frameIdx = Math.round(t * 60);
      const gx = -100 + ((frameIdx * 37) % 180);
      const gy = -100 + ((frameIdx * 53) % 180);
      grainRect.setAttribute("x", String(gx));
      grainRect.setAttribute("y", String(gy));
    }
  };
})();
