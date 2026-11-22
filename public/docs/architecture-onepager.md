# Stranded Value — Technical Architecture One-Pager

**Live:** [https://stranded.giveabit.io](https://stranded.giveabit.io) · **Repo:** [https://github.com/kitsboy/stranded](https://github.com/kitsboy/stranded) · **Version:** `2.16.0`

## 1. Stack & Runtime Architecture
- **Framework:** Next.js 14 (App Router, static export `output: 'export'` to `dist/`) + TypeScript 5 + Tailwind CSS.
- **Geospatial Engine:** MapLibre GL JS 5 with native GPU pin clustering, province emission/renewable choropleths, NSRDB solar irradiance rasters, and hydrokinetic polygons.
- **Deep-Link Fast Path:** Pre-generated per-site JSON records (`/public/data/site/<GHGRP_ID>.json`, ~587 B gzipped across 2,611 sites) warm-start deep links (`/map?site=G10365`) in milliseconds before the 2.85 MB full GeoJSON finishes hydrating.
- **Offline-First PWA:** Service Worker + IndexedDB GeoJSON caching (`lib/offline-db.ts`) and local-first storage for missions, bookmarks, watchlists, and custom fleet templates.
- **Cryptographic Provenance:** Dataset SHA-256 and per-pin proofs anchored to the Bitcoin blockchain via OpenTimestamps (`lib/satohash.ts`, `lib/pin-proof.ts`).

## 2. System Data Flow
```
[ECCC Open GHGRP (2,611 sites) + NRCan Renewables (1,049) + Remote Communities (207) + StatCan 2025]
       │
       ▼  (Build-time deterministic pipeline: scripts/generate-live-stats.js & generate-site-records.mjs)
[public/data/stranded-sites.geojson + live-stats.json + methane-capture.json + 2,611 site/<id>.json]
       │
       ▼  (Client runtime: zero backend lock-in, live mempool.space + CoinGecko multi-fiat feeds)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  • 6-Step Codified Math Engine (HowTheMathWorks.tsx)                                   │
│  • Miner Stack Cockpit & Shared Fuel-Budget Dispatcher (lib/fleet-model.ts)            │
│  • Capture Hut & Gas Scrubber BOM Sizer (lib/capture-huts.ts)                          │
│  • Sovereign Canadian Bitcoin Pension Simulator (lib/pension-model.ts)                 │
│  • Multi-Jurisdiction Capital & Grants Directory (lib/capital-directory.ts)            │
│  • 5-Format Bank Pack & Branded PDF Diligence Exporter (lib/bank-pack.ts)              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Verification & Quality Gates
Every build executes automated verification before deployment:
1. `npm run validate` — validates all 2,611 GeoJSON features, Stranded Score™ v3 distribution, and byte-exact parity across all 2,611 individual site records.
2. `npm run test:helpers` — unit-tests fuel budget dispatch, `÷ 24` daily-energy-to-average-kW physics, pin proofs, NRCan renewable overlays, StatCan capacity factors, capture huts, and pension math.
3. `npx tsc -p tsconfig.json --noEmit` & `npm run lint` — strict zero-error TypeScript and Next/React lint checks.
4. `npm run check:security` — secret hygiene scan across the repository.

## 4. Quick Start (Local Development)
```bash
git clone https://github.com/kitsboy/stranded.git
cd stranded
npm install
npm test
npm run dev   # http://localhost:3003
```

---
**Safe Harbour:** Educational / informational only. Part of the [Give A Bit](https://giveabit.io) family.
