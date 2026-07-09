# Kimi Handoff — Stranded

## Latest Session Summary (from 2026-07-09 goodbye)

**Chat topic:** Stranded full-day ship: power-ups, P0–P2, mobile/language fixes, docs backup, GitHub release tag, clean goodbye.

**Finished this session:**
- Live **v2.3.5** at https://stranded.giveabit.io (`deploy:check` OK)
- GitHub release **v2.3.5**: https://github.com/kitsboy/stranded/releases/tag/v2.3.5 (tag → `5dc9bc0`)
- Score explain, bank packs, mission portfolio, deep links, watch banner
- Mobile footer CTAs; language menu downward + EN default
- Docs pack + tarball; DEPLOYMENT truth = CF project **strandedbuild**
- E2E 9 tests; `npm run test:helpers` + validate

**Still to do:**
- Kimi: when Cam says sync — ingest `SESSION-SUMMARY-2026-07-09.md` + this file into Obsidian/MASTER-BRAIN
- Kimi: M4 ~/projects cleanup (stranded/openstrata/btcminiscript if still present)
- Cam optional: CF API token panic deploy; staging DNS

**Next for Kimi:** Do **not** sync until Cam says go. Then update Stranded Kanban + architecture map; educate Hermes on v2.3.5 release URL and deploy ritual (`push main` → `deploy:check`). No full chat logs.

**Git State (goodbye):**
- SHA: `5dc9bc0` (+ docs goodbye commit may append)
- Tag: `v2.3.5`
- Branch: `main` · Unpushed: none after goodbye push

---

## Session — 2026-07-09 (full day — progress locked)

**Machine:** M3 (Grok) · **Project:** stranded  
**Production:** https://stranded.giveabit.io · **v2.3.5** · `deploy:check` OK  
**CF Pages:** `strandedbuild` · **GitHub:** kitsboy/stranded `main`

### Done
- [x] Client power batch v2.3.0–2.3.5 (score explain, bank packs, peers, sensitivity, pages)
- [x] P0 / P1 / P2 versioned deploys
- [x] Mobile footer CTAs; language menu fix
- [x] Docs + SESSION-SUMMARY + snapshot tarball
- [x] GitHub release tag **v2.3.5**
- [x] Goodbye handoff complete

### Decisions
- Client-first; localStorage mission/leads (honest)
- Bank pack multi-format text; no heavy xlsx
- Wrangler project name **strandedbuild** only
- Tag is bookmark only (site already live)

### Still open (Kimi / Cam)
- [ ] Kimi: M4 MASTER-BRAIN sync when Cam says go
- [ ] Kimi: M4 ~/projects cleanup
- [ ] Cam: CF API token for wrangler emergency deploy

### Knowledge files
- `SESSION-SUMMARY-2026-07-09.md`
- `docs/PROGRESS-SNAPSHOT-2026-07-09.md`
- `archive/snapshots/stranded-docs-handoff-2026-07-09.tgz`
- `docs/DEPLOYMENT.md`
- Release: https://github.com/kitsboy/stranded/releases/tag/v2.3.5

---

## Session — 2026-07-09 (earlier — v2.3.0 power batch)

**Done:**
- v2.3.0 client-only power batch: score explain, bank packs, peers, sensitivity, `/privacy` `/roadmap` `/open-data`
- Tests: test:helpers + validate + e2e; CF strandedbuild

**Decisions:**
- Excel via TSV; backends deferred

**Git State:**
- SHA: `690670d` (superseded by later 2.3.x commits)

---

## Latest Session Summary (from 2026-07-07 goodbye)

**Chat topic:** Stranded Score v3, deploy pipeline, M3/M4 rules correction, portfolio cleanup.

**Finished this session:**
- Stranded Score™ v3 shipped (v2.2.1 live); shared `lib/scoring-shared.cjs`
- Kimi fixed E2E smoke tests + `deploy:check`; CI green; CF `strandedbuild` confirmed
- M3/M4 rules rewritten: `~/projects/TWO-MACHINE-RULES.md` — Goose retired, Grok=M3, Kimi/Hermes=M4 MASTER-BRAIN
- openstrata + btcminiscript secured on GitHub from M3
- SSH github.com config on M3 (`id_ed25519_giveabit`)
- Copy-paste handoff .txt files for Cam

**Still to do:**
- Kimi: M4 `~/projects/` cleanup (see `~/projects/M3-M4-CLEANUP-HANDOFF.txt`)
- Kimi: mirror TWO-MACHINE-RULES to `~/MASTER-BRAIN/`
- CF API token; rotate hermes-agent PAT; UI score tier colors

**Next for Kimi:** Integrate SESSION-SUMMARY-2026-07-07.md into Obsidian/MASTER-BRAIN when Cam says sync.

---

## Handoff to Kimi — 2026-07-07 (session end)

**Machine:** M3 (Grok)  
**Project:** stranded (+ portfolio rules)

### Done
- [x] SESSION-SUMMARY-2026-07-07.md written
- [x] Goodbye handoff complete

### Git State
- Last commit SHA: `d72765ea26b24d8d65442d603749a5108a629a31`
- Branch: `main`
- Unpushed: none

---

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
