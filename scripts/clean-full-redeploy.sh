#!/usr/bin/env bash
#
# Clean full reset + redeploy with public cutover (the only "deploy this to prod" script).
#
# Phases:
#   1) stop stack (volumes preserved)
#   2) git pull (autostash)
#   3) rebuild both web slots --no-cache
#   4) start db, wait healthy
#   5) prisma-safe migrate deploy (host -> localhost:5432)
#   6) optional db:seed (OMANPHOTO_RUN_DB_SEED=1)
#   7) start db + web slots (legacy `web` is in profile=ci and is force-stopped here)
#   8) check-env.sh
#   9) wait both slots ready, smoke /en/services and /en/ai-studio on both
#  10) zero-downtime cutover (scripts/zero-downtime-deploy.sh): swaps nginx upstream + verifies public URL
#  11) public marker assertion: https://omanphoto.com must serve build:${NEXT_PUBLIC_BUILD_ID}
#
# Any non-OK step aborts. The script never declares success unless the public site is on the new build.
#
# Env:
#   OMANPHOTO_RUN_DB_SEED=1   — run `npm run db:seed` from app/
#   PUBLIC_VERIFY_URL=...     — public URL to assert (default https://omanphoto.com)
#   SKIP_PUBLIC_CUTOVER=1     — skip steps 10-11 (local-only rebuild; you must NOT use this for production)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_DIR="${ROOT}/docker"
PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL:-https://omanphoto.com}"
cd "${ROOT}"

