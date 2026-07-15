# Kimi Handoff — Stranded

## Latest Session Summary (from 2026-07-15 — v2.8.0 dashboard command center)

**Chat topic:** Dashboard elite redesign — capture slider, emission tiers, live ticker, polish.

**Finished this session:**
- **4 new dashboard components** — `DashboardLiveTicker`, `DashboardCaptureSlider`, `DashboardEmissionTiers`, `DashboardSourceMix`
- **Dashboard page overhaul** — full-bleed hero, capture slider after Opportunity Radar, tier/source grid
- **Emission Tier Leaders** replaces simulated Top Movers; score badges + compare top 2 on sites table
- Quick Actions: Sites, Compare, Education + icons; Export live-stats JSON in hero
- Dashboard CSS (`.dashboard-hero`, `.dashboard-ticker`, `.dashboard-panel`)
- E2E +1 Opportunity Radar test; `test:helpers` dashboard-metrics cases
- `docs/UPGRADES-476-525.md` (50/50 shipped)

**Still to do:**
- GitHub release **v2.8.0**
- Kimi vault sync when Cam says go

**Git State:**
- Version: **2.8.0**
- Branch: `main`

---

## Latest Session Summary (from 2026-07-15 — v2.7.0 top-50 autonomous batch)

**Chat topic:** Ship everything feasible from top-50 backlog without user input.

**Finished this session:**
- live-stats per-province emission + revenue; revenue choropleth toggle
- Map cluster expand + pin click; compare URL sync; score-tier cluster colors; help toolbar btn
- Sites fuzzy search + full CSV; compare ROI rows; pitch auto-advance + Nostr share
- API docs expand; PWA v10; home prefetch; high-contrast theme
- `docs/UPGRADES-426-475.md` (23 shipped, 27 infra-blocked)

**Still to do:**
- CF API token; staging DNS; server PDF; cloud presets (need user/infra)
- GitHub release **v2.7.0**

**Git State:**
- Version: **2.7.0**
- Branch: `main`

---

## Latest Session Summary (from 2026-07-15 — v2.6.5 pitch deck elite redesign)

**Chat topic:** Fix pitch stat card overflow + elite polish entire `/pitch` page.

**Finished this session:**
- **Stat cards fixed** — responsive 2→3→6 grid, compact values on tablet, icons, no text bleed
- **Portfolio Capture Simulator** — 1–100% slider → CO₂e, BTC, revenue, generator kW
- **Province Opportunity Rank** — top 6 provinces by modeled revenue share
- **Score distribution** panel, live ticker, hero mesh, Present Mode + copy link CTAs
- `lib/pitch-metrics.ts`, `components/pitch/*`, pitch CSS, i18n +20 keys × EN/FR/DE/ES
- E2E +1 pitch stat overflow test; `test:helpers` pitch-metrics cases

**Still to do:**
- Kimi vault sync when Cam says go
- Optional: GitHub release **v2.6.5**

**Git State:**
- Version: **2.6.5**
- Branch: `main`

---

## Latest Session Summary (from 2026-07-15 — v2.6.1 round 8 polish + QA pack)

**Chat topic:** Parallel agent merges for upgrades **351–410** → polish/QA batch **411–425**.

**Finished this session:**
- **Map command center CSS** — upgrades 351–370 (`--map-hud-gap`, toolbar pill, filter glow, layer stack)
- **Extracted components** — `MapToolbar`, `MapHud`, `EcccFreshnessBadge`, `MapEmptyState`, `FilterPanelHeader`
- **`lib/map-csp.ts`** + `lib/format-number.ts` + `map-filters` validation helpers
- **i18n 365 keys** × EN/FR/DE/ES (ECCC badge, empty state, compare CTA, print line)
- **PWA** `stranded-v9` · province print ECCC header · map print header ECCC line
- E2E **+3** (map canvas visible, loading overlay clears, ECCC badge vs nav overlap)
- `test:helpers` — format-number, map-csp, validatePresetName, shouldShowFilterToast
- `docs/UPGRADES-351-425.md` (75/75), CHANGELOG [2.6.1], TS merge fixes

