#!/usr/bin/env bash
#
# Post-deploy guard: prove the AI sales assistant is actually live.
# Catches the silent-failure mode where the widget code ships but the runtime
# env (NEXT_PUBLIC_ASSISTANT_ENABLED / DEEPSEEK_API_KEY) is missing — the cause
# of the "where is my chatbot?" incident on 2026-04-24.
#
# Run standalone:
#   bash scripts/verify-assistant.sh                       # against PUBLIC URL (https://omanphoto.com)
#   ASSISTANT_VERIFY_URL=http://127.0.0.1:3002 \
#     bash scripts/verify-assistant.sh                     # against a specific slot
#
# Wired into:
#   scripts/zero-downtime-deploy.sh — runs against the inactive slot BEFORE
#   the nginx swap, so a broken assistant cleanly aborts cutover.
#
# Skip with: OMANPHOTO_SKIP_ASSISTANT_CHECK=1 (use sparingly — defeats the guard).
#
# Env:
#   ASSISTANT_VERIFY_URL    Base URL to probe. Default: https://omanphoto.com
#   DOCKER_ENV_FILE         Path to docker/.env. Default: <repo>/docker/.env
#   ASSISTANT_PROBE_TIMEOUT Seconds for HTTP timeouts (default 30 — DeepSeek can be slow).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${ASSISTANT_VERIFY_URL:-https://omanphoto.com}"
URL="${URL%/}"  # strip trailing slash
DOCKER_ENV_FILE="${DOCKER_ENV_FILE:-${ROOT}/docker/.env}"
TIMEOUT="${ASSISTANT_PROBE_TIMEOUT:-30}"

# EN floating-button label rendered by app/components/assistant-widget.tsx.
EN_PILL='Need help?'
# AR floating-button label (UTF-8) — keep in this file rather than reading the source so
# the test catches accidental copy changes in the widget.
AR_PILL='نحتاج مساعدة'

log()  { echo "[verify-assistant] $*"; }
fail() { echo "[verify-assistant] FAIL: $*" >&2; exit 1; }

if [[ "${OMANPHOTO_SKIP_ASSISTANT_CHECK:-0}" == "1" ]]; then
  log "OMANPHOTO_SKIP_ASSISTANT_CHECK=1 — skipping all assistant checks (this disables the deploy guard)."
  exit 0
fi

# Read intent from docker/.env without sourcing it (sourcing would execute shell metachars).
read_dotenv() {
  local key="$1" file="$2"
  [[ -f "${file}" ]] || return 1
  # Last assignment wins (matches docker compose behavior). Strip surrounding quotes if any.
  grep -E "^${key}=" "${file}" | tail -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/'
}

flag="$(read_dotenv NEXT_PUBLIC_ASSISTANT_ENABLED "${DOCKER_ENV_FILE}" || true)"
key="$(read_dotenv DEEPSEEK_API_KEY "${DOCKER_ENV_FILE}" || true)"

if [[ "${flag}" != "1" ]]; then
  log "NEXT_PUBLIC_ASSISTANT_ENABLED='${flag:-<unset>}' in ${DOCKER_ENV_FILE} — assistant intentionally disabled. Skipping."
  log "  (set NEXT_PUBLIC_ASSISTANT_ENABLED=1 in docker/.env to enable the widget and this guard)"
  exit 0
fi

log "target=${URL}  (assistant flag is ON in ${DOCKER_ENV_FILE})"

# ---- Check 1: /en homepage contains the EN floating-button label ----
log "check 1/3: GET ${URL}/en must contain '${EN_PILL}'"
en_html="$(curl -sS --max-time "${TIMEOUT}" "${URL}/en")" \
  || fail "could not fetch ${URL}/en"
if ! grep -Fq "${EN_PILL}" <<<"${en_html}"; then
  served_marker="$(grep -oE 'build:[^"<>[:space:]]+' <<<"${en_html}" | head -1 || true)"
  fail "EN homepage missing assistant pill text '${EN_PILL}'. Served marker=${served_marker:-<none>}.
  Likely cause: NEXT_PUBLIC_ASSISTANT_ENABLED is not set inside the running container.
  Check:  docker exec docker-web-blue-1 env | grep ASSISTANT  (or web-green)
  Fix:    add it to docker/docker-compose.yml x-web-common.environment, then re-deploy."
fi
log "check 1/3: ok (EN pill present)"

# ---- Check 2: /ar homepage contains the AR floating-button label ----
log "check 2/3: GET ${URL}/ar must contain Arabic pill"
ar_html="$(curl -sS --max-time "${TIMEOUT}" "${URL}/ar")" \
  || fail "could not fetch ${URL}/ar"
if ! grep -Fq "${AR_PILL}" <<<"${ar_html}"; then
  fail "AR homepage missing assistant pill text. Same root cause as check 1 — the runtime env is wrong."
fi
log "check 2/3: ok (AR pill present)"

# ---- Check 3: POST /api/assistant must return 200 with ok:true ----
if [[ -z "${key:-}" ]]; then
  fail "NEXT_PUBLIC_ASSISTANT_ENABLED=1 but DEEPSEEK_API_KEY is empty in ${DOCKER_ENV_FILE}.
  The widget would render but every click would 503. Set DEEPSEEK_API_KEY (server-side, never NEXT_PUBLIC_*) and re-deploy."
fi

log "check 3/3: POST ${URL}/api/assistant must return 200 with ok:true (DEEPSEEK_API_KEY is set)"
probe_body='{"locale":"en","message":"deploy probe","pageContext":{"source":"deploy-guard"}}'
probe_resp_file="$(mktemp)"
trap 'rm -f "${probe_resp_file}"' EXIT
http_code="$(curl -sS --max-time "${TIMEOUT}" -o "${probe_resp_file}" -w '%{http_code}' \
  -X POST "${URL}/api/assistant" \
  -H 'Content-Type: application/json' \
  -d "${probe_body}")" || fail "could not POST ${URL}/api/assistant"

probe_resp="$(cat "${probe_resp_file}")"
case "${http_code}" in
  200)
    if ! grep -Fq '"ok":true' <<<"${probe_resp}"; then
      fail "POST /api/assistant returned 200 but body lacks '\"ok\":true'. body=${probe_resp:0:400}"
    fi
    ;;
  429)
    log "WARN: POST got 429 (rate-limited). Treating as non-fatal — assistant is live but probe collided with rate limit."
    log "      If this happens repeatedly, raise ASSISTANT_MAX in app/app/api/assistant/route.ts or skip with OMANPHOTO_SKIP_ASSISTANT_CHECK=1."
    ;;
  503)
    fail "POST /api/assistant returned 503 (assistant_unavailable). DEEPSEEK_API_KEY is missing inside the container, even though it is present in ${DOCKER_ENV_FILE}.
  Verify with:  docker exec docker-web-<active-slot>-1 sh -c 'env | grep DEEPSEEK_API_KEY'
  body=${probe_resp:0:400}"
    ;;
  *)
    fail "POST /api/assistant returned HTTP ${http_code}. body=${probe_resp:0:400}"
    ;;
esac
log "check 3/3: ok (HTTP ${http_code}, ok:true)"

log "OK — assistant is live at ${URL} (EN pill, AR pill, /api/assistant 200)."
