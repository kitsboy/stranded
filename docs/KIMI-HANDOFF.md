# Kimi Handoff — Stranded

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