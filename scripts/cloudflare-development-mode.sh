#!/usr/bin/env bash
# Toggle Cloudflare Development Mode (bypasses edge cache ~3 hours when "on").
# Usage: CF_DEV_MODE_VALUE=on|off ./cloudflare-development-mode.sh
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-${CF_AUTH_TOKEN:-}}}"
ZONE="${CLOUDFLARE_ZONE_ID:-${CF_ZONE_ID:-}}"
VAL="${CF_DEV_MODE_VALUE:-on}"

if [[ -z "$TOKEN" || -z "$ZONE" ]]; then
  echo "cloudflare-development-mode: missing CLOUDFLARE_ZONE_ID or API token" >&2
  exit 1
fi

if [[ "$VAL" != "on" && "$VAL" != "off" ]]; then
  echo "cloudflare-development-mode: CF_DEV_MODE_VALUE must be on or off" >&2
  exit 1
fi

resp="$(curl -sS -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/${ZONE}/settings/development_mode" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{\"value\":\"${VAL}\"}")"

if echo "$resp" | grep -q '"success":true'; then
  echo "cloudflare-development-mode: set to ${VAL}."
else
  echo "cloudflare-development-mode: API error:" >&2
  echo "$resp" | head -c 2000 >&2
  exit 1
fi
