# Stranded Value — Status

**Updated:** 2026-11-22
**Site:** https://stranded.giveabit.io (Cloudflare Pages · project `strandedbuild`)
**GitHub:** https://github.com/kitsboy/stranded (`main`)
**Build:** Next.js static export — `npm run build` → `dist/`
**Dev:** `npm run dev` → `localhost:3003`
**Version:** **2.17.0**
**Methane (Lead Story):** 2,611 mapped facilities, 2,588 with reported CH₄, 675 high-confidence. Newest filing year in the file: 2024.
**Energy Atlas & Phase 3 SMR Horizon:** 1,049 NRCan renewable plants + 207 remote communities (143 fossil microgrids, 111 sized) + Phase 3 Nuclear & Small Modular Reactor (SMR) interruptible baseload simulator on `/verticals`.
**Public Pitch & Sovereign Pension Suite (v2.16.0–v2.17.0):**
- **6-Step Codified Math Engine (`HowTheMathWorks`)**: Live Network (`~0.41 sat/TH/d`) vs. Optimistic (`0.90 sat/TH/d`) toggle, Sankey energy-to-sats diagram, and Excel-formula `.TSV` export.
- **Vendor-Neutral Capture Huts (`CaptureHutSizer`)**: 10ft/20ft/40ft Air & Immersion enclosures, CH₄/H₂S gas composition sliders, Waste-Heat Co-Gen sizer, SVG engineering schematic, Used vs. Next-Gen ASIC matrix, and Vendor RFQ export.
- **10% Sovereign Canadian Bitcoin Pension Plan (`SovereignPensionPlan`)**: 6 National, Provincial Heritage, and First Nations trust modes, 10% Flat BTC vs. 27% Status-Quo Fiat Tax comparison, CPP/Norway GPFG benchmarks, `#pension` shareable URL hash, and Printable Whitepaper PDF.
- **Global Capital & Grants Directory (`GlobalCapitalDirectory`)**: 13+ verified programs across Canada Federal, AB, BC, ON/SK, USA, and Europe + Two-SPV Stackable Capital Calculator, DSCR Stress Tester, Equipment Lease vs. Buy toggle, and 1-Click Data Room Bundle.
- **Map Hover & Cockpit Polish**: Hover popups stay open with a 340ms bridge and clickable `"Click to build it →"` button; desktop & mobile `SiteDetailsPanel` share the 4-tab cockpit (`Overview · Build · Financials · Evidence`); 15 km Radius Cluster Builder and Mission QR code included.
**Docs:** https://stranded.giveabit.io/docs

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
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-11-22T23:16:18.865Z

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
