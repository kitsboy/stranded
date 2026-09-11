#!/usr/bin/env bash
#
# Build + verify wrapper for stranded.giveabit.io — THIS SCRIPT NEVER DEPLOYS.
#
# SINGLE-DEPLOYER RULE (settled 2026-09-11, commit 2d0686c):
#   Cloudflare Pages git integration (project "strandedbuild") is the one and
#   only deployer. A push to `main` is the deploy. There is no wrangler path,
#   no CLOUDFLARE_API_TOKEN, no manual second deployer — a second builder on
#   the same URL reintroduces the stale/last-writer-wins race that served old
#   builds after a push. Do not add one back.
#
# What this does instead: build the current commit locally, then wait for the
# live site to actually serve it (same check the `Stranded — verify live
# deploy` GitHub workflow runs, via scripts/deploy-check.sh).
#
#   bash deploy.sh                 # build + wait up to 15 min for the live site
#   bash deploy.sh --dist dist     # build + one-shot check, fail fast (no --wait)
#   bash deploy.sh <extra args>    # forwarded to scripts/deploy-check.sh
#   SKIP_BUILD=1 bash deploy.sh    # skip install/rebuild, verify the existing dist/
#
# Exit 0 only when the live site is verified to be serving this build.
# Normal flow:  git push origin main  &&  bash deploy.sh
# Quick check:  npm run deploy:check
#
# Risk: safe — builds and reads the live site; writes nothing to Cloudflare.
set -euo pipefail

cd "$(dirname "$0")"

echo "🔨 Stranded — build + verify (Cloudflare Pages is the only deployer)"
echo "   deploy happens on: git push origin main"

if [ "${SKIP_BUILD:-0}" = "1" ]; then
  echo "⏭  SKIP_BUILD=1 — reusing the existing dist/ (no install, no rebuild)"
  [ -d dist ] || { echo "❌ SKIP_BUILD=1 but ./dist does not exist — build first" >&2; exit 1; }
else
  if [ -f package-lock.json ]; then
    echo "📦 npm ci…"
    npm ci || npm install
  else
    echo "📦 npm install…"
    npm install
  fi

  echo "🧹 Cleaning build caches…"
  rm -rf .next dist

  echo "🏗  Building (static export → dist/)…"
  # Bound the heap: this box also runs other workers' builds (matches CI).
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"
  npm run build
fi

# Default: wait for Cloudflare Pages to publish this commit. Extra args win.
CHECK_ARGS=(--wait --timeout 900 --interval 20 --dist dist)
if [ "$#" -gt 0 ]; then
  CHECK_ARGS=("$@")
fi

echo "🔎 Verifying the live site serves this build (scripts/deploy-check.sh ${CHECK_ARGS[*]})…"
rc=0
bash scripts/deploy-check.sh "${CHECK_ARGS[@]}" || rc=$?
if [ "$rc" -ne 0 ]; then
  echo "" >&2
  if [ "$rc" -eq 2 ]; then
    echo "❌ Bad arguments passed to scripts/deploy-check.sh (exit 2) — see its --help above." >&2
  else
    echo "❌ Build is fine, but the live site does NOT match it." >&2
    echo "   Deploy still pending, failed, or the push never happened." >&2
    echo "   Next: confirm the commit is pushed to main, then re-run: npm run deploy:check" >&2
  fi
  exit "$rc"
fi

echo ""
echo "✅ Build built and live site verified — https://stranded.giveabit.io"
echo "   Preview locally: npx serve -p 3003 dist"
