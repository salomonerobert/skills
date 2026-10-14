#!/usr/bin/env bash
# check -> render -> mux audio -> verify -> contact sheets -> stats.
# usage: render.sh PROJECT_DIR vN [--draft] [--audio audio/master.wav]
#   --draft   30 fps, quality draft (fast iteration). Final renders are 60 fps / high.
set -euo pipefail
P=$(cd "$1" && pwd); V=$2; shift 2
DRAFT=0; AUDIO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --draft) DRAFT=1 ;;
    --audio) AUDIO=$2; shift ;;
    *) echo "unknown arg $1"; exit 2 ;;
  esac; shift
done
S=$(dirname "$(readlink -f "$0")")
PY=~/.cache/argon-mg-video/venv/bin/python; [ -x "$PY" ] || PY=python3
PNPM=$(command -v pnpm || echo "$HOME/.local/bin/pnpm")
HF="$PNPM dlx hyperframes@0.8.91"
cd "$P"; mkdir -p out frames

echo "== static lint"; python3 "$S/review.py" lint "$P" || { echo "lint failed: fix the items above"; exit 1; }
echo "== hyperframes check"; CI=1 $HF check </dev/null
if [ $DRAFT = 1 ]; then FPS=30; Q=draft; else FPS=60; Q=high; fi
echo "== render ($FPS fps, $Q)"
CI=1 $HF render --fps $FPS --quality $Q --workers 4 -o "out/${V}_silent.mp4" . </dev/null

if [ -z "$AUDIO" ]; then
  for c in audio/master.wav audio/music_30s.wav; do [ -f "$c" ] && AUDIO=$c && break; done
fi
if [ -n "$AUDIO" ] && [ -f "$AUDIO" ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/${V}_silent.mp4")
  ffmpeg -nostdin -y -v error -i "out/${V}_silent.mp4" -i "$AUDIO" -c:v copy -c:a aac -b:a 192k \
    -t "$DUR" -movflags +faststart "out/${V}.mp4"
else
  echo "(no audio found; output is silent)"; cp "out/${V}_silent.mp4" "out/${V}.mp4"
fi

echo "== verify"
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of compact "out/${V}.mp4"
python3 "$S/review.py" sheets "out/${V}.mp4" "frames/${V}" --fps 2
python3 "$S/review.py" stats "out/${V}.mp4"
echo "done: $P/out/${V}.mp4  (contact sheets in frames/${V}/)"