**Still to do:**
- Kimi: sync when Cam says go — ingest v2.6.1 + UPGRADES-351-425
- GitHub release **v2.6.1** after push + deploy:check (no SHA yet this session)

**Git State:**
- SHA: *(pending — session handoff before push)*
- Version: **2.6.0** in package.json (CHANGELOG drafts 2.6.1; no package bump per Cam)
- Branch: `main`
- Pipeline target: `npx tsc --noEmit` ✅ · `npm run test:helpers` ✅ · e2e **19** expected

---

## Session Summary (from 2026-07-15 — v2.5.0 round 6 elite release)

**Chat topic:** Round 6 upgrades 276–300 → v2.5.0 ship.

**Finished this session:**
- **i18n 241 keys** × EN/FR/DE/ES — pitch, map, education headings, errors, onboarding, SW toast
- **HtmlLangSync** — `document.documentElement.lang` follows locale
- **PWA** `stranded-v6` + improved SW update toast with version label
- **Layout** theme-color #243447 + apple touch icons; home prefetch /map + /pitch
- **Libs** `site-search`, `mission-templates`, `performance` timing stub
- **Onboarding tour** on map (dismissible); geolocate HUD button
- E2E **+3** (onboarding dismiss, geolocate, recent sites in palette)
- `docs/UPGRADES-201-300.md`, CHANGELOG [2.5.0], roadmap, diligence v2.5.0
- `SESSION-SUMMARY-2026-07-15-v2.5.md` + `KIMI-HANDOFF-STRANDED-2026-07-15-v2.5.md`

**Still to do:**
- Kimi: sync when Cam says go — ingest v2.5.0 summaries + UPGRADES-201-300
- GitHub release **v2.5.0** after push + deploy:check

**Git State:**
- SHA: `685e2ad`
- Version: **2.5.0**
- Branch: `main` · 1 commit ahead of origin
- Pipeline: validate ✅ · test:helpers ✅ · build ✅ (26 pages) · e2e **14/14** ✅

---

## Session Summary (from 2026-07-15 — v2.4.0 round 5 full ship)

**Chat topic:** whatsup recovery → all pending items + round 5 upgrades 151–200 → push.

**Finished this session:**
- GitHub release **v2.3.7** tagged (`e6f5452`) — audit remediations bookmark
- **i18n expansion** — 107 keys × EN/FR/DE/ES; `useLocale` hook; home/footer/sites/mission
- **MapLibre native clusters** — tier colors, 3-mode toggle, auto-default >180 sites
- **Upgrades 151–175** — compare, province print, Nostr share, bookmarks tags, GWP calc, methodology calculator, JSON-LD, verticals wind/heat, PWA shortcuts, j/k map nav
- **Upgrades 176–200** — grant quiz, choropleth, score sparkline, halving slider, watch toasts, Tadbuy/Sherpacarta hooks, lazy education charts
- `docs/UPGRADES-151-200.md` — 50/50 shipped
- CHANGELOG [2.4.0], roadmap, diligence v2.4.0, SOURCE-OF-TRUTH bump
- E2E **11/11** pass (incl. compare + province print)
- PWA cache `stranded-v5`
- `SESSION-SUMMARY-2026-07-15.md` + `KIMI-HANDOFF-STRANDED-2026-07-15.md`

**Still to do:**
- Kimi: sync when Cam says go — ingest summaries + UPGRADES doc into Obsidian/MASTER-BRAIN
- GitHub release **v2.4.0** after push + deploy:check

**Git State:**
- Version: **2.4.0**
- Branch: `main` · 4 feature commits ahead of origin

---

## Session Summary (from 2026-07-10 goodbye)

**Chat topic:** Comprehensive audit + ship remediations (security, reliability, a11y) → **v2.3.6** and **v2.3.7**.

