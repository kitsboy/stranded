# Stranded Value — Status

**Updated:** 2026-07-03 by Grok  
**Site:** https://stranded.giveabit.io (Cloudflare Pages)  
**Build:** Next.js static export — `npm run build` → `dist/`  
**Dev:** `npm run dev` → `localhost:3003`  
**Data:** 2,611 ECCC methane sites, live map, education hub, pitch deck, marketing hub  
**Status:** Live — all routes work, map loads, auto-sync docs active

**New:** `/pitch` live investor deck with auto-updating charts from `live-stats.json`  
**Pipeline:** `npm run verify` — full commit/push/deploy check + GitHub Actions CI

<!-- LIVE-STATS:START -->
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-07-03T18:46:28.660Z

| Metric | Value |
|--------|-------|
| Sites | 2,611 |
| Provinces | 13 |
| Daily methane (kg) | 2,053,504 |
| CH₄ (tonnes/yr) | 749,529 |
| Avg Stranded Score | 46.9 |
| High-score sites (≥80) | 0 |
| 5% CO₂e avoided/yr | 1,049,340 t |
| Model annual revenue | $15,090,541,726 (@ $85,000 BTC) |

Full breakdown: [docs/LIVE-STATS.md](./LIVE-STATS.md) · Live JSON: `/data/live-stats.json` · Pitch: [https://stranded.giveabit.io/pitch](https://stranded.giveabit.io/pitch)
<!-- LIVE-STATS:END -->
