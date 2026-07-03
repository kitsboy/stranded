# Stranded — Deployment

**Production:** https://stranded.giveabit.io  
**GitHub:** https://github.com/kitsboy/stranded (branch: `main`)  
**Deploy target:** Cloudflare Pages (auto-deploy on push)

---

## Pipeline (Verified)

| Step | Command | Result |
|------|---------|--------|
| Data validate | `npm run validate` | 2,611 sites check |
| Docs sync | `npm run docs:sync` | Regenerates `live-stats.json` + docs |
| Lint | `npm run lint` | ESLint (next/core-web-vitals) |
| Build | `npm run build` | Static export → `dist/` |
| Push | `git push origin main` | CF Pages auto-builds |
| Full verify | `npm run verify` | Runs all checks + dry-run push |

**CI:** `.github/workflows/ci.yml` runs on every push/PR to `main`.

---

## Auto-Deploy (Preferred)

1. Commit and push to `main`
2. Cloudflare Pages builds with:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Env:** `BUILD_STATIC=true` (set in CF dashboard or via build command)
3. Custom domain `stranded.giveabit.io` → Pages project `stranded`

No wrangler required for normal deploys.

---

## Local Dev

```bash
npm install
rm -rf .next dist node_modules/.cache   # if CSS/HMR issues
npm run dev                              # http://localhost:3003
```

---

## Manual Build + Preview

```bash
npm run build
npx serve -p 3003 dist
# or: npm run preview
```

---

## Manual CF Deploy (Fallback)

```bash
./deploy.sh
# or:
npm run build
wrangler pages deploy ./dist --project-name=stranded
```

---

## Build Output

- `dist/index.html` — Home
- `dist/map.html` — Command Center
- `dist/education.html` — Education Center
- `dist/sites.html` — All Sites
- `dist/pitch.html` — Live pitch deck (auto-stats)
- `dist/data/live-stats.json` — Self-updating platform metrics
- `dist/data/stranded-sites.geojson` — 2,611 ECCC sites
- `dist/Marketing-Hub.html` — Marketing suite

---

## Environment

| Variable | Purpose |
|----------|---------|
| `BUILD_STATIC=true` | Enables static export to `dist/` |
| `NEXT_PUBLIC_SITE_URL` | OG/metadata base (default: stranded.giveabit.io) |

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*