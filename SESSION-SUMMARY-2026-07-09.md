# Session Summary — Stranded (2026-07-09)

## Chat topic
Whatsup recovery → confirm deploy runway → ship client power-ups → P0/P1/P2 fix batches → mobile footer CTA ghosts → language menu off-screen ES bug → full docs/knowledge backup.

## Finished this session

### Platform (live **v2.3.5**)
- **Score v3** explainability, tier colors (elite≥85 / high≥65 / med≥45 / low)
- **Bank packs** CSV · TSV · MD · HTML · JSON (site + mission)
- Peers + sensitivity tornado (revenue index so difficulty swings)
- Map legend, tier filters, inferred grid/internet filters
- Mission portfolio: real localStorage adds from education + sites
- Deep links: `?site=` `?province=` `?mission=` + watch-site banner
- Pages: `/privacy` `/roadmap` `/open-data` + methodology bank-pack/glossary
- Mobile: CTAs inside sticky footer (killed fixed ghost bar under footer)
- Language toggle: opens **downward**, click toggle, default EN
- Lead form honesty: local-only + export JSON + email draft
- i18n nav strings EN/FR/DE/ES; light theme pass; e2e **9 tests**
- Tests: `npm run test:helpers` + `validate` + build 24 routes

### Deploy pipeline
- `git push origin main` → CF Pages project **`strandedbuild`**
- Ritual: `npm run verify` / build → push → `npm run deploy:check`
- Production matches package **2.3.5** (confirmed)

### Knowledge preservation
- `docs/KIMI-HANDOFF.md` updated
- `SESSION-SUMMARY-2026-07-09.md` (this file)
- `LATEST-UPDATE.md`
- `archive/snapshots/stranded-docs-handoff-2026-07-09.tgz`
- DEPLOYMENT / SOURCE-OF-TRUTH / STATUS / README / I18N refreshed

## Still pending (not blocking)

### Kimi / M4
- Mirror TWO-MACHINE-RULES → `~/MASTER-BRAIN/`
- M4 `~/projects/` cleanup (stranded/openstrata/btcminiscript backup then delete on HERMES)
- Sync this session summary into Obsidian when Cam says go

### Backend / config (needs Cam secrets)
- Cloudflare API token for wrangler fallback
- Staging DNS; post-deploy CI notify
- Optional auth / cloud portfolio / email alerts

### Product backlog (client-capable later)
- Full FR copy depth beyond nav
- Lasso multi-select map; true XLSX workbook
- Stronger offline PWA; more e2e for bank pack clicks

## Key decisions
- Client-first: no SaaS/backend until secrets ready
- Bank pack TSV instead of heavy xlsx dependency
- Mission portfolio = localStorage only (honest)
- Language default EN; menu never opens above sticky nav

## Mission
Stranded maps 2,611 methane sites for Bitcoin-powered remediation under Give A Bit Safe Harbour. Progress is on GitHub `kitsboy/stranded` main + live CF.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
