#!/usr/bin/env bash
# Production: bake git SHA + UTC time into the Next.js client bundle (NEXT_PUBLIC_*).
# Prefer this script over raw `docker compose build` so build-args are never dropped.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/docker"

NEXT_PUBLIC_BUILD_ID="$(cd "$ROOT" && git rev-parse --short HEAD 2>/dev/null || echo nogit)"
NEXT_PUBLIC_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

export NEXT_PUBLIC_BUILD_ID
export NEXT_PUBLIC_BUILD_TIME

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"${SCRIPT_DIR}/validate-build-stamps.sh"

echo "=== docker compose build (build-arg only; compose .env ignored for stamps) ==="
echo "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}"
echo "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"

docker compose build web \
  --build-arg "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}" \
  --build-arg "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"

docker compose up -d web
