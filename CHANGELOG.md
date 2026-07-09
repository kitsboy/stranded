# Changelog

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