#!/usr/bin/env python3
"""Reviewer toolkit: static lint, contact sheets, transition strips and motion stats.

usage:
  review.py lint   PROJECT_DIR      # static checks (micro-text, visibility, fromTo, determinism)
  review.py sheets VIDEO OUTDIR [--fps 2] [--cols 4] [--rows 4] [--tile 384]
  review.py strip  VIDEO OUT.jpg --start 3.5 --end 4.3 [--n 8] [--tile 384]
  review.py frame  VIDEO OUT.jpg --t 12.3 [--w 960]
  review.py frames VIDEO OUTDIR --t 3.25 3.75 20.83 [--w 960]   # e.g. 0.5 s before every hit
  review.py stats  VIDEO            # per-0.25s motion energy, dead stretches, cut list, loudness

Never view images wider than ~1600 px or more than ~20 per turn (many-image limit).
"""
import argparse, json, os, subprocess, sys, tempfile, pathlib


def sh(cmd, **kw):
  return subprocess.run(cmd, check=True, stdin=subprocess.DEVNULL, capture_output=True, text=True, **kw)


def duration(v):
  return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v]).stdout)


def sheets(a):
  out = pathlib.Path(a.outdir); out.mkdir(parents=True, exist_ok=True)
  for f in out.glob("sheet_*.jpg"): f.unlink()
  th = int(a.tile * 9 / 16)
  vf = (f"fps={a.fps},scale={a.tile}:{th},"
        f"drawtext=fontfile=/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Bold.ttf:"
        f"text='%{{pts\\:hms}}':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6,"
        f"tile={a.cols}x{a.rows}:padding=4:color=gray")
  sh(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", a.video, "-vf", vf, "-q:v", "3", str(out / "sheet_%02d.jpg")])
  print("\n".join(sorted(str(p) for p in out.glob("sheet_*.jpg"))))


def strip(a):
  n = a.n; th = int(a.tile * 9 / 16)
  with tempfile.TemporaryDirectory() as d:
    for i in range(n):
      t = a.start + (a.end - a.start) * i / max(1, n - 1)
      sh(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", a.video, "-frames:v", "1",
          "-vf", f"scale={a.tile}:{th},drawtext=fontfile=/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Bold.ttf:text='{t:.2f}s':x=6:y=6:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.6",
          f"{d}/f{i:02d}.png"])
    cols = 4; rows = (n + cols - 1) // cols
    sh(["ffmpeg", "-nostdin", "-y", "-v", "error", "-framerate", "1", "-i", f"{d}/f%02d.png",
        "-vf", f"tile={cols}x{rows}:padding=4:color=gray", "-frames:v", "1", "-q:v", "3", a.out])
  print(a.out)


def frame(a):
  sh(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", f"{a.t:.3f}", "-i", a.video, "-frames:v", "1",
      "-vf", f"scale={a.w}:-2", "-q:v", "2", a.out])
  print(a.out)


