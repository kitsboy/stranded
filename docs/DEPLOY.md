# Stranded Deploy (Historical one-liner — see docs/DEPLOYMENT.md for current)

# Current recommended:
#   rm -rf .next dist && npm run build
#   wrangler pages deploy ./dist --project-name=stranded --commit-dirty=true
# Or just push to GitHub main — Cloudflare Pages auto-deploys from the repo.
# Local preview: npx serve -p 3003 dist
# Dev: rm -rf .next dist && npm run dev (http://localhost:3003)

cd ~/stranded && rm -rf .next dist && npm run build && wrangler pages deploy ./dist --project-name=stranded --commit-dirty=true || echo "See full DEPLOYMENT.md"
