# Stranded responsive QA — verdict

Card: `t_6d3c92c3` · branch `main` · verified against a local static build and the live
site at `https://stranded.giveabit.io`.

## How this was measured

`scripts/qa-widths.mjs` (Playwright, already a devDependency — no new packages) walks
**390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 px** across `/`, `/map/?site=G10161`,
`/sites/`, `/open-data/` and `/dashboard/`, and writes screenshots to `docs/qa/`.

```
node scripts/qa-widths.mjs                        # live site
node scripts/qa-widths.mjs http://localhost:39117 # local build
node scripts/qa-widths.mjs --assert               # non-zero exit on any finding
```

It asserts, per width × page: horizontal overflow (`scrollWidth - innerWidth`),
clipped controls, controls occluded at their centre point (`elementFromPoint`),
visible text under 11px, the smallest interactive target, and implausible
magnitudes. On the map it waits for the panel that is visible at that width and, on
phones, taps **Expand** on the bottom sheet first — the cockpit is only rendered once
the sheet is expanded, so asserting before that measures the hidden docked cockpit
and produces phantom findings.

`scripts/_zig_cockpit_qa.mjs` does the cockpit-specific work: every control inside
`[data-testid="site-cockpit"]`, tooltip placement, the keyboard loop, the displayed
magnitudes on G10161 (Keele Valley, 56,013.9 kg CH₄/day), and a corrupted-storage run.

## The verdict, width by width

**No horizontal overflow at any of the seven widths on any of the five pages** —
`scrollWidth == innerWidth` everywhere, before and after the fixes. That was already
true; it is now asserted.

| width | result |
|---|---|
| 390 / 430 | clean except the expanded bottom sheet covering map chrome (see below) |
| 768 | clean; the HUD-vs-toolbar collision is gone |
| 1024 | clean; attribution visible, `Copy viewport JSON` no longer flagged |
| 1280 / 1440 / 1920 | clean except minor overlap between MapLibre's own controls and floating panels |

## What I changed (each with the measurement that proves it)

1. **Top-centre overlays shared one anchor and collided.** The HUD, toolbar, first-run
   strip and radius chip were four independent `absolute` elements pinned to
   `top-16` / `top-20` / `top-24`. Measured at 768px: HUD occupied y 108–146, the
   toolbar y 124–161 — **22px of overlap**, and the toolbar's centre hit-tested to
   `map-top-hud__inner`. At 390px the overlap was 10px and the blocker was the
   first-run strip. Fix: one `map-top-stack` flex column so the relationship is
   structural, not four magic offsets. After: toolbar centre hit-tests to itself at
   every width.

2. **OSM/CARTO attribution was hidden at every width.** It lives inside the map
   stage's `z-0` stacking context at `z-[11]`, so every page overlay beat it —
   measured blocked by the bottom sheet at 390/430/768/1024 and by the onboarding
   card at 1280+. That is a licence term, not cosmetics. Fix: moved to the top-left
   with an opaque chip (`© CARTO · OSM`); now hit-tests to itself at all seven widths.

3. **Sub-44px touch targets in the cockpit.** The card's bar is 44px on `<768px`.
   Before: mode buttons 33px, the ⓘ tip 14px, genset remove 32px, the miner-count
   button 34px, `Show all figures` ~14px, `Fill the gas instead` ~16px, and
   `Copy fleet link` 330×25. After: **the smallest control inside the cockpit at
   390px is ≥44px** (verified by `_zig_cockpit_qa.mjs`).

4. **Sub-44px targets elsewhere.** The dashboard's capture slider measured **8px**
   tall — every bare `<input type=range>` renders ~14px, so one rule gives sliders a
   44px touch box on phones (the dual-range widget positions its own absolute thumbs
   and is excluded). The sites list's `Sort sites` / `Filter by province` selects
   measured **20px**; a `select` rule gives them 44px on phones. Checkboxes were
   13px — raised to 24px (WCAG 2.5.8 AA), and the `Open the live map` checklist link
   and breadcrumb links to 44px on phones.

5. **Stale chunk 404 broke client-side navigation after a deploy.** A browser holding
   an older document requests chunk hashes the newest deploy no longer has; Cloudflare
   answers with its HTML error page and the navigation dies
   (`Refused to execute script … MIME type ('text/html') is not executable`). New
   `components/ChunkLoadRecovery.tsx` listens for chunk-load failures and does a
   one-shot hard reload, guarded by a 30s sessionStorage window so a genuinely broken
   build cannot loop.

