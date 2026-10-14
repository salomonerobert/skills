#!/usr/bin/env bash
# One-time setup for the argon-mg-video skill. Idempotent; safe to re-run.
# Creates:
#   ~/.cache/argon-mg-video/venv     python with librosa, scipy, numpy, soundfile, fonttools, brotli
#   ~/.cache/argon-mg-video/vendor   GSAP 3.14.2 + SplitText/DrawSVG/MorphSVG/MotionPath/CustomEase/ScrambleText
#   ~/.cache/argon-mg-video/fonts    Google Sans (+ subset variable Google Sans Flex < 2 MB) + OFL display fonts
# Also pre-fetches hyperframes@0.8.91 so the first check/render doesn't stall.
set -euo pipefail
C=~/.cache/argon-mg-video
mkdir -p "$C/vendor" "$C/fonts"

# ---- python venv ----
if [ ! -x "$C/venv/bin/python" ]; then
  python3 -m venv "$C/venv"
fi
if ! "$C/venv/bin/python" -c "import librosa, scipy, soundfile, fontTools" 2>/dev/null; then
  UV=$(command -v uv || echo ~/.local/bin/uv)
  if [ -x "$UV" ]; then
    "$UV" pip install --python "$C/venv/bin/python" librosa soundfile scipy numpy fonttools brotli
  else
    "$C/venv/bin/pip" install -q librosa soundfile scipy numpy fonttools brotli
  fi
fi

# ---- GSAP (all plugins free since 3.13; vendored, never CDN at render time) ----
for f in gsap.min.js SplitText.min.js DrawSVGPlugin.min.js MorphSVGPlugin.min.js MotionPathPlugin.min.js CustomEase.min.js ScrambleTextPlugin.min.js; do
  [ -s "$C/vendor/$f" ] || curl -sfL "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/$f" -o "$C/vendor/$f"
done

# ---- fonts ----
LF=~/.local/share/fonts
G=https://github.com/google/fonts/raw/main/ofl
PYV="$C/venv/bin/python"
# Static Google Sans Regular/Bold: local copy if installed, else instance the OFL variable font from google/fonts.
for spec in "Regular:400" "Bold:700"; do
  n=${spec%%:*}; w=${spec##*:}
  if [ ! -s "$C/fonts/GoogleSans-$n.ttf" ]; then
    if [ -f "$LF/GoogleSans-$n.ttf" ]; then cp "$LF/GoogleSans-$n.ttf" "$C/fonts/"; chmod u+w "$C/fonts/GoogleSans-$n.ttf"
    else
      [ -s "$C/fonts/GoogleSansVar.ttf" ] || curl -sfL "$G/googlesans/GoogleSans%5BGRAD,opsz,wght%5D.ttf" -o "$C/fonts/GoogleSansVar.ttf"
      # (slow: ~1 min per weight) then subset under HyperFrames' 2 MB inline limit
      "$C/venv/bin/fonttools" varLib.instancer "$C/fonts/GoogleSansVar.ttf" wght=$w GRAD=0 opsz=17 -o "$C/fonts/gs_tmp.ttf"
      "$C/venv/bin/pyftsubset" "$C/fonts/gs_tmp.ttf" --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2190-21FF,U+25A0-27BF" \
        --output-file="$C/fonts/GoogleSans-$n.ttf" && rm -f "$C/fonts/gs_tmp.ttf"
    fi
  fi
done
rm -f "$C/fonts/GoogleSansVar.ttf"
# Variable Google Sans Flex (keep wght/wdth/slnt live). HyperFrames won't inline fonts > 2 MB:
# pin every other axis present and subset to Latin.
if [ ! -s "$C/fonts/GoogleSansFlex.ttf" ]; then
  FLEX=$(ls "$LF"/GoogleSansFlex*.ttf 2>/dev/null | head -1 || true)
  if [ -z "$FLEX" ]; then
    FLEX="$C/fonts/flex_src.ttf"
    curl -sfL "$G/googlesansflex/GoogleSansFlex%5BROND,opsz,slnt,wdth,wght%5D.ttf" -o "$FLEX"
  fi
  PINS=$("$PYV" -c "
import sys; from fontTools.ttLib import TTFont
ax=[a.axisTag for a in TTFont(sys.argv[1])['fvar'].axes]
print(' '.join({'GRAD':'GRAD=0','ROND':'ROND=0','opsz':'opsz=72'}[t] for t in ax if t in ('GRAD','ROND','opsz')))" "$FLEX")
  "$C/venv/bin/fonttools" varLib.instancer "$FLEX" $PINS -o "$C/fonts/tmp_flex.ttf"
  "$C/venv/bin/pyftsubset" "$C/fonts/tmp_flex.ttf" \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2190-21FF,U+25A0-27BF" \
    --output-file="$C/fonts/GoogleSansFlex.ttf"
  rm -f "$C/fonts/tmp_flex.ttf" "$C/fonts/flex_src.ttf"
fi
getfont() { [ -s "$C/fonts/$2" ] || curl -sfL "$G/$1" -o "$C/fonts/$2"; }
getfont "instrumentserif/InstrumentSerif-Regular.ttf" "InstrumentSerif-Regular.ttf"
getfont "instrumentserif/InstrumentSerif-Italic.ttf" "InstrumentSerif-Italic.ttf"
getfont "bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf" "BigShouldersDisplay.ttf"
getfont "anton/Anton-Regular.ttf" "Anton-Regular.ttf"
getfont "jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" "JetBrainsMono.ttf"

# ---- hyperframes prefetch (CI=1 + closed stdin or pnpm hangs on an invisible prompt) ----
PNPM=$(command -v pnpm || echo ~/.local/bin/pnpm)
CI=1 "$PNPM" dlx hyperframes@0.8.91 --version </dev/null >/dev/null 2>&1 || true

echo "venv:   $C/venv/bin/python"
echo "vendor: $(ls "$C/vendor" | tr '\n' ' ')"
echo "fonts:  $(ls "$C/fonts" | tr '\n' ' ')"
for f in gsap.min.js SplitText.min.js MorphSVGPlugin.min.js; do [ -s "$C/vendor/$f" ] || { echo "MISSING vendor/$f"; exit 1; }; done
for f in GoogleSansFlex.ttf InstrumentSerif-Italic.ttf BigShouldersDisplay.ttf; do [ -s "$C/fonts/$f" ] || { echo "MISSING fonts/$f"; exit 1; }; done
echo "setup OK"
