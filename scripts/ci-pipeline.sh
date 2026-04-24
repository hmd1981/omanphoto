#!/usr/bin/env bash
#
# CI/CD: build web image, prisma-safe migrate deploy, (re)start web, verify DB + HTTP.
# Intended for GitHub Actions (push to main) or a self-hosted runner with Docker + compose.
#
# Env (optional):
#   GITHUB_SHA / GITHUB_RUN_ID — logged; BUILD_ID defaults from git SHA
#   NEXT_PUBLIC_BUILD_ID / NEXT_PUBLIC_BUILD_TIME — set if already in environment
#   CI_ORIGIN — base URL for HTTP checks (default http://127.0.0.1:3000)
#   LOG_FILE — log path (default: repo root ci-deploy.log)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DOCKER_DIR="${ROOT}/docker"
LOG_FILE="${LOG_FILE:-${ROOT}/ci-deploy.log}"
CI_ORIGIN="${CI_ORIGIN:-http://127.0.0.1:3000}"
# Single `web` on :3000 for CI (compose profile `ci`). Production uses scripts/zero-downtime-deploy.sh (blue/green).
DOCKER_COMPOSE_CI=(docker compose --profile ci)

cd "${ROOT}"

: >"${LOG_FILE}"

log() {
  echo "$@" | tee -a "${LOG_FILE}"
}

append_summary() {
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "$@" >>"${GITHUB_STEP_SUMMARY}"
  fi
}

fail() {
  log "ERROR: $*"
  append_summary "### Deployment result: **FAILED**"
  append_summary "_${*}_"
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  fail "docker not found in PATH"
fi

BUILD_ID="${NEXT_PUBLIC_BUILD_ID:-}"
BUILD_TIME="${NEXT_PUBLIC_BUILD_TIME:-}"
if [[ -z "${BUILD_ID}" ]]; then
  if [[ -n "${GITHUB_SHA:-}" ]]; then
    BUILD_ID="${GITHUB_SHA:0:7}"
  else
    BUILD_ID="$(git -C "${ROOT}" rev-parse --short HEAD 2>/dev/null || echo local)"
  fi
fi
if [[ -z "${BUILD_TIME}" ]]; then
  BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi
export NEXT_PUBLIC_BUILD_ID="${BUILD_ID}"
export NEXT_PUBLIC_BUILD_TIME="${BUILD_TIME}"

log "=== Oman Photo CI pipeline ==="
log "build_id=${NEXT_PUBLIC_BUILD_ID} build_time=${NEXT_PUBLIC_BUILD_TIME}"
log "github_sha=${GITHUB_SHA:-} github_run_id=${GITHUB_RUN_ID:-}"
append_summary "## CI deploy"
append_summary "- **Build id:** \`${NEXT_PUBLIC_BUILD_ID}\`"
append_summary "- **Build time:** \`${NEXT_PUBLIC_BUILD_TIME}\`"

export NEXT_PUBLIC_BUILD_ID
export NEXT_PUBLIC_BUILD_TIME
if ! bash "${ROOT}/docker/validate-build-stamps.sh" 2>&1 | tee -a "${LOG_FILE}"; then
  fail "Build stamp validation failed"
fi

cd "${DOCKER_DIR}"

log "=== docker compose (profile ci): build web ==="
if ! "${DOCKER_COMPOSE_CI[@]}" build web \
  --build-arg "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}" \
  --build-arg "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}" \
  --build-arg "DATABASE_URL_BUILD=postgresql://omanphoto:omanphoto_dev@127.0.0.1:5432/omanphoto?schema=public" \
  2>&1 | tee -a "${LOG_FILE}"; then
  fail "Docker image build failed"
fi

log "=== docker compose: start db ==="
if ! "${DOCKER_COMPOSE_CI[@]}" up -d db 2>&1 | tee -a "${LOG_FILE}"; then
  fail "Could not start Postgres (db service)"
fi

log "=== wait: Postgres healthy ==="
ready=0
for _ in $(seq 1 45); do
  if "${DOCKER_COMPOSE_CI[@]}" exec -T db pg_isready -U omanphoto -d omanphoto >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [[ "${ready}" -ne 1 ]]; then
  fail "Postgres did not become ready in time"
fi
log "Postgres is ready."

log "=== prisma-safe: migrate deploy (one-off web container) ==="
set +e
MIGRATE_OUT="$("${DOCKER_COMPOSE_CI[@]}" run -T --rm web \
  bash -lc '/opt/omanphoto/scripts/prisma-safe.sh migrate deploy --schema=../server/prisma/schema.prisma' 2>&1)"
MIGRATE_STATUS=$?
set -e
printf '%s\n' "${MIGRATE_OUT}" | tee -a "${LOG_FILE}"
if [[ "${MIGRATE_STATUS}" -ne 0 ]]; then
  append_summary "### Migration status: **FAILED** (exit ${MIGRATE_STATUS})"
  fail "prisma migrate deploy failed (exit ${MIGRATE_STATUS})"
fi
append_summary "### Migration status: **OK**"

log "=== docker compose: up web (recreate / restart) ==="
if ! "${DOCKER_COMPOSE_CI[@]}" up -d web --force-recreate 2>&1 | tee -a "${LOG_FILE}"; then
  fail "docker compose up web failed"
fi

log "=== wait: HTTP ${CI_ORIGIN}/en/ai-studio ==="
http_ok=0
for _ in $(seq 1 60); do
  if curl -sf --max-time 5 "${CI_ORIGIN}/en/ai-studio" -o /dev/null; then
    http_ok=1
    break
  fi
  sleep 2
done
if [[ "${http_ok}" -ne 1 ]]; then
  append_summary "### HTTP /en/ai-studio: **FAILED**"
  fail "GET ${CI_ORIGIN}/en/ai-studio did not return success within timeout"
fi
log "GET ${CI_ORIGIN}/en/ai-studio -> OK"

if ! curl -sf --max-time 5 "${CI_ORIGIN}/en" -o /dev/null; then
  append_summary "### HTTP /en: **FAILED**"
  fail "GET ${CI_ORIGIN}/en did not return success"
fi
log "GET ${CI_ORIGIN}/en -> OK"

log "=== DATABASE_URL + DB reachability (inside web container) ==="
set +e
DBCHK_OUT="$("${DOCKER_COMPOSE_CI[@]}" exec -T web bash /opt/omanphoto/scripts/check-env.sh 2>&1)"
DBCHK_STATUS=$?
set -e
printf '%s\n' "${DBCHK_OUT}" | tee -a "${LOG_FILE}"
if [[ "${DBCHK_STATUS}" -ne 0 ]]; then
  append_summary "### Database check: **FAILED**"
  fail "check-env inside web container failed (exit ${DBCHK_STATUS})"
fi
append_summary "### Database check: **OK**"

log "=== CI pipeline completed successfully ==="
append_summary "### Deployment result: **SUCCESS**"
append_summary "- Log file: \`${LOG_FILE}\` (artifact in GitHub Actions)"

exit 0
