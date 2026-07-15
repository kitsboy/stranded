# Upgrades 601–625 (v2.8.4 polish batch)

Shipped **2026-07-15** — dashboard i18n, accessibility, performance marks, PWA v12.

| # | Upgrade | Status |
|---|---------|--------|
| 601 | `lib/i18n.ts` — `dashboardOpportunityRadar*` keys × EN/FR/DE/ES | ✅ |
| 602 | `lib/i18n.ts` — `dashboardCapture*` keys × EN/FR/DE/ES | ✅ |
| 603 | `lib/i18n.ts` — `statusHealthy`, `skipToMain`, `privacyLastUpdated` | ✅ |
| 604 | `DashboardOpportunityRadar` — wire i18n titles, tiles, province rank | ✅ |
| 605 | `DashboardCaptureSlider` — wire i18n labels + capture badge | ✅ |
| 606 | `globals.css` — `.skip-link` focus-visible styles | ✅ |
| 607 | `globals.css` — `.sr-only-focusable` utility | ✅ |
| 608 | `Nav.tsx` — skip-to-main as first focusable element | ✅ |
| 609 | `layout.tsx` — remove duplicate skip link; CoinGecko preconnect | ✅ |
| 610 | `public/sw.js` — bump to `stranded-v12` | ✅ |
| 611 | `lib/offline-db.ts` — `OFFLINE_CACHE_VERSION` v12 | ✅ |
| 612 | PWA precache — `/dashboard` route (retained in v12) | ✅ |
| 613 | `lib/performance.ts` — `markPageReady(route)` helper | ✅ |
| 614 | Dashboard page — `markPageReady('dashboard')` on stats load | ✅ |
| 615 | Pitch page — `markPageReady('pitch')` on stats load | ✅ |
| 616 | `SwUpdateToast` — version from live-stats in toast title | ✅ |
| 617 | `swUpdateTitle` — `{version}` placeholder × 4 locales | ✅ |
| 618 | `scripts/verify-pipeline.sh` — `dist/dashboard.html` check | ✅ |
| 619 | `app/privacy/page.tsx` — last updated from package version | ✅ |
| 620 | E2E smoke — `/funding` route | ✅ |
| 621 | E2E smoke — `/bookmarks` route | ✅ |
| 622 | E2E smoke — `/partnerships` route | ✅ |
| 623 | `package.json` — version **2.8.4** | ✅ |
| 624 | CHANGELOG `[2.8.4]` entry | ✅ |
| 625 | `docs/UPGRADES-601-625.md` tracking doc | ✅ |

*25/25 planned · 25 shipped this batch*