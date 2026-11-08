# Stranded Value — Status

**Updated:** 2026-11-07 by Grok
**Site:** https://stranded.giveabit.io (Cloudflare Pages · project `strandedbuild`)
**GitHub:** https://github.com/kitsboy/stranded (`main` at `4664497`)
**Build:** Next.js static export — `npm run build` → `dist/`
**Dev:** `npm run dev` → `localhost:3003`
**Version:** **2.15.0**
**Methane:** 2,611 mapped facilities, 2,588 with reported CH₄, 675 high-confidence. Newest filing year in the file: 2024.
**Energy:** 1,049 plants, mostly August 2017. StatCan generation and capacity are both 2025, pulled 2026-11-04. Remote communities: 207 from the 2025 file (111 sized, 96 unsized).
**Story:** `/` and `/dashboard` price a top share of reported methane on a live mempool.space window. Vented gas is only the published fugitive split.
**Financing screen:** `docs/FINANCING-SCREEN.md`. Planning note from the 4 Nov 2026 window. Not a page on the site. Methane stays. Remind Cam of this plan at the next login.
**Docs:** https://stranded.giveabit.io/docs
**Status:** Live. The 2026-11-04 refresh is `a2f0c6d`. The docs index and this financing note are `4664497`.

The release notes below this header stop at v2.11. The current release list is `CHANGELOG.md` and `/changelog`.

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
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-10-05T01:05:42.818Z

| Metric | Value |
|--------|-------|
| Sites | 2,611 |
| Provinces | 13 |
| Daily methane (kg) | 1,967,567 |
| CH₄ (tonnes/yr) | 718,162 |
| Avg Stranded Score | 60.3 |
| High-score sites (≥80) | 103 |
| 5% CO₂e avoided/yr | 1,005,427 t |
| Model annual revenue | $601,777,343 (@ $85,000 BTC) |

Full breakdown: [docs/LIVE-STATS.md](./LIVE-STATS.md) · Live JSON: `/data/live-stats.json` · Pitch: [https://stranded.giveabit.io/pitch](https://stranded.giveabit.io/pitch)
<!-- LIVE-STATS:END -->
