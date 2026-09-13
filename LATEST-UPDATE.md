# stranded — Last Updated 2026-09-13 by Mimi (persistent build summary)

**Brief:** the phone sheet's Build section now leads with the ASIC / generator / quantity controls under a persistent build summary; the docked desktop cockpit keeps its full layout (card t_a04fe2af).

**Commit:** see the tip of `main` from this card (`feat(build): persistent build summary beside the hardware controls …`)

- **A summary that follows the choice.** Electrical power used/available (with a fill meter), total CapEx, net/day and payback are shown while you pick an ASIC, a generator mix or a miner count — in Build on a phone (sticky under the section tabs) and above the builder on the docked desktop cockpit.
- **Same model, same numbers.** Every figure comes from the existing `computeFleetModel` outputs; the money format is now one shared `formatMoneyFiat` used by both the ROI summary and the strip, so the summary, the cockpit, the ROI rows and the bank-pack export cannot disagree. The summary is display-only — no formula, input, default or export changed.
- **Honest by construction.** The selected currency is named, the optimistic hashprice assumption is labelled, payback reads N/A when the model has none, and the capacity line says the real constraint in words ("Gas ceiling reached — equipment adds no gas.", "N miners beyond the gas ceiling earn nothing.", "No usable gas here — the build stays at zero."). Methane is never multiplied by a genset count.
- **Controls before prose.** On the phone only, Build is ordered ASIC → generator → miner stack → templates → handoff → power table, and inside the cockpit the miner stack moves above the venting comparison. The docked desktop cockpit is untouched (every block in its original flow order, no tabs, no gating).
- **Nothing hides under the strip.** Each picker can be scrolled clear of the sticky strip (`scroll-margin-top`), the strip is flush under the tabs after scrolling, and it never takes more than ~1/3 of the sheet (187px of 593px at 360×740).
- **Verified:** `npm test`, `npm run lint` (pre-existing warnings only), `npm run build`, and the new 12-test `tests/e2e/build-summary.spec.ts` (touch emulation at 360/375/390/430, fine pointer at 1280/1440) all green locally; `site-sections` and `fuel-budget` re-run clean; exact-head CI and the live deploy identity-checked after push.
