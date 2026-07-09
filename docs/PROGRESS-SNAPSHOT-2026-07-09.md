# Stranded — Progress Snapshot 2026-07-09

**Version:** 2.3.5  
**Production:** https://stranded.giveabit.io  
**GitHub:** https://github.com/kitsboy/stranded  
**Release tag:** https://github.com/kitsboy/stranded/releases/tag/v2.3.5 (points at docs+code milestone `5dc9bc0`)  
**Deploy check:** package == production **2.3.5**  
**Session closed:** 2026-07-09 goodbye — use whatsup to resume

## What works (shipped)

| Area | Status |
|------|--------|
| 2,611 ECCC sites + Score™ v3 | Live (avg ~60, 108 ≥80, 32 ≥85) |
| Map Command Center | Filters, heatmap, mission, bank packs, deep links |
| Score explain + inferred grid | Site panel + map/palette filters |
| Bank packs | CSV / TSV / MD / HTML / JSON |
| Education | Simulators, real sites, mission add, quiz |
| Sites browser | Score/source filters, bulk mission, bank export |
| Pitch / Marketing Hub | Live stats + static hub |
| Mobile footer CTAs | Inside footer (no ghost bar) |
| Language menu | Downward, EN default, clickable |
| Privacy / Roadmap / Open data | Public pages |
| Tests | validate + test:helpers + e2e 9 |

## Data lineage

- Primary: ECCC open methane dataset  
- Canonical geo: `data/stranded-sites-REAL.geojson` → `public/data/stranded-sites.geojson`  
- Score formula: `lib/scoring-shared.cjs` (shared by app + live-stats + validate)  
- Build regenerates: `live-stats.json`, `status.json`, sitemap, docs LIVE-STATS blocks  

## Local-only features (by design)

- Mission portfolio, bookmarks, notes, filter presets, certified lead drafts, watch alerts  
- No server intake for leads (export JSON / mailto)  

## Backup artifacts

| Artifact | Path |
|----------|------|
| Session summary | `SESSION-SUMMARY-2026-07-09.md` |
| Kimi handoff | `docs/KIMI-HANDOFF.md` |
| Docs tarball | `archive/snapshots/stranded-docs-handoff-2026-07-09.tgz` |
| Changelog | `CHANGELOG.md` (through 2.3.5) |
| Live stats | `public/data/live-stats.json` |

## Concerns (open)

See end of latest KIMI-HANDOFF section and root STATUS.md.

---

*Do not lose: git is source of truth; this file is the human-readable bookmark.*
