# stranded — Last Updated 2026-09-13 by Mimi (phone-sheet sections)

**Brief:** mobile Overview / Build / Financials / Evidence workspace in the site sheet (card t_152a2036).

**Commit:** see the tip of `main` from this card (`feat(mobile): site sheet sections …`)

- **The phone sheet is sectioned.** A sticky four-tab nav (Overview · Build · Financials · Evidence) shows one section at a time; Overview opens by default for a newly selected site and carries a prominent "Configure build →" CTA that routes to Build.
- **Nothing was removed or duplicated.** Every metric, the ASIC/genset selects, templates, presets, financing/scenario controls, notes and exports are exactly where they were — one copy of each, in their original DOM order. Blocks are gated with a CSS class (`.site-section-off`), so nothing unmounts: form state survives a section switch and no control is rendered twice.
- **Desktop is untouched.** At xl+ the docked cockpit shows all four sections at once with no tab strip; a 1440px fine-pointer box snapshot (live vs local) diffs clean apart from the wrapper elements (`onlyA: []`).
- **Hero numbers stay on screen on a phone** via the existing sticky thumb bar (miners / sats/day / kW); the tab strip is sticky at the sheet's top edge, measured flush (no strip of scrolling content above it) and reachable while the section scrolls.
- **Tabs are 44px targets at 360/375/390/430**, with roving tabindex + Arrow/Home/End and safe-area padding; the layout viewport stays at the device width and the document never scrolls sideways.
- **Verified:** `npm test`, `npm run lint` (warnings only), `npm run build`, new `tests/e2e/site-sections.spec.ts` (9 tests) plus the existing fuel-budget / tap-target / hit-area / smoke / legibility suites green locally; exact-head CI and the live deploy identity-checked after push.
