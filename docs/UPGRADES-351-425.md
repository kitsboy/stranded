# Upgrades 351–425 (Round 8) — Status

**Version:** 2.6.1 · **Ship date:** 2026-07-15 · **Total:** 75 upgrades tracked

| # | Upgrade | Status |
|---|---------|--------|
| 351 | Map stage vignette overlay (`map-stage-vignette`) | ✅ Shipped v2.6.1 |
| 352 | MapLibre nav control glass + rounded + xl right offset | ✅ Shipped v2.6.1 |
| 353 | Scale bar repositioned above footer (`--map-footer-offset`) | ✅ Shipped v2.6.1 |
| 354 | Coordinate readout glass pill + copy flash state | ✅ Shipped v2.6.1 |
| 355 | North compass widget (bearing-synced) | ✅ Shipped v2.6.1 |
| 356 | Minimap border glow on hover | ✅ Shipped v2.6.1 |
| 357 | Heat legend gradient + Low/Med/High labels | ✅ Shipped v2.6.1 |
| 358 | Map toolbar unified glass pill (`map-toolbar-pill`) | ✅ Shipped v2.6.1 |
| 359 | Top HUD responsive wrap (`map-top-hud`) | ✅ Shipped v2.6.1 |
| 360 | Filter panel border glow when filters active | ✅ Shipped v2.6.1 |
| 361 | Filter panel 4px spacing grid | ✅ Shipped v2.6.1 |
| 362 | Score slider track matches dual-range styling | ✅ Shipped v2.6.1 |
| 363 | Province chip hover micro-animation | ✅ Shipped v2.6.1 |
| 364 | Source chip active pulse animation | ✅ Shipped v2.6.1 |
| 365 | Mission ring toggle integrated into layer panel | ✅ Shipped v2.6.1 |
| 366 | Right column scroll shadow indicators | ✅ Shipped v2.6.1 |
| 367 | Site details panel header gradient accent | ✅ Shipped v2.6.1 |
| 368 | Mission panel card elevation hierarchy | ✅ Shipped v2.6.1 |
| 369 | Bottom status bar typography polish | ✅ Shipped v2.6.1 |
| 370 | Footer ECCC link hover underline gradient | ✅ Shipped v2.6.1 |
| 371 | `lib/format-number.ts` — compact K/M/B HUD stats | ✅ Shipped v2.6.1 |
| 372 | `MapStatsBar` uses `formatCompactNumber` for emission | ✅ Shipped v2.6.1 |
| 373 | `MapToolbar` extracted component + `data-testid` | ✅ Shipped v2.6.1 |
| 374 | `MapHud` extracted component + `data-testid` | ✅ Shipped v2.6.1 |
| 375 | `EcccFreshnessBadge` with relative time + i18n | ✅ Shipped v2.6.1 |
| 376 | `MapEmptyState` when zero filtered sites | ✅ Shipped v2.6.1 |
| 377 | `FilterPanelHeader` shared sticky header | ✅ Shipped v2.6.1 |
| 378 | `map-stage` wrapper + `data-testid` for E2E | ✅ Shipped v2.6.1 |
| 379 | Split map canvas loading vs sites loading overlays | ✅ Shipped v2.6.1 |
| 380 | Map `resize()` on load + tile error handler | ✅ Shipped v2.6.1 |
| 381 | `MapProvinceBars` framer-motion grow on filter change | ✅ Shipped v2.6.1 |
| 382 | Emission preset chips `aria-pressed` + ring active state | ✅ Shipped v2.6.1 |
| 383 | Compare CTA gradient button + `map-compare-open` testid | ✅ Shipped v2.6.1 |
| 384 | Layer stack unified panel (`map-layer-panel-unified`) | ✅ Shipped v2.6.1 |
| 385 | Score legend horizontal compact in layer stack | ✅ Shipped v2.6.1 |
| 386 | CSP cartocdn.com domains in `public/_headers` | ✅ Shipped v2.6.1 |
| 387 | `lib/map-csp.ts` documented tile/CSP allowlist | ✅ Shipped v2.6.1 |
| 388 | `validatePresetName` in `lib/map-filters.ts` | ✅ Shipped v2.6.1 |
| 389 | `shouldShowFilterToast` dedupe helper | ✅ Shipped v2.6.1 |
| 390 | Map print header includes ECCC attribution line | ✅ Shipped v2.6.1 |
| 391 | i18n batch: map empty, viewport, attribution strings (EN) | ✅ Shipped v2.6.1 |
| 392 | i18n: compare CTA, score legend, quick actions, site peek | ✅ Shipped v2.6.1 |
| 393 | i18n: ECCC badge + HUD suffix strings | ✅ Shipped v2.6.1 |
| 394 | `mapHudVisibleSuffix`, `mapEccc*` keys × 4 locales | ✅ Shipped v2.6.1 |
| 395 | `printEcccLine` for province print header | ✅ Shipped v2.6.1 |
| 396 | Province print `data-testid="print-eccc-line"` | ✅ Shipped v2.6.1 |
| 397 | SW update toast copy → v2.6.1 | ✅ Shipped v2.6.1 |
| 398 | PWA cache `stranded-v9` (`sw.js`, offline-db, indicator) | ✅ Shipped v2.6.1 |
| 399 | `mapToolbarAria` + toolbar `role="toolbar"` | ✅ Shipped v2.6.1 |
| 400 | Map toolbar fit/screenshot/print `aria-label` audit | ✅ Shipped v2.6.1 |
| 401 | `data-testid` audit: map-toolbar, map-hud, map-empty-state | ✅ Shipped v2.6.1 |
| 402 | `data-testid` audit: map-loading-overlay, map-sites-loading | ✅ Shipped v2.6.1 |
| 403 | `data-testid` audit: eccc-freshness-badge, map-print-header | ✅ Shipped v2.6.1 |
| 404 | `data-testid` audit: filter-panel-active-count, map-province-bars | ✅ Shipped v2.6.1 |
| 405 | Minimap `aria-label` for screen readers | ✅ Shipped v2.6.1 |
| 406 | Map coordinate readout accessible title | ✅ Shipped v2.6.1 |
| 407 | `prefers-reduced-motion` disables chip pulse + minimap lift | ✅ Shipped v2.6.1 |
| 408 | Map command center CSS design tokens (`--map-hud-gap`, etc.) | ✅ Shipped v2.6.1 |
| 409 | FR/DE/ES sync for all 32 new i18n keys (#417) | ✅ Shipped v2.6.1 |
| 410 | TypeScript merge fixes (`map-stage` close, duplicate imports) | ✅ Shipped v2.6.1 |
| 411 | E2E: map canvas visible (`.maplibregl-canvas` or `map-stage`) | ✅ Shipped v2.6.1 |
| 412 | E2E: map loading overlay clears | ✅ Shipped v2.6.1 |
| 413 | E2E: ECCC badge does not overlap nav (bounding box) | ✅ Shipped v2.6.1 |
| 414 | Unit test map CSP domains (`lib/map-csp.ts` + test-helpers) | ✅ Shipped v2.6.1 |
| 415 | This upgrades master doc (351–425) | ✅ Shipped v2.6.1 |
| 416 | CHANGELOG [2.6.1] section draft | ✅ Shipped v2.6.1 |
| 417 | FR/DE/ES for all new i18n keys | ✅ Shipped v2.6.1 |
| 418 | `map-command-center` CSS design tokens | ✅ Shipped v2.6.1 |
| 419 | Print layout ECCC in print header | ✅ Shipped v2.6.1 |
| 420 | `aria-label` audit on map toolbar buttons | ✅ Shipped v2.6.1 |
| 421 | `data-testid` audit for new components | ✅ Shipped v2.6.1 |
| 422 | PWA cache bump `stranded-v9` | ✅ Shipped v2.6.1 |
| 423 | `scripts/test-helpers.mjs` for new lib utilities | ✅ Shipped v2.6.1 |
| 424 | Fix TypeScript errors from agent merges | ✅ Shipped v2.6.1 |
| 425 | Session handoff note in `docs/KIMI-HANDOFF.md` | ✅ Shipped v2.6.1 |

## Summary

- **20 / 20 shipped** for upgrades 351–370 (map command center visual polish CSS).
- **40 / 40 shipped** for upgrades 371–410 (components, CSP, i18n, a11y, PWA).
- **15 / 15 shipped** for upgrades 411–425 (E2E, tests, docs, handoff pack).
- **Client-only** — no new backend dependencies.
- **PWA cache** bumped to `stranded-v9`.
- **i18n** EN/FR/DE/ES — **365 keys** per locale.
- **E2E** — **19 tests** (incl. map canvas, overlay clear, ECCC badge layout).
- **test:helpers** — `format-number`, `map-csp`, `map-filters` validation cases.

See `CHANGELOG.md` for deploy notes.