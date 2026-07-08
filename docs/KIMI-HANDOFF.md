# Kimi Handoff — Stranded

## Latest Session Summary (from 2026-07-07)

**Chat topic:** Fix Stranded Score formula, deploy v2.2.1.

**Finished this session:**
- Root cause: ECCC geojson has no `distance_to_grid_km` or `internet_type` — v2 used worst-case defaults (max ~78, 0 sites ≥80)
- Shipped **Stranded Score™ v3** via `lib/scoring-shared.cjs` (shared across app, live-stats, validation)
- Distribution now: avg ~60, 108 sites ≥80, 32 elite ≥85; Keele Valley Landfill tops at 93
- Updated methodology, education copy, CHANGELOG; bumped to **v2.2.1**; pushed to main

**Still to do:**
- CF API token for wrangler fallback; SSH git remote; OAuth portfolios
- Enrich geojson with real grid distance / internet when data source found
- Kimi: sync this handoff when Cam says go

---

## Latest Session Summary (from 2026-07-03 goodbye)

**Chat topic:** Confirm deployment, then implement upgrades 101–150.

**Finished this session:**
- Deploy confirmed live at **v2.2.0** (was stuck on v1.0.0; CF caught up after push)
- Round 4 (101–150): heatmap, IndexedDB, 5 new pages, export formats, education polish, integrations
- 150 total upgrades shipped across four rounds; 21 static routes
- Handoff + session summary written; git clean on `main`

**Still to do:**
- CF API token for wrangler fallback; SSH git remote; OAuth portfolios
- Kimi: sync `SESSION-SUMMARY-2026-07-03.md` + this file into Obsidian / MASTER-BRAIN

**Next for Kimi:** Update Stranded Kanban, architecture map, educate Hermes on v2.2 routes and deploy pipeline. Do not sync to M4 until Cam says go.

---

## Handoff to Kimi — 2026-07-03 (session end)

**Machine:** M3 (Grok)
**Project:** stranded

### Done
- [x] Deployment verified — https://stranded.giveabit.io at v2.2.0
- [x] Upgrades 101–150 (round 4) committed and pushed
- [x] SESSION-SUMMARY-2026-07-03.md + goodbye handoff complete

### Decisions
- Git push → CF Pages remains primary deploy; wrangler needs API token
- Privacy-first: local analytics stub, IndexedDB cache, no third-party trackers

### What's Next
- Round 5 upgrades (151+) if Cam wants another batch
- Security: rotate embedded git HTTPS token → SSH
- CF dashboard: confirm project watches `kitsboy/stranded` `main`

### Git State
- Last commit SHA: `dd5615a088edfc1a45eca66cd2095db490a00b1d`
- Branch: `main`
- Unpushed: none

---

## Handoff to Kimi — 2026-07-03 (upgrades 101–150, v2.2.0)

**Machine:** M3 (Grok) · **Commit:** `56eb847`

### Done
- [x] Confirmed git push deploy pipeline; production was stuck on v1.0.0 (CF auto-deploy lagging)
- [x] Round 4 upgrades 101–150: heatmap, IndexedDB, filter presets, 5 new pages, KML/GeoJSON export
- [x] Education quiz share + progress + genset table; ROI halving chart; Tadbuy/Sherpacarta hooks
- [x] PWA v3, offline indicator, pitch embed mode, keyboard help, v2.2.0

### Deploy note
- Wrangler manual deploy blocked (no CLOUDFLARE_API_TOKEN). Rely on CF Pages git hook.
- If production stays on v1.0.0, check CF Pages project connection to `kitsboy/stranded` main.

### What's Next
- Wire CF API token for manual `wrangler pages deploy` fallback
- Rotate git remote HTTPS token → SSH
- Full emission heatmap tuning; OAuth portfolios (still localStorage)

---

## Handoff to Kimi — 2026-07-03 (50 upgrades complete)

### Batch 1 (1–25)
- Scoring v2 formula, live featured sites, pitch/Marketing Hub/⌘K routes
- Pitch: Chart.js, choropleth, print/PDF, province charts
- ECCC refresh script + nightly docs-sync cron
- Footer live-stats stamp, score percentile badges
- Cluster ROI tooltips, gas treatment derate, LCOE on map panel
- SOFC in gensets, used ASIC market, Certified lead form
- CETA funding wizard, First Nations partnerships page
- Energy verticals page (wind/solar/waste heat/biomass/hydro)
- Mission CSV/PDF/share deep-links

### Batch 2 (26–50)
- Portfolio localStorage persistence + mission URL tokens
- Compare 2–3 sites modal, historical BTC + difficulty sliders
- Advanced ROI: tx fees, H2S derate, seasonal uptime, carbon credits, incentives, jobs
- Map: satellite layer, 3D terrain pitch, touch polish
- PWA service worker + update toast
- i18n language toggle (en/fr/de/es)
- a11y skip link, ARIA nav, next/image
- Map useEffect fixes, Playwright E2E smoke tests
- Education code-split, per-route OG metadata, JSON-LD
- .env.example, Slack CI notify on failure

## Handoff to Kimi — 2026-07-03 (earlier)

**Machine:** M3 (Grok)
**Project:** stranded

### Done
- [x] Verified full pipeline: validate → docs:sync → lint → build → push dry-run; live site confirmed at stranded.giveabit.io
- [x] Added GitHub Actions CI (`.github/workflows/ci.yml`) + `npm run verify` script
- [x] Built self-evolving docs: `generate-live-stats.js` + `sync-docs.js` → `live-stats.json`, `LIVE-STATS.md`, injected blocks in README/STATUS/SOT
- [x] Created `/pitch` page — live charts, province/emission/genset breakdowns, BTC revenue, top sites table
- [x] Fixed ESLint config, SiteDetailsPanel hooks bug, metadataBase production URL, Marketing-Hub localhost links
- [x] Created `docs/DEPLOYMENT.md`, `docs/DOCUMENTATION.md`; updated root SOURCE-OF-TRUTH pointer

### Decisions
- Stats regenerate on every `npm run build` via prebuild/postbuild hooks — pitch page reads JSON, docs get marker blocks
- Pitch uses pure CSS/SVG charts (no new deps) + live CoinGecko BTC refresh every 60s
- CI runs on GitHub; CF Pages auto-deploys from main push

### What's Next
- Tune Stranded Score formula (most sites floor at 8 — home featured scores may be stale/hardcoded)
- Add pitch link to Marketing Hub nav + command palette routes
- Consider wrangler token rotation (remote URL has embedded credential — security hygiene)
- Kimi: wire nightly `docs:sync` into M3 Researcher Scan if desired

### Git State
- Last commit SHA: (see post-push)
- Branch: main
- Unpushed: this session's commit

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*