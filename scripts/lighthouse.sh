#!/usr/bin/env bash
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
# Lighthouse scores of Compare and Overview on a local production build (ADR 0108). Prints a Markdown table.
# Lighthouse 12 runs through npx (npm cache, nothing installed in the project) with its default mobile settings;
# the browser is CHROME_PATH, or the newest Playwright Chromium in ~/.cache/ms-playwright. About one minute.
# Usage: bash scripts/lighthouse.sh [port]      (JSON reports go to $LH_OUT, default a new temporary folder)
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${1:-4193}"
OUT="${LH_OUT:-$(mktemp -d)}"
if [ -z "${CHROME_PATH:-}" ]; then
  CHROME_PATH="$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux*/chrome 2>/dev/null | sort -V | tail -1)"
fi
export CHROME_PATH
[ -x "$CHROME_PATH" ] || { echo "no Chromium: set CHROME_PATH" >&2; exit 1; }
npm run build > "$OUT/build.log" 2>&1
npx vite preview --port "$PORT" --strictPort > "$OUT/preview.log" 2>&1 &
PREVIEW=$!
trap 'kill $PREVIEW 2>/dev/null || true' EXIT
for _ in $(seq 30); do curl -sf "http://localhost:$PORT/" > /dev/null && break; sleep 1; done
for page in index overview; do
  path=""; [ "$page" = overview ] && path="overview.html"
  npx --yes lighthouse@12 "http://localhost:$PORT/$path" --quiet --chrome-flags="--headless=new --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$OUT/$page.json" > "$OUT/$page.log" 2>&1
done
python3 - "$OUT" <<'EOF'
import json, sys
print("| Page | Performance | Accessibility | Best practices | SEO |")
print("|---|---|---|---|---|")
for page, label in (("index", "Compare"), ("overview", "Overview")):
    r = json.load(open(f"{sys.argv[1]}/{page}.json"))
    c = r["categories"]
    score = lambda k: round(c[k]["score"] * 100)  # noqa: E731
    print(f"| {label} | {score('performance')} | {score('accessibility')} | {score('best-practices')} | {score('seo')} |")
print(f"\nLighthouse {r['lighthouseVersion']}, {r['configSettings']['formFactor']}, throttling {r['configSettings']['throttlingMethod']}; reports in {sys.argv[1]}")
EOF
