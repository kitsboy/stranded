# Kimi Handoff — Stranded

## Handoff to Kimi — 2026-07-03

**Machine:** M3 (Grok)
**Project:** stranded

### Done
- [x] Verified full pipeline: validate → docs:sync → lint → build → push dry-run; live site confirmed at stranded.giveabit.io
- [x] Added GitHub Actions CI (`.github/workflows/ci.yml`) + `npm run verify` script
- [x] Built self-evolving docs: `generate-live-stats.js` + `sync-docs.js` → `live-stats.json`, `LIVE-STATS.md`, injected blocks in README/STATUS/SOT
- [x] Created `/pitch` page — live charts, province/emission/genset breakdowns, BTC revenue, top sites table
- [x] Fixed ESLint config, SiteDetailsPanel hooks bug, metadataBase production URL, Marketing-Hub localhost links
- [x] Created `docs/DEPLOYMENT.md`, `docs/DOCUMENTATION.md`; updated root SOURCE-OF-TRUTH pointer

### Decisions
- Stats regenerate on every `npm run build` via prebuild/postbuild hooks — pitch page reads JSON, docs get marker blocks
- Pitch uses pure CSS/SVG charts (no new deps) + live CoinGecko BTC refresh every 60s
- CI runs on GitHub; CF Pages auto-deploys from main push

### What's Next
- Tune Stranded Score formula (most sites floor at 8 — home featured scores may be stale/hardcoded)
- Add pitch link to Marketing Hub nav + command palette routes
- Consider wrangler token rotation (remote URL has embedded credential — security hygiene)
- Kimi: wire nightly `docs:sync` into M3 Researcher Scan if desired

### Git State
- Last commit SHA: (see post-push)
- Branch: main
- Unpushed: this session's commit

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*