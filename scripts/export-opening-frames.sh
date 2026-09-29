#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${PLAYWRIGHT_MODULE:-}" ]]; then
  CANDIDATE="$(ls -1d "$HOME"/.npm/_npx/*/node_modules/playwright/index.mjs 2>/dev/null | tail -1 || true)"
  if [[ -n "$CANDIDATE" ]]; then
    PLAYWRIGHT_MODULE="$(node -p "require('url').pathToFileURL(process.argv[1]).href" "$CANDIDATE")"
  else
    PLAYWRIGHT_BIN="$(npm exec --yes --package=playwright -- which playwright)"
    PLAYWRIGHT_MODULE="$(node -p "require('url').pathToFileURL(require('path').resolve(process.argv[1], '..', 'playwright', 'index.mjs')).href" "$(dirname "$PLAYWRIGHT_BIN")")"
  fi
fi
export PLAYWRIGHT_MODULE

exec node "$ROOT/scripts/export-opening-frames.mjs" "$@"
