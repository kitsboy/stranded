# Stranded — Documentation
> Last updated: 2026-06 (current with Stranded Value branding, generator models + full per-site Value piping from 2611 real geojson, home flow + personas, lighter design, full marketing/docs cleanup)

## What This Is
Interactive platform for Stranded Value: 2,611 real ECCC sites, real methane-to-power generator models (specs, CAPEX, efficiency, prices), honest per-site Value/ROI (generator CapEx + ASIC mining revenue (live BTC) + financing + explicit methane-loss opportunity cost), rich Education Center, clear business flow + persona paths, professional Marketing Hub.

**CURRENT (local dev):** http://localhost:3003 (Next.js on port 3003)
- `/` : Home — "Stranded Value Flow" (Discover→Learn→Build→Fund) + persona business cards (Operators / Capital / Gov / Landowners) + CTAs
- `/map` : Command Center (live filters by province/source, 2,611 pins, SiteDetails with genset select + debt/interest + CapEx + methaneLossDailyBtc + financed payback, Mission portfolio aggregates incl. total generator kW)
- `/education` : Stranded Value Education Center (3 simulators w/ live BTC+genset, 6+ machines w/ full specs+configurator+LCOE+bars+apply, per-site Value explorer on real top emitters by province with financing/persona/regional, chemistry animation, quiz, risk matrix, timeline, Value Toolkit w/ downloads + progress)
- `/sites` : All sites explorer (generator power/recommended columns)
- `/Marketing-Hub.html` : Self-contained Marketing & Sales Hub (5 living docs + visuals + charts + taxonomy + print-ready, lighter #243447)

**FUTURE:** https://stranded.giveabit.io (Cloudflare Pages static deploy from GitHub main)
**PREVIOUS (deprecated):** https://tools.giveabit.io/stranded/ (Umbrel etc. — removed)

## Current Tech & Structure
- Next.js 14 (app router only for routes+layout)
- Static export (`next.config.js`: `output:'export'`, `distDir:'dist'`)
- Dev: `rm -rf .next dist && npm run dev` (port 3003 per package.json)
- Build: `npm run build`
- Preview: `npx serve -p 3003 dist`
- Data: `public/data/stranded-sites.geojson` (2,611 features from ECCC; **key field emission_rate_kg_day powers generator sizing + full Value calc**; also province, source_type, confidence, name, city, ch4_tonnes_year, reference_year, ghgrp_id + all others exposed)
- Shared logic: `lib/sites.ts` (GENSET_DATA 6+ models w/ powerKW/eff/methaneNm3h/capexPerKW/notes, computeGeneratorPower(dailyMethaneKg, gensetId, derate), recommendGenset, enrichSite (adds recommended + max kW), loadSites/fetch, computeSiteValue pipeline for dailyBtcRevenue / CapEx / methaneLoss / paybacks / financing)
- Branding: "Stranded" + "Value" logo treatment (Nav etc.), "Stranded Energy, Bitcoin Access", globally ~20% lighter bg (#243447 CSS var + glass updates + btn polish)

## Key Recent Enhancements (Current as of 2026-06 full pass)
- Education Center (major): Stranded Value rebrand everywhere, 3 simulators (basic/adv w/ BTC sensitivity + genset integration + treatment effect; regionalImpact), 6+ real genset models full cards (power/eff/methaneNm3h/capexPerKW/opex/notes/2026 prices), live visual Power Plant Configurator (numUnits, treatmentAdder, LCOE, power bars, apply-to-sim buttons), massive per-site Value explorer (real geojson load, top-30 by province select, genset/ASIC/financing/persona controls, honest pipeline: emission_kg_day → powerKW (derate by confidence/source) → numAsics → dailyBtcRevenue (live) → profitCAD → totalCapEx (genset+asics) → annualFinancingCost → paybacks + explicit methaneLossDailyBtc opportunity cost + personaNote + regional note + map deep-link), animated chemistry (framer), Stranded Value IQ quiz + scoring + recs, "From Problem to Value" timeline, Risk vs Value matrix, expanded glossary, Value Toolkit (localStorage progress, comparison, JS blob downloads for brief + hub PDF, CTAs), impact counter.
- Whole-project generator + Value integration: lib/sites.ts shared GENSET + compute, SiteDetailsPanel (genset dropdown + debt%/interest sliders + generatorPowerKw + gensetCapex + methaneLossDailyBtc + financedPayback in ROI display), MissionPanel (totalGeneratorPower etc.), /sites table (maxGeneratorPowerKW + recommended), home flow/persona.
- Design & Flow: Global lighter backgrounds, glass hovers, new primary/secondary buttons, "How Stranded Value Works - Clear Business Flow" 4-step + "Choose Your Path" persona cards w/ tailored CTAs on home.
- Marketing + Docs: All 5 .md refreshed, self-contained Marketing-Hub.html (lighter bg, Stranded Value, new features noted, print CSS, charts, visuals), SOURCE/DEPLOY/DOCUMENTATION full current rewrites + this cleanup pass (branding, links, commands, generator/Value details).
- Data honesty: Every usable field from 2611 (esp. emission_rate_kg_day) piped into real, always-current calcs. No hard-coded %. Financing, derates, persona, regional suitability explicit.

## Data
- Primary: ECCC GHGRP (verified 2,611 sites)
- File: public/data/stranded-sites.geojson
- Used fields: emission_rate_kg_day (drives gas → power → ROI), province (regional), source_type/confidence (context/derate), name/city/etc. for labels.
- Generator models (shared in lib/sites.ts + education): Mobile 250kW, Jenbacher J316, Cat G3520H, MAN 20V, Cummins, Capstone, + extras (Wärtsilä, future SOFC). Specs include powerKW, eff, methaneNm3h, capexPerKW.

## Common Commands (Always Clean Caches)
```bash
# Dev (recommended — now uses normal Next dev experience)
rm -rf .next dist node_modules/.cache
npm run dev          # http://localhost:3003

# Validate data
npm run validate

# Build (static export to dist/ for Cloudflare)
npm run build

# Preview the built static site
npm run preview
# or: npx serve -p 3003 dist
```

## Troubleshooting (Current)
- Cache ENOENT errors (`dist/cache/webpack/...`), missing CSS (`layout.css 404`), chunk 404s: The old `output: 'export' + distDir` combo polluted the dev server. We fixed the config so `dev` is now clean. Run the full ritual:
  ```bash
  rm -rf .next dist node_modules/.cache
  npm run dev
  ```
- Nothing on 3003: Run `npm run dev` after the clean above.
- HMR / module errors after kill or build: Same ritual.
- Heavy pages (education/map): Client-side heavy (2611 geojson load + simulators + per-site explorer). Works great in dev and static build.
- Old external links: All active docs point to localhost:3003/* (dev) or future https://stranded.giveabit.io.

## How It Works (Current Simple Flow)
1. `npm run dev` serves Next.js on localhost:3003
2. Browser loads React app (client-side heavy for map/education)
3. Data fetched from public/data/stranded-sites.geojson (enriched client-side with generator/ROI logic)
4. Click site → SiteDetailsPanel shows real per-site Value (generator + mining + CapEx + loss + financing)
5. Education → per-site explorer uses same real data + machines for education + business value.

## Data Format (stranded-sites.geojson)
Features have properties including:
- ghgrp_id, name, company, province, city, source_type, emission_rate_kg_day, ch4_tonnes_year, ch4_co2e_tonnes, confidence, reference_year, etc.

Enriched on load (lib/sites.ts): strandedScore, potentialDailyProfitCAD, emission, recommendedGenset, maxGeneratorPowerKW.

## Remember
- **Always** `rm -rf .next dist` before `npm run dev` after any build or interrupted session.
- All Value/ROI calcs (gas → genset power/CapEx → #ASICs + live BTC revenue → opex → total CapEx + explicit methane loss daily BTC + debt/interest financing → paybacks) are real, dynamic, and squeezed from the live 2611-site geojson + GENSET_DATA + ASIC model.
- Marketing Hub + all docs (SOURCE, DEPLOYMENT, DOCUMENTATION, 5 .md) kept current in this pass (Stranded Value, generators, flow, design, commands, future URL).
- Future: Deploy to Cloudflare Pages for https://stranded.giveabit.io (just push main; CF builds dist/). Update DNS once.

**If all else fails (the ritual):**
```bash
rm -rf .next dist node_modules/.cache && npm run dev
```
(For built preview: `npm run preview` or `npx serve -p 3003 dist`)