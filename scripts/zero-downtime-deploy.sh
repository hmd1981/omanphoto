#!/usr/bin/env bash
#
# Blue/green: build inactive slot, migrate, health + marker checks, switch Nginx, verify public, stop old slot.
# Requires: docker compose (web-blue / web-green), db healthy, Nginx including docker/nginx-upstream-generated.conf
#
# Env:
#   ROOT / repo auto-detected
#   NEXT_PUBLIC_BUILD_ID / NEXT_PUBLIC_BUILD_TIME (optional; default from git + date)
#   NGINX_UPSTREAM_GENERATED (default: $ROOT/docker/nginx-upstream-generated.conf)
#   NGINX_UPSTREAM_TEMPLATE (default: $ROOT/docker/nginx.upstream.active.template)
#   PUBLIC_VERIFY_URL (default https://omanphoto.com)
#   ZERO_DEPLOY_LOG (default $ROOT/zero-downtime-deploy.log)
#   SLOT_FILE (default $ROOT/.active-slot), PREVIOUS_SLOT_FILE (default $ROOT/.previous-slot)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_DIR="${ROOT}/docker"
unset COMPOSE_PROFILES
SLOT_FILE="${SLOT_FILE:-${ROOT}/.active-slot}"
PREVIOUS_SLOT_FILE="${PREVIOUS_SLOT_FILE:-${ROOT}/.previous-slot}"
NGINX_GEN="${NGINX_UPSTREAM_GENERATED:-${DOCKER_DIR}/nginx-upstream-generated.conf}"
NGINX_TPL="${NGINX_UPSTREAM_TEMPLATE:-${DOCKER_DIR}/nginx.upstream.active.template}"
PUBLIC_VERIFY_URL="${PUBLIC_VERIFY_URL:-https://omanphoto.com}"
LOG_FILE="${ZERO_DEPLOY_LOG:-${ROOT}/zero-downtime-deploy.log}"

PORT_BLUE=3001
PORT_GREEN=3002

cd "${ROOT}"
: >"${LOG_FILE}"

log() { echo "$@" | tee -a "${LOG_FILE}"; }

sudo_if_needed() {
  if [[ "${EUID:-1}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

port_for_slot() {
  case "$1" in
    blue) echo "${PORT_BLUE}" ;;
    green) echo "${PORT_GREEN}" ;;
    *) echo "invalid slot: $1" >&2; return 1 ;;
  esac
}

service_for_slot() {
  case "$1" in
    blue) echo "web-blue" ;;
    green) echo "web-green" ;;
    *) return 1 ;;
  esac
}

invert_slot() {
  case "$1" in
    blue) echo green ;;
    green) echo blue ;;
    *) echo blue ;;
  esac
}

ensure_nginx_generated() {
  if [[ ! -f "${NGINX_TPL}" ]]; then
    echo "Missing template ${NGINX_TPL}" >&2
    exit 1
  fi
  if [[ ! -f "${NGINX_GEN}" ]]; then
    local p="${PORT_BLUE}" a=""
    if [[ -f "${SLOT_FILE}" ]]; then
      a="$(tr '[:upper:]' '[:lower:]' <"${SLOT_FILE}" | tr -d '[:space:]')"
    fi
    if [[ "${a}" == "green" ]]; then
      p="${PORT_GREEN}"
    fi
    sed "s/__PORT__/${p}/g" "${NGINX_TPL}" >"${NGINX_GEN}"
    log "Bootstrapped ${NGINX_GEN} (port ${p}) from template."
  fi
}

write_upstream_port() {
  local port="$1"
  sed "s/__PORT__/${port}/g" "${NGINX_TPL}" >"${NGINX_GEN}.next"
  mv "${NGINX_GEN}.next" "${NGINX_GEN}"
}

cleanup_new_slot() {
  local svc="$1"
  log "Stopping failed slot container: ${svc}"
  ( cd "${DOCKER_DIR}" && docker compose stop "${svc}" ) 2>/dev/null || true
}

BUILD_ID="${NEXT_PUBLIC_BUILD_ID:-}"
BUILD_TIME="${NEXT_PUBLIC_BUILD_TIME:-}"
if [[ -z "${BUILD_ID}" ]]; then
  BUILD_ID="$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo nogit)"
fi
if [[ -z "${BUILD_TIME}" ]]; then
  BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi
export NEXT_PUBLIC_BUILD_ID="${BUILD_ID}"
export NEXT_PUBLIC_BUILD_TIME="${BUILD_TIME}"

