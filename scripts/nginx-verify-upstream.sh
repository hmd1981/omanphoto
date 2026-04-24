#!/usr/bin/env bash
# Confirm nginx (or similar) forwards to a local Oman Photo slot (:3000 CI, :3001 blue, :3002 green).
# Read-only unless DEPLOY_NGINX_RELOAD=1.
set -euo pipefail

FOUND=0
PATTERN='127\.0\.0\.1:300[0-2]|localhost:300[0-2]'

for d in /etc/nginx/sites-enabled /etc/nginx/sites-available /etc/nginx/conf.d; do
  [[ -d "$d" ]] || continue
  matches="$(grep -rE "$PATTERN" "$d" --include='*.conf' 2>/dev/null || true)"
  if [[ -n "$matches" ]]; then
    FOUND=1
    echo "=== nginx: upstream :3000-:3002 referenced under ${d} ==="
    grep -rE "proxy_pass|upstream|$PATTERN" "$d" --include='*.conf' 2>/dev/null | head -40 || true
  fi
done

# Repo-managed generated upstream (blue/green)
REPO_GEN="$(cd "$(dirname "$0")/.." && pwd)/docker/nginx-upstream-generated.conf"
if [[ -f "$REPO_GEN" ]]; then
  FOUND=1
  echo "=== nginx: repo generated upstream file ==="
  head -20 "$REPO_GEN" || true
fi

if [[ "$FOUND" -eq 0 ]]; then
  echo "=== nginx: no :3000-:3002 upstream found under common paths (install/config may differ) ===" >&2
fi

if [[ "${DEPLOY_NGINX_RELOAD:-0}" == "1" ]]; then
  if command -v nginx >/dev/null 2>&1; then
    nginx -t
    nginx -s reload
    echo "=== nginx: config OK and reload sent ==="
  else
    echo "=== nginx: binary not in PATH ===" >&2
    exit 1
  fi
fi
