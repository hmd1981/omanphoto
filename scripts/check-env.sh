#!/usr/bin/env bash
# Validate DATABASE_URL format and optionally verify TCP reachability to the DB host.
# Usage:
#   scripts/check-env.sh              # format + TCP (default)
#   scripts/check-env.sh --no-connect
#   scripts/check-env.sh --prisma     # explicit alias (same as default)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

CONNECT=1
for a in "$@"; do
  case "$a" in
    --no-connect) CONNECT=0 ;;
    --prisma) ;;
    *) ;;
  esac
done

# shellcheck source=/dev/null
source "${SCRIPT_DIR}/lib/omanphoto-env.sh"

if ! omanphoto_ensure_database_url "$REPO_ROOT"; then
  exit 1
fi

if [[ ! "${DATABASE_URL}" =~ ^postgres(ql)?:// ]]; then
  echo "check-env: DATABASE_URL must start with postgresql:// or postgres:// (got: ${DATABASE_URL:0:32}...)" >&2
  exit 1
fi

if [[ "${CONNECT}" -eq 0 ]]; then
  echo "check-env: DATABASE_URL is set and format OK (TCP check skipped)."
  exit 0
fi

# postgresql://[user[:pass]@]host[:port][/db] — host/port for TCP (passwords with @ are unsupported here).
_raw="${DATABASE_URL#*://}"
_authority="${_raw%%/*}"
_hostport="${_authority}"
if [[ "${_authority}" == *@* ]]; then
  _hostport="${_authority##*@}"
fi
host="${_hostport%%:*}"
port="5432"
if [[ "${_hostport}" == *:* ]]; then
  port="${_hostport#*:}"
  port="${port%%/*}"
  port="${port%%\?*}"
fi

if [[ -z "${host}" ]]; then
  echo "check-env: could not parse database host from DATABASE_URL." >&2
  exit 1
fi

if command -v nc >/dev/null 2>&1; then
  if ! nc -z -w 4 "${host}" "${port}"; then
    echo "check-env: database host ${host}:${port} is not reachable (nc). Is Postgres running?" >&2
    exit 1
  fi
elif command -v timeout >/dev/null 2>&1; then
  if ! timeout 4 bash -c ": >/dev/tcp/${host}/${port}" 2>/dev/null; then
    echo "check-env: database host ${host}:${port} is not reachable (bash /dev/tcp)." >&2
    exit 1
  fi
else
  echo "check-env: warning: install nc (netcat) or GNU timeout for TCP checks; skipping host probe." >&2
fi

echo "check-env: DATABASE_URL OK; ${host}:${port} reachable."
