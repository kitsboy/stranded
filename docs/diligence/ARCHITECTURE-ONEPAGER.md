---
title: Technical Architecture One-Pager
project: Stranded Value
version: 1.0.0
audience: developers, technical partners
last_updated: 2026-07-15
owner: Kimi (Orchestrator) + Nova (Docs)
self_evolving: true
update_rule: >
  Any material change to product, stack, deploy path, traction, or ask
  MUST update this file in the same PR/commit when possible.
  Weekly freshness target: score >= 7 (see nova-product-management).
tags: [diligence, pitch, mvp, giveabit]
---
# Stranded Value — Technical Architecture One-Pager

**Live:** https://stranded.giveabit.io · **Repo:** https://github.com/kitsboy/stranded · **Version:** `2.4.0`

## Stack
Next.js 14 (static export) · MapLibre GL · ECCC GeoJSON · generator/ASIC models · Cloudflare Pages (`strandedbuild`)

## System map (boxes)
```
[User browser]
     |
     v
[SPA / static app on Cloudflare Pages]
     |
        +--------+--------+
|                 |
        v                 v
[Public APIs / LN / Nostr / OTS]   [Optional M3/M4 services]
```

## Architecture notes
- Frontend map + site explorer
- Static/structured site dataset (2,611 CA sites)
- Generator + ASIC economics calculators
- Education center content
- Auto-deploy via GitHub → CF Pages

## Deploy path
git push main → Cloudflare Pages auto

## Data & privacy posture
Prefer client-side and user-held keys. Minimize PII. Bitcoin rails where payments exist. See project privacy/security docs if present.

## MVP boundary
- **In MVP now:** Map command center (clusters, choropleth, heatmap), education + halving slider, compare/print pages, funding quiz, bookmarks export, mission timeline CSV, local watch alerts, PWA v5 cache.
- **Explicitly later:** Cloud sync accounts, email/Telegram alerts, global datasets beyond Canada, certified equipment marketplace.

## Dependencies
ECCC data lineage; live BTC price feeds optional

## How a technical helper starts (15 min)
```bash
git clone https://github.com/kitsboy/stranded.git
cd stranded
# typically:
npm install
npm run dev
```
Read `README.md`, `docs/DEPLOYMENT.md` (or `DEPLOY.md`), and this file.

## Known gaps (full disclosure)
See Investor one-pager risks + project `LATEST-UPDATE.md` / handoffs. Do not claim production hardness without tests/deploy verification.

## Related
- [Investor one-pager](./INVESTOR-ONEPAGER.md)
- [Ask sheet](./ASK-SHEET.md)
- Deeper docs: `docs/ARCHITECTURE.md` (if present), `SOURCE-OF-TRUTH.md`, `docs/.ai_docs/`

---
**Safe Harbour:** Educational / informational only. Not financial, legal, or investment advice.
Bitcoin involves risk. DYOR. Not your keys, not your cheese.
Part of the [Give A Bit](https://giveabit.io) family.
