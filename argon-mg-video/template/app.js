/* global gsap, CustomEase, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, ScrambleTextPlugin */
/*
 * Master timeline scaffold. Replace the DEMO section with your storyboard, keep the helpers.
 * Rules baked in (see references/craft-standards.md):
 *   - every time comes from the beat grid: b(n)
 *   - every non-initial element is hidden at t=0 with autoAlpha:0 and shown with autoAlpha at its cut
 *   - text reveals are masked slides / scale pops, never opacity fades
 *   - every shot gets a continuous base layer (baseLayer) so no frame freezes
 *   - fromTo(): immediateRender:false goes in the TO vars (3rd argument)
 */
(function () {
  "use strict";
  gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, ScrambleTextPlugin);

  // ---------------------------------------------------------------- beat grid
  const BPM = {{BPM}};
  const FPS = {{FPS}};
  const DURATION = {{DURATION}};
  const BEAT = 60 / BPM;            // 128 bpm -> 0.46875 s; 1 bar = 4 beats; 64 beats = 30 s
  const b = (n) => +(n * BEAT).toFixed(5);
  const F = 1 / FPS;                // one frame

  const tl = gsap.timeline({ paused: true });

  // ---------------------------------------------------------------- helpers
  /** Hide everything that is not on screen at t=0. List EVERY scene, shot, wipe, flash, shockwave. */
  function hideAtStart(selectors) { gsap.set(selectors, { autoAlpha: 0 }); }

  /** Hard cut: hide outgoing (parent AND child shots), show incoming. */
  function cut(t, outSel, inSel) {
    if (outSel) tl.set(outSel, { autoAlpha: 0 }, t);
    if (inSel) tl.set(inSel, { autoAlpha: 1 }, t);
  }

  /** Continuous base layer: slow push-in for the whole shot so no frame freezes. */
  function baseLayer(sel, t0, t1, from = 0.95, to = 1.06) {
    tl.fromTo(sel, { scale: from }, { scale: to, duration: t1 - t0, ease: "none", immediateRender: false }, t0);
  }

  /** Continuous rotation/drift on secondary vectors (rings, rays, sparkles). */
  function drift(sel, t0, t1, rot = 30, origin = "960 540") {
    tl.fromTo(sel, { rotation: 0, svgOrigin: origin }, { rotation: rot, duration: t1 - t0, ease: "none", immediateRender: false }, t0);
  }

  /** Masked per-char slide-up (+ optional variable-font weight swell). Element must sit inside .line-mask. */
  function maskReveal(sel, t, { chars = true, dur = 0.4, stagger = 0.022, swell = false } = {}) {
    const targets = chars ? new SplitText(sel, { type: "chars" }).chars : sel;
    gsap.set(targets, { yPercent: 118, opacity: 1 });
    const from = { yPercent: 118 };
    const to = { yPercent: 0, duration: dur, stagger: chars ? stagger : 0, ease: "expo.out", immediateRender: false };
    if (swell) { from.fontVariationSettings = "'wght' 300, 'wdth' 85"; to.fontVariationSettings = "'wght' 900, 'wdth' 100"; }
    tl.fromTo(targets, from, to, t);
    return targets;
  }

  /** Masked exit (slide up and out). */
  function maskExit(targets, t, dur = 0.22) {
    tl.to(targets, { yPercent: -118, duration: dur, stagger: 0.01, ease: "power3.in" }, t);
  }

  /** Scale pop with overshoot. */
  function pop(sel, t, dur = 0.34) {
    tl.fromTo(sel, { scale: 0 }, { scale: 1, duration: dur, ease: "back.out(1.9)", immediateRender: false }, t);
  }

  /** Stacked color-band wipe: bands grow (2-3 frame stagger), cut underneath at full cover, bands retract. */
  function bandWipe(groupSel, stripSel, tStart, onCover) {
    const cover = tStart + 0.22;
    tl.set(groupSel, { autoAlpha: 1 }, tStart);
    tl.fromTo(stripSel, { scaleY: 0, transformOrigin: "50% 0%" },
      { scaleY: 1, duration: 0.2, stagger: 2.5 * F, ease: "power3.in", immediateRender: false }, tStart);
    if (onCover) onCover(cover + 3 * F);
    tl.to(stripSel, { scaleY: 0, transformOrigin: "50% 100%", duration: 0.22, stagger: 2.5 * F, ease: "power3.out" }, cover + 3 * F);
    tl.set(groupSel, { autoAlpha: 0 }, cover + 0.5);
  }

  /** 2-frame hot flash (>= 85% luminance). Never a long white fade (gray wash). */
  function flash(t) {
    tl.set("#flash-overlay", { opacity: 0.95 }, t - 2 * F);
    tl.set("#flash-overlay", { opacity: 0.88 }, t - F);
    tl.set("#flash-overlay", { opacity: 0 }, t);
  }

  /** Impact: 7-frame seeded shake on #stage + 3-frame RGB split on #camera + optional shockwave. */
  function addImpactHit(tHit, seed = 1, { shockwave = true } = {}) {
    const angles = [0.65, 2.75, 4.45, 1.35, 3.85, 5.55, 2.15];
    for (let f = 0; f < 7; f++) {
      const decay = (7 - f) / 7, amp = 14 * decay, ang = angles[f] + seed * 1.17;
      tl.set("#stage", { x: +(Math.cos(ang) * amp).toFixed(2), y: +(Math.sin(ang) * amp).toFixed(2),
        rotation: +(0.5 * decay * ((f + seed) % 2 ? -1 : 1)).toFixed(3) }, +(tHit + f * F).toFixed(5));
    }
    tl.set("#stage", { x: 0, y: 0, rotation: 0 }, +(tHit + 7 * F).toFixed(5));
    tl.set("#camera", { filter: "url(#rgbImpactSplit)" }, tHit);
    [[6, 2], [4, 1.5], [2, 0.5]].forEach(([dx, dy], i) => {
      tl.set("#rgb-red-off", { attr: { dx: -dx, dy: -dy } }, +(tHit + i * F).toFixed(5));
      tl.set("#rgb-blue-off", { attr: { dx, dy } }, +(tHit + i * F).toFixed(5));
    });
    tl.set("#camera", { filter: "none" }, +(tHit + 3 * F).toFixed(5));
    if (shockwave) {
      // Start at the outer perimeter so no small ring ever sits over the type; hidden until the hit.
      tl.set("#shockwave", { autoAlpha: 1 }, tHit);
      tl.fromTo("#shockwave", { scale: 1.45, opacity: 1, svgOrigin: "960 540" },
        { scale: 4.2, opacity: 0, duration: 0.45, ease: "expo.out", immediateRender: false }, tHit);
      tl.set("#shockwave", { autoAlpha: 0 }, tHit + 0.46);
    }
  }

  /** Kick micro-punch on every beat in [fromBeat, toBeat). Bigger on listed drop beats. */
  function kickPunches(fromBeat, toBeat, dropBeats = []) {
    for (let i = fromBeat; i < toBeat; i++) {
      const amp = dropBeats.includes(i) ? 1.028 : 1.012;
      tl.fromTo("#camera", { scale: amp }, { scale: 1, duration: BEAT * 0.96, ease: "power2.out", immediateRender: false, overwrite: "auto" }, b(i));
    }
  }

  /** Specular light sweep across a hero (bar element inside the shot). */
  function specularSweep(sel, t, dur = 0.8) {
    tl.set(sel, { autoAlpha: 1, x: -400 }, t);
    tl.to(sel, { x: 2000, duration: dur, ease: "power2.inOut" }, t);
    tl.set(sel, { autoAlpha: 0 }, t + dur);
  }

  /** Peak-velocity motion blur toggle (only during the fast frames). */
  function blurDuring(sel, filterId, t0, t1) {
    tl.set(sel, { filter: `url(#${filterId})` }, t0);
    tl.set(sel, { filter: "none" }, t1);
  }

  // ---------------------------------------------------------------- ambient stage (whole video)
  // ONE soft key light that breathes (<= 40 px drift, <= 3% scale) + reverse-parallax hairline grid.
  tl.fromTo("#bg-key-light", { x: -18, y: -12, scale: 0.988, svgOrigin: "960 540" },
    { x: 18, y: 12, scale: 1.012, duration: DURATION, ease: "sine.inOut", immediateRender: false }, 0);
  tl.fromTo("#bg-subtle-grid", { x: 18, y: 10 }, { x: -18, y: -10, duration: DURATION, ease: "none", immediateRender: false }, 0);
  /** Section tint: cross-fade the key light to a DESATURATED hue (~70% slate + ~30% section color). */
  function tint(t, inner, outer, dur = 0.5) {
    tl.to("#bg-key-stop0", { attr: { "stop-color": inner }, duration: dur, ease: "sine.inOut" }, t);
    tl.to("#bg-key-stop1", { attr: { "stop-color": outer }, duration: dur, ease: "sine.inOut" }, t);
  }
  // e.g. slate-indigo (open) -> slate-cobalt (drop) -> slate-teal -> warm slate-plum -> slate-blue (end)
  tint(b(8) - 0.25, "#64748E", "#586882");
  tint(b(12) - 0.25, "#68748C", "#5A657C");
  tl.set("#flash-overlay", { opacity: 0 }, 0);

  // ---------------------------------------------------------------- SFX cue export
  // Cue times come from the SAME variables as the animation, so sound can't drift from picture.
  // tools/sfx.py --from-js app.js extracts this list (window.__sfxCues = [ ... ];) into audio/sfx_cues.json.
  // Hierarchy: <= 3 impacts in the whole video, 3-5 accents on section downbeats, everything else light.
  // Families: impact shockwave accent tickroll swell pluck glide zip swish suck doppler shutter shimmer thud sting.
  // Pitched cues use notes of the music's key (analyze_music.py / chroma); F minor pentatonic shown here.

  // ================================================================ DEMO (replace with your storyboard)
  hideAtStart(["#s1-shotB", "#scene2", "#scene3", "#wipe-bands-a", "#shockwave", "#s2-spec"]);

  // Shot 1A (beats 0-2): spark ignites on frame 1, rays draw, continuous rotation
  baseLayer("#s1-shotA", 0, b(2));
  tl.fromTo("#s1-spark", { scale: 0.4, rotation: -45, svgOrigin: "960 540" },
    { scale: 1.3, rotation: 15, duration: b(2), ease: "back.out(2)", immediateRender: false }, 0);
  tl.fromTo(".s1-ray", { drawSVG: "0% 10%" }, { drawSVG: "15% 100%", duration: b(2), stagger: 0.02, ease: "power2.out", immediateRender: false }, 0);
  drift("#s1-rays", 0, b(2), 28);
  drift("#s1a-orbit", 0, b(2), 140);

  // Shot 1B (beats 2-6): masked kinetic headline + italic serif accent
  cut(b(2), "#s1-shotA", "#s1-shotB");
  baseLayer("#s1-shotB", b(2), b(6));
  drift("#s1b-orbit", b(2), b(6), -70);
  const l1 = maskReveal("#s1-line1", b(2), { swell: true });
  const l2 = maskReveal("#s1-line2", b(3));
  maskExit([...l1, ...l2], b(6) - 0.24);

  // Drop (beat 8): sparkle iris opens on the hero already in place, finishes before the downbeat
  cut(b(6), null, "#scene2");
  tl.fromTo("#iris-clip-path", { scale: 0.02, svgOrigin: "960 540" },
    { scale: 9, duration: b(8) - b(6) - 0.06, ease: "power2.in", immediateRender: false }, b(6));
  tl.set("#scene2", { clipPath: "none" }, b(8));
  cut(b(8), "#scene1", null);
  tl.fromTo("#s2-shotA", { scale: 1.12 }, { scale: 1.0, duration: 0.3, ease: "expo.out", immediateRender: false }, b(8));
  baseLayer("#s2-shotA", b(8) + 0.3, b(12), 1.0, 1.05);
  tl.fromTo("#heroGrad", { attr: { x1: 240, x2: 1680 } }, { attr: { x1: -400, x2: 1040 }, duration: b(12) - b(8), ease: "sine.inOut", immediateRender: false }, b(8));
  addImpactHit(b(8), 1);
  kickPunches(9, 12);
  specularSweep("#s2-spec", b(10));

  // Band wipe into the end card (cover lands on beat 12)
  bandWipe("#wipe-bands-a", ".ba-strip", b(12) - 0.25, (tCover) => cut(tCover, "#scene2", "#scene3"));
  baseLayer("#s3-shotA", b(12), DURATION, 0.97, 1.04);
  drift("#s3-orbit", b(12), DURATION, 120);
  kickPunches(12, Math.floor(DURATION / BEAT) - 1);
  maskReveal("#s3-title", b(12), { swell: true });
  maskReveal("#s3-cta", b(13), { chars: false });
  maskReveal("#s3-sign", b(14), { chars: false });
  addImpactHit(b(14), 3, { shockwave: false });
  tl.to("#stage", { opacity: 0, duration: 0.4, ease: "power1.in" }, DURATION - 0.4);
  // ================================================================ /DEMO

  window.__sfxCues = [
    { t: 0.0, type: "pluck", freq: 261.63, gain: 0.40, pan: 0.0, label: "spark ignition pop" },
    { t: 0.02, type: "zip", dur: 0.9, f_start: 523.25, f_end: 1396.9, pan_start: -0.18, pan_end: 0.18, gain: 0.30, label: "rays DrawSVG" },
    { t: b(2), type: "tickroll", count: 13, stagger: 0.022, freq: 261.63, pan_start: -0.35, pan_end: 0.35, gain: 0.30, label: "headline char slide-up" },
    { t: b(2), type: "swell", dur: 0.45, freq: 174.61, gain: 0.34, pan: 0.0, label: "weight swell" },
    { t: b(6), type: "glide", dur: b(8) - b(6), f_start: 261.63, f_end: 698.46, gain: 0.40, pan: 0.0, label: "iris opening" },
    { t: b(8), type: "impact", freq: 87.31, gain: 0.96, pan: 0.0, duck_db: -3.2, label: "DROP (impact 1 of max 3)" },
    { t: b(8), type: "shockwave", dur: 0.46, freq: 174.61, gain: 0.44, pan: 0.0, label: "shockwave ring" },
    { t: b(10), type: "shimmer", dur: 0.8, freq: 698.46, pan_start: -0.45, pan_end: 0.45, gain: 0.28, label: "specular sweep" },
    { t: b(12) - 0.25, type: "swish", dur: 0.45, freq: 220, bands: 4, gain: 0.42, label: "band wipe (one swish per band)" },
    { t: b(14), type: "sting", dur: 2.5, freq: 174.61, gain: 0.50, label: "end-card resolved chord" },
  ];

  tl.set({}, {}, DURATION); // pin timeline length

  // Deterministic grain: shift the noise rect per frame (no Math.random at render time)
  const grainRect = document.getElementById("grain-rect");
  tl.eventCallback("onUpdate", () => {
    const fi = Math.round(tl.time() * FPS);
    grainRect.setAttribute("x", String(-100 + ((fi * 37) % 180)));
    grainRect.setAttribute("y", String(-100 + ((fi * 53) % 180)));
  });

  window.__mainTimeline = tl;
})();
