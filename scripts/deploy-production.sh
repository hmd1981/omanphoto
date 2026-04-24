#!/usr/bin/env bash
#
# Production deploy: Docker web image, optional nginx check/reload, Cloudflare purge (+ optional Dev Mode),
# then assert public HTML matches origin (deploy markers).
#
# Manual checks (DNS / wrong origin): compare dig A/AAAA for your hostname vs this server's public IP.
#
# Env file (optional): repo root `.env.deploy` — see scripts/env.deploy.example
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${DEPLOY_LOG_PATH:-${ROOT}/.deploy-last.log}"

if [[ -f "${ROOT}/.env.deploy" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT}/.env.deploy"
  set +a
fi

# Optional: same-host Postgres URL for preflight (only used if .env.deploy did not set DATABASE_URL).
if [[ -z "${DATABASE_URL:-}" && -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ROOT}/.env"
  set +a
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "=== check-env (deploy preflight) ===" | tee -a "$LOG"
  "${ROOT}/scripts/check-env.sh" 2>&1 | tee -a "$LOG" || exit 1
fi

NEXT_PUBLIC_BUILD_ID="$(cd "$ROOT" && git rev-parse --short HEAD 2>/dev/null || echo nogit)"
NEXT_PUBLIC_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export NEXT_PUBLIC_BUILD_ID
export NEXT_PUBLIC_BUILD_TIME

"${ROOT}/docker/validate-build-stamps.sh" 2>&1 | tee -a "$LOG"

{
  echo "========================================"
  echo "deploy_start_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}"
  echo "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"
} | tee -a "$LOG"

echo "=== zero-downtime deploy (blue/green) ===" | tee -a "$LOG"
export NEXT_PUBLIC_BUILD_ID
export NEXT_PUBLIC_BUILD_TIME
if ! "${ROOT}/scripts/zero-downtime-deploy.sh" 2>&1 | tee -a "$LOG"; then
  echo "zero_downtime_deploy_result=fail" | tee -a "$LOG"
  exit 1
fi
echo "zero_downtime_deploy_result=ok" | tee -a "$LOG"

ACTIVE_SLOT="$(tr '[:upper:]' '[:lower:]' <"${ROOT}/.active-slot" 2>/dev/null | tr -d '[:space:]' || echo blue)"
ORIGIN_PORT=3001
if [[ "${ACTIVE_SLOT}" == "green" ]]; then
  ORIGIN_PORT=3002
fi
export DEPLOY_VERIFY_ORIGIN_URL="${DEPLOY_VERIFY_ORIGIN_URL:-http://127.0.0.1:${ORIGIN_PORT}/en}"

echo "=== verify: origin deploy markers (${DEPLOY_VERIFY_ORIGIN_URL}) ===" | tee -a "$LOG"
if DEPLOY_VERIFY_PUBLIC_URL="" \
  "${ROOT}/scripts/verify-deploy-markers.sh" 2>&1 | tee -a "$LOG"; then
  echo "origin_verify_result=ok" | tee -a "$LOG"
else
  echo "origin_verify_result=fail" | tee -a "$LOG"
  exit 1
fi

echo "=== nginx: upstream check (read-only) ===" | tee -a "$LOG"
"${ROOT}/scripts/nginx-verify-upstream.sh" 2>&1 | tee -a "$LOG" || true

TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-${CF_AUTH_TOKEN:-}}}"
ZONE="${CLOUDFLARE_ZONE_ID:-${CF_ZONE_ID:-}}"

if [[ -n "$TOKEN" && -n "$ZONE" ]]; then
  echo "=== Cloudflare: purge cache ===" | tee -a "$LOG"
  "${ROOT}/scripts/cloudflare-purge-cache.sh" 2>&1 | tee -a "$LOG"

  CF_DM="${CF_ENABLE_DEV_MODE_ON_DEPLOY:-1}"
  if [[ "$CF_DM" == "1" ]]; then
    echo "=== Cloudflare: Development Mode on (~3h, bypasses edge cache) ===" | tee -a "$LOG"
    if CF_DEV_MODE_VALUE=on "${ROOT}/scripts/cloudflare-development-mode.sh" 2>&1 | tee -a "$LOG"; then
      :
    else
      echo "warning: Development Mode API failed (token may need Zone Settings Edit; or set CF_ENABLE_DEV_MODE_ON_DEPLOY=0)" | tee -a "$LOG" >&2
    fi
  fi
else
  echo "=== Cloudflare: skipped (set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID to purge + optional dev mode) ===" | tee -a "$LOG"
fi

if [[ "${DEPLOY_SKIP_PUBLIC_VERIFY:-0}" == "1" ]]; then
  echo "=== verify: public skipped (DEPLOY_SKIP_PUBLIC_VERIFY=1) ===" | tee -a "$LOG"
else
  PUBLIC="${DEPLOY_VERIFY_PUBLIC_URL:-https://omanphoto.com/en}"
  export DEPLOY_VERIFY_PUBLIC_URL="$PUBLIC"
  echo "=== verify: public deploy markers (${PUBLIC}) ===" | tee -a "$LOG"
  if "${ROOT}/scripts/verify-deploy-markers.sh" 2>&1 | tee -a "$LOG"; then
    echo "public_verify_result=ok" | tee -a "$LOG"
  else
    echo "public_verify_result=fail" | tee -a "$LOG"
    echo "=== FAIL: public HTML did not match expected markers after purge/retries ===" | tee -a "$LOG" >&2
    exit 1
  fi
fi

echo "deploy_end_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG"
echo "=== deploy finished successfully ===" | tee -a "$LOG"
