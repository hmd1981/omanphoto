#!/usr/bin/env bash
# Fail fast if NEXT_PUBLIC build stamps are missing or placeholder (used before docker compose build).
set -euo pipefail

id="${NEXT_PUBLIC_BUILD_ID:-}"
time="${NEXT_PUBLIC_BUILD_TIME:-}"

if [[ -z "$id" ]]; then
  echo "ERROR: NEXT_PUBLIC_BUILD_ID is empty. Pass --build-arg NEXT_PUBLIC_BUILD_ID=<git-sha> (see docker/build-web.sh)." >&2
  exit 1
fi
if [[ "$id" == "unknown" ]]; then
  echo "ERROR: NEXT_PUBLIC_BUILD_ID must not be \"unknown\". Use docker/build-web.sh or explicit --build-arg." >&2
  exit 1
fi
if [[ -z "$time" ]]; then
  echo "ERROR: NEXT_PUBLIC_BUILD_TIME is empty." >&2
  exit 1
fi
if [[ "$time" == "unknown" ]]; then
  echo "ERROR: NEXT_PUBLIC_BUILD_TIME must not be \"unknown\"." >&2
  exit 1
fi

echo "OK: build stamps validated (NEXT_PUBLIC_BUILD_ID=${id} NEXT_PUBLIC_BUILD_TIME=${time})"
