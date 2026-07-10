# Session Summary — Stranded — 2026-07-10

**Chat Topic:** Full adversarial audit of Stranded (security, reliability, concurrency, a11y, UI), then ship remediations through **v2.3.6** and **v2.3.7**.

## Key Things We Did
- End-to-end audit of static Next export app (map, mission, exports, SW, localStorage, a11y)
- Prioritised findings by severity; release call: **Ship with known risks**
- Implemented P0 + remaining high-value remediations in two ship waves
- Built, pushed `main`, confirmed production via `deploy:check`

## What We Finished
- **v2.3.6 live:** security headers (CSP, XFO, nosniff, referrer), HTML-escape exports, PasswordGate scrub, SW network-first (`stranded-v4`), map pan/zoom, live-BTC-scaled mission yields, sites/palette error states, form/dialog a11y basics
- **v2.3.7 live:** shared `BtcPriceProvider` + timeouts, `FocusTrap` modals, **Next.js 14.2.35**, removed js-cookie, Chart.js in CSP, nav-only i18n disclosure, design-token/CSS alignment
- Production: https://stranded.giveabit.io · package **2.3.7** · `deploy:check` OK
- GitHub `main` clean; unpushed none after goodbye commits

## What We Are Still Aiming to Finish
- Full content i18n (nav-only today)
- Native MapLibre cluster layers (DOM auto-cluster already helps)
- Optional CF API token for panic wrangler deploys
- Optional GitHub release tag for v2.3.7 (bookmark only)
- Kimi/M4 sync only when Cam says go

## Update / Status
As of 2026-07-10, Stranded is a hardened static intelligence site on Cloudflare Pages (`strandedbuild`). Audit remediations shipped; framework patched to 14.2.35; single CoinGecko poll path; safer exports and offline cache strategy. No multi-tenant backend remains—local-first by design.

## Key Decisions / Notes
- Client password gate is dead; use edge auth (CF Access) if private previews ever needed
- Network-first SW for HTML + `/data/*` prioritises freshness
- Mission daily yield scales with live BTC (enrichment still base-anchored at $85k)
- Certified lead form is local-only (honest copy)
- CF project name is **strandedbuild** (not `stranded`)

## Mission Tie-in
Stranded turns verified Canadian methane waste into Bitcoin-powered value maps—public ECCC data, honest models, capital pathways under Safe Harbour / Give A Bit.

## Git Snapshot
- SHA: `e3caf82` (docs) / feature ships `e6f5452`, `32bf44d`
- Version: **2.3.7**
- Branch: `main` · Remote: kitsboy/stranded

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
