# stranded — Last Updated 2026-09-13 by Ziggy (economics repair 2)

**Brief:** Carbon baseline honesty, FX contract, and portfolio model alignment (Lenny t_e9e28d17 → repair t_424deeeb).

**Commit:** `02bd54d`

- **Carbon:** credit/abatement revenue is $0 by default and requires an OPTO-IN capture scenario AND a published vent/flare baseline. Sites with `flux_scope: not-applicable` or a null split (e.g. Mission Landfill G12350) show `$0` + "no published baseline". Removed the dual ungrounded panel figures ($50/t ×100% vs $45/t ×30%). GWP=28 everywhere; MissionPanel capex now uses `GENSET.capexPerKW` (not $1,000/kW).
- **FX:** price produced once (fleet-model pattern) — dropped the `(btc/85000)` production-scaling double-count from `computeAdvancedRoi`, `computeSiteValue` and the education widget; revenue is exactly linear in price. No bare `1.35` in any export path; unit-pure USD opex vs revenue. Removed `CAD_PER_USD` export. Static heuristics use documented `lib/capex-fx.ts` fallbacks derived from the map defaults.
- **Templates:** equipment + overclock only; `estimateFleetPaybackDays` returns the live session payback or `unavailable` — never a stale stored-assumption estimate.
- **CO₂e surfaces** relabelled as scenario equivalents (homepage/dashboard/pitch/term-sheet/LIVE-STATS), never "avoided".
- Verified: `npm test`, `npm run lint` (warnings only), `npm run build`, new economics unit tests, rendered-DOM e2e (45 tests green).