def stats(a):
  v = a.video
  probe = json.loads(sh(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", v]).stdout)
  vs = [s for s in probe["streams"] if s["codec_type"] == "video"][0]
  aus = [s for s in probe["streams"] if s["codec_type"] == "audio"]
  print(f"duration={float(probe['format']['duration']):.3f}s size={vs['width']}x{vs['height']} fps={vs['r_frame_rate']} "
        f"vcodec={vs['codec_name']} pix={vs.get('pix_fmt')} audio={'yes ' + aus[0]['codec_name'] if aus else 'NO'}")
  # motion energy via low-res grayscale diff
  raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", v, "-vf", "fps=20,scale=64:36,format=gray",
                        "-f", "rawvideo", "-"], stdin=subprocess.DEVNULL, capture_output=True, check=True).stdout
  fs = 64 * 36; frames = [raw[i:i + fs] for i in range(0, len(raw) - fs + 1, fs)]
  diffs = [0.0] + [sum(abs(x - y) for x, y in zip(frames[i], frames[i - 1])) / fs for i in range(1, len(frames))]
  luma = [sum(f) / fs for f in frames]
  buckets = {}
  for i, d in enumerate(diffs):
    buckets.setdefault(int(i / 5), []).append(d)  # 0.25 s buckets
  line = []
  for b in sorted(buckets):
    m = max(buckets[b]); line.append("#" if m > 8 else "+" if m > 2.5 else "." if m > 0.6 else "_")
  print("motion per 0.25s (_ static . subtle + moving # big):")
  for i in range(0, len(line), 40):
    print(f"  {i/4:5.1f}s {''.join(line[i:i+40])}")
  dead = []; run = 0
  for i, d in enumerate(diffs):
    run = run + 1 if d < 0.6 else 0
    if run == 10: dead.append(round((i - 9) / 20, 2))
  print("static stretches >=0.5s start at:", dead or "none")
  cuts = [round(i / 20, 2) for i, d in enumerate(diffs) if d > 25]
  print("hard cuts/flashes (big frame diffs):", cuts)
  dark = [round(i / 20, 2) for i, l in enumerate(luma) if l < 6]
  if dark: print(f"near-black frames: {len(dark)} (first {dark[:6]} ... last {dark[-3:]})")
  if aus:
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", v, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       stdin=subprocess.DEVNULL, capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    print("loudness:", " ".join(tail.split())[:300])


def frames(a):
  out = pathlib.Path(a.outdir); out.mkdir(parents=True, exist_ok=True)
  for t in a.t:
    f = out / f"t{t:06.2f}.jpg"
    sh(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", a.video, "-frames:v", "1",
        "-vf", f"scale={a.w}:-2", "-q:v", "2", str(f)])
    print(f)


