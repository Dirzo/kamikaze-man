#!/usr/bin/env bash
# Real Chrome regression tests with all manifests/sprites and the native ES module graph loaded.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=${PORT:-8878}
CHROME=${CHROME:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)}
OUT=${SMOKE_OUT:-$(mktemp -d)}
mkdir -p "$OUT"
python3 -m http.server "$PORT" --directory public >"$OUT/http.log" 2>&1 &
SERVER=$!
trap 'kill $SERVER >/dev/null 2>&1 || true' EXIT
sleep 0.8
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --window-size=1460,950 \
  --virtual-time-budget=12000 --dump-dom "http://127.0.0.1:$PORT/?smoke" >"$OUT/dom.html" 2>"$OUT/chrome.log"
python3 - "$OUT/dom.html" <<'PY'
import sys,re,html
s=open(sys.argv[1]).read()
m=re.search(r'<pre id="smoke-results">(.*?)</pre>',s,re.S)
print(html.unescape(m[1]) if m else 'Browser tests did not finish')
assert 'data-smoke="pass"' in s, 'Browser regression failure: inspect dom.html and chrome.log'
PY
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --window-size=1460,950 \
  --virtual-time-budget=3000 --screenshot="$OUT/title.png" "http://127.0.0.1:$PORT/" 2>>"$OUT/chrome.log"

for scene in combat canyon depths forge bag late; do
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --window-size=1460,950 \
    --virtual-time-budget=3000 --screenshot="$OUT/$scene.png" "http://127.0.0.1:$PORT/?capture=$scene" 2>>"$OUT/chrome.log"
done

CHROME="$CHROME" PORT="$PORT" SMOKE_OUT="$OUT" node tests/mobile-check.mjs
