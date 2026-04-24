#!/usr/bin/env bash
#
# Production deploy: rebuild Next.js container, then invalidate Cloudflare cache
# so visitors do not keep old HTML/assets at the edge.
#
# --- If the public site still looks old after deploy, check manually ---
# 1) Cloudflare: Caching > Configuration > Purge Everything (or use this script).
# 2) Cloudflare: Caching > Configuration > Development Mode = On (3h; bypasses cache).
# 3) Origin vs hostname: curl -sI http://127.0.0.1:3000/en and curl -sI https://YOURDOMAIN/en
#    Compare cache headers; origin should be "fresh" after container restart; public lags until purge.
# 4) Page Rules / Cache Rules: avoid caching HTML for dynamic routes if you still see staleness.
#
# Optional env file (not committed): repo root .env.deploy
#   CLOUDFLARE_API_TOKEN=...   # Zone > Cache Purge + Zone > Zone Settings Edit
#   CLOUDFLARE_ZONE_ID=...
#   CF_ENABLE_DEV_MODE_ON_DEPLOY=1   # optional: turn on Dev Mode after purge (3h)
#   DEPLOY_VERIFY_PUBLIC_URL=https://omanphoto.com/en
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}/docker"

if [[ -f "${ROOT}/.env.deploy" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT}/.env.deploy"
  set +a
fi

echo "=== docker compose: build web ==="
docker compose build web

echo "=== docker compose: up -d web ==="
docker compose up -d web

echo "=== waiting for app to listen ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf --max-time 2 "http://127.0.0.1:3000/en" -o /dev/null; then
    break
  fi
  sleep 1
done

ORIGIN_SNIP="$(curl -sS --max-time 15 "http://127.0.0.1:3000/en" | tr '\n' ' ' | head -c 4000)"
if echo "$ORIGIN_SNIP" | grep -q "_next/static"; then
  echo "=== origin: OK (served Next HTML with _next/static) ==="
else
  echo "=== origin: warning — unexpected response from 127.0.0.1:3000/en ===" >&2
fi

TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-${CF_AUTH_TOKEN:-}}}"
ZONE="${CLOUDFLARE_ZONE_ID:-${CF_ZONE_ID:-}}"

if [[ -n "$TOKEN" && -n "$ZONE" ]]; then
  echo "=== Cloudflare: purge cache ==="
  "${ROOT}/scripts/cloudflare-purge-cache.sh"

  if [[ "${CF_ENABLE_DEV_MODE_ON_DEPLOY:-0}" == "1" ]]; then
    echo "=== Cloudflare: enable Development Mode (3h) ==="
    CF_DEV_MODE_VALUE=on "${ROOT}/scripts/cloudflare-development-mode.sh"
  fi
else
  echo "=== Cloudflare: skipped (set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID in .env.deploy) ===" >&2
fi

if [[ -n "${DEPLOY_VERIFY_PUBLIC_URL:-}" ]]; then
  echo "=== verify public URL (first 120 bytes of body) ==="
  curl -sS --max-time 25 -L "${DEPLOY_VERIFY_PUBLIC_URL}" | head -c 120 | tr '\n' ' ' || true
  echo
fi

echo "=== deploy finished ==="
