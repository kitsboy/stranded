#!/usr/bin/env bash
# Full pipeline verification — run before commit/push/deploy
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "═══ Stranded Pipeline Verification ═══"
echo ""

echo "▸ Git state"
BRANCH=$(git branch --show-current)
echo "  Branch: $BRANCH"
if [ -n "$(git status --porcelain)" ]; then
  echo "  ⚠ Uncommitted changes present"
  git status --short
else
  echo "  ✓ Working tree clean"
fi
UNPUSHED=$(git log --oneline "origin/${BRANCH}..HEAD" 2>/dev/null | wc -l | tr -d ' ')
echo "  Unpushed commits: $UNPUSHED"

echo ""
echo "▸ Data validation"
npm run validate

echo ""
echo "▸ Generate live stats + sync docs"
node scripts/generate-live-stats.js
node scripts/sync-docs.js

echo ""
echo "▸ Lint"
npm run lint

echo ""
echo "▸ Production build"
rm -rf .next dist
npm run build

echo ""
echo "▸ Build output check"
test -f dist/index.html && echo "  ✓ dist/index.html"
test -f dist/map.html && echo "  ✓ dist/map.html"
test -f dist/pitch.html && echo "  ✓ dist/pitch.html"
test -f dist/dashboard.html && echo "  ✓ dist/dashboard.html"
test -f dist/data/live-stats.json && echo "  ✓ dist/data/live-stats.json"
test -f dist/data/stranded-sites.geojson && echo "  ✓ dist/data/stranded-sites.geojson"

echo ""
echo "▸ Remote push dry-run"
git push --dry-run origin "$BRANCH" && echo "  ✓ Push would succeed"

echo ""
echo "▸ Live site check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://stranded.giveabit.io || echo "000")
echo "  stranded.giveabit.io → HTTP $HTTP_CODE"

echo ""
echo "═══ Pipeline verification PASSED ═══"
echo "Deploy: git push origin $BRANCH → Cloudflare Pages auto-builds dist/"