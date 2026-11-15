#!/usr/bin/env bash
# SI-generated: Claude Code (Anthropic) — see SI-DISCLOSURE.md
# Copy of the static site for GitHub Pages (P4y): build HEAD and push dist/ as the single commit of branch gh-pages.
# This script only prepares the branch. Turning Pages on and the repository's visibility are the author's settings.
#
#   bash deploy/pages.sh            # build HEAD → push branch gh-pages to origin (force: the branch holds one build)
#   bash deploy/pages.sh --dry-run  # build + assemble the branch commit locally, push nothing
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
BRANCH=gh-pages
say() { echo "pages: $*"; }
die() { echo "pages: FAILED — $*" >&2; exit 1; }
DRY=0
case "${1:-}" in "") ;; --dry-run) DRY=1 ;; *) die "unknown argument: $1 (--dry-run)" ;; esac

# Git hooks export GIT_DIR / GIT_INDEX_FILE / GIT_WORK_TREE: the temporary repository below must not inherit them.
unset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE GIT_OBJECT_DIRECTORY GIT_COMMON_DIR

git -C "$ROOT" diff --quiet HEAD -- || die "uncommitted changes — commit first (the copy must equal HEAD)"
sha="$(git -C "$ROOT" rev-parse HEAD)"
origin="$(git -C "$ROOT" remote get-url origin)"
[ -f "$ROOT/demo/demo.pdf" ] || die "demo/demo.pdf missing (the copy links its own deck)"

(cd "$ROOT" && npx --no-install vite build --logLevel error)
[ -f "$ROOT/dist/demo/demo.pdf" ] || die "build did not copy demo/demo.pdf"

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
cp -a "$ROOT/dist/." "$tmp/"
printf '{"commit": "%s"}\n' "$sha" > "$tmp/version.json"
touch "$tmp/.nojekyll"   # serve files as built (no Jekyll processing)
git -C "$tmp" init -q -b "$BRANCH"
git -C "$tmp" add -A
git -C "$tmp" -c user.name="$(git -C "$ROOT" config user.name)" -c user.email="$(git -C "$ROOT" config user.email)" \
  commit -q -m "Static build of $sha for GitHub Pages (deploy/pages.sh)"
say "assembled $(git -C "$tmp" ls-files | wc -l) files from ${sha:0:7}"
[ "$DRY" = 1 ] && { say "dry run: nothing pushed"; exit 0; }
git -C "$tmp" push -q -f "$origin" "$BRANCH:$BRANCH"
say "pushed $BRANCH = build of ${sha:0:7}"
