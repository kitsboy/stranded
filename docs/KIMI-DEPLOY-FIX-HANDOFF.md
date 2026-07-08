# KIMI HANDOFF — Fix Stranded Deploy Pipeline (copy everything below)

**Machine:** M3 (coding) or wherever repo is checked out  
**Project:** stranded  
**Repo:** https://github.com/kitsboy/stranded  
**CF Pages project name:** strandedbuild (NOT stranded)  
**Production:** https://stranded.giveabit.io  
**Current version:** 2.2.1 (Stranded Score v3 — deployed, working)

---

## CONTEXT FOR KIMI

- Cloudflare Pages auto-deploy IS working. Project slug is `strandedbuild`.
- GitHub Actions CI is RED on every push — E2E Playwright smoke tests fail (strict mode: duplicate text matches). This does NOT block CF deploy but erodes confidence.
- `deploy.sh` has wrong wrangler project name (`stranded` should be `strandedbuild`).
- Git remote on M3 has embedded HTTPS PAT — rotate to SSH.
- No `deploy:check` script yet — add one so we know prod version matches package.json.
- Work is safe on GitHub main. Do not lose commits — always push.

---

## TASK LIST (do all)

1. Fix E2E smoke tests in `tests/e2e/smoke.spec.ts`
2. Fix `deploy.sh` wrangler project name → `strandedbuild`
3. Add `scripts/deploy-check.sh` + `npm run deploy:check`
4. Update `docs/DEPLOYMENT.md` with correct project name + deploy ritual
5. Run full verify, fix anything broken, commit, push
6. Confirm production after push (curl version check)
7. Update `docs/KIMI-HANDOFF.md` when done

---

## COMMANDS — RUN IN ORDER

```bash
cd ~/projects/stranded
git pull origin main
git status
```

```bash
npm run validate
npm run build
```

```bash
npx serve -p 3003 dist &
sleep 3
PLAYWRIGHT_BASE_URL=http://localhost:3003 npm run e2e
```

If E2E fails, fix `tests/e2e/smoke.spec.ts` then re-run e2e until green.

---

## E2E FIX (replace smoke.spec.ts map + pitch tests)

Problem: `getByText(/2,611/i)` and `getByText(/Verified Sites|2,611/i)` match multiple elements.

Use specific locators instead:

```typescript
test('map loads sites', async ({ page }) => {
  await page.goto('/map')
  await expect(page.locator('#main-content, main').first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('heading', { name: /Command Center|Map/i }).first()).toBeVisible({ timeout: 15000 })
})

test('pitch shows live stats', async ({ page }) => {
  await page.goto('/pitch')
  await expect(page.getByText('Verified Sites', { exact: true }).first()).toBeVisible({ timeout: 10000 })
})
```

Run e2e again until 6/6 pass.

---

## FIX deploy.sh

Change line:
`--project-name=stranded`
To:
`--project-name=strandedbuild`

---

## ADD scripts/deploy-check.sh

```bash
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
```

Add to package.json scripts:
`"deploy:check": "bash scripts/deploy-check.sh"`

```bash
chmod +x scripts/deploy-check.sh
```

---

## GIT REMOTE SSH (M3 — Cam may need to approve)

```bash
cd ~/projects/stranded
git remote set-url origin git@github.com:kitsboy/stranded.git
git remote -v
```

Cam: revoke old GitHub PAT in GitHub → Settings → Developer settings → Personal access tokens.

---

## WRANGLER FALLBACK (only if CF git deploy stops working)

Cam must provide CLOUDFLARE_API_TOKEN with Cloudflare Pages Edit permission.

```bash
export CLOUDFLARE_API_TOKEN="PASTE_FROM_CAM"
cd ~/projects/stranded
npm run build
npx wrangler pages deploy ./dist --project-name=strandedbuild
npm run deploy:check
```

---

## COMMIT AND PUSH

```bash
cd ~/projects/stranded
npm run verify
git add -A
git commit -m "fix: E2E smoke tests, deploy-check, strandedbuild wrangler name"
git push origin main
```

Wait 5-10 minutes then:

```bash
npm run deploy:check
curl -s https://stranded.giveabit.io/data/live-stats.json | head -5
```

Expect version 2.2.1 or higher, topSites score ~93.

---

## CF DASHBOARD (verify only — should already be correct)

- Project: strandedbuild
- Repo: kitsboy/stranded
- Branch: main
- Build command: npm run build
- Output: dist
- Auto deploy: enabled
- DNS: stranded.giveabit.io CNAME strandedbuild.pages.dev (proxied)

GitHub → Settings → Integrations → Cloudflare Workers and Pages → ensure kitsboy/stranded is in allowed repos.

---

## DONE CRITERIA

- [ ] `npm run e2e` passes 6/6 locally
- [ ] GitHub Actions CI green on next push
- [ ] `npm run deploy:check` passes
- [ ] `deploy.sh` uses strandedbuild
- [ ] docs/KIMI-HANDOFF.md updated
- [ ] git remote is SSH (no PAT in URL)

---

*Safe Harbour · Give A Bit · stranded.giveabit.io*