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
