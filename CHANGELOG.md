# Changelog

## [2.6.3] — 2026-07-15

### Fixed
- Quick Tour card nudged up (stacked column padding + mobile safe-area bottom)
- Removed fullscreen toggle from map right column
- Global site footer hidden on `/map` — only map ECCC footer strip remains
- Mobile map: `100dvh` height, no main padding bleed, status/layer/FAB constrained to viewport

## [2.6.2] — 2026-07-15

### Fixed
- **Missing map pins** — sites sync now waits for `mapLoaded`; cluster source primed on style load
- **Black basemap** — default restored to **Light** (OpenStreetMap white map); Dark optional in layers
- **Top-right overlap** — zoom controls pinned `right: 1rem`; ECCC badge moved to left side
- **Bottom cutoff** — footer/status/layer stack spacing (`--map-safe-bottom`, `--map-footer-offset`); right column scrollable with safe max-height

## [2.6.1] — 2026-07-15

### Added (upgrades 351–425, map polish + QA pack)
- **351–370** — Map command center CSS polish: vignette, glass nav/scale, toolbar pill, HUD wrap, filter glow, chip animations, layer stack, status/footer typography
- **371–390** — `MapToolbar`, `MapHud`, `EcccFreshnessBadge`, `MapEmptyState`, `FilterPanelHeader`; `format-number`; split loading overlays; compare CTA; `lib/map-csp.ts`
- **391–410** — **365 i18n keys** × EN/FR/DE/ES; `printEcccLine`; PWA `stranded-v9`; aria/testid audits; TS merge fixes
- **411–425** — E2E map canvas + overlay clear + ECCC badge layout; `test:helpers` CSP/format-number cases; `UPGRADES-351-425.md`; handoff pack

### Fixed
- **Map not showing** — CSP allows CARTO dark tiles + MapLibre glyphs; full-bleed `map-stage` wrapper
- **Loading overlay** — map tiles visible while sites dataset loads separately
- **ECCC badge overlap** — repositioned clear of MapLibre zoom controls
- Map page `map-stage` closing tag + duplicate import merge fixes

## [2.6.0] — 2026-07-15

### Fixed (map layout)
- **Filters + Quick Tour overlap** — stacked left column with `gap-4`; filter panel capped height so tour sits below with tidy buffer
- **Emissions dual-range slider** — thumbs/track inset so handles stay inside the filter card (no bleed onto map)