**Finished this session:**
- Full audit report (security / race / reliability / a11y / UI)
- **v2.3.6:** CSP + security headers, HTML-escape exports, PasswordGate removed, SW v4 network-first, map pointer-events fix, mission BTC scaling, error states
- **v2.3.7:** Shared BtcPriceProvider, FocusTrap dialogs, Next **14.2.35**, drop js-cookie, Chart.js CSP, i18n honesty note
- Live: https://stranded.giveabit.io · `deploy:check` **OK 2.3.7**
- SESSION-SUMMARY-2026-07-10.md written

**Still to do:**
- Kimi: sync only when Cam says go — ingest this summary + SESSION-SUMMARY-2026-07-10.md into Obsidian/MASTER-BRAIN
- Optional: GitHub release tag v2.3.7; CF API token for wrangler panic deploys
- Optional later: full i18n; MapLibre native clusters

**Next for Kimi:** Do **not** sync until Cam says go. Update Stranded Kanban + note deploy ritual: `push main` → wait → `npm run deploy:check`. CF project **strandedbuild**. No full chat logs.

**Git State (goodbye):**
- SHA: `e3caf82`
- Version: **2.3.7**
- Branch: `main` · Unpushed: none after goodbye push

---

## Latest Session Summary (from 2026-07-09 goodbye)

**Chat topic:** Stranded full-day ship: power-ups, P0–P2, mobile/language fixes, docs backup, GitHub release tag, clean goodbye.

**Finished this session:**
- Live **v2.3.5** at https://stranded.giveabit.io (`deploy:check` OK)
- GitHub release **v2.3.5**: https://github.com/kitsboy/stranded/releases/tag/v2.3.5 (tag → `5dc9bc0`)
- Score explain, bank packs, mission portfolio, deep links, watch banner
- Mobile footer CTAs; language menu downward + EN default
- Docs pack + tarball; DEPLOYMENT truth = CF project **strandedbuild**
- E2E 9 tests; `npm run test:helpers` + validate

**Still to do:**
- Kimi: when Cam says sync — ingest `SESSION-SUMMARY-2026-07-09.md` + this file into Obsidian/MASTER-BRAIN
- Kimi: M4 ~/projects cleanup (stranded/openstrata/btcminiscript if still present)
- Cam optional: CF API token panic deploy; staging DNS

**Next for Kimi:** Do **not** sync until Cam says go. Then update Stranded Kanban + architecture map; educate Hermes on v2.3.5 release URL and deploy ritual (`push main` → `deploy:check`). No full chat logs.

**Git State (goodbye):**
- SHA: `5dc9bc0` (+ docs goodbye commit may append)
- Tag: `v2.3.5`
- Branch: `main` · Unpushed: none after goodbye push

---

## Session — 2026-07-09 (full day — progress locked)

**Machine:** M3 (Grok) · **Project:** stranded  
**Production:** https://stranded.giveabit.io · **v2.3.5** · `deploy:check` OK  
**CF Pages:** `strandedbuild` · **GitHub:** kitsboy/stranded `main`

### Done
- [x] Client power batch v2.3.0–2.3.5 (score explain, bank packs, peers, sensitivity, pages)
- [x] P0 / P1 / P2 versioned deploys
- [x] Mobile footer CTAs; language menu fix
- [x] Docs + SESSION-SUMMARY + snapshot tarball
- [x] GitHub release tag **v2.3.5**
- [x] Goodbye handoff complete

### Decisions
- Client-first; localStorage mission/leads (honest)
- Bank pack multi-format text; no heavy xlsx
- Wrangler project name **strandedbuild** only
- Tag is bookmark only (site already live)

### Still open (Kimi / Cam)
- [ ] Kimi: M4 MASTER-BRAIN sync when Cam says go
- [ ] Kimi: M4 ~/projects cleanup
- [ ] Cam: CF API token for wrangler emergency deploy

### Knowledge files
- `SESSION-SUMMARY-2026-07-09.md`
- `docs/PROGRESS-SNAPSHOT-2026-07-09.md`
- `archive/snapshots/stranded-docs-handoff-2026-07-09.tgz`
- `docs/DEPLOYMENT.md`
- Release: https://github.com/kitsboy/stranded/releases/tag/v2.3.5

---

## Session — 2026-07-09 (earlier — v2.3.0 power batch)

