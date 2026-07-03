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

## Deploy (Auto — git push triggers CF Pages)
```bash
cd ~/projects/stranded && git push origin main
```
Cloudflare Pages auto-builds from GitHub. 

## Manual Deploy Fallback (M4)
```bash
rsync -avz --delete ~/projects/stranded/dist/ m4:~/tmp-stranded-dist/
# On M4:
# wrangler pages deploy ~/tmp-stranded-dist/ --project-name stranded
```

## Post-Deploy Verify
```bash
curl -s https://stranded.giveabit.io | grep -q 'Stranded'
```

## Deploy Script
A `deploy.sh` script exists at project root with additional automation.

## Rollback
```bash
git revert HEAD && git push origin main
```
