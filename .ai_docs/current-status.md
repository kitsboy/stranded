# Current Status — Stranded

**Version:** v2.10.0  
**Last Updated:** 2026-08-11  
**Domain:** https://stranded.giveabit.io  
**Build:** Next.js static export → `dist/` (CF Pages `strandedbuild`)  
**Dev:** `npm run dev` → localhost:3003  

## Session close (2026-08-11)

- In-flow footer (no sticky overlay)
- v2.10.0 mega upgrade batch (~50 model/UX items)
- Fuller 4-column footer: all routes, legal, suite, giveabit wordmark
- HEAD: `7982619` on `main` (pushed)

## Recent Milestones
- **v2.10.0** — Models (DQ, confidence, Monte Carlo, verticals, gas decline, CapEx/FX, amortization, carbon), dashboard capital tools, map saved views + site list, pitch speaker notes, PWA/stale/density, 4-col footer + giveabit logo (2026-08-11)
- **v2.9.x** — Lighthouse sweeps, Umami, CI/deploy trailingSlash fixes (2026-08-10)
- **v2.9.0** — Megabatch #526–625, dashboard i18n (2026-07-15)

## Known Issues
- Flaky keyboard-help E2E (optional cleanup)
- `tests/e2e/smoke.spec.ts` NodeList iteration needs downlevelIteration under strict tsc
- Tailwind unused-class noise (non-blocking)

## Next Steps
- E2E for new dashboard / site-detail panels
- Province one-click bank pack
- Lighthouse re-check after CF deploy of footer
- Optional: swap giveabit logo asset if Cam supplies a new mark
