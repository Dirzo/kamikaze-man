#!/usr/bin/env bash
# Runs every in-game self-test in headless Chrome against public/ and fails if any
# reports "fail" or reports fewer "pass" proofs than expected.
#
#   bash crazy-weapon-man-site/tests/smoke.sh            (uses chrome/chromium on PATH)
#   CHROME=/path/to/chrome bash crazy-weapon-man-site/tests/smoke.sh
#
# Each line below is: <query string> <minimum number of data-cwm-*="pass" attributes>.
# The self-tests live in the game code and are switched on by these query flags. They check the
# legacy procedural visuals, so they run with the pixel renderer off (nopx); a separate check
# below makes sure the pixel renderer itself loads its art.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=${PORT:-8877}
CHROME=${CHROME:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)}
OUT=$(mktemp -d)

python3 -m http.server "$PORT" --directory public >"$OUT/http.log" 2>&1 &
SERVER=$!
trap 'kill $SERVER >/dev/null 2>&1 || true' EXIT
sleep 0.8

SUITES='
? 4
?animationSmoke=1 9
?hordeShowcase=1&feedbackShowcase=1 4
?nightmareShowcase=1 10
?nightmareSmoke=1 11
?waveShopSmoke=1 10
?chaosSmoke=1 7
?readabilitySmoke=1 7
?impactSmoke=1 5
?knockSmoke=1 5
?enemyContactSmoke=1 5
?characterIdentitySmoke=1 4
?characterIdentityV27Smoke=1 4
?characterV29Smoke=1&runtimeV28Smoke=1 7
?rarityV30Smoke=1&characterV29Smoke=1&runtimeV28Smoke=1 8
?lootV31Smoke=1&runtimeV28Smoke=1 6
?lootV31Showcase=1 4
?cheapV32Smoke=1&runtimeV28Smoke=1 7
?cheapV32Showcase=1 4
'

failed=0
while read -r query want; do
  [ -z "$query" ] && continue
  dom="$OUT/dom.html"
  if [ "$query" = "?" ]; then url="?nopx=1"; else url="$query&nopx=1"; fi
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --window-size=1500,820 \
    --virtual-time-budget=9000 --dump-dom "http://127.0.0.1:$PORT/$url" >"$dom" 2>"$OUT/chrome.log" || true
  passes=$(grep -oE 'data-cwm-[a-z0-9-]+="pass"' "$dom" | sort -u | wc -l)
  fails=$(grep -oE 'data-cwm-[a-z0-9-]+="fail"' "$dom" | sort -u || true)
  if [ -n "$fails" ] || [ "$passes" -lt "$want" ]; then
    echo "FAIL $query: $passes/$want passes ${fails//$'\n'/ }"
    failed=1
  else
    echo "ok   $query: $passes passes"
  fi
done <<<"$SUITES"
# Pixel renderer: art manifest + sprites load and the renderer reports ready.
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --window-size=1500,820 \
  --virtual-time-budget=6000 --dump-dom "http://127.0.0.1:$PORT/" >"$OUT/px.html" 2>"$OUT/chrome.log" || true
if grep -q 'data-cwm-px="ready"' "$OUT/px.html"; then
  echo "ok   pixel renderer ready"
else
  echo "FAIL pixel renderer: $(grep -o 'data-cwm-px="[a-z]*"' "$OUT/px.html" || echo 'no status')"
  failed=1
fi
exit $failed