**Done:**
- v2.3.0 client-only power batch: score explain, bank packs, peers, sensitivity, `/privacy` `/roadmap` `/open-data`
- Tests: test:helpers + validate + e2e; CF strandedbuild

**Decisions:**
- Excel via TSV; backends deferred

**Git State:**
- SHA: `690670d` (superseded by later 2.3.x commits)

---

## Latest Session Summary (from 2026-07-07 goodbye)

**Chat topic:** Stranded Score v3, deploy pipeline, M3/M4 rules correction, portfolio cleanup.

**Finished this session:**
- Stranded Score™ v3 shipped (v2.2.1 live); shared `lib/scoring-shared.cjs`
- Kimi fixed E2E smoke tests + `deploy:check`; CI green; CF `strandedbuild` confirmed
- M3/M4 rules rewritten: `~/projects/TWO-MACHINE-RULES.md` — Goose retired, Grok=M3, Kimi/Hermes=M4 MASTER-BRAIN
- openstrata + btcminiscript secured on GitHub from M3
- SSH github.com config on M3 (`id_ed25519_giveabit`)
- Copy-paste handoff .txt files for Cam

**Still to do:**
- Kimi: M4 `~/projects/` cleanup (see `~/projects/M3-M4-CLEANUP-HANDOFF.txt`)
- Kimi: mirror TWO-MACHINE-RULES to `~/MASTER-BRAIN/`
- CF API token; rotate hermes-agent PAT; UI score tier colors

**Next for Kimi:** Integrate SESSION-SUMMARY-2026-07-07.md into Obsidian/MASTER-BRAIN when Cam says sync.

---

## Handoff to Kimi — 2026-07-07 (session end)

**Machine:** M3 (Grok)  
**Project:** stranded (+ portfolio rules)

### Done
- [x] SESSION-SUMMARY-2026-07-07.md written
- [x] Goodbye handoff complete

### Git State
- Last commit SHA: `d72765ea26b24d8d65442d603749a5108a629a31`
- Branch: `main`
- Unpushed: none

---

## Latest Session Summary (2026-07-07) — Deploy Pipeline Fixes

**Chat topic:** Fix E2E smoke tests, deploy pipeline corrections, add deploy:check.

