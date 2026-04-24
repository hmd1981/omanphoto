#!/usr/bin/env bash
# Assert HTML from origin and/or public URL contains deploy markers (layout metadata).
# Markers: substring "ai-studio" and booking path "/en/contact" (see app/app/layout.tsx).
set -euo pipefail

MARKER_AI="ai-studio"
MARKER_BOOKING="/en/contact"

verify_html() {
  local label=$1
  local url=$2
  local html
  if ! html=$(curl -sS -f -L --max-time 45 "$url"); then
    echo "{\"verify\":\"fail\",\"reason\":\"curl\",\"label\":\"${label}\",\"url\":\"${url}\"}"
    return 1
  fi
  if ! echo "$html" | grep -Fq "$MARKER_AI"; then
    echo "{\"verify\":\"fail\",\"reason\":\"missing_ai-studio\",\"label\":\"${label}\",\"url\":\"${url}\"}"
    return 1
  fi
  if ! echo "$html" | grep -Fq "$MARKER_BOOKING"; then
    echo "{\"verify\":\"fail\",\"reason\":\"missing_booking_route\",\"label\":\"${label}\",\"url\":\"${url}\"}"
    return 1
  fi
  echo "{\"verify\":\"ok\",\"label\":\"${label}\",\"url\":\"${url}\"}"
  return 0
}

ORIGIN="${DEPLOY_VERIFY_ORIGIN_URL:-http://127.0.0.1:3000/en}"
verify_html "origin" "$ORIGIN" || exit 1

PUBLIC="${DEPLOY_VERIFY_PUBLIC_URL:-}"
if [[ -n "$PUBLIC" ]]; then
  retries="${DEPLOY_VERIFY_PUBLIC_RETRIES:-10}"
  delay="${DEPLOY_VERIFY_PUBLIC_RETRY_DELAY_SEC:-4}"
  for ((i = 1; i <= retries; i++)); do
    if verify_html "public" "$PUBLIC"; then
      exit 0
    fi
    echo "{\"verify\":\"retry\",\"attempt\":${i},\"max\":${retries},\"wait_sec\":${delay}}" >&2
    sleep "$delay"
  done
  exit 1
fi

exit 0
