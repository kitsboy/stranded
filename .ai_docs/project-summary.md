# Project Summary — Stranded Value

**Purpose:** Map, model, and fund stranded methane energy as Bitcoin-powered wealth — 2,611 ECCC-verified Canadian sites.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · MapLibre GL · static export to `dist/`

**Live:** https://stranded.giveabit.io · **GitHub:** kitsboy/stranded · **Family:** Give A Bit / Safe Harbour

## Core product surfaces
| Route | Role |
|-------|------|
| `/` | Landing + KPIs + onboarding checklist |
| `/map` | Command center (filters, mission, layers, heatmap) |
| `/sites` | Full table explorer |
| `/dashboard` | Command dashboard + capital exports |
| `/education` | Simulators, gensets, quiz |
| `/pitch` | Live investor deck + present mode + speaker notes |
| `/funding` | Grant quiz + term sheet / CapEx tools |
| `/methodology`, `/open-data`, `/status`, `/privacy` | Trust / legal / ops |
| Plus | provinces, compare, bookmarks, verticals, benchmarks, global, partnerships, roadmap, changelog, docs/api |

## Key libs (v2.10)
Scoring (`scoring-shared.cjs`), ROI, bank packs, portfolio, map URL state, data-quality, monte-carlo, vertical-scores, gas-decline, amortization, capex-fx, carbon-overlay, locale-format, digests, term-sheet, case-study.

## Footer
In-flow 4-column site footer (not sticky): brand + giveabit logo, platform, resources, company/legal/suite. Hidden on `/map` (map has its own bar).