**Finished this session:**
- Fixed `tests/e2e/smoke.spec.ts` — replaced duplicate-text locators with specific element-selectors. **All 6/6 E2E tests pass.**
- Fixed `deploy.sh` — wrangler `--project-name` changed from `stranded` → `strandedbuild`
- Created `scripts/deploy-check.sh` — compares `package.json` version vs production `live-stats.json`
- Added `npm run deploy:check` script to `package.json`
- Replaced broken `.gitignore` (had merge conflict artifacts) with clean version
- Switched git remote from HTTPS to SSH (`git@github.com:kitsboy/stranded.git`)
- Updated `docs/DEPLOYMENT.md` with correct project name (`strandedbuild`), post-deploy verification ritual, and CF dashboard config
- Committed and pushed to `main` — CI run #11 in progress
- Production verification: `npm run deploy:check` passes (v2.2.1 matches)
- Previous CI runs (#1–#10) all passed

**Still to do:**
- CF API token for wrangler fallback (if git deploy stops working)
- Kimi: sync this handoff into Obsidian / MASTER-BRAIN

**Next for Kimi:** Update Stranded Kanban, educate Hermes on deploy pipeline improvements.

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

## Deploy Pipeline Configuration (as of 2026-07-07)

- **CF Pages project name:** `strandedbuild`
- **Deploy method:** `git push origin main` → Cloudflare Pages auto-builds
- **Manual fallback:** `CLOUDFLARE_API_TOKEN` + `npx wrangler pages deploy ./dist --project-name=strandedbuild`
- **Post-deploy check:** `npm run deploy:check`
- **E2E tests:** `npm run e2e` (6 tests, all passing)
- **Full verify:** `npm run verify`
- **Git remote:** SSH `git@github.com:kitsboy/stranded.git`
- **Production:** https://stranded.giveabit.io (v2.2.1)

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*

## Session — 2026-07-09 (audit remediations v2.3.6)

**Done:**
- Comprehensive audit remediations shipped as **v2.3.6**
- Security headers (CSP, XFO, nosniff, referrer, permissions)
- HTML escape for mission/bank pack `document.write` exports
- PasswordGate stubbed; password scrubbed from archive docs
- SW network-first for HTML + `/data/*` (cache `stranded-v4`)
- Map canvas pointer-events restored (pan/zoom)
- Mission yields scale with live BTC; sites + palette error/retry
- A11y: dialogs, form labels, markers role/button, lead form labels
- Offline indicator only when offline; deterministic site IDs

**Decisions:**
- Client-side password gate is dead; edge auth only for private previews
- Network-first SW prioritizes freshness over aggressive offline HTML cache

**Git State:**
- SHA: `32bf44d`
- Unpushed: none (pushed main)
- Production: CF Pages `strandedbuild` auto-deploy from main


## Session — 2026-07-15 (v2.6.4 black bar fix)

**Done:**
- Removed long horizontal black bar on map (empty `map-right-column` scroll-shadow painting `--bg-dark` band beside zoom controls)
- Hide right column when no site/mission/compare content; softened scroll shadows to radial fades only
- E2E: `empty right column does not render ghost bar over map`
- Version **2.6.4** pushed `76dcd83` → docs handoff `9c2e950`
- Production verified: `deploy:check` OK at 2.6.4

**Decisions:**
- `showRightColumn` gate: `selectedSite || portfolio.length || compareSites.length >= 2`
- CompareSitesModal moved outside column wrapper so modal still works when column hidden

**Git State:**
- SHA: `9c2e950`
- Unpushed: none

## Latest Session Summary (from 2026-07-15 goodbye)

**Chat topic:** Map command center polish v2.6.0–v2.6.4; final fix = empty black horizontal bar beside zoom controls.

**Finished in this session:**
- v2.6.0–v2.6.3 map layout, basemap, pins, tour, footer, mobile polish
- v2.6.4 ghost bar removed (`map-right-column` conditional + CSS scroll-shadow fix)
- 21 E2E tests; production live at https://stranded.giveabit.io/map/

**Still to do:**
- Flaky keyboard-help E2E (`?` shortcut) — optional cleanup
- Kimi vault sync when Cam says go (M3 hand-off files ready)

**Next for Kimi:** Read `SESSION-SUMMARY-2026-07-15.md`; update MASTER-BRAIN/Kanban; note **v2.6.4** production. Do not sync to M4 until instructed.

## Session — 2026-07-15 (v2.6.0 map elite round 7)

**Done:**
- Fixed Filters ↔ Quick Tour overlap (stacked left column, gap-4, capped filter height)
- Fixed emissions dual-range slider bleed outside filter card
- Shipped upgrades **#301–350** via 4 parallel agents: filter UX, map tools, keyboard/mobile workflow, stats/i18n/docs
- PWA `stranded-v8`, 333 i18n keys, 16 E2E tests passing

**Decisions:**
- Single OnboardingTour instance via `isXlViewport` matchMedia (stacked xl / floating mobile)
- Map page is now primary command center (~1.6k lines); subcomponents extracted (MapStatsBar, MapFilterSummary, MobileFilterDrawer, etc.)

**Git State:**
- SHA: `f5d46e4`
- Version: **2.6.0**
- Push main → CF strandedbuild auto-deploy

## Session — 2026-07-09 (v2.3.7 remaining audit fixes)

**Done:**
- Shared `BtcPriceProvider` + `lib/btc-price.ts` (timeout, multi-fiat, 95s poll)
- Map/home/dashboard/pitch/site panel/education use shared price
- `FocusTrap` on command palette, compare, keyboard help
- Next.js **14.2.35** + eslint-config-next; removed js-cookie
- CSP allows chart.js CDN; design tokens aligned with CSS vars
- Language menu covers nav, home hero, footer, sites & mission; donate QR Escape/close
- Dashboard load error state

**Git State:**
- SHA: `e6f5452`
- Version: **2.3.7**
- Pushed main → CF strandedbuild auto-deploy

