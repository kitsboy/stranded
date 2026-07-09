# STRANDED

**Stranded Energy, Bitcoin Access**  
**Stranded Value — Turn wasted energy into verifiable Bitcoin-powered wealth.**

A premium, immersive intelligence platform for mapping, modeling, and funding stranded energy opportunities. Built for GiveAbit.

## What is this?

An open, public dataset from Environment & Climate Change Canada (ECCC) showing 2,611 real stranded methane emission sites that are currently uneconomical to capture. 

We integrate real generator models (Jenbacher, Caterpillar, MAN, etc.) to turn that gas into on-site power, then Bitcoin mining — creating BTC with zero grid impact while destroying potent methane and generating verifiable economic value ("Stranded Value").

This project is the definitive interactive experience for that thesis:

- **Command Center Map** (`/map`) — Live filters (provinces, sources), 2,611 sites, generator sizing in details, per-site Value/ROI (CapEx, methane loss opportunity cost, financing), portfolio "Mission" simulator, deep links.
- **Education Center** (`/education`) — World-class: simulators with live BTC + real gensets, 6+ generator models with specs/prices, per-site Value explorer wired to real geojson (emission → power kW → ASICs → daily BTC revenue + CapEx + financed payback), animated chemistry, Stranded Value IQ quiz, risk matrix, timeline, Value Toolkit + downloads.
- **All Sites** (`/sites`) — Explorer with generator power kW + recommended genset columns.
- **Home** — Clear "Stranded Value Flow" (Discover → Learn → Build → Fund) + persona-driven business paths (Operators, Capital, Gov, Landowners).
- **Pitch Deck** (`/pitch`) — Live investor page with auto-updating charts, province/emission/genset breakdowns, BTC revenue model, top sites table.
- **Marketing Hub** (`/Marketing-Hub.html`) — Self-contained professional suite with 5 docs, visuals, charts, print/PDF.
- Every single one of the 2,611 original properties is preserved and explorable with honest, dynamic calcs.

## Tech

- Next.js 14 (app router) + TypeScript + Tailwind + Framer Motion
- MapLibre GL (fast, self-hosted)
- Live BTC price (CoinGecko)
- Shared generator + ROI logic in `lib/sites.ts` (GENSET_DATA for 6+ models, computeGeneratorPower, per-site Value with CapEx/financing/methane-loss)
- Static export (`output: 'export'`, `dist/`)
- Fully client-side, PWA-ready

## Run it (Development)

```bash
npm install

# Recommended clean ritual (especially after builds or when you see cache/CSS 404s)
rm -rf .next dist node_modules/.cache
npm run dev
```

Open http://localhost:3003

> **Note:** The project is configured for smooth dev (`next dev` uses normal `.next` with full HMR + CSS). Production builds (`npm run build`) still output a static site to `dist/` for Cloudflare Pages / `stranded.giveabit.io`.

Hit **⌘K** (or the Search button) anywhere for the global site command palette. It's magical.

## Key Features (Current — v2.3.5)

- **Stranded Score™ v3** — Shared formula (`lib/scoring-shared.cjs`); factor explain UI; inferred grid/internet when ECCC fields missing; tier colors elite/high/med/low.
- **Bank packs** — Diligence exports: CSV, Excel-friendly TSV, Markdown, HTML print, JSON (site + mission).
- **Command Center Map** — Filters, heatmap, score legend, mission portfolio, peers, sensitivity tornado, watch-site local banner, deep links (`site`, `province`, `mission`).
- **Active Mission Portfolio** — localStorage; add from map, education, or sites browser.
- **Live BTC + Real Machines** — CoinGecko + genset library + advanced ROI in `lib/roi-model.ts`.
- **Education** — Simulators, quiz, real-site explorer, glossary tips on methodology.
- **Mobile** — Primary CTAs live inside sticky footer (no fixed ghost bar).
- **i18n** — Nav labels EN/FR/DE/ES; language menu opens downward (EN default).
- **Quality** — `npm run validate` · `test:helpers` · `e2e` (9) · `deploy:check`.
- **Docs / handoff** — `docs/KIMI-HANDOFF.md`, `SESSION-SUMMARY-2026-07-09.md`, `docs/PROGRESS-SNAPSHOT-2026-07-09.md`.

## Data

Source of truth: `data/stranded-sites-REAL.geojson` (never mutated). 2,611 verified ECCC sites.

Served at `/data/stranded-sites.geojson`.

Key fields wired into Value: emission_rate_kg_day (gas → genset power kW → ASIC count → daily BTC), province, source_type, confidence, ch4_tonnes_year, etc. Generator models + ASIC data produce CapEx, methaneLossDailyBtc (opportunity cost), financed payback.

All original ECCC fields + enriched (recommendedGenset, maxGeneratorPowerKW, strandedScore) inspectable.

## Philosophy

Be daring. Make data beautiful and actionable. Prioritize the delight of exploration over feature bloat.

This is a tool for believers in fixing the money *and* the world at the same time.

## License & Credits

Data: Environment and Climate Change Canada — open data.

Interface & intelligence layer: GiveAbit Intelligence.

## Current & Next

See `docs/SOURCE-OF-TRUTH.md`, `docs/DEPLOYMENT.md`, `docs/DOCUMENTATION.md`, `docs/LIVE-STATS.md` (auto-generated), and `docs/Marketing/` for living docs. Run `npm run docs:sync` to refresh all stats from the 2,611-site dataset.

Recent completed: 25+ home enhancements, 20+ education (incl. machines/configurator/chemistry/persona), generator wiring across panel/map/education/lib, 30 premium items (LCOE, financing, regional, viz, etc.), global design polish, full docs + marketing cleanup.

Future: Deploy to https://stranded.giveabit.io (Cloudflare Pages from this GitHub), more verticals (wind, heat, etc.), live API refreshes, "Stranded Value Certified", used-market explorer, full map ROI.

Built with love for the orange pill and the blue planet.

<!-- LIVE-STATS:START -->
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-07-09T21:13:45.828Z

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
