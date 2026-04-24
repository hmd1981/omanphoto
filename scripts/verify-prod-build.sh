#!/usr/bin/env bash
#
# Verify the public site serves the same build as the active blue/green slot.
# Exits non-zero (loudly) if drift is detected. Run after every deploy and from cron.
#
# Env:
#   PUBLIC_VERIFY_URL=...   (default https://omanphoto.com)
#   SLOT_FILE=...           (default /root/omanphoto/.active-slot)
#   NGINX_GEN=...           (default /root/omanphoto/docker/nginx-upstream-generated.conf)
set -euo pipefail

PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL:-https://omanphoto.com}"
ROOT_DEFAULT="$(cd "$(dirname "$0")/.." && pwd)"
SLOT_FILE="${SLOT_FILE:-${ROOT_DEFAULT}/.active-slot}"
NGINX_GEN="${NGINX_GEN:-${ROOT_DEFAULT}/docker/nginx-upstream-generated.conf}"

log() { echo "[verify-prod-build] $*"; }
fail() { echo "[verify-prod-build] FAIL: $*" >&2; exit 1; }

active="$(tr '[:upper:]' '[:lower:]' <"${SLOT_FILE}" 2>/dev/null | tr -d '[:space:]' || true)"
case "${active}" in
  blue) port=3001 ;;
  green) port=3002 ;;
  *) fail "active slot file ${SLOT_FILE} missing or invalid (got '${active}')" ;;
esac

nginx_port=""
if [[ -f "${NGINX_GEN}" ]]; then
  nginx_port="$(grep -oE 'server[[:space:]]+127\.0\.0\.1:[0-9]+' "${NGINX_GEN}" | head -1 | grep -oE '[0-9]+$' || true)"
fi
if [[ -n "${nginx_port}" && "${nginx_port}" != "${port}" ]]; then
  fail "nginx upstream port (${nginx_port}) != active slot port (${port}, ${active}). Run scripts/zero-downtime-deploy.sh."
fi

slot_html="$(curl -sS --max-time 15 "http://127.0.0.1:${port}/en")" \
  || fail "could not fetch http://127.0.0.1:${port}/en (active slot=${active})"
slot_marker="$(echo "${slot_html}" | grep -oE 'build:[^"<>[:space:]]+' | head -1 || true)"
[[ -n "${slot_marker}" ]] || fail "active slot :${port} did not return a build marker"

public_html="$(curl -sS --max-time 30 "${PUBLIC_VERIFY_URL}/en")" \
  || fail "could not fetch ${PUBLIC_VERIFY_URL}/en"
public_marker="$(echo "${public_html}" | grep -oE 'build:[^"<>[:space:]]+' | head -1 || true)"
[[ -n "${public_marker}" ]] || fail "public ${PUBLIC_VERIFY_URL} did not return a build marker"

log "active_slot=${active} active_port=${port}"
log "slot_marker=${slot_marker}"
log "public_marker=${public_marker}"

if [[ "${slot_marker}" != "${public_marker}" ]]; then
  fail "DRIFT: public ${PUBLIC_VERIFY_URL} serves ${public_marker} but active slot serves ${slot_marker}"
fi

log "OK — public matches active slot (${slot_marker})"
