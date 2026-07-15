# SOURCE OF TRUTH - Stranded (Value)

**Project Name:** Stranded (Stranded Value / Stranded Energy Intelligence Platform)
**Tagline:** Stranded Energy, Bitcoin Access (Value)

**Parent Company:** Give A Bit (giveabit.io)
**Portfolio Context:** Part of Bitcoin-centric sovereignty tools. Full architecture, maps, workflows, and agents live in Obsidian Vault at /Users/cam/MASTER-BRAIN on M4 (Kimi/HERMES). Nightly Obsidian syncs active. Work split across M3 (coding) and M4 (Master Brain) using clean handoff files.

**GitHub (Source of Truth):** https://github.com/kitsboy/stranded (renamed from stranded-canada to remove "Canada" branding while preserving full commit history and Cloudflare Pages connection)
**Branch:** main
**Last Major Update:** 2026-07-15 — **v2.5.0** live (round 6 upgrades 276–300: 241-key i18n, PWA v6, onboarding tour, site-search, mission-templates, E2E + docs pack). See `SESSION-SUMMARY-2026-07-15-v2.5.md` + `docs/UPGRADES-201-300.md`.

**Production (live):** https://stranded.giveabit.io (Cloudflare Pages project **`strandedbuild`**, git push `main`)  
**Local dev:** http://localhost:3003  
**Deprecated:** https://tools.giveabit.io/stranded/

**Key routes:**
- `/` — Stranded Value Flow + persona paths + live-stats hero
- `/map` — Command Center (filters, heatmap, mission, score explain, bank packs, deep links)
- `/education` — Simulators, gensets, quiz, real-site explorer → mission
- `/sites` — Cards/table, score/source filters, bulk mission, bank export
- `/pitch` — Live investor deck
- `/methodology` `/privacy` `/roadmap` `/open-data` `/status` `/dashboard` …
- `/Marketing-Hub.html` — Professional marketing suite

**Deployment:** see **`docs/DEPLOYMENT.md`** (canonical).  
- Framework: Next.js 14 app router · static export `dist/`  
- Scripts: `validate` · `test:helpers` · `e2e` · `deploy:check`  
- Git remote: `git@github.com:kitsboy/stranded.git`

**Core Purpose (Marketing Pitch):**
Stranded turns wasted energy (starting with methane) into verifiable Bitcoin-powered value — environmental restoration + economic returns + community wealth. By mapping 2,611 real Canadian sites, integrating real generator models (Jenbacher, Cat, MAN, Cummins, Capstone, Wärtsilä etc. with powerKW/eff/methaneNm3h/capexPerKW/2026 prices), and computing honest per-site Value/ROI (gas → genset power kW/CapEx → ASIC count + live BTC revenue → opex → total CapEx + methane loss opportunity cost + debt/interest financing → paybacks), we make stranded energy bankable and actionable. "Stranded Value" = climate + capital + sovereign opportunity. Visit giveabit.io to learn more.

