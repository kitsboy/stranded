# stranded — Standard Operating Procedure

## Build
```bash
cd ~/projects/stranded
BUILD_STATIC=true npm run build
```
Outputs static export to `dist/` via Next.js.

## Dev Server
```bash
cd ~/projects/stranded && npm run dev
```
Dev server runs on port 3003.

## Pre-Deploy Checks
```bash
cd ~/projects/stranded && git status && BUILD_STATIC=true npm run build
```

## Deploy (the only deployer: Cloudflare Pages git integration)
```bash
cd ~/projects/stranded && git push origin main
```
Cloudflare Pages auto-builds from GitHub (project `strandedbuild`). This is the *only*
deployer — no token, no wrangler, no manual fallback.

## There is no manual deploy fallback
A second deployer racing the git integration on the same URL is what caused the
"push looks deployed but the old build is still served" bug. Do not rsync + deploy, do not
`wrangler pages deploy`, do not wire a CF token.

## Post-Deploy Verify
```bash
cd ~/projects/stranded && npm run deploy:check   # waits/checks live buildId + served data
# or: bash scripts/deploy-check.sh --wait --timeout 900 --interval 20 --dist dist
```
CI runs the same check: workflow `Stranded — verify live deploy` on every push to `main`.

## Build & Verify Script
`deploy.sh` at project root builds the current commit and waits until the live site serves
it. It is a verifier, not a deployer — deploying is `git push origin main`.

## Rollback
```bash
git revert HEAD && git push origin main
```
