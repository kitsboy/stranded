#!/usr/bin/env bash
# Nightly self-evolving docs — run via cron on M3
# 0 2 * * * cd ~/projects/stranded && ./scripts/nightly-docs-sync.sh >> /tmp/stranded-nightly.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[$(date -Iseconds)] Nightly docs sync starting"
node scripts/refresh-eccc-data.js
node scripts/sync-docs.js

if git diff --quiet docs/ public/data/live-stats.json README.md STATUS.md; then
  echo "No doc changes — skipping commit"
  exit 0
fi

git add docs/LIVE-STATS.md docs/SOURCE-OF-TRUTH.md docs/DOCUMENTATION.md public/data/live-stats.json README.md STATUS.md
git commit -m "chore: nightly auto-sync live stats and docs [$(date +%Y-%m-%d)]"
git push origin main
echo "[$(date -Iseconds)] Committed and pushed doc updates"