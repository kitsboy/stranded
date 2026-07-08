#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PKG_VERSION=$(node -p "require('./package.json').version")
PROD_JSON=$(curl -sf https://stranded.giveabit.io/data/live-stats.json)
PROD_VERSION=$(echo "$PROD_JSON" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version")
echo "package.json: $PKG_VERSION"
echo "production:   $PROD_VERSION"
if [ "$PKG_VERSION" != "$PROD_VERSION" ]; then
  echo "MISMATCH — CF may still be building or deploy failed"
  exit 1
fi
echo "OK — production matches package.json"
