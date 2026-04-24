#!/usr/bin/env bash
# Purge Cloudflare CDN cache for the zone (fixes stale HTML/JS after deploy).
# Requires: CLOUDFLARE_ZONE_ID, and one of CLOUDFLARE_API_TOKEN | CF_API_TOKEN | CF_AUTH_TOKEN
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-${CF_AUTH_TOKEN:-}}}"
ZONE="${CLOUDFLARE_ZONE_ID:-${CF_ZONE_ID:-}}"

if [[ -z "$TOKEN" || -z "$ZONE" ]]; then
  echo "cloudflare-purge-cache: missing CLOUDFLARE_ZONE_ID or API token (CLOUDFLARE_API_TOKEN / CF_API_TOKEN / CF_AUTH_TOKEN)" >&2
  exit 1
fi

PAYLOAD='{"purge_everything":true}'
if [[ "${CF_PURGE_HOSTNAMES_ONLY:-}" == "1" ]] && [[ -n "${CF_PURGE_HOSTNAMES:-}" ]]; then
  # Example CF_PURGE_HOSTNAMES: '["omanphoto.com","www.omanphoto.com"]'
  PAYLOAD="{\"hosts\":${CF_PURGE_HOSTNAMES}}"
fi

resp="$(curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data "${PAYLOAD}")"

if echo "$resp" | grep -q '"success":true'; then
  echo "cloudflare-purge-cache: purge requested successfully."
else
  echo "cloudflare-purge-cache: API error:" >&2
  echo "$resp" | head -c 2000 >&2
  exit 1
fi
