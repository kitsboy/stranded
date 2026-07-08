# Kimi Handoff — Stranded

## Latest Session Summary (2026-07-07) — Deploy Pipeline Fixes

**Chat topic:** Fix E2E smoke tests, deploy pipeline corrections, add deploy:check.

**Finished this session:**
- Fixed `tests/e2e/smoke.spec.ts` — replaced duplicate-text locators with specific element-selectors. **All 6/6 E2E tests pass.**
- Fixed `deploy.sh` — wrangler `--project-name` changed from `stranded` → `strandedbuild`
- Created `scripts/deploy-check.sh` — compares `package.json` version vs production `live-stats.json`
- Added `npm run deploy:check` script to `package.json`
- Replaced broken `.gitignore` (had merge conflict artifacts) with clean version
- Switched git remote from HTTPS to SSH (`git@github.com:kitsboy/stranded.git`)
- Updated `docs/DEPLOYMENT.md` with correct project name (`strandedbuild`), post-deploy verification ritual, and CF dashboard config
- Committed and pushed to `main` — CI run #11 in progress
- Production verification: `npm run deploy:check` passes (v2.2.1 matches)
- Previous CI runs (#1–#10) all passed

**Still to do:**
- CF API token for wrangler fallback (if git deploy stops working)
- Kimi: sync this handoff into Obsidian / MASTER-BRAIN

**Next for Kimi:** Update Stranded Kanban, educate Hermes on deploy pipeline improvements.

---

## Latest Session Summary (from 2026-07-03 goodbye)

**Chat topic:** Confirm deployment, then implement upgrades 101–150.

**Finished this session:**
- Deploy confirmed live at **v2.2.0** (was stuck on v1.0.0; CF caught up after push)
- Round 4 (101–150): heatmap, IndexedDB, 5 new pages, export formats, education polish, integrations
- 150 total upgrades shipped across four rounds; 21 static routes
- Handoff + session summary written; git clean on `main`

**Still to do:**
- CF API token for wrangler fallback; SSH git remote; OAuth portfolios
- Kimi: sync `SESSION-SUMMARY-2026-07-03.md` + this file into Obsidian / MASTER-BRAIN

**Next for Kimi:** Update Stranded Kanban, architecture map, educate Hermes on v2.2 routes and deploy pipeline. Do not sync to M4 until Cam says go.

---

## Handoff to Kimi — 2026-07-03 (session end)

**Machine:** M3 (Grok)
**Project:** stranded

### Done
- [x] Deployment verified — https://stranded.giveabit.io at v2.2.0
- [x] Upgrades 101–150 (round 4) committed and pushed
- [x] SESSION-SUMMARY-2026-07-03.md + goodbye handoff complete

### Decisions
- Git push → CF Pages remains primary deploy; wrangler needs API token
- Privacy-first: local analytics stub, IndexedDB cache, no third-party trackers

### What's Next
- Round 5 upgrades (151+) if Cam wants another batch
- Security: rotate embedded git HTTPS token → SSH
- CF dashboard: confirm project watches `kitsboy/stranded` `main`

### Git State
- Last commit SHA: `dd5615a088edfc1a45eca66cd2095db490a00b1d`
- Branch: `main`
- Unpushed: none

---

## Handoff to Kimi — 2026-07-03 (upgrades 101–150, v2.2.0)

**Machine:** M3 (Grok) · **Commit:** `56eb847`

### Done
- [x] Confirmed git push deploy pipeline; production was stuck on v1.0.0 (CF auto-deploy lagging)
- [x] Round 4 upgrades 101–150: heatmap, IndexedDB, filter presets, 5 new pages, KML/GeoJSON export
- [x] Education quiz share + progress + genset table; ROI halving chart; Tadbuy/Sherpacarta hooks
- [x] PWA v3, offline indicator, pitch embed mode, keyboard help, v2.2.0

### Deploy note
- Wrangler manual deploy blocked (no CLOUDFLARE_API_TOKEN). Rely on CF Pages git hook.
- If production stays on v1.0.0, check CF Pages project connection to `kitsboy/stranded` main.

### What's Next
- Wire CF API token for manual `wrangler pages deploy` fallback
- Rotate git remote HTTPS token → SSH
- Full emission heatmap tuning; OAuth portfolios (still localStorage)

---

## Deploy Pipeline Configuration (as of 2026-07-07)

- **CF Pages project name:** `strandedbuild`
- **Deploy method:** `git push origin main` → Cloudflare Pages auto-builds
- **Manual fallback:** `CLOUDFLARE_API_TOKEN` + `npx wrangler pages deploy ./dist --project-name=strandedbuild`
- **Post-deploy check:** `npm run deploy:check`
- **E2E tests:** `npm run e2e` (6 tests, all passing)
- **Full verify:** `npm run verify`
- **Git remote:** SSH `git@github.com:kitsboy/stranded.git`
- **Production:** https://stranded.giveabit.io (v2.2.1)

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
