# Stranded mobile legibility — type floor + touch targets

Card: **t_7e023bd7** · owner: ziggy · 2026-09-12

## How this was measured (and what was NOT done)

Every number below comes from a headless Chromium talking to the **live site**
(or, where noted, to the exact `dist/` this repo builds) —
`scripts/qa-widths.mjs` and `scripts/qa-legibility.mjs`.

**There is no vision step.** This host has no working image tool, so I did not
look at a single screenshot. Nothing in this document is a visual opinion: it is
DOM geometry and computed style. If a layout *looks* wrong while measuring
"right", this document cannot see it. Screenshots are still written to
`docs/qa/*.png` for a human to look at.

Two measurement notes, because both change the numbers:

1. **Counting tiny text depends on how you walk the DOM.** A walker over every
   text node counts ~11.7k nodes under 11px across 5 pages × 4 widths; the
   previous harness (which skipped inline nodes and only counted containers)
   counted 235 on `/sites` at 1440px. The honest claim is *"9–10px was the
   default label size and it was everywhere"*, not one specific count.
2. **For a form control inside its own `<label>`, the label is the target.**
   WCAG 2.5.5 measures the target, not the glyph. `qa-widths.mjs` now measures
   the wrapping label for inputs (this is why the map layer checkboxes are no
   longer reported as 13px controls).

## Residual A — no text floor (the real work on this card)

**Before** (live site, pre-fix build, 5 pages × 390/430/768/1440):
**11,747 visible text nodes below 11px**, every page, every width.
The single most repeated string was the **9px nav tagline "Value"** (one per
page load), and these were the dominant classes:

| nodes | size | what it is |
|---|---|---|
| 5,772 | 10px | `/sites` card labels (`Generator:`, `kg CH₄ / day`, badges, `FLY TO MAP` / `+ MISSION` CTAs) |
| 960 | 9px | `/sites` + dashboard `Top 1%` tier badge |
| 195 | 8–9px | dashboard histogram axis label + rank badge |
| 52 | 9px | map province rows (`Venting`) |
| 20 | 9px | `nav-logo-sub` — the "Value" tagline |

**Root cause:** there was no type scale. `text-[9px]` / `text-[10px]` were the
*default* micro-label size, used 352 times across 88 files, plus eight hardcoded
8–10px declarations in `app/globals.css`. Nothing in the codebase expressed a
floor, so nothing enforced one.

**Fix — a floor, applied to the label layer, not to instances:**

- `tailwind.config.ts` gains two tokens:
  - `text-label` = **12px** — anything a user is meant to read
  - `text-micro` = **11px** — map/chart chrome whose box is fixed by an
    absolutely-positioned layout. The absolute minimum, and never the only copy
    of a number or a name.
- One codemod (`scripts/type-floor-sweep.mjs`, kept in-tree for auditability)
  rewrote all 352 arbitrary pixel utilities onto those tokens: 88 files,
  map/chart components → `text-micro`, everything readable → `text-label`.
- `app/globals.css`: the eight sub-11px declarations (nav tagline when scrolled,
  `.section-divider__label`, map scale bar, heat-legend labels, toolbar fit,
  mission-ring toggle, status-bar density, map footer) moved to 11–12px.
- `tests/e2e/legibility.spec.ts` (**new, runs in CI on every push**) asserts
  *zero* visible text below 11px on **7 pages × 2 widths (390 / 1440)** against
  the static build the deploy serves. The floor cannot silently drift back.

**After** (the dist built from this branch):

| page | 390px | 430px | 768px | 1440px |
|---|---|---|---|---|
| `/` | 0 | 0 | 0 | 0 |
| `/map/?site=G10161` | 0 | 0 | 0 | 0 |
| `/sites/` | 0 | 0 | 0 | 0 |
| `/dashboard/` | 0 | 0 | 0 | 0 |
| `/open-data/` | 0 | 0 | 0 | 0 |

and `qa-widths.mjs` reports no "tiny text" finding at any of its seven widths
(390 → 1920), where it used to report up to 235 per page.

### Labels that intentionally render at 11px

These are `text-micro`, i.e. at the floor, not below it — and each one is
chrome whose container is positioned over the map or inside a chart, where 12px
re-opened the overlay-overlap bugs closed by the previous pass:

`Map.tsx`, `MapHud`, `MapToolbar`, `MapStatsBar`, `MapFiltersPanel`,
`MapFilterSummary`, `MapProvinceBars`, `LayerControls`, `ScoreLegend`,
`ScoreSparkline`, `SavedMapViews`, `FirstRunStrip`, `OnboardingTour`,
`OfflineIndicator`, `CommandPalette`, `MinerStackCockpit`,
`MinerStackThumbBar`, `RoiProjectionChart`, `GasDeclineChart`,
`GeneratorDerateChart`, `EducationCharts`, `EducationHalvingTimeline`,
`MonteCarloPanel`, `ScoreHistogram`, `ConfidenceBandBar`.

