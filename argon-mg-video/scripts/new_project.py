#!/usr/bin/env python3
"""Scaffold a motion-graphics video project from the skill template.

usage: new_project.py DIR --title "Gemini 4 Argon" [--hero "GEMINI 4"] [--signoff Google]
                      [--bpm 128] [--duration 30] [--fps 60]

Copies template/ (index.html, app.js, common.css, hyperframes.json, package.json, meta.json,
plan/storyboard.md), the vendored GSAP plugins and the font cache, plus symlinks the skill
scripts into DIR/tools. Run scripts/setup.sh first.
"""
import argparse, pathlib, re, shutil, sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path.home() / ".cache" / "argon-mg-video"


def main():
  p = argparse.ArgumentParser()
  p.add_argument("dir")
  p.add_argument("--title", required=True)
  p.add_argument("--hero", default=None, help="hero word(s) for the demo lockup (default: title upper-cased)")
  p.add_argument("--signoff", default="Google")
  p.add_argument("--bpm", type=float, default=128.0)
  p.add_argument("--duration", type=float, default=30.0)
  p.add_argument("--fps", type=int, default=60)
  p.add_argument("--force", action="store_true")
  a = p.parse_args()

  for need in [CACHE / "vendor" / "gsap.min.js", CACHE / "fonts" / "GoogleSansFlex.ttf"]:
    if not need.exists():
      sys.exit(f"missing {need}; run: bash {SKILL}/scripts/setup.sh")

  d = pathlib.Path(a.dir).expanduser().resolve()
  if (d / "index.html").exists() and not a.force:
    sys.exit(f"{d}/index.html exists (use --force to overwrite)")
  d.mkdir(parents=True, exist_ok=True)
  slug = re.sub(r"[^a-z0-9]+", "-", a.title.lower()).strip("-")
  subs = {"{{TITLE}}": a.title, "{{HERO}}": a.hero or a.title.upper(), "{{SIGNOFF}}": a.signoff,
          "{{BPM}}": f"{a.bpm:g}", "{{DURATION}}": f"{a.duration:g}", "{{FPS}}": str(a.fps), "{{SLUG}}": slug}
  for src in (SKILL / "template").rglob("*"):
    if src.is_dir():
      continue
    dst = d / src.relative_to(SKILL / "template")
    dst.parent.mkdir(parents=True, exist_ok=True)
    text = src.read_text()
    for k, v in subs.items():
      text = text.replace(k, v)
    dst.write_text(text)
  for sub in ["vendor", "fonts"]:
    (d / sub).mkdir(exist_ok=True)
    for f in (CACHE / sub).iterdir():
      if f.is_file():
        shutil.copy2(f, d / sub / f.name)
        (d / sub / f.name).chmod(0o644)
  for sub in ["audio", "out", "frames", "assets"]:
    (d / sub).mkdir(exist_ok=True)
  tools = d / "tools"
  if not tools.exists():
    tools.symlink_to(SKILL / "scripts")
  beat = 60.0 / a.bpm
  print(f"project: {d}\n  beat={beat:.5f}s bar={4*beat:.5f}s total_beats={a.duration/beat:.2f}")
  print(f"next: edit plan/storyboard.md, then\n  bash tools/render.sh {d} v0 --draft")


if __name__ == "__main__":
  main()
