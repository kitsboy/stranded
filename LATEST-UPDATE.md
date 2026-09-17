# stranded — Last Updated 2026-09-17 by Mimi (deep-link card from the site's own record, t_ea3a7734)

**Brief:** `https://stranded.giveabit.io/map/?site=G12350` — the link you send when you mean *"look at this one"* — took **10–37 s** before Mission Landfill's card appeared, and it was provably CPU, not network (the audit measured a *faster* connection taking *longer*). The `?site=` id was only resolved *inside* the code path that had already parsed 2.85 MB of GeoJSON, enriched 2,611 sites and percentile-ranked them all, so the card could not exist until the portfolio did. It now opens from **that one site's own record** (~950 B, `public/data/site/G12350.json`) while the dataset loads behind it.

**Commit:** `fix(map): a shared link opens its site from that site's own record`

- **One record per site, generated at build.** `scripts/generate-site-records.mjs` (new, in `prebuild`) publishes 2,611 files to `public/data/site/<id>.json` — a record is **not** a summary or a subset: it is the exact `EnrichedSite` `loadSites()` returns, built from the same canonical geojson through the *same* functions (`enrichSite`, `scorePercentiles`, `scoreBadgeLabel`). `public/data/site-records.json` publishes the source digest and the record-set digest.
- **`lib/sites.ts` → `loadSiteRecord(id)`** fetches that one record, or returns `null` so the caller falls back to the dataset path. It never invents a site.
- **`app/map/page.tsx`** opens the card from the record, centres the map on it, and lets the dataset fill in behind. The dataset can no longer **yank** a selection: if the person closed the card or picked another site while it loaded, their choice stands; if the record is what is showing, the dataset does not replace it (same data, no remount flash). Fleet links (`?site=…&tpl=…`) keep the old path — their template can only be scaled once the dataset is here.
- **The dataset stopped being the bottleneck too.** `scorePercentile()` sorts and scans the whole score array on *every* call, and the pipeline calls it twice per site: **O(n² log n)**, ~7 s of CPU for 2,611 sites. New `scorePercentiles()` sorts once and binary-searches — **O(n log n)**, and provably the same numbers: regenerating the record set after the change rewrote **0 of 2,611 files**, same `recordsSha256` (`1ce1974a…`).
- **Proven, not asserted.** `npm run validate` now also runs `scripts/validate-site-records.mjs`, which recomputes the dataset's own answer for **all 2,611 sites** and compares it **field-for-field** with the published record, re-derives a 250-site sample the *old slow way* and asserts no published rank moved, and rejects a record set that has drifted from the data digest.
- **Measured (local, cold cache, back-to-back on the same box, real Chromium, `?site=G12350`):**

  | profile | card BEFORE → AFTER | map at full 2,611 state |
  |---|---|---|
  | 390px · Slow 4G · 4× CPU | **34.4 s → 5.8 s** | 33.0 s → 11.7 s |
  | 390px · 10 Mbps · 4× CPU | **24.8 s → 8.3 s** | 22.8 s → 10.9 s |
  | 1440px · no throttle | **11.1 s → 4.2 s** | 7.7 s → 5.2 s |
  | 390px · plain `/map/` (no deep link) | no card (correct) | 22.4 s → 6.3 s |

  The **deep-link path alone** — record requested, received, card rendered — measures **0.14–1.1 s** (the range is this shared box's load: `load average` sat between 6 and 10 on 3 cores during the runs). The rest of the absolute time is the app's own boot (HTML → JS → hydration), which under Slow 4G + 4× CPU is the larger half and is not dataset work.
- **Nothing else regressed:** `npm test`, `npm run lint` (no new findings), `npx tsc --noEmit`, `npm run build` all green; the fix-1 suite (`scripts/verify-mobile-layers-drawer.mjs` — 360/390/430 + 1440, real CDP touch, including the deep-linked pin tap) re-run against this build: **pass, zero failures**; the repo's own Playwright specs re-run against the built site.

---
# stranded — Last Updated 2026-09-17 by Mimi (layers panel gets a phone form, t_0b9e6cb1)

**Brief:** on a phone the *layers* box ("SCORE V3 / Satellite imagery / performance mode") used to float over the map — 192 × 950 px anchored bottom-right, **44% of the map stage** — and it swallowed every tap and drag underneath it, so a pin under it could not be opened and the map would not pan from that half. It now has the same phone form the Filters panel already has: a **"Layers" button next to "Filters"** opening the **same drawer**, with the panel itself desktop-only. Desktop is untouched.

**Commit:** `fix(map): give the layers panel a phone form — "Layers" button + drawer`

- **Below 1280px the corner panel is gone; it is a drawer.** `.map-layer-stack` is now `hidden xl:flex`. The "Layers" button (teal layers glyph, 44px, top-left beside Filters) opens the Filters drawer component — one file, one pattern: `MobileFilterDrawer` grew `title` / `icon` / `accentClass` / `closeLabel` / `testId` props so both drawers are the same surface. Closes by backdrop tap, ✕, Escape, or the page's `closeAllPanels`.
- **The controls are defined once.** The mission-ring toggle, the choropleth switch and every `LayerControls` row/preset/slider are now a single `layerControls` / `layerQuickToggles` pair rendered into *both* shells (desktop panel + drawer), so the two can never drift apart. The Score v3 legend rides along into the drawer.
- **The phone keeps the touch floor.** New coarse-pointer rule: rows, pills and sliders inside the Layers drawer get the same ≥44px target the desktop panel already had (`.map-layer-stack` rules don't reach into a drawer).
- **Honest by construction.** No map data, pin contents or proof-per-pin surface was touched (the serialised sibling card's work); layer *state* is the same React state, just a different home.
- **Verified in a real browser, with real touch events.** `scripts/verify-mobile-layers-drawer.mjs` (Playwright, CDP `Input.dispatchTouchEvent`, fresh contexts, coarse pointer) — all green **locally and on production** (`--live --strict-console`: zero console errors at 360/390/430):
  - the floating panel's own footprint (x∈[186,378], y∈[0,755]) at 390px: **25/25 sampled points belong to the map or to chrome that pre-dates this change; 0 unclassified**; `elementFromPoint(195,450)` = the map canvas;
  - **the deep-linked pin is tappable again.** The pin's pixel is derived from the app's own coordinate readout (two taps → px-per-degree → project G12350) and lands on **(195, 450)** — the exact pixel the audit measured and the exact spot the panel owned. One touch tap there opens the site card (Mission Landfill) and sets `?site=G12350`. Before: 0 maplibre click events, no card;
  - **the map pans from that half:** a 120px drag starting at (300,520) moved the centre lng −123.07961 → −122.50576;
  - **the drawer carries the same controls:** 26 controls, **26 reachable**, scrollable, 320px of 390 wide (not full screen), toggling a layer inside it flips the layer, and it closes on backdrop tap, ✕ and Escape;
  - 360/390/430 (no horizontal overflow) + 1440 desktop (panel still `display:flex`, 27 controls).
  - Known, unchanged, **not this card**: the first-visit quick tour (z-75) and getting-started strip still sit over the map (audit finding F13) — measured again and reported, untouched.

---

# stranded — Last Updated 2026-09-16 by Mimi (proof-per-pin trust UI, t_fcf032ef)

**Brief:** every pin on the map now carries its OTS-backed proof state — one honest answer for all 2,611 pins, because they all come from one Bitcoin-anchored dataset file (`stranded-sites-REAL.geojson`, digest `28c99c26…`, block 966,549, checked via Satohash's own node). The family's shared `HowProofWorks` explainer was ported byte-for-byte (kitsboy/satohash `src/components/trust/HowProofWorks.jsx`) — not reinvented.

**Commit:** `feat(trust): proof-per-pin map — every pin's OTS-backed proof state (port HowProofWorks)`

- **Pin status on the map itself.** The map HUD carries a "Pin proof" chip — *Anchored to Bitcoin · block 966,549 · own node* — and every pin hover popup shows the same line in the same words, so the anchor is felt at the pin, not buried in a doc page.
- **Pin detail surface (Evidence tab).** Each site's panel now leads its Evidence section with "Is this pin proven?" — anchored state, the Bitcoin block, HOW it was checked (own node `bitcoind` vs public explorer `esplora`), the `ots verify stranded-sites-REAL.geojson.ots` command and a one-tap `.ots` download. Forged / unresolvable proofs render **"Not proven"** on every surface; when no check has completed, the copy says exactly that (never an upgraded verdict).
- **The shared state machine, imported.** `stateFromVerdict` comes from the ported component; Stranded feeds it warm ELI16 labels and a per-pin provenance line ("Mission Landfill (row G12350) comes from stranded-sites-REAL.geojson…").
- **Honest by construction.** A registry `status` is never presented as proof. A recorded verdict (`public/data/proof-per-pin.json`, produced by `npm run proof:refresh` from a live `POST /api/verify`) is only trusted for the exact digest it names — the moment the dataset digest changes, the old verdict is dropped and the UI says so. In production the browser re-checks the chain live on every visit (`api.satohash.io` CORS-allowlisted for stranded.giveabit.io); in dev it falls back to the recorded check and labels it as such.
- **Verified:** `npm run test:helpers` (incl. new `test-pin-proof` honesty suite) green, `tsc` clean, `npm run build` (static export) green, and the new 4-test `tests/e2e/proof-per-pin.spec.ts` green (confirmed path via the recorded verdict, forged path via route-mocked rejection: badge + panel + hover popup all render "Not proven", no .ots offered when there is none).