If a future pass wants these at 12px, the container sizes have to move with
them — that is a layout job, not a typography job.

## Residual B — touch targets

The card's corrected note confirmed `Open the live map` (20px → 130×44) and
`Filter by province` (→ 253×44) were already fixed before I started. What I
found and fixed, all inside `@media (pointer: coarse)` so mouse users keep the
compact layout:

| control | before @390 | after @390 |
|---|---|---|
| map toolbar pills (back/forward/share/screenshot/print/help) | 30×26 | 44×44 |
| map style + metric chips (`Light`, `Satellite`, `Provinces`, `Avg score`, …) | 42–49×21–27 | ≥44 tall |
| map status-bar action (`COMMAND PALETTE (⌘K)`) | 159×16 | 44 tall |
| map layer-toggle rows (checkbox *target*) | 13×14 input | 44px row label |
| `Ctrl K` hint button (first-run strip) | 52×17 | 44 tall |
| first-run strip dismiss / tour dismiss | 32×32 / 26×26 | 44×44 |
| `My location` | 75×22 | 44 tall |
| nav toggles (theme / density / language) | 65×26 | 44 tall |
| footer links | 163×28 | 44 tall |
| dashboard metric chips | 49×27 | 44 tall |
| dashboard `Open map to build a mission →` | 166×16 | 44 tall |
| dashboard province rows (`Alberta`, …) | 44×16 | 44 tall |
| onboarding checklist checkbox | 24×24 | 44×44 |
| **OSM/CARTO attribution chip** | 100×19 | 100×44 |
| map footer `ECCC dataset ↗` | 91×17 | 44 tall |
| footer CTAs (`Donate Bitcoin`, `Marketing Hub`, `Open Map`, `Pitch`) | 30–42px | 44 tall |
| home readiness badge | 26–42px | 44 tall |
| command-palette recent-site chips | 160×26 | 44 tall |
| dashboard top-sites table links | 200×20 | 44 tall |
| cockpit `Verify this yourself →` pill | 23px | 44 tall |
| icon-only buttons (theme / density toggles, overlay dismiss) | 28×44, 26×44 | 44×44 |
| map layer-toggle checkbox click targets | 13×14 glyph | 44px row label |

## One process note worth keeping

The first version of the attribution rule targeted `.map-attribution` — a class
that **does not exist** on the element (it carries
`data-testid="map-attribution"`). It built fine, deployed fine, and looked like
a fix in the diff; the live harness then reported the same 19px control as
before. A CSS rule that matches nothing is a silent patch: the only proof a
target fix landed is a measurement of the live element afterwards.

## Two mechanisms

- **`.hit-area-44`** — `padding: .625rem` + `margin: -.625rem`, a layout-neutral
  way to buy a 44px target without moving a pixel or repainting anything. Used
  for the onboarding checklist checkboxes.
- A single documented `@media (pointer: coarse)` block in `app/globals.css`,
  scoped **by container** (`#main-content button`, `.map-toolbar-pill`,
  `.map-layer-stack`, `.map-status-bar`, `.map-footer-bar`, `footer a.footer-link`)
  rather than per instance, so the next control added to those containers
  inherits the floor instead of drifting.

### The 24×24 you flagged

It is **not** a duplicate CTA. It is the **get-started checklist checkbox**
(`w-6 h-6`, i.e. exactly the WCAG 2.5.8 AA 24px floor) from
`components/OnboardingChecklist.tsx`; the 130×44 element next to it is the
checklist *link*, which was already fixed. The checkbox is now wrapped in a
`<label class="hit-area-44">` so the box you can hit is 44×44 while the drawn
checkbox stays 24×24. `tests/e2e/legibility.spec.ts` asserts that target.

## Named exemptions — measured, judged, and deliberately left alone

These are the honest "intentional, here is why" entries. None of them is a
silent patch.

