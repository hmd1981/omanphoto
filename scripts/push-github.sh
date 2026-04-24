#!/usr/bin/env bash
# Push main to GitHub. Usage:
#   ./scripts/push-github.sh https://github.com/OWNER/REPO.git
# Requires: git credential (HTTPS token) or SSH key for git@github.com:OWNER/REPO.git
set -euo pipefail

REPO_URL="${1:?Usage: $0 https://github.com/OWNER/REPO.git}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git branch -M main

REMOTE_NAME="${GITHUB_REMOTE_NAME:-github}"
if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  git remote set-url "$REMOTE_NAME" "$REPO_URL"
else
  git remote add "$REMOTE_NAME" "$REPO_URL"
fi

echo "Pushing main to $REMOTE_NAME ($REPO_URL) ..."
git push -u "$REMOTE_NAME" main

echo "Local HEAD: $(git rev-parse HEAD)"
echo "Verify on GitHub: Settings → General → default branch, and compare commit SHA."
