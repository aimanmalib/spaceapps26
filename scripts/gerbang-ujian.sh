#!/usr/bin/env bash
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
# Project test gate: build + JavaScript unit tests + Python unit tests. Run from anywhere.
set -euo pipefail
cd "$(dirname "$0")/.."
# Tests that run git in temp folders must not inherit hook-provided git variables.
unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE
[ -d node_modules ] || npm ci --no-audit --no-fund --silent
npx --no-install vite build --logLevel error
node --test 'tests/**/*.test.mjs'
python3 -m unittest discover -s tests -q
echo "gerbang-ujian: OK"
