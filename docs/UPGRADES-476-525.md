# Upgrades 476–525 (v2.8.0 dashboard batch)

Shipped **2026-07-15** — dashboard command center elite redesign.

| # | Upgrade | Status |
|---|---------|--------|
| 476 | `lib/dashboard-metrics.ts` — deployment readiness scoring | ✅ |
| 477 | `lib/dashboard-metrics.ts` — province revenue leaders | ✅ |
| 478 | `lib/dashboard-metrics.ts` — emission tier items helper | ✅ |
| 479 | `lib/dashboard-metrics.ts` — confidence breakdown helper | ✅ |
| 480 | `lib/dashboard-metrics.ts` — live model revenue @ BTC | ✅ |
| 481 | `lib/dashboard-metrics.ts` — captureAtPct portfolio projection | ✅ |
| 482 | `DashboardHero` — mesh gradient, live badge, version tag | ✅ |
| 483 | `DashboardHero` — Open Map / Pitch / Status CTAs | ✅ |
| 484 | `DashboardHero` — Export live-stats JSON button | ✅ |
| 485 | `DashboardStatGrid` — 8 KPI cards via PitchStatCard | ✅ |
| 486 | `DashboardOpportunityRadar` — readiness gauge + factor bars | ✅ |
| 487 | `DashboardOpportunityRadar` — top 5 province revenue rank | ✅ |
| 488 | `DashboardOpportunityRadar` — `data-testid` for E2E | ✅ |
| 489 | `DashboardLiveTicker` — scrolling KPI strip | ✅ |
| 490 | `DashboardCaptureSlider` — 1–100% mini capture simulator | ✅ |
| 491 | `DashboardCaptureSlider` — sites / CO₂e / BTC / revenue tiles | ✅ |
| 492 | `DashboardEmissionTiers` — visual tier breakdown bars | ✅ |
| 493 | `DashboardSourceMix` — top 6 source type bars | ✅ |
| 494 | `DashboardGensetMix` — genset recommendation panel | ✅ |
| 495 | `DashboardConfidencePanel` — ECCC confidence breakdown | ✅ |
| 496 | Dashboard CSS `.dashboard-hero` mesh + bleed | ✅ |
| 497 | Dashboard CSS `.dashboard-ticker` scroll animation | ✅ |
| 498 | Dashboard CSS `.dashboard-panel` hover polish | ✅ |
| 499 | Dashboard page `.dashboard-page` full-bleed layout | ✅ |
| 500 | Live ticker placed after hero (pitch-style) | ✅ |
| 501 | Capture slider section after Opportunity Radar | ✅ |
| 502 | Emission tiers + source mix 2-column grid | ✅ |
| 503 | Score distribution histogram panel | ✅ |
| 504 | Province comparison bar chart panel | ✅ |
| 505 | Carbon credit scenarios ($20/$50/$80) | ✅ |
| 506 | Top 10 sites table with score tier badges | ✅ |
| 507 | Top 10 sites percentile badges (Top 5% etc.) | ✅ |
| 508 | Compare top 2 sites link in table header | ✅ |
| 509 | Top 10 CSV export | ✅ |
| 510 | Emission Tier Leaders (replaces fake Top Movers) | ✅ |
| 511 | Top provinces quick links | ✅ |
| 512 | Quick Actions — Map, Sites, Compare, Education | ✅ |
| 513 | Quick Actions — Pitch, Funding with icons | ✅ |
| 514 | Auto-refresh live-stats every 60s | ✅ |
| 515 | Live BTC price via BtcPriceProvider | ✅ |
| 516 | GeoJSON score fetch for percentile badges | ✅ |
| 517 | Breadcrumbs navigation | ✅ |
| 518 | Error state + retry button | ✅ |
| 519 | Loading state with role="status" | ✅ |
| 520 | `test:helpers` dashboard-metrics unit cases | ✅ |
| 521 | E2E smoke — Opportunity Radar visibility | ✅ |
| 522 | Reduced-motion safe ticker animation | ✅ |
| 523 | Accessible slider aria-label on capture | ✅ |
| 524 | CHANGELOG [2.8.0] entry | ✅ |
| 525 | `docs/UPGRADES-476-525.md` tracking doc | ✅ |

*50/50 planned · 50 shipped this batch*