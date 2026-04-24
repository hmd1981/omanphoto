#!/usr/bin/env bash
# Load DATABASE_URL from repo root .env when unset, then validate and exec Prisma from app/.
# Usage (from anywhere):
#   scripts/prisma-safe.sh migrate deploy --schema=../server/prisma/schema.prisma
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${REPO_ROOT}/app"

# shellcheck source=/dev/null
source "${SCRIPT_DIR}/lib/omanphoto-env.sh"

if ! omanphoto_ensure_database_url "$REPO_ROOT"; then
  exit 1
fi

SUB="${1:-}"
CHECK_FLAGS=()
case "$SUB" in
  generate | version | "" | validate | format)
    CHECK_FLAGS=(--no-connect)
    ;;
esac

"${SCRIPT_DIR}/check-env.sh" "${CHECK_FLAGS[@]}"

if [[ ! -d "${APP_DIR}" ]]; then
  echo "prisma-safe: expected app directory at ${APP_DIR}" >&2
  exit 1
fi

cd "${APP_DIR}"
exec npx prisma "$@"
