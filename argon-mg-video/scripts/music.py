#!/usr/bin/env python3
"""Generate an instrumental music bed with Lyria via the Gemini API (stdlib only).

usage: music.py --prompt "Minimal R&B hip-hop instrumental, 64 bpm ..." --out audio/raw_music.wav
       [--model lyria-3-pro-preview] [--prompt-file p.txt]

API key: $GEMINI_API_KEY (or $GOOGLE_API_KEY), else GEMINI_API_KEY=... in ~/.config/argon-mg-video/.env.
The API returns MP3 for Lyria; the output extension is corrected automatically (.wav -> .mp3) and the
real path is printed. Convert with:  ffmpeg -i audio/raw_music.mp3 -ar 44100 -ac 2 audio/raw_music.wav
Lyria blocks some words (e.g. "keynote", "marimba") with PROHIBITED_CONTENT; rephrase if that happens.
"""
import argparse, base64, json, os, pathlib, sys, time, urllib.error, urllib.request

API = "https://generativelanguage.googleapis.com/v1beta"


def api_key() -> str:
  for name in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
    if os.environ.get(name):
      return os.environ[name]
  env = pathlib.Path.home() / ".config/argon-mg-video/.env"
  if env.exists():
    for line in env.read_text().splitlines():
      if line.strip().startswith(("GEMINI_API_KEY=", "GOOGLE_API_KEY=")):
        return line.split("=", 1)[1].strip().strip('"').strip("'")
  sys.exit("set GEMINI_API_KEY (or put it in ~/.config/argon-mg-video/.env)")


def walk(node):
  if isinstance(node, dict):
    yield node
    for v in node.values():
      yield from walk(v)
  elif isinstance(node, list):
    for v in node:
      yield from walk(v)


def generate(prompt: str, model: str, retries: int = 4) -> tuple[bytes, str]:
  body = json.dumps({"contents": [{"role": "user", "parts": [{"text": prompt}]}]}).encode()
  url = f"{API}/models/{model}:generateContent"
  for attempt in range(retries + 1):
    req = urllib.request.Request(url, data=body, method="POST",
                                 headers={"Content-Type": "application/json", "x-goog-api-key": api_key()})
    try:
      with urllib.request.urlopen(req, timeout=420) as r:
        resp = json.loads(r.read())
      break
    except urllib.error.HTTPError as e:
      msg = e.read().decode(errors="replace")[:600]
      if e.code in (429, 500, 502, 503, 504) and attempt < retries:
        time.sleep(3 * 2 ** attempt); continue
      sys.exit(f"HTTP {e.code}: {msg}")
    except (TimeoutError, urllib.error.URLError) as e:
      if attempt < retries:
        time.sleep(3 * 2 ** attempt); continue
      sys.exit(f"network error: {e}")
  blocks = [d for d in walk(resp) if isinstance(d.get("data"), str)
            and str(d.get("mimeType", d.get("mime_type", ""))).startswith("audio")]
  if not blocks:
    sys.exit("no audio in response (blocked prompt?): " + json.dumps(resp)[:600])
  b = blocks[-1]
  return base64.b64decode(b["data"]), b.get("mimeType") or b.get("mime_type", "")


def main():
  p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
  p.add_argument("--prompt"); p.add_argument("--prompt-file")
  p.add_argument("--model", default="lyria-3-pro-preview")
  p.add_argument("--out", required=True)
  a = p.parse_args()
  prompt = a.prompt or (pathlib.Path(a.prompt_file).read_text() if a.prompt_file else None)
  if not prompt:
    sys.exit("--prompt or --prompt-file required")
  data, mime = generate(prompt, a.model)
  ext = {"audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/wav": ".wav", "audio/x-wav": ".wav"}.get(mime)
  out = pathlib.Path(a.out)
  if ext and out.suffix != ext:
    out = out.with_suffix(ext)
  out.parent.mkdir(parents=True, exist_ok=True)
  out.write_bytes(data)
  print(out)


if __name__ == "__main__":
  main()