def lint(a):
  """Static checks for the failure modes that cost review rounds. Exit 1 on errors."""
  import re
  d = pathlib.Path(a.project)
  html = (d / "index.html").read_text()
  js_files = [d / "app.js"] if (d / "app.js").exists() else []
  js = "\n".join(f.read_text() for f in js_files)
  css = (d / "common.css").read_text() if (d / "common.css").exists() else ""
  inline_js = "\n".join(re.findall(r"<script>(.*?)</script>", html, re.S))
  errs, warns = [], []

  if not re.search(r"window\.__timelines\[\s*[\"']main[\"']\s*\]\s*=", html):
    errs.append("index.html must assign window.__timelines[\"main\"] inline (hyperframes StaticGuard)")
  if re.search(r"<script[^>]+src=[\"']https?://", html):
    errs.append("CDN <script src=http...>: vendor every library locally")
  for pat, why in [(r"Math\.random\(", "Math.random() at render time is non-deterministic (seed a PRNG)"),
                   (r"requestAnimationFrame|setInterval\(", "rAF/setInterval don't advance when HyperFrames seeks"),
                   (r"@keyframes", "CSS @keyframes don't follow the seeked timeline")]:
    for name, src in [("app.js", js), ("index.html", inline_js + html if pat == "@keyframes" else inline_js), ("common.css", css)]:
      if re.search(pat, src):
        errs.append(f"{name}: {why}")
  # immediateRender:false placed in fromTo FROM vars (2nd arg) is ignored by GSAP
  for m in re.finditer(r"fromTo\(\s*[^,]+,\s*\{([^{}]*)\}\s*,\s*\{", js):
    if "immediateRender" in m.group(1):
      line = js[:m.start()].count("\n") + 1
      errs.append(f"app.js:{line}: immediateRender in fromTo FROM vars is ignored; move it to the TO vars")
  # motion paths must be <path>, not circle/ellipse
  for m in re.finditer(r"path:\s*[\"']#([\w-]+)[\"']", js):
    tag = re.search(rf"<(\w+)[^>]*id=[\"']{m.group(1)}[\"']", html)
    if tag and tag.group(1) in ("circle", "ellipse"):
      errs.append(f"motionPath #{m.group(1)} is a <{tag.group(1)}>; use a <path> (crashes HyperFrames bootstrap)")
  # non-initial scene layers must start hidden
  scenes = re.findall(r"<div[^>]*class=[\"'][^\"']*scene-layer[^\"']*[\"'][^>]*>", html)
  for s in scenes[1:]:
    if "visibility:hidden" not in s.replace(" ", ""):
      errs.append(f"non-initial scene starts visible (add style=\"visibility:hidden\"): {s[:90]}")
  for s in re.findall(r"<(?!linearGradient|radialGradient|filter|clipPath|mask|fe)[^>]*id=[\"'][^\"']*(?:shockwave|burst|specular|spec\b)[^\"']*[\"'][^>]*>", html):
    if "visibility:hidden" not in s.replace(" ", "") and "flash-overlay" not in s:
      warns.append(f"impact element not hidden in HTML (pre-visible ring/burst risk): {s[:90]}")
  # tiny text
  for name, src in [("common.css", css), ("index.html", html)]:
    for m in re.finditer(r"font-size\s*[:=]\s*[\"']?(\d+(?:\.\d+)?)px", src):
      if float(m.group(1)) < 48:
        line = src[:m.start()].count("\n") + 1
        ctx = src[max(0, src.rfind("\n", 0, m.start())):src.find("\n", m.end())]
        if "lint-ok" not in ctx:
          errs.append(f"{name}:{line}: font-size {m.group(1)}px < 48px (HUD micro-text); mark 'lint-ok' only for motif labels")
    for m in re.finditer(r"font-size=[\"'](\d+(?:\.\d+)?)[\"']", src):
      if float(m.group(1)) < 48:
        line = src[:m.start()].count("\n") + 1
        if "lint-ok" not in src[src.rfind("\n", 0, m.start()):src.find("\n", m.end())]:
          errs.append(f"{name}:{line}: SVG font-size {m.group(1)} < 48")
  # opacity-driven text reveals (warn)
  for m in re.finditer(r"\.(?:from|fromTo)\(\s*([^,]+),\s*\{[^{}]*\bopacity:\s*0\b", js):
    line = js[:m.start()].count("\n") + 1
    warns.append(f"app.js:{line}: opacity:0 reveal on {m.group(1).strip()[:40]}; for text use masked slide / scale pop")
  for w in warns: print("WARN ", w)
  for e in errs: print("ERROR", e)
  print(f"lint: {len(errs)} errors, {len(warns)} warnings")
  sys.exit(1 if errs else 0)


def main():
  p = argparse.ArgumentParser(); sp = p.add_subparsers(dest="cmd", required=True)
  s = sp.add_parser("frames"); s.add_argument("video"); s.add_argument("outdir")
  s.add_argument("--t", type=float, nargs="+", required=True); s.add_argument("--w", type=int, default=960)
  s = sp.add_parser("lint"); s.add_argument("project")
  s = sp.add_parser("sheets"); s.add_argument("video"); s.add_argument("outdir")
  s.add_argument("--fps", type=float, default=2); s.add_argument("--cols", type=int, default=4)
  s.add_argument("--rows", type=int, default=4); s.add_argument("--tile", type=int, default=384)
  s = sp.add_parser("strip"); s.add_argument("video"); s.add_argument("out")
  s.add_argument("--start", type=float, required=True); s.add_argument("--end", type=float, required=True)
  s.add_argument("--n", type=int, default=8); s.add_argument("--tile", type=int, default=384)
  s = sp.add_parser("frame"); s.add_argument("video"); s.add_argument("out")
  s.add_argument("--t", type=float, required=True); s.add_argument("--w", type=int, default=960)
  s = sp.add_parser("stats"); s.add_argument("video")
  a = p.parse_args()
  {"sheets": sheets, "strip": strip, "frame": frame, "stats": stats, "frames": frames, "lint": lint}[a.cmd](a)


if __name__ == "__main__":
  main()
