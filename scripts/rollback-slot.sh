#!/usr/bin/env bash
#
# Switch Nginx upstream back to the previous slot (.previous-slot), reload, verify public URL.
# Does not start/stop containers by default — only traffic flip (see scripts/zero-downtime-deploy.sh).
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

sudo_if_needed() {
  if [[ "${EUID:-1}" -eq 0 ]]; then "$@"; else sudo "$@"; fi
}

port_for_slot() {
  case "$1" in
    blue) echo 3001 ;;
    green) echo 3002 ;;
    *) echo "invalid slot: $1" >&2; return 1 ;;
  esac
}

invert_slot() {
  case "$1" in
    blue) echo green ;;
    green) echo blue ;;
    *) echo blue ;;
  esac
}

write_upstream_port() {
  local port="$1"
  sed "s/__PORT__/${port}/g" "${NGINX_TPL}" >"${NGINX_GEN}.next"
  mv "${NGINX_GEN}.next" "${NGINX_GEN}"
}

ACTIVE="$(tr '[:upper:]' '[:lower:]' <"${SLOT_FILE}" 2>/dev/null | tr -d '[:space:]' || true)"
PREV="$(tr '[:upper:]' '[:lower:]' <"${PREVIOUS_SLOT_FILE}" 2>/dev/null | tr -d '[:space:]' || true)"

if [[ -z "${PREV}" || ( "${PREV}" != "blue" && "${PREV}" != "green" ) ]]; then
  if [[ -n "${ACTIVE}" && ( "${ACTIVE}" == "blue" || "${ACTIVE}" == "green" ) ]]; then
    PREV="$(invert_slot "${ACTIVE}")"
  else
    echo "Could not determine previous slot (set ${PREVIOUS_SLOT_FILE} or valid ${SLOT_FILE})." >&2
    exit 1
  fi
fi

TARGET_PORT="$(port_for_slot "${PREV}")"
case "${PREV}" in
  blue) TARGET_SVC="web-blue" ;;
  green) TARGET_SVC="web-green" ;;
  *) echo "invalid previous slot" >&2; exit 1 ;;
esac

echo "rollback: active_file=${ACTIVE:-?} previous_slot=${PREV} target_port=${TARGET_PORT} target_service=${TARGET_SVC}"

cd "${DOCKER_DIR}"
docker compose up -d "${TARGET_SVC}" || true

if [[ ! -f "${NGINX_TPL}" ]]; then
  echo "Missing ${NGINX_TPL}" >&2
  exit 1
fi

cp -a "${NGINX_GEN}" "${NGINX_GEN}.bak.rollback" 2>/dev/null || true
write_upstream_port "${TARGET_PORT}"
sudo_if_needed nginx -t
sudo_if_needed nginx -s reload

sleep "${PUBLIC_VERIFY_DELAY_SEC:-5}"
curl -sf --max-time 45 "${PUBLIC_VERIFY_URL}/en/ai-studio" -o /dev/null

echo "${PREV}" >"${SLOT_FILE}"
echo "${ACTIVE}" >"${PREVIOUS_SLOT_FILE}"
echo "rollback: OK — nginx now -> ${PREV} (127.0.0.1:${TARGET_PORT})"
