# Stranded Value — Status

**Updated:** 2026-08-11 by Grok  
**Site:** https://stranded.giveabit.io (Cloudflare Pages · project `strandedbuild`)  
**GitHub:** https://github.com/kitsboy/stranded (`main`)  
**Build:** Next.js static export — `npm run build` → `dist/`  
**Dev:** `npm run dev` → `localhost:3003`  
**Data:** 2,611 ECCC methane sites  
**Version:** **2.11.0** · **Routes:** 26 static app pages + Marketing Hub  
**Status:** Live — main pushed; CF auto-deploy  
**Last goodbye:** 2026-08-11 — session handoff in `docs/KIMI-HANDOFF.md` · `LATEST-UPDATE.md`

## Shipped highlights (v2.11)

- **Fleet templates v2** — save the miner stack as a named template (inline name input), apply to this site or any other (rescales to that site's gas), browse all 5 presets
- **Fleet in every export** — bank pack (md/html/json), case study, term sheet, one-pager all carry the fleet config when one is set (unchanged when not)
- Persistent saves survive reload; corrupt localStorage key can never white-screen the static site

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

<!-- LIVE-STATS:START -->
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-09-12T00:17:46.420Z

| Metric | Value |
|--------|-------|
| Sites | 2,611 |
| Provinces | 13 |
| Daily methane (kg) | 1,967,567 |
| CH₄ (tonnes/yr) | 718,162 |
| Avg Stranded Score | 60.3 |
| High-score sites (≥80) | 103 |
| 5% CO₂e avoided/yr | 1,005,427 t |
| Model annual revenue | $14,458,890,380 (@ $85,000 BTC) |

Full breakdown: [docs/LIVE-STATS.md](./LIVE-STATS.md) · Live JSON: `/data/live-stats.json` · Pitch: [https://stranded.giveabit.io/pitch](https://stranded.giveabit.io/pitch)
<!-- LIVE-STATS:END -->