**Key Features (Current State):**
- 2,611 real ECCC sites (geojson) with full enrichment (Stranded Score, recommendedGenset, maxGeneratorPowerKW) and every field (emission_rate_kg_day drives everything)
- Professional UI: ~20% lighter global bg (#243447 CSS var), refined glass + hovers, .btn-primary/secondary, orange (#FF8C00)/teal, logo "Stranded" + "Value" sub
- Education Center: Stranded Value focus, BTC + genset simulators, 6+ real machines w/ full specs + prices (see lib/sites.ts), visual Power Plant Configurator (numUnits, treatment adder, LCOE calc, bars), per-site Value explorer (select real top emitters by province; real emission → effective power kW via genset/derate → #ASICs → dailyBtcRevenue live → dailyProfitCAD → totalCapEx (genset+asic) → debt/interest financing → paybacks + explicit methaneLossDailyBtc as opportunity cost), persona notes, regional suitability, apply-to-sim, animated chemistry (framer-motion), quiz (5Q + recs), risk matrix, "From Problem to Value" timeline, Value Toolkit (checkbox progress, comparison table, JS downloads for brief/hub)
- Map/Command Center + SiteDetailsPanel: Full generator select + financing sliders (debt%, interest), power cap + gensetCapexBtc + methane loss callout + financedPaybackDays in ROI; MissionPanel aggregates totalGeneratorPower etc.
- Home: "How Stranded Value Works - Clear Business Flow" (4-step), "Choose Your Path - Persona Driven Business Flow" (4 cards w/ CTAs)
- Sites + Mission: Generator columns/aggregates everywhere
- Marketing Hub: Self-contained /Marketing-Hub.html (Tailwind+Chart.js+FA, 5 docs, images, capital streams viz, taxonomy, print CSS, lighter #243447)
- Shared: lib/sites.ts (GENSET_DATA, compute funcs, enrichSite, computeSiteValue), live BTC, static export
- All Value calcs honest/dynamic/real (squeezed from 2611 dataset fields + genset specs + ASIC 0.0000009 BTC/TH/day model)

**Data Source:**
- Primary: Environment and Climate Change Canada (ECCC) GHGRP — https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823
- File: public/data/stranded-sites.geojson (2,611 features)
- Key fields used: emission_rate_kg_day (core for gas → power → ROI), province, source_type, confidence, name, city, ch4_tonnes_year, reference_year, ghgrp_id (plus enriched: strandedScore, maxGeneratorPowerKW, recommendedGenset)
- Generator models integrated from real specs (powerKW, eff, methaneNm3h, capexPerKW, etc.)

**Recent Major Changes (2026-06):**
- Full rebrand: "Stranded Value" (titles/copy/glossary/education), logo treatment "Stranded" + "Value" sub (Nav, hub, etc.), "Stranded Energy, Bitcoin Access" hero/flow
- Generator + per-site Value everywhere: lib/sites.ts (GENSET_DATA 6 models + compute), education explorer (real geojson 2611 piped), SiteDetailsPanel (select + financing + CapEx + methaneLoss + payback), Mission/sites aggregates, configurator LCOE/treatment/chemistry
- Home: explicit 4-step Stranded Value Flow + 4 persona business cards/CTAs
- Design: Global lighter bg (#243447), glass polish, buttons, hovers; Marketing Hub lighter + current
- Education 2.0: simulators (BTC+genset), machines section, per-site IIFE explorer (persona/financing/regional), quiz, viz, toolkit, downloads
- Docs: Full SOURCE/DEPLOY/DOCUMENTATION rewrites + all Marketing .md + Hub updated + this cleanup pass
- Data: emission_rate_kg_day + all usable fields squeezed into real calcs (power, #miners, revenue, CapEx, loss, financed)
- Build/dev: Always `rm -rf .next dist` ritual; static export clean
- Deprecated: Old Umbrel/tools.giveabit.io/Vite remnants removed from active docs

**Mission Alignment:**
Bitcoin sovereignty, environmental remediation through energy capture + mining, education on real Value (climate + capital + community), transparent data-driven tools, linking to giveabit.io. Positive, approachable, focused on actionable sovereign wealth from stranded resources.

**Gaps / Next Opportunities:**
- Live API for newest ECCC data refreshes + auto-enrichment
- Stronger per-site ROI directly in /map SiteDetails + clusters (education explorer is currently richest)
- Gas treatment derate + LCOE visible on map/panel too
- More genset models (SOFC, fuel cells) + used/refurb market explorer + fleet decline curves
- "Stranded Value Certified" + gamified progress / lead-gen in hub
- Deploy to https://stranded.giveabit.io (CF Pages from GitHub main; update any DNS)
- Expand verticals (curtailed wind/solar, waste heat, biomass, hydro spill) with analogous machine/ROI models
- Full per-site export sheets (CSV/brief) from map + more map generator icons

**Hand-off Note (Kimi later per request):**
This file + README.md + the live app + Marketing assets are the primary current source. (KIMI-HANDOFF-*.md files to be refreshed in a future dedicated pass.)

**Generated / Last Full Docs Cleanup:** 2026-06 (this pass: all main docs + marketing + README + layout + stray info updated for Stranded Value, generators/Value piping, flow, lighter design, current Next.js + 2611 real calcs)
**Status:** Highly polished, data-driven, business-flow focused, ready for Cloudflare deployment to stranded.giveabit.io. All active documentation and marketing information current as of this update. Historical notes (BUILD-STATUS etc.) flagged.

---

**Template Rule:** Every future Give A Bit project must include at least this level of documentation: GitHub source, live URLs (dev + prod), deployment details, key docs list, simple pitch, Git snapshot, mission alignment, gaps, and clean hand-off note.

<!-- LIVE-STATS:START -->
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-07-15T20:16:32.767Z

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