### Added (upgrades 301–350, map command center elite)
- **301–315** — Filter badge, collapse/expand, emission presets, province/source bulk actions, chip summary, sticky header, custom scrollbar, fit-to-results, mission-only toggle, log-scale slider, score custom indicator
- **316–332** — Map bookmarks, view history, fit bounds, north arrow, style switcher, site labels, province highlight, heat legend, minimap pan, performance mode, WebGL fallback, screenshot/print export, coordinate copy, radius slider, cluster tooltips, loading skeleton
- **333–342** — Keyboard shortcuts (E/L/[/Esc), mobile filter drawer + swipe, bottom sheet peek, full URL filter sync, recent presets, preset delete, mission ring toggle
- **343–350** — MapStatsBar, province mini bars, site density indicator, map SEO meta, aria-live filter announcements, focus trap, reduced-motion map, `UPGRADES-301-350.md`
- PWA cache `stranded-v8` · **333 i18n keys** × EN/FR/DE/ES · **16 E2E tests**

## [2.5.1] — 2026-07-15

### Fixed (crash hardening)
- **ErrorBoundary** on all pages — isolated failures no longer white-screen the whole app
- Safe **localStorage JSON.parse** in command palette + mission portfolio loaders
- Map **choropleth/heatmap/minimap** wrapped in try/catch (duplicate layer races)
- Education quiz **markEduSection** moved out of render path
- Pitch **Chart.js** pinned CDN URL with onerror fallback
- **trailingSlash: true** + `_redirects` for reliable Cloudflare Pages client navigation
- PWA cache `stranded-v7`

## [2.5.0] — 2026-07-15

### Added (upgrades 276–300, round 6 elite release)
- **276** — i18n expansion to **241 keys** × EN/FR/DE/ES (education intro, pitch CTAs, map controls, errors, onboarding, SW toast)
- **277** — `HtmlLangSync` — `document.documentElement.lang` follows locale
- **278** — Pitch page wired to i18n (hero, stats, charts, CTAs)
- **279** — Map command center labels + toasts i18n; geolocate HUD button
- **280** — Education top 20 section headings i18n
- **281** — `meta theme-color` #243447 in root layout
- **282** — Apple touch icon link tags (`/logo.png`)
- **283** — Home hero prefetch `/map` + `/pitch`
- **284** — PWA cache `stranded-v6`; SW update toast with version + refresh action
- **285** — Non-hero home flywheel image `loading="lazy"`
- **286** — Map dynamic import verified (`ssr: false` on `/map`)
- **287** — `lib/performance.ts` navigation timing marks stub
- **288–290** — E2E: onboarding tour dismiss, geolocate button, recent sites in palette
- **291** — `test:helpers` cases: `scorePercentile`, `site-search`, `mission-templates`
- **292–300** — `UPGRADES-201-300.md`, roadmap round 6, diligence v2.5.0, handoff pack

### New libs
- `lib/site-search.ts` — ranked site search + presets
- `lib/mission-templates.ts` — elite/regional mission templates
- `components/OnboardingTour.tsx` — first-visit map tour (dismissible)

## [2.4.0] — 2026-07-15

### Added (upgrades 151–200, round 5)
- **151–175** — Compare page, province print one-pager, map URL radius, local analytics categories, province codes, bookmark tags, native MapLibre clusters
- **176** — Funding grant matcher quiz (5 questions, localStorage result)
- **177** — Partnerships miner contact CTA block
- **178** — About page contribution / how-to-help section
- **179** — Bookmarks export/import JSON (v2 with tags)
- **180** — Mission portfolio timeline CSV export (halving-adjusted)
- **181** — Score sparkline in site panel (last 7 visits, localStorage)
- **182** — Map emission choropleth by province layer
- **183** — Dashboard top movers section (simulated % labels)
- **184** — Education halving timeline interactive slider
- **185** — Design token contrast fixes (`lib/design-tokens.ts`, `globals.css`)
- **186** — Lazy-loaded Education charts (`EducationCharts` dynamic import)
- **187** — `og:meta` via layout metadata on routes missing Open Graph
- **188** — robots.txt sitemap reference verified (`https://stranded.giveabit.io/sitemap.xml`)
- **189** — Offline indicator shows PWA cache version (`stranded-v5`)
- **190** — Filter preset share via URL hash (`/map#preset=…`)
- **191** — Site watch alerts toast on score/emission threshold
- **192** — Tadbuy ad hook placeholder on site panel
- **193** — Sherpacarta legal template link on pitch page
- **194** — E2E test for `/compare` page
- **195** — E2E test for province print page
- **196** — `docs/UPGRADES-151-200.md` master list
- **197–200** — Roadmap, diligence v2.4.0, Kimi handoff, SOURCE-OF-TRUTH bump

## [2.3.5] — 2026-07-09

### Fixed
- Language menu opens **downward** under the nav (was `bottom-full` → flew off the top of the screen)
- Click-to-toggle + outside click / Escape (works on mobile; no hover trap)
- Default / invalid locale hard-resets to **English**; EN listed first and clearly selectable

## [2.3.4] — 2026-07-09

### Added (P2)
- Glossary hover tips on methodology (`GlossaryTip`)
- Nav labels follow language toggle (EN/FR/DE/ES expanded strings)
- Sites browser: source-type + min-score filters; bulk mission already in P0
- E2E: privacy/roadmap/open-data, methodology, sites filters

## [2.3.3] — 2026-07-09

### Fixed / Enhanced (P1)
- Map deep links: `?province=` alias, robust `site`/`mission` restore, toast on missing site
- Local **watch-site** banner on map open when score ≥ threshold
- Light theme: broader glass/input/panel contrast fixes
- Hook lint cleanups (CommandPalette recent save, SiteDetails site deps, Map terrain note)
- Footer version reads live-stats

## [2.3.2] — 2026-07-09

### Fixed (P0)
- Map grid/internet layers + command palette “Near Grid” use Score v3 **inferred** grid distance / connectivity
- Education + sites **Add to mission** writes real local portfolio (`addSitesToMission`)
- Certified lead form honesty: local-only save, export JSON, email draft (no fake “we’ll respond”)
- Replaced remaining education/site `alert()` with Sonner toasts

## [2.3.1] — 2026-07-09

### Fixed
- **Sensitivity tornado** — index now uses `annualRevenueUsd + carbonRevenueUsd` so Network difficulty (and all levers) produce non-zero swing; previously power+carbon-only made difficulty a no-op

## [2.3.0] — 2026-07-09

### Added (client-only power batch)
- **Score explainability** — factor breakdown (emission, proximity, infra, confidence, source, recency) with inferred flags
- **Bank packs** — CSV / Excel TSV / Markdown / HTML print / JSON for site + mission
- **Peer sites** + emission-similarity helpers
- **Sensitivity tornado** (BTC, derate, difficulty, carbon)
- Map **Score v3 legend** + tier quick filters (All / Med+ / High+ / Elite)
- Pages: `/privacy`, `/roadmap`, `/open-data`
- Glossary lib; footer links; `npm run test:helpers` (real shipped modules via tsx)

## [2.2.2] — 2026-07-09

### Fixed
- **Score tier UI alignment** — all badges/markers now use Score v3 thresholds (elite ≥85, high ≥65, medium ≥45, low &lt;45) via shared `scoreTierClass` / `scoreTierColor`
- Home featured scores, sites browser, command palette, and map markers no longer used legacy cutoffs (72 / 78 / 62)
- Status page shows live version, site count, avg score, and high-score count from `/status.json` + `live-stats.json`

### Enhanced
- Homepage stats pull from live-stats (site count, 13 provinces, avg score, sites ≥80)
- 5% impact calculator uses live impact totals when available
- Methodology page documents score tier color legend
- Command palette presets: Elite (≥85) and High (≥65)

## [2.2.1] — 2026-07-07

### Fixed
- **Stranded Score™ v3** — ECCC data lacks `distance_to_grid_km` and `internet_type`; v2 penalized all 2,611 sites with worst-case defaults (max score ~78, zero sites ≥80). v3 infers proxies from source type, province, emission tier, confidence, and reporting year. Distribution: avg ~60, 108 sites ≥80, 32 elite ≥85.
- Shared scoring module (`lib/scoring-shared.cjs`) keeps app, live-stats, and validation in sync
- Updated methodology and education copy to document v3 formula

## [2.2.0] — 2026-07-03

### Added (upgrades 101–150)
- Emission heatmap layer on map
- IndexedDB offline cache for GeoJSON dataset
- Filter preset save/load UI on map
- Education quiz share, progress tracker, genset comparison table
- Pages: `/bookmarks`, `/methodology`, `/about`, `/global`, `/benchmarks`
- KML + filtered GeoJSON export from map
- Multi-year halving-adjusted ROI projection chart
- Portfolio named profiles, site watch alerts (localStorage)
- Tadbuy/Sherpacarta integration hooks on site panel
- Keyboard shortcuts help (`?`), offline indicator, PWA v3 cache
- Command palette bookmarks + expanded routes
- Dashboard 60s auto-refresh, monthly refresh agent script
- Design tokens lib, local analytics stub

## [2.1.0] — 2026-07-03

### Added (upgrades 51–100)
- Dashboard, provinces, changelog, status, API docs pages
- Bookmarks lib, map URL state, mobile nav, theme toggle
- BTC sensitivity slider on pitch, sitemap, robots.txt

## [2.0.0] — 2026-07-03

### Added (upgrades 1–50)
- Scoring v2, pitch charts, PWA, advanced ROI, verticals/funding/partnerships