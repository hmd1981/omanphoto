#!/usr/bin/env bash
# Shared helpers for DATABASE_URL (sourced by other scripts; do not execute directly).
# shellcheck shell=bash

omanphoto_ensure_dotenv_from_example() {
  local root="$1"
  if [[ -f "${root}/.env" ]]; then
    return 0
  fi
  if [[ ! -f "${root}/.env.example" ]]; then
    return 1
  fi
  cp "${root}/.env.example" "${root}/.env"
  echo "omanphoto-env: created ${root}/.env from .env.example (not overwriting existing files)." >&2
  return 0
}

omanphoto_load_database_url_from_dotenv() {
  local root="$1"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    return 0
  fi
  if [[ ! -f "${root}/.env" ]]; then
    return 1
  fi
  set -a
  # shellcheck disable=SC1091
  source "${root}/.env"
  set +a
  return 0
}

omanphoto_ensure_database_url() {
  local root="$1"
  omanphoto_ensure_dotenv_from_example "$root" || true
  omanphoto_load_database_url_from_dotenv "$root" || true
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "omanphoto-env: DATABASE_URL is unset." >&2
    echo "  Fix: export DATABASE_URL=postgresql://... or create ${root}/.env (see ${root}/.env.example)." >&2
    return 1
  fi
  return 0
}
