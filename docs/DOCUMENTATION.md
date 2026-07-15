# Stranded — Documentation Index

**Live:** https://stranded.giveabit.io  
**Repo:** https://github.com/kitsboy/stranded

---

## Self-Evolving Docs

Numbers in docs stay current via the build pipeline:

1. `scripts/generate-live-stats.js` — reads `data/stranded-sites-REAL.geojson`, writes `public/data/live-stats.json` + `docs/LIVE-STATS.md`
2. `scripts/sync-docs.js` — injects live stats blocks into README, STATUS, SOURCE-OF-TRUTH, this file
3. `npm run docs:sync` — run manually anytime
4. `prebuild` / `postbuild` hooks — auto-run on every build

**Pitch page** (`/pitch`) and **Marketing Hub** read the same live-stats JSON for charts.

---

## Core Docs

| Doc | Purpose |
|-----|---------|
| [SOURCE-OF-TRUTH.md](./SOURCE-OF-TRUTH.md) | Project bible — features, data, gaps |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Commit → push → deploy pipeline |
| [LIVE-STATS.md](./LIVE-STATS.md) | Auto-generated platform metrics |
| [MISSION.md](./MISSION.md) | Mission alignment |
| [STATUS.md](../STATUS.md) | Current status snapshot |
| [README.md](../README.md) | Developer onboarding |

## Marketing

| Doc | Path |
|-----|------|
| Executive Summary | `docs/Marketing/1-Executive-Summary-Enhanced.md` |
| One-Pager | `docs/Marketing/2-Marketing-One-Pager-Enhanced.md` |
| Mission Statement | `docs/Marketing/3-Mission-Statement-Enhanced.md` |
| Vision & Values | `docs/Marketing/4-Mission-Vision-Values-Enhanced.md` |
| Roadmap & Funding | `docs/Marketing/5-Roadmap-Funding-Enhanced.md` |
| Marketing Hub (HTML) | `/Marketing-Hub.html` |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — Stranded Value flow + personas |
| `/map` | Command Center — 2,611 sites, filters, ROI |
| `/education` | Education Center — simulators, quiz, toolkit |
| `/sites` | All sites explorer |
| `/pitch` | Live investor pitch — charts + auto-stats |
| `/Marketing-Hub.html` | Print-ready marketing suite |

## Data

- **Source:** Environment & Climate Change Canada (ECCC) open data
- **Canonical file:** `data/stranded-sites-REAL.geojson` (2,611 features, never mutated)
- **Served at:** `/data/stranded-sites.geojson`
- **Key field:** `emission_rate_kg_day` → generator power → ASIC count → BTC revenue

## Scripts

```bash
npm run dev          # Dev server :3003
npm run build        # Static export + docs sync
npm run validate     # Data integrity (2611 sites)
npm run docs:sync    # Regenerate live stats + sync docs
npm run verify       # Full pipeline check
```

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*

<!-- LIVE-STATS:START -->
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-07-15T23:56:39.145Z

| Metric | Value |
|--------|-------|
| Sites | 2,611 |
| Provinces | 13 |
| Daily methane (kg) | 2,053,504 |
| CH₄ (tonnes/yr) | 749,529 |
| Avg Stranded Score | 60.4 |
| High-score sites (≥80) | 108 |
| 5% CO₂e avoided/yr | 1,049,340 t |
| Model annual revenue | $15,090,541,726 (@ $85,000 BTC) |

Full breakdown: [docs/LIVE-STATS.md](./LIVE-STATS.md) · Live JSON: `/data/live-stats.json` · Pitch: [https://stranded.giveabit.io/pitch](https://stranded.giveabit.io/pitch)
<!-- LIVE-STATS:END -->