log "=== zero-downtime deploy ==="
log "timestamp_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ) commit=$(git -C "${ROOT}" rev-parse HEAD 2>/dev/null || echo unknown)"
log "build_id=${NEXT_PUBLIC_BUILD_ID} build_time=${NEXT_PUBLIC_BUILD_TIME}"

if ! bash "${ROOT}/docker/validate-build-stamps.sh" 2>&1 | tee -a "${LOG_FILE}"; then
  log "ERROR: build stamp validation failed"
  exit 1
fi

ensure_nginx_generated

ACTIVE="$(tr '[:upper:]' '[:lower:]' <"${SLOT_FILE}" 2>/dev/null | tr -d '[:space:]' || true)"
if [[ -z "${ACTIVE}" || ( "${ACTIVE}" != "blue" && "${ACTIVE}" != "green" ) ]]; then
  ACTIVE=blue
  echo "${ACTIVE}" >"${SLOT_FILE}"
  log "Initialized .active-slot -> ${ACTIVE}"
fi

INACTIVE="$(invert_slot "${ACTIVE}")"
ACTIVE_PORT="$(port_for_slot "${ACTIVE}")"
INACTIVE_PORT="$(port_for_slot "${INACTIVE}")"
ACTIVE_SVC="$(service_for_slot "${ACTIVE}")"
INACTIVE_SVC="$(service_for_slot "${INACTIVE}")"

log "active_slot=${ACTIVE} active_port=${ACTIVE_PORT} active_service=${ACTIVE_SVC}"
log "target_slot=${INACTIVE} target_port=${INACTIVE_PORT} target_service=${INACTIVE_SVC}"

cd "${DOCKER_DIR}"

log "=== docker compose: ensure db ==="
docker compose up -d db
ready=0
for _ in $(seq 1 45); do
  if docker compose exec -T db pg_isready -U omanphoto -d omanphoto >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "${ready}" -ne 1 ]]; then
  log "ERROR: Postgres not ready"
  exit 1
fi

log "=== docker compose: ensure active slot is running ==="
docker compose up -d "${ACTIVE_SVC}"

log "=== docker compose: build ${INACTIVE_SVC} ==="
if ! docker compose build "${INACTIVE_SVC}" \
  --build-arg "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}" \
  --build-arg "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}" \
  --build-arg "DATABASE_URL_BUILD=postgresql://omanphoto:omanphoto_dev@127.0.0.1:5432/omanphoto?schema=public" \
  2>&1 | tee -a "${LOG_FILE}"; then
  log "ERROR: docker compose build failed"
  exit 1
fi

log "=== prisma-safe migrate deploy (ephemeral ${INACTIVE_SVC}) ==="
set +e
MIGRATE_OUT="$(docker compose run -T --rm "${INACTIVE_SVC}" \
  bash -lc '/opt/omanphoto/scripts/prisma-safe.sh migrate deploy --schema=../server/prisma/schema.prisma' 2>&1)"
MIGRATE_STATUS=$?
set -e
printf '%s\n' "${MIGRATE_OUT}" | tee -a "${LOG_FILE}"
if [[ "${MIGRATE_STATUS}" -ne 0 ]]; then
  log "ERROR: migrate deploy failed (exit ${MIGRATE_STATUS})"
  exit 1
fi
log "migration_status=ok"

log "=== docker compose: up ${INACTIVE_SVC} (new slot) ==="
if ! docker compose up -d "${INACTIVE_SVC}" --force-recreate 2>&1 | tee -a "${LOG_FILE}"; then
  log "ERROR: could not start ${INACTIVE_SVC}"
  exit 1
fi

NEW_CID="$(docker compose ps -q "${INACTIVE_SVC}" 2>/dev/null | head -n1 || true)"
IMG_ID="$(docker compose images -q "${INACTIVE_SVC}" 2>/dev/null | head -n1 || true)"
log "inactive_container_id=${NEW_CID:-unknown}"
log "inactive_image_id=${IMG_ID:-unknown}"

log "=== health: http://127.0.0.1:${INACTIVE_PORT}/en/ai-studio ==="
http_ok=0
for _ in $(seq 1 90); do
  if curl -sf --max-time 5 "http://127.0.0.1:${INACTIVE_PORT}/en/ai-studio" -o /dev/null; then
    http_ok=1
    break
  fi
  sleep 2
