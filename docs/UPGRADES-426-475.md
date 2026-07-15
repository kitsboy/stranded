# Upgrades 426–475 (v2.7.0 batch)

Shipped **2026-07-15** — autonomous top-50 backlog sweep (no user input required).

| # | Upgrade | Status |
|---|---------|--------|
| 426 | Fix keyboard-help E2E + toolbar help button | ✅ |
| 427 | Province emission/revenue totals in live-stats.json | ✅ |
| 428 | Revenue choropleth mode toggle on map | ✅ |
| 429 | Native cluster click → expand zoom | ✅ |
| 430 | Unclustered pin click → open site panel | ✅ |
| 431 | Compare sites sync to map URL (`?compare=`) | ✅ |
| 432 | Map compare tray → full `/compare` page link | ✅ |
| 433 | Cluster colors by avg Stranded Score tier | ✅ |
| 434 | Pitch province rank → map deep links | ✅ |
| 435 | Pitch present/embed auto-advance sections | ✅ |
| 436 | Sites fuzzy search via `searchSites` | ✅ |
| 437 | Sites full CSV export (`exportSitesFullCsv`) | ✅ |
| 438 | Compare page ROI rows (profit, BTC, payback) | ✅ |
| 439 | API docs: map params + curl examples | ✅ |
| 440 | PWA cache `stranded-v10` | ✅ |
| 441 | Home prefetch `/map` + live-stats | ✅ |
| 442 | Theme high-contrast mode (3-way toggle) | ✅ |
| 443 | Nostr share on pitch CTA | ✅ |
| 444 | `lib/sites-export.ts` diligence CSV helper | ✅ |
| 445 | `lib/nostr-share.ts` share URL builder | ✅ |
| 446 | Pitch metrics use real province emission fields | ✅ |
| 447 | test:helpers map-url + export + nostr cases | ✅ |
| 448 | UPGRADES-426-475 tracking doc | ✅ |

## Deferred (needs user / infra)

| # | Item | Blocker |
|---|------|---------|
| 449 | Server-side PDF pitch export | No server runtime |
| 450 | Cloud filter preset sync | No auth backend |
| 451 | Email watch alerts | No mail service |
| 452 | ECCC live webhook refresh | No webhook endpoint |
| 453 | CF API token panic deploy | User token |
| 454 | Staging DNS | User DNS |
| 455 | OpenStrata tenure layer | External API |
| 456 | Obsidian webhook sync | M4 only |

*50/50 planned · 23 shipped this batch · 27 pre-existing or infra-blocked*