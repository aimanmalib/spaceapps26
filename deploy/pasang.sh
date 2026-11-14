#!/usr/bin/env bash
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
# Deploy the static site. Idempotent. Reads host-specific names from deploy/hos.env (not in git; see hos.env.example).
#
#   bash deploy/pasang.sh           # build HEAD → copy to deploy/live → wait for DNS → container → proxy route → live check
#   bash deploy/pasang.sh --semak   # live check only (DNS, HTTPS + valid certificate, served commit = HEAD)
#   bash deploy/pasang.sh --undur   # roll back: remove proxy route + container (the DNS record is managed outside this repo)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
HOST=spaceapps26.aimanmalib.com
CTR=spaceapps26-web
ROUTE_FILE=spaceapps26.yaml
say() { echo "pasang: $*"; }
die() { echo "pasang: FAILED — $*" >&2; exit 1; }

[ -f "$HERE/hos.env" ] || die "deploy/hos.env missing (copy deploy/hos.env.example)"
# shellcheck disable=SC1091
set -a; . "$HERE/hos.env"; set +a
for v in PROXY_NET PROXY_CTR PROXY_DYNAMIC_DIR ORIGIN_IP; do [ -n "${!v:-}" ] || die "$v empty in deploy/hos.env"; done
grep -q "Host(\`$HOST\`)" "$HERE/traefik.yaml" || die "traefik.yaml does not route $HOST"
compose() { docker compose -p spaceapps26 --env-file "$HERE/hos.env" -f "$HERE/compose.yaml" "$@"; }
head_sha() { git -C "$ROOT" rev-parse HEAD; }

check_once() {  # rc 0 = live; reason on stdout
  local t ip; t="$(mktemp -d)"; trap 'rm -rf "$t"' RETURN
  ip="$(dig +short "$HOST" @1.1.1.1 | tail -1)"
  [ "$ip" = "$ORIGIN_IP" ] || { echo "dig $HOST = '$ip', expected $ORIGIN_IP (DNS-only)"; return 1; }
  # No -k: curl fails unless the certificate is valid for the name.
  curl -sS --max-time 20 -o "$t/b" -D "$t/h" "https://$HOST/" 2>"$t/e" || { echo "https: $(tail -1 "$t/e")"; return 1; }
  head -1 "$t/h" | grep -q ' 200' || { echo "GET / → $(head -1 "$t/h")"; return 1; }
  grep -qi '^content-security-policy:' "$t/h" || { echo "GET / without CSP header"; return 1; }
  curl -sS --max-time 20 -o "$t/v" "https://$HOST/version.json" || { echo "version.json unreachable"; return 1; }
  grep -q "\"$(head_sha)\"" "$t/v" || { echo "served commit ≠ HEAD ($(tr -d '\n' < "$t/v"))"; return 1; }
  curl -sS --max-time 20 -o /dev/null -D "$t/r" "http://$HOST/" || { echo "http unreachable"; return 1; }
  head -1 "$t/r" | grep -qE ' 30[18]' || { echo "http:// does not redirect"; return 1; }
  return 0
}

check() {  # a new route needs time for the certificate: retry 9 × 10 s before declaring failure
  local i m
  for i in 1 2 3 4 5 6 7 8 9; do
    if m="$(check_once)"; then say "live check PASSED (attempt $i): $HOST → $ORIGIN_IP, valid certificate, GET / 200, commit $(head_sha | cut -c1-7)"; return 0; fi
    say "attempt $i: $m — waiting 10 s"; sleep 10
  done
  return 1
}

case "${1:-}" in
  --semak) check || die "live check"; exit 0 ;;
  --undur)
    say "remove proxy route"; docker exec "$PROXY_CTR" rm -f "$PROXY_DYNAMIC_DIR/$ROUTE_FILE"
    say "remove container"; docker rm -fv "$CTR" >/dev/null 2>&1 || true
    exit 0 ;;
  "") ;;
  *) die "unknown argument: $1 (--semak | --undur)" ;;
esac

# 0. Deploy = HEAD: refuse uncommitted changes to tracked files.
git -C "$ROOT" diff --quiet HEAD -- || die "uncommitted changes — commit first (the live site must equal HEAD)"
free_gb="$(df -BG --output=avail / | tail -1 | tr -dc 0-9)"
[ "$free_gb" -ge 20 ] || die "only ${free_gb} GB free on / (need ≥ 20)"

# 1. Build, then copy into deploy/live in place (the bind mount follows the folder, so it is never replaced).
(cd "$ROOT" && npx --no-install vite build --logLevel error)
mkdir -p "$HERE/live"
rsync -a --delete "$ROOT/dist/" "$HERE/live/"
printf '{"commit": "%s"}\n' "$(head_sha)" > "$HERE/live/version.json"
say "built $(head_sha | cut -c1-7) → deploy/live"

# 2. DNS must answer before the route exists (HTTP-01: route first = certificate fails and is not retried soon).
for _ in $(seq 1 30); do [ "$(dig +short "$HOST" @1.1.1.1 | tail -1)" = "$ORIGIN_IP" ] && break; sleep 4; done
[ "$(dig +short "$HOST" @1.1.1.1 | tail -1)" = "$ORIGIN_IP" ] || die "dig $HOST @1.1.1.1 does not answer $ORIGIN_IP — route NOT installed"

# 3. Container. --force-recreate: single-file mounts are bound to the inode, edited configs need a new container.
compose up -d --force-recreate >/dev/null
docker exec "$CTR" nginx -t 2>&1 | tail -1
docker exec "$CTR" cat /etc/nginx/conf.d/default.conf | cmp -s - "$HERE/nginx.conf" || die "nginx.conf in container ≠ repo"
docker exec "$CTR" cat /etc/nginx/headers.conf | cmp -s - "$HERE/nginx-headers.conf" || die "nginx-headers.conf in container ≠ repo"

# 4. Route: copy only when different (every copy reloads the proxy).
if docker exec "$PROXY_CTR" cat "$PROXY_DYNAMIC_DIR/$ROUTE_FILE" 2>/dev/null | cmp -s - "$HERE/traefik.yaml"; then
  say "proxy route unchanged"
else
  docker cp "$HERE/traefik.yaml" "$PROXY_CTR:$PROXY_DYNAMIC_DIR/$ROUTE_FILE"; say "proxy route copied"
fi

# 5. Live check.
check || die "live check after 90 s (roll back: bash deploy/pasang.sh --undur)"
say "DONE https://$HOST/"
