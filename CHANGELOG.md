# Changelog

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