done
if [[ "${http_ok}" -ne 1 ]]; then
  log "ERROR: inactive slot health check failed"
  cleanup_new_slot "${INACTIVE_SVC}"
  exit 1
fi
log "health_check_inactive=ok"

log "=== deploy marker (build:${NEXT_PUBLIC_BUILD_ID}) on inactive slot ==="
html=""
if ! html="$(curl -sS -f --max-time 20 "http://127.0.0.1:${INACTIVE_PORT}/en/ai-studio")"; then
  log "ERROR: could not fetch HTML for marker check"
  cleanup_new_slot "${INACTIVE_SVC}"
  exit 1
fi
if ! echo "${html}" | grep -Fq "build:${NEXT_PUBLIC_BUILD_ID}"; then
  log "ERROR: deploy marker build:${NEXT_PUBLIC_BUILD_ID} not found in /en/ai-studio HTML"
  cleanup_new_slot "${INACTIVE_SVC}"
  exit 1
fi
log "deploy_marker_check=ok"

# Assistant guard: prove the AI sales widget is actually live on the new slot
# (EN pill, AR pill, POST /api/assistant -> 200). Catches the silent-failure mode
# where docker/.env is missing NEXT_PUBLIC_ASSISTANT_ENABLED or DEEPSEEK_API_KEY.
# Runs against the inactive port BEFORE the nginx swap, so a broken assistant
# aborts cleanly without ever exposing it to the public.
log "=== assistant guard on inactive slot (port ${INACTIVE_PORT}) ==="
if ! ASSISTANT_VERIFY_URL="http://127.0.0.1:${INACTIVE_PORT}" \
     bash "${ROOT}/scripts/verify-assistant.sh" 2>&1 | tee -a "${LOG_FILE}"; then
  log "ERROR: assistant guard failed on inactive slot — aborting cutover (nginx untouched)"
  cleanup_new_slot "${INACTIVE_SVC}"
  exit 1
fi
log "assistant_guard=ok"

log "=== backup nginx upstream and write port ${INACTIVE_PORT} ==="
cp -a "${NGINX_GEN}" "${NGINX_GEN}.bak"
write_upstream_port "${INACTIVE_PORT}"

log "=== nginx -t ==="
if ! sudo_if_needed nginx -t 2>&1 | tee -a "${LOG_FILE}"; then
  log "ERROR: nginx -t failed; restoring upstream backup"
  mv "${NGINX_GEN}.bak" "${NGINX_GEN}"
  cleanup_new_slot "${INACTIVE_SVC}"
  exit 1
fi
log "nginx_test=ok"

log "=== nginx reload ==="
if ! sudo_if_needed nginx -s reload 2>&1 | tee -a "${LOG_FILE}"; then
  log "ERROR: nginx reload failed; restoring upstream backup"
  mv "${NGINX_GEN}.bak" "${NGINX_GEN}"
  sudo_if_needed nginx -t && sudo_if_needed nginx -s reload
  cleanup_new_slot "${INACTIVE_SVC}"
  exit 1
fi
log "nginx_reload=ok"

sleep "${PUBLIC_VERIFY_DELAY_SEC:-5}"

log "=== public verify: ${PUBLIC_VERIFY_URL}/en/ai-studio ==="
if ! curl -sf --max-time 45 "${PUBLIC_VERIFY_URL}/en/ai-studio" -o /dev/null; then
  log "ERROR: public URL check failed; restoring nginx upstream from backup (port ${ACTIVE_PORT})"
  if [[ -f "${NGINX_GEN}.bak" ]]; then
    cp -a "${NGINX_GEN}.bak" "${NGINX_GEN}"
  else
    write_upstream_port "${ACTIVE_PORT}"
  fi
  sudo_if_needed nginx -t
  sudo_if_needed nginx -s reload
  cleanup_new_slot "${INACTIVE_SVC}"
  log "public_verify=fail"
  exit 1
fi
log "public_verify=ok"

log "=== update slot files and stop old service ${ACTIVE_SVC} ==="
echo "${INACTIVE}" >"${SLOT_FILE}"
echo "${ACTIVE}" >"${PREVIOUS_SLOT_FILE}"
docker compose stop "${ACTIVE_SVC}" 2>&1 | tee -a "${LOG_FILE}" || true

rm -f "${NGINX_GEN}.bak"

log "=== zero-downtime deploy SUCCESS ==="
log "active_slot_now=${INACTIVE} previous_slot=${ACTIVE}"
exit 0
