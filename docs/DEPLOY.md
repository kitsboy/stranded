# Stranded Deploy — quick reference (full truth: docs/DEPLOYMENT.md)

# Cloudflare Pages git integration is the ONLY deployer.
# Deploy  = push to main (CF Pages builds project "strandedbuild")
# Verify  = npm run deploy:check   (or: bash scripts/deploy-check.sh --wait --dist dist)
# Wait    = the `Stranded — verify live deploy` GitHub workflow runs the same check on CI
# There is no manual deployer. No wrangler, no CLOUDFLARE_API_TOKEN, no npx wrangler pages deploy.

# The check verifies IDENTITY, not recency: the live site must name the commit it
# was built from (`commit` in /data/live-stats.json) and it must be the commit being
# shipped. A build clock is printed for humans but is never the gate — a timestamp
# floor once passed a stale deploy by 41 seconds (see .ai_docs/deploy-verification.md).
# Regression test for the gate: npm run deploy:check:selftest

cd ~/projects/stranded && npm run build && git push origin main && npm run deploy:check
