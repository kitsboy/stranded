# Stranded Deploy — quick reference (full truth: docs/DEPLOYMENT.md)

# Primary (2026-07):
#   npm run build && git push origin main
#   npm run deploy:check
# CF Pages project: strandedbuild  (NOT "stranded")
# Manual (needs CLOUDFLARE_API_TOKEN):
#   npx wrangler pages deploy ./dist --project-name=strandedbuild

cd ~/projects/stranded && npm run build && git push origin main && npm run deploy:check
