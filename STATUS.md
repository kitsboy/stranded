# Stranded Value — Status

**Updated:** 2026-08-11 by Grok  
**Site:** https://stranded.giveabit.io (Cloudflare Pages · project `strandedbuild`)  
**GitHub:** https://github.com/kitsboy/stranded (`main`)  
**Build:** Next.js static export — `npm run build` → `dist/`  
**Dev:** `npm run dev` → `localhost:3003`  
**Data:** 2,611 ECCC methane sites  
**Version:** **2.10.0** · **Routes:** 26 static app pages + Marketing Hub  
**Status:** Live — main pushed; CF auto-deploy  
**Last goodbye:** 2026-08-11 — session handoff in `docs/KIMI-HANDOFF.md` · `LATEST-UPDATE.md`

## Shipped highlights (v2.10)

- In-flow **4-column footer** (all pages, legal, suite, giveabit logo) — not sticky  
- Mega model pack: data quality, confidence bands, Monte Carlo, vertical scores, gas decline, CapEx/FX, amortization, carbon overlay  
- Dashboard: portfolio rollup, province leaderboard, KPI picker, one-pager, weekly digest, term sheet  
- Map: saved views, visible site list drawer  
- Pitch speaker notes · funding capital tools · PWA install + stale banner + density toggle  
- Site details: case study export + full model panels  

## Pipeline

```text
npm run validate && npm run test:helpers && npm run build
git push origin main
npm run deploy:check   # optional post-deploy
```

## Knowledge

| File | Role |
|------|------|
| `docs/KIMI-HANDOFF.md` | Session handoffs (append top) |
| `LATEST-UPDATE.md` | One-line last session |
| `.ai_docs/current-status.md` | Agent status layer |
| `CHANGELOG.md` | Release notes |
| `docs/DEPLOYMENT.md` | Deploy truth |
