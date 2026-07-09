# Deployment — Stranded Value

**Production:** https://stranded.giveabit.io  
**GitHub:** https://github.com/kitsboy/stranded (`main`)  
**CF Pages project name:** `strandedbuild`  
**Package version:** see root `package.json` (must match `/data/live-stats.json` + `/status.json`)

## Primary path (use this)

```bash
cd ~/projects/stranded
npm run validate          # data + Score v3 sanity
npm run test:helpers      # pure helper unit tests (tsx)
npm run build             # static export → dist/
git add -A && git commit -m "…"
git push origin main      # triggers Cloudflare Pages
# wait ~2–3 min
npm run deploy:check      # package.json version == production live-stats
```

## Manual fallback (needs API token)

```bash
export CLOUDFLARE_API_TOKEN=…   # not in repo
npx wrangler pages deploy ./dist --project-name=strandedbuild
```

## Post-deploy ritual

| Check | Command / URL |
|-------|----------------|
| Version match | `npm run deploy:check` |
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
- Do **not** use project name `stranded` for wrangler — correct name is **`strandedbuild`**
- Historical one-liners in `docs/DEPLOY.md` may show old project names

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
