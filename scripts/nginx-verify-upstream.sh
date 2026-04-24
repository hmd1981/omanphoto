#!/usr/bin/env bash
# Confirm nginx (or similar) forwards to 127.0.0.1:3000. Read-only unless DEPLOY_NGINX_RELOAD=1.
set -euo pipefail

FOUND=0
for d in /etc/nginx/sites-enabled /etc/nginx/sites-available /etc/nginx/conf.d; do
  [[ -d "$d" ]] || continue
  matches="$(grep -rE '127\.0\.0\.1:3000|localhost:3000' "$d" --include='*.conf' 2>/dev/null || true)"
  if [[ -n "$matches" ]]; then
    FOUND=1
    echo "=== nginx: upstream :3000 referenced under ${d} ==="
    grep -rE 'proxy_pass|upstream|127\.0\.0\.1:3000|localhost:3000' "$d" --include='*.conf' 2>/dev/null | head -40 || true
  fi
done

if [[ "$FOUND" -eq 0 ]]; then
  echo "=== nginx: no :3000 upstream found under common paths (install/config may differ) ===" >&2
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
