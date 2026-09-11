# Deployment — Stranded Value

**Production:** https://stranded.giveabit.io  
**GitHub:** https://github.com/kitsboy/stranded (`main`)  
**CF Pages project name:** `strandedbuild`  
**Package version:** see root `package.json` (must match `/data/live-stats.json` + `/status.json`)

## One deployer, and only one (settled 2026-09-11)

**Cloudflare Pages git integration is the only deployer.** A push to `main` *is* the deploy —
CF Pages builds project `strandedbuild` from the repo and publishes it to
https://stranded.giveabit.io.

There is **no manual deployer**: no `wrangler pages deploy`, no `npx wrangler …`, no
`CLOUDFLARE_API_TOKEN`. A second builder racing the git integration on the same URL is what
produced the "push looks deployed but the old build is still served" bug, so do not add one
back. `deploy.sh` builds and verifies — it never deploys.

## Primary path (use this)

```bash
cd ~/projects/stranded
npm run validate          # data + Score v3 sanity
npm run test:helpers      # pure helper unit tests (tsx)
npm run build             # static export → dist/
git add <files> && git commit -m "…"
git push origin main      # ← this deploys (Cloudflare Pages git integration)
npm run deploy:check      # wait ~2–3 min, then verify what is actually being served
```

`npm run deploy:check` is the local twin of CI's verify step. It checks that the live
`buildId` is not older than the pushed commit **and** that the served data payload equals the
one your build produced. Exit 0 = verified; exit 1 = stale/failed deploy with the reason
printed. No secret required.

## Verification (automatic)

| Where | What |
|-------|------|
| GitHub Actions — `Stranded — verify live deploy` | Runs on every push to `main`: builds the pushed commit, then polls the live site up to 15 min and **fails the job red** if CF Pages never publishes it |
| `npm run deploy:check` | Same check locally, one command |
| `bash deploy.sh` | Build + wait for the live site to serve that build (wrapper over the above) |

## Post-deploy ritual

| Check | Command / URL |
|-------|----------------|
| Build match | `npm run deploy:check` |
| Health | https://stranded.giveabit.io/status.json |
| Live stats | https://stranded.giveabit.io/data/live-stats.json |
| E2E (local) | `npm run e2e` |

## Dev

```bash
npm run dev   # http://localhost:3003
```

## Notes

- Static export only (`BUILD_STATIC=true next build` → `dist/`)
- Git remote: SSH `git@github.com:kitsboy/stranded.git`
- `buildId` comes from the build clock, so two builds of the same commit never share one —
  the gate is freshness ("live is not older than the pushed commit"), not equality
- Dated handoffs and `SESSION-SUMMARY-*.md` mention wrangler/tokens because they were written
  when a manual deployer existed; they are history, not instructions

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
