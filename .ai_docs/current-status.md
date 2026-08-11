# Current Status — Stranded

**Version:** v2.10.0
**Last Updated:** 2026-08-11
**Domain:** stranded.giveabit.io
**Build:** Static export to dist/

## Recent Milestones
- v2.10.0 — Mega upgrade batch: models (MC, decline, CapEx/FX, amortization, vertical scores, DQ, confidence), dashboard capital tools, map saved views + site list, pitch speaker notes, PWA/stale/density, in-flow footer (2026-08-11)
- v2.9.x — Lighthouse sweeps, Umami, trailingSlash CI/deploy fixes (2026-08-10)
- v2.9.0 — Dashboard i18n, megabatch #526–625 (2026-07-15)

## Known Issues
- Flaky keyboard-help E2E test (question mark shortcut) — optional cleanup
- `tests/e2e/smoke.spec.ts` may need downlevelIteration for NodeList iteration under tsc
- index.css / Tailwind unused-class noise (not blocking)

## Next Steps
- Wire near-me radius deeper into map URL state if not fully connected
- Province bank-pack one-click from provinces page
- E2E smoke for new dashboard/map panels
- Keep Lighthouse regressions green after CF deploy
