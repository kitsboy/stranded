# Stranded Deploy — quick reference (full truth: docs/DEPLOYMENT.md)

# Cloudflare Pages git integration is the ONLY deployer.
# Deploy  = push to main (CF Pages builds project "strandedbuild")
# Verify  = npm run deploy:check   (or: bash scripts/deploy-check.sh --wait --dist dist)
# Wait    = the `Stranded — verify live deploy` GitHub workflow runs the same check on CI
# There is no manual deployer. No wrangler, no CLOUDFLARE_API_TOKEN, no npx wrangler pages deploy.

cd ~/projects/stranded && npm run build && git push origin main && npm run deploy:check
