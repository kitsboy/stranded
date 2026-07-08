#!/bin/bash
# Deploy script for stranded.giveabit.io (Cloudflare Pages)
# Run from repo root after git push (or locally for manual). Prefers CF auto-deploy.
# Current: Next.js static export to dist/. See docs/DEPLOYMENT.md for full current process.
# Risk: safe

set -e

echo "🚀 Deploying stranded.giveabit.io (from GitHub main or local build)..."


echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning caches..."
rm -rf .next dist

echo "🔨 Building (static export)..."
npm run build

echo "📤 Deploying to Cloudflare Pages (project: stranded — update --project-name if your Pages project has a different slug)..."
wrangler pages deploy ./dist --project-name=strandedbuild --commit-dirty=true || echo "(wrangler optional — Cloudflare Pages auto-deploys from GitHub main)"

echo "✅ Build ready in ./dist. Push to main for CF Pages deploy to https://stranded.giveabit.io"
echo "   Preview locally: npx serve -p 3003 dist"