| item | measured | why it stays | WCAG |
|---|---|---|---|
| `Check it` (`/open-data`), `Learn more in Education →` (`/`), `Verify this yourself →` (`/map`), `ECCC Open` / `Part of the Give A Bit family` (`/dashboard`) | 14–19px tall | **SUPERSEDED 2026-09-12 — fixed, see addendum below.** Inline links inside a sentence. Growing them would push running text apart and make it *harder* to read; the criterion exempts them by name. `qa-widths.mjs` lists them under "Inline text links under 44px — listed, not failures". | 2.5.5 (AAA) & 2.5.8 (AA) inline exception |
| Native range inputs — capture slider, `Minimum/Maximum emission`, `Number of top sites` | 8–24px track | The track is **drawn by the browser**; the whole row is the drag surface, and the previous pass already gave bare ranges a 44px touch box on phones. Resizing the UA control would be restyling, not targeting. | 2.5.5 exemption: "target is determined by the user agent" |
| `Skip to main content` | 1×1 until focused | Visually-hidden skip link — it is a keyboard affordance; it becomes a normal target the moment it is focused. | 2.5.5 focus-visible convention |
| Desktop-only controls at 1280–1920 (`Collapse` 13×13, `RESET` 71×17, `Dev` summary, `Select all`) | 13–22px | The touch floor is applied with `@media (pointer: coarse)` only: these are mouse-sized affordances on a layout that has room for them, and the same components are ≥44px on a phone. | 2.5.5 applies to pointer input; the phone variant is the one that matters |
| Map right-column / bottom-sheet occlusion of map chrome | e.g. `Fit to filtered sites behind …` | `qa-widths.mjs`'s centre-point test: a docked panel sits *over* the map canvas by design at 768–1920px. The card names this class as a non-finding. | — |
| `© CoinGecko CORS` console errors on non-production origins | 2 per load | The price API allows the production origin only; it errors from `localhost:3011` and from the harness host, not from `stranded.giveabit.io`. Reproduced against the bare CDN endpoint. | — |

## Re-verifying this yourself

```bash
# build + serve exactly what CF Pages serves
npm run build && npx serve -p 3011 dist

# the card's own harness: overflow / clipping / overlap / tiny text / magnitudes
node scripts/qa-widths.mjs http://localhost:3011

# the raw counts behind the table above (writes /tmp/legibility-probe.json)
node scripts/qa-legibility.mjs http://localhost:3011

# the CI guard, exactly as CI runs it
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test tests/e2e/legibility.spec.ts
```

## Live verification (the build the site actually serves)

```
bash scripts/deploy-check.sh --dist dist
✅ DEPLOY VERIFIED after 1 attempt(s)
   live commit  : d7ecf097b5c7b85ef8e8c917585331e93551e165
   live buildId : 20260912010543 (generated 2026-09-12T01:05:43Z)
   live version : 2.11.0 (matches package.json)
   served data payload matches dist/data/live-stats.json
```

Against that build:

- `qa-legibility.mjs` — **0 text nodes below 11px** across 5 pages × 4 widths
  (390/430/768/1440). Before: 11,747.
- `qa-widths.mjs` — **no "tiny text" finding at any of the 7 widths** (390 →
  1920, 35 checks); **no undersized-control finding** on any page; the
  remaining findings are (a) the map's centre-point occlusion flags, where a
  docked panel sits over the canvas by design, and (b) console errors from the
  CoinGecko price CDN rate-limiting the harness host — both named as
  non-findings on this card and reproduced against the bare endpoints.
- `tests/e2e/legibility.spec.ts` in **CI**: green on the commit that introduced
  it (the `E2E smoke tests` step ran `playwright test` over `tests/e2e/`,
  including the new spec).

## What is still open (deliberately)

Nothing on this card's two residuals. The items below are the named exemptions
in the table above — they are decisions, not backlog. If the family wants the
44px bar to extend to inline prose links too, that is a copy/layout change and
should be its own card: it trades reading comfort for tap size and the WCAG
criterion explicitly permits the current state.

---

## Addendum — 2026-09-12: inline prose links fixed, and the trade-off above was avoidable

Cam asked for the inline-link remainder to be fixed. The reasoning recorded above
was **right about layout and wrong about touch**: it assumed a 44px target must
come from a bigger line box. It need not.

An **inline** box's vertical padding does not contribute to line-box height, so
`padding-block` grows the hit area to 44px while the text reflows by *zero*
pixels. Implemented as `a.hit-area-inline` inside the existing
`@media (pointer: coarse)` block (`app/globals.css`), applied to:

- `Check it` (`/open-data`)
- `Learn more in Education →` (`/`)
- `ECCC Open Data` (`/docs/api`)

Measured live 2026-09-12 against the deployed build, touch-emulated
(`hasTouch`/`isMobile`) versus desktop:

| link | phone (coarse) | desktop (fine) |
|---|---|---|
| `Check it` | 49×14 → **49×44** | 49×14 (unchanged) |
| `Learn more in Education →` | 214×19 → **214×49** | 214×19 (unchanged) |
| `ECCC Open Data` | 118×16 → **118×46** | 118×16 (unchanged) |

Desktop values are identical before and after — that identity is the proof there
is no reflow. **Lesson for the next auditor:** measure a hit target by its
*interactive* box, not by the inner glyph. A 24×24 checkbox inside a 44×44
`<label class="hit-area-44">` is a 44px target; reporting the inner input as a
failure is a harness bug, and that is exactly what happened to `Open the live map`
in the orchestrator's sweep.


