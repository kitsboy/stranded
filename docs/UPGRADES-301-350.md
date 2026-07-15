# Upgrades 301–350 (Round 7) — Status

**Version:** 2.5.1 · **Ship date:** 2026-07-15 · **Total:** 50 upgrades tracked

| # | Upgrade | Status |
|---|---------|--------|
| 301 | `lib/map-filters.ts` — active filter count + chip builders | ✅ Shipped v2.5.1 |
| 302 | Map filter summary chips (`MapFilterSummary`) | ✅ Shipped v2.5.1 |
| 303 | Collapsible filter panel + localStorage persist | ✅ Shipped v2.5.1 |
| 304 | Mission-only filter toggle | ✅ Shipped v2.5.1 |
| 305 | Emission log-scale dual slider | ✅ Shipped v2.5.1 |
| 306 | Emission quick presets (`EmissionPresets`) | ✅ Shipped v2.5.1 |
| 307 | Score preset chips + custom label | ✅ Shipped v2.5.1 |
| 308 | Province/source select-all + clear | ✅ Shipped v2.5.1 |
| 309 | Recent filter presets strip | ✅ Shipped v2.5.1 |
| 310 | Delete saved filter preset | ✅ Shipped v2.5.1 |
| 311 | HUD active filter count badge | ✅ Shipped v2.5.1 |
| 312 | `MapFiltersPanel` shared mobile component | ✅ Shipped v2.5.1 |
| 313 | DualRangeSlider log-scale thumb positions | ✅ Shipped v2.5.1 |
| 314 | Radius filter adjust slider HUD | ✅ Shipped v2.5.1 |
| 315 | Fit-to-filtered button in filter panel | ✅ Shipped v2.5.1 |
| 316 | Map view bookmarks save/load | ✅ Shipped v2.5.1 |
| 317 | Map pan/zoom history back/forward (`map-view-history`) | ✅ Shipped v2.5.1 |
| 318 | `lib/map-bounds.ts` fitBounds helpers | ✅ Shipped v2.5.1 |
| 319 | Map screenshot export | ✅ Shipped v2.5.1 |
| 320 | Map print stylesheet + print button | ✅ Shipped v2.5.1 |
| 321 | Map style switcher (dark/satellite/terrain) | ✅ Shipped v2.5.1 |
| 322 | Site labels layer (zoom > 10) | ✅ Shipped v2.5.1 |
| 323 | Performance mode toggle (reduced animations) | ✅ Shipped v2.5.1 |
| 324 | WebGL unsupported banner | ✅ Shipped v2.5.1 |
| 325 | Click-to-copy map coordinates | ✅ Shipped v2.5.1 |
| 326 | Mission ring toggle on map | ✅ Shipped v2.5.1 |
| 327 | Mobile filter drawer shell + swipe | ✅ Shipped v2.5.1 |
| 328 | Mobile site bottom sheet (peek/expand) | ✅ Shipped v2.5.1 |
| 329 | Layer panel show/hide toggle | ✅ Shipped v2.5.1 |
| 330 | Full filter URL state (`maxEmission`, `sources`) | ✅ Shipped v2.5.1 |
| 331 | `buildMapShareUrl` helper | ✅ Shipped v2.5.1 |
| 332 | Map keyboard shortcuts expanded | ✅ Shipped v2.5.1 |
| 333 | Escape closes mobile filters first | ✅ Shipped v2.5.1 |
| 334 | Province highlight on map when filtered | ✅ Shipped v2.5.1 |
| 335 | Mobile filter drawer with stats | ✅ Shipped v2.5.1 |
| 336 | Mobile site sheet drag dismiss | ✅ Shipped v2.5.1 |
| 337 | Focus trap on mobile filter drawer | ✅ Shipped v2.5.1 |
| 338 | Debounced filter URL sync | ✅ Shipped v2.5.1 |
| 339 | Map loading skeleton overlay | ✅ Shipped v2.5.1 |
| 340 | i18n keys for map filter elite batch (EN) | ✅ Shipped v2.5.1 |
| 341 | FR/DE/ES sync for all new map i18n keys | ✅ Shipped v2.5.1 |
| 342 | PWA cache `stranded-v7` (v2.5.1 hardening) | ✅ Shipped v2.5.1 |
| 343 | `MapStatsBar` — live filtered avg score, emission, top province | ✅ Shipped v2.5.1 |
| 344 | `MapProvinceBars.tsx` — filtered sites mini bar by province | ✅ Shipped v2.5.1 |
| 345 | Site density indicator in status bar | ✅ Shipped v2.5.1 |
| 346 | Map page meta/SEO (canonical, keywords, Twitter) | ✅ Shipped v2.5.1 |
| 347 | aria-live announcements for filter changes | ✅ Shipped v2.5.1 |
| 348 | Focus trap in mobile filter drawer | ✅ Shipped v2.5.1 |
| 349 | `prefers-reduced-motion` respect for map animations | ✅ Shipped v2.5.1 |
| 350 | This upgrades master doc (301–350) | ✅ Shipped v2.5.1 |

## Summary

- **42 / 42 shipped** for upgrades 301–342 (map filter elite + mobile + URL state batch).
- **8 / 8 shipped** for upgrades 343–350 (map stats, a11y, SEO, docs pack).
- **Client-only** — no new backend dependencies.
- **PWA cache** bumped to `stranded-v8`.
- **i18n** EN/FR/DE/ES — **333 keys** per locale (map stats + filter elite strings).
- **test:helpers** — `map-stats`, `map-bounds`, `map-url-state` unit cases added.

See `CHANGELOG.md` for deploy notes.