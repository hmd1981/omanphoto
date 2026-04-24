#!/usr/bin/env bash
# Production: bake git SHA + UTC time into the Next.js client bundle (NEXT_PUBLIC_*).
# Prefer this script over raw `docker compose build` so build-args are never dropped.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NEXT_PUBLIC_BUILD_ID="$(cd "$ROOT" && git rev-parse --short HEAD 2>/dev/null || echo nogit)"
NEXT_PUBLIC_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

export NEXT_PUBLIC_BUILD_ID
export NEXT_PUBLIC_BUILD_TIME

"${SCRIPT_DIR}/validate-build-stamps.sh"

cd "$ROOT/docker"

echo "=== docker compose build (profile ci; build-arg only; compose .env ignored for stamps) ==="
echo "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}"
echo "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"

docker compose --profile ci build web \
  --build-arg "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}" \
  --build-arg "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"

docker compose --profile ci up -d web