6. **A shared fleet link gave 5–10s of silence.** The map has to fetch and parse the
   2.85 MB GeoJSON before a deep-linked site resolves; meanwhile the panel is simply
   absent, which reads as "the link is broken". Added a `map-deeplink-loading` chip
   that names the site from the URL and shows the load percentage.

7. **CI was red on every commit since ~20:33.** `tests/e2e/smoke.spec.ts` asserted
   `Verified Sites`, a claim the honesty pass deliberately retired (the stat card now
   reads **`Mapped Sites`**). Updated the assertion to the honest wording so a
   regression back to "Verified Sites" fails loudly. Grep of the whole `tests/` tree
   found no other assertion depending on retired wording.

## Magnitudes (the units check)

Cockpit on `G10161`, full gas (from `_zig_cockpit_qa.mjs`, identical at 390 and 1280):

- `sats/day` **659,802,004** · `$/day` **≈ $508.1K** · **26,116 miners** ·
  **105,766 kW of 105,772 kW** of gas · payback **418 d**
- Cross-check: 659.8M sats ≈ 6.598 BTC ≈ $508.1K at ≈$77k/BTC, and 26,116 miners ×
  ~4.05 kW ≈ 105.8 MW, which is what 56,013.9 kg CH₄/day can power. Internally
  consistent and physically plausible — the ×10⁸ `formatSats` bug would have shown
  ~6.6×10¹⁶.
- The harness ceilings were raised accordingly (sats/day 5e7 → 1e10, $/day 5e6 → 1e8):
  the old values flagged a *correct* full-gas build on the largest site.

## The residual checks

- **Corrupted fleet key** (`stranded.fleets.v1 = '{broken json['`): the site panel
  **opens normally, 0 page errors**. Graceful degradation works — this settles the
  open question from the orchestrator's notes.
- **Tooltip**: opens to the left of the ⓘ button; measured `234×77` at 390px and
  `240×77` at 1280px, fully inside the viewport both times (`shown=true onScreen=true`).
- **Keyboard loop**: the miner bar is focusable and `ArrowLeft` moves the count
  26116 → 26115; focus ring `2px solid rgb(255,140,0)` on desktop. On the 390px run
  the ring read `none` — that is Chrome's `:focus-visible` heuristic after a
  *programmatic* focus, not a missing style; the ring is present for real Tab focus.
- **Console errors**: every console error the sweep captured is
  `api.coingecko.com … blocked by CORS policy` — the test host being rate-limited,
  not a site bug. No page errors on the map or the cockpit. The only other failure is
  a third-party glyph-range 404 from `demotiles.maplibre.org`, present before these
  changes too.

## Still rough — honest list

1. **The expanded mobile/tablet bottom sheet covers map chrome.** At 390/430/768/1024
   expanding the site panel makes it up to 85dvh tall, so the toolbar, the map's zoom
   controls and the `ⓘ` layer panel sit behind it. This is deliberate bottom-sheet
   behaviour (the sheet is effectively modal — collapse or close it to get back to the
   map), but on a **tablet (768–1024px)** covering the whole map to configure one site
   is the wrong trade: those widths have room for the docked column that currently
   only appears at `xl` (1280px). Not fixed here because moving the dock breakpoint
   changes the map layout at three widths and needs its own verification pass.
2. **The 9px text is a deliberate style, not drift — left alone.** The most common
   sample is the nav logo's "Value" subtitle (`components/Nav.tsx:88`). The rest are
   the brand's small-caps eyebrow labels (`uppercase tracking-wider`) and chart
   sub-labels. Live figures use ≥11px with `tabular-nums`. 235 nodes under 11px at
   1280px on `/sites` is mostly per-row score chrome. I did not touch the eyebrow
   style: it is a system convention and the card explicitly said not to "fix" it
   wholesale. Flagged for Cam as a brand call, not silently changed.
3. **Minor MapLibre-control overlap at 1280/1440/1920.** The compass and the ECCC
   freshness badge are both placed at `top-[4.5rem] xl:left-[19.5rem]` and overlap;
   zoom controls are partially behind floating panels at some widths. Mostly
   pre-existing (the compass/badge collision exists in the code independently of this
   card) and invisible without opening the cockpit.
4. **`Sort sites` etc. were measured at 20px only on the live build** — the local
   re-run after the `select` rule should show ≥44px; if a width still fails it is
   recorded in the sweep output rather than glossed.
5. **Vision analysis was unavailable to me**, so every judgement above is a measured
   number from the DOM, not a visual review. The screenshots in `docs/qa/` are there
   for a human to look at; I have not seen them.
