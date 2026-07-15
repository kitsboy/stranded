# Stranded Value — Status

**Updated:** 2026-07-09 by Grok  
**Site:** https://stranded.giveabit.io (Cloudflare Pages · project `strandedbuild`)  
**GitHub:** https://github.com/kitsboy/stranded (`main`)  
**Build:** Next.js static export — `npm run build` → `dist/`  
**Dev:** `npm run dev` → `localhost:3003`  
**Data:** 2,611 ECCC methane sites  
**Version:** **2.3.5** · **Routes:** 24 static app pages + Marketing Hub  
**Status:** Live — `npm run deploy:check` OK (package == production)  
**Release bookmark:** https://github.com/kitsboy/stranded/releases/tag/v2.3.5  
**Last goodbye:** 2026-07-09 — full session summary in `SESSION-SUMMARY-2026-07-09.md`

## Shipped highlights (v2.3.x)

- Score™ v3 + explain factors + tier colors + map legend  
- Bank packs (CSV/TSV/MD/HTML/JSON), peers, sensitivity tornado  
- Mission portfolio local adds (map / education / sites)  
- Deep links, watch-site local banner, light theme pass  
- Mobile footer CTAs (no fixed ghost buttons)  
- Language menu fixed (opens down, EN default)  
- Privacy / Roadmap / Open Data; e2e 9 tests; `npm run test:helpers`

## Pipeline

```text
npm run validate && npm run test:helpers && npm run build
git push origin main
npm run deploy:check
```

## Knowledge / backup

| File | Role |
|------|------|
| `docs/KIMI-HANDOFF.md` | Structured handoff for M4/Kimi |
| `SESSION-SUMMARY-2026-07-09.md` | Full session narrative |
| `docs/PROGRESS-SNAPSHOT-2026-07-09.md` | Point-in-time capability map |
| `archive/snapshots/stranded-docs-handoff-2026-07-09.tgz` | Compressed docs backup |
| `docs/DEPLOYMENT.md` | Deploy truth (strandedbuild) |
| `docs/SOURCE-OF-TRUTH.md` | Living product doc |

## Open concerns (non-blocking)

1. **CF API token missing** — wrangler emergency deploy blocked; git hook is primary  
2. **Lead form is local-only** — correct honesty; no CRM until backend  
3. **CoinGecko rate limits** — soft-fail BTC price; offline uses fallbacks  
4. **Light theme** — improved, not pixel-perfect on every panel  
5. **i18n** — nav, hero, footer, sites, mission wired; education/map/pitch bodies still EN
6. **M4 sync pending** — Kimi should ingest handoff **when Cam says go** (not yet)  
7. **Watch alerts** — local toast on map open only (no push/email)  
8. **Docs drift risk** — prefer git tag `v2.3.5` + live-stats version over prose  

<!-- LIVE-STATS:START -->
> **Auto-synced** from `data/stranded-sites-REAL.geojson` on 2026-07-15T20:46:08.852Z

| Metric | Value |
|--------|-------|
| Sites | 2,611 |
| Provinces | 13 |
| Daily methane (kg) | 2,053,504 |
| CH₄ (tonnes/yr) | 749,529 |
| Avg Stranded Score | 60.4 |
| High-score sites (≥80) | 108 |
| 5% CO₂e avoided/yr | 1,049,340 t |
| Model annual revenue | $15,090,541,726 (@ $85,000 BTC) |

Full breakdown: [docs/LIVE-STATS.md](./LIVE-STATS.md) · Live JSON: `/data/live-stats.json` · Pitch: [https://stranded.giveabit.io/pitch](https://stranded.giveabit.io/pitch)
<!-- LIVE-STATS:END -->

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