log() { echo "[clean-full-redeploy] $*"; }
fail() { echo "[clean-full-redeploy] ERROR: $*" >&2; exit 1; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"; }

require_cmd docker
require_cmd git
require_cmd curl

if docker compose version >/dev/null 2>&1; then
  DC=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  DC=(docker-compose)
else
  fail "docker compose not found"
fi

cd "${DOCKER_DIR}"
log "Step 1: stop all compose services (volumes preserved)"
"${DC[@]}" down

cd "${ROOT}"
log "Step 2: fetch + merge latest origin/main (autostash if working tree dirty)"
git fetch origin main
if ! git merge --no-edit --autostash origin/main; then
  fail "git merge origin/main failed (resolve conflicts, then re-run)"
fi

NEXT_PUBLIC_BUILD_ID="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
NEXT_PUBLIC_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export NEXT_PUBLIC_BUILD_ID NEXT_PUBLIC_BUILD_TIME
[[ "${NEXT_PUBLIC_BUILD_ID}" != "unknown" ]] || fail "NEXT_PUBLIC_BUILD_ID invalid"
[[ -n "${NEXT_PUBLIC_BUILD_TIME}" && "${NEXT_PUBLIC_BUILD_TIME}" != "unknown" ]] || fail "NEXT_PUBLIC_BUILD_TIME invalid"

if [[ -f "${ROOT}/docker/validate-build-stamps.sh" ]]; then
  bash "${ROOT}/docker/validate-build-stamps.sh"
fi

cd "${DOCKER_DIR}"
log "Step 3: rebuild web images (--no-cache, build stamps)"
"${DC[@]}" build --no-cache web-blue web-green \
  --build-arg "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}" \
  --build-arg "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}" \
  --build-arg "DATABASE_URL_BUILD=postgresql://omanphoto:omanphoto_dev@127.0.0.1:5432/omanphoto?schema=public"

log "Step 4: start db and wait until healthy"
if "${DC[@]}" up -d --wait db 2>/dev/null; then
  :
else
  "${DC[@]}" up -d db
  ready=0
  for _ in $(seq 1 60); do
    if "${DC[@]}" exec -T db pg_isready -U omanphoto -d omanphoto >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 2
  done
  [[ "${ready}" -eq 1 ]] || fail "Postgres did not become ready"
fi

cd "${ROOT}"
log "Step 5: prisma-safe migrate deploy (host → localhost:5432)"
# shellcheck source=/dev/null
source "${ROOT}/scripts/lib/omanphoto-env.sh"
omanphoto_ensure_dotenv_from_example "${ROOT}" || true
omanphoto_load_database_url_from_dotenv "${ROOT}" || true
[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL unset; create ${ROOT}/.env from .env.example"

bash "${ROOT}/scripts/prisma-safe.sh" migrate deploy --schema=../server/prisma/schema.prisma

if [[ "${OMANPHOTO_RUN_DB_SEED:-0}" == "1" ]]; then
  log "Step 6: db:seed content-only (OMANPHOTO_RUN_DB_SEED=1; never overwrites photos/hero)"
  omanphoto_load_database_url_from_dotenv "${ROOT}" || true
  if [[ -z "${ADMIN_PASSWORD:-}" && -f "${ROOT}/.env" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT}/.env"
    set +a
  fi
  [[ -n "${ADMIN_PASSWORD:-}" ]] || fail "ADMIN_PASSWORD must be set for seed (e.g. export ADMIN_PASSWORD=admin)"
  cd "${ROOT}/app"
  OMANPHOTO_SEED_DEMO=0 npm run db:seed
  cd "${ROOT}"
else
  log "Step 6: skip db:seed (set OMANPHOTO_RUN_DB_SEED=1 to run)"
fi

cd "${DOCKER_DIR}"
log "Step 7: start db + web-blue + web-green (force-stop legacy ci 'web' on :3000)"
"${DC[@]}" up -d db web-blue web-green
# Defensive: legacy CI service uses port 3000 and would happily serve stale content if nginx
# ever pointed there. Always make sure it is not running outside CI.
if "${DC[@]}" ps --status running --services 2>/dev/null | grep -qx web; then
  log "  legacy 'web' container detected — stopping (production must use blue/green only)"
  "${DC[@]}" stop web || true
fi

cd "${ROOT}"
log "Step 8: check-env.sh"
bash "${ROOT}/scripts/check-env.sh"

http_check() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 25 "${url}")" || return 1
  [[ "${code}" == "200" ]] || fail "HTTP ${code} for ${url}"
}

# CMD runs migrate + optional seed before `next start`; allow time for listen on :3000.
wait_slot_ready() {
  local port="$1"
  local svc="web-blue"
  [[ "${port}" == "3002" ]] && svc="web-green"
  local url="http://127.0.0.1:${port}/en/ai-studio"
  local ok=0
  for _ in $(seq 1 120); do
    if curl -sf --max-time 8 "${url}" -o /dev/null 2>/dev/null; then
      ok=1
      break
    fi
    sleep 2
  done
  [[ "${ok}" -eq 1 ]] || fail "slot :${port} (${svc}) not ready on ${url} within ~4min — inspect: (cd ${DOCKER_DIR} && docker compose logs ${svc})"
}

assert_slot_marker() {
  local port="$1"
  local html
  html="$(curl -sS --max-time 20 "http://127.0.0.1:${port}/en")" \
    || fail "could not fetch http://127.0.0.1:${port}/en for marker check"
  echo "${html}" | grep -Fq "build:${NEXT_PUBLIC_BUILD_ID}" \
    || fail "slot :${port} does not serve build:${NEXT_PUBLIC_BUILD_ID} — image not really rebuilt"
}

log "Step 9: wait for both slots and verify each serves the new build (build:${NEXT_PUBLIC_BUILD_ID})"
for port in 3001 3002; do
  wait_slot_ready "${port}"
  http_check "http://127.0.0.1:${port}/en/services"
  http_check "http://127.0.0.1:${port}/en/ai-studio"
  assert_slot_marker "${port}"
done

if [[ "${SKIP_PUBLIC_CUTOVER:-0}" == "1" ]]; then
  log "SKIP_PUBLIC_CUTOVER=1 set — skipping nginx cutover and public verification."
  log "WARNING: ${PUBLIC_VERIFY_URL} is NOT guaranteed to serve build:${NEXT_PUBLIC_BUILD_ID}. Do not use this for production."
  exit 0
fi

log "Step 10: zero-downtime cutover via scripts/zero-downtime-deploy.sh"
PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL}" \
NEXT_PUBLIC_BUILD_ID="${NEXT_PUBLIC_BUILD_ID}" \
NEXT_PUBLIC_BUILD_TIME="${NEXT_PUBLIC_BUILD_TIME}" \
  bash "${ROOT}/scripts/zero-downtime-deploy.sh"

log "Step 11: public marker assertion against ${PUBLIC_VERIFY_URL}/en"
public_html="$(curl -sS --max-time 30 "${PUBLIC_VERIFY_URL}/en")" \
  || fail "could not fetch ${PUBLIC_VERIFY_URL}/en for public marker check"
if ! echo "${public_html}" | grep -Fq "build:${NEXT_PUBLIC_BUILD_ID}"; then
  served="$(echo "${public_html}" | grep -oE 'build:[^"<>]+' | head -1 || true)"
  fail "PUBLIC SITE STILL ON STALE BUILD. expected=build:${NEXT_PUBLIC_BUILD_ID} served=${served:-<none>} — investigate nginx upstream and active slot"
fi
log "public_marker_check=ok (build:${NEXT_PUBLIC_BUILD_ID})"

log "Done. build_id=${NEXT_PUBLIC_BUILD_ID} build_time=${NEXT_PUBLIC_BUILD_TIME} active_slot=$(cat "${ROOT}/.active-slot" 2>/dev/null || echo unknown)"
