# Session Summary — Stranded + Portfolio (2026-07-07)

## Chat Topic
Recover stranded context, fix Stranded Score v3, secure deploy pipeline, correct M3/M4 two-machine rules (Goose retired → Grok/Kimi/Hermes), and make handoff docs copy-paste friendly.

## Key Things We Did
- **whatsup recovery** — loaded v2.2.1 stranded state from handoff files
- **Stranded Score™ v3** — fixed scoring (ECCC missing grid/internet fields); avg ~60, 108 sites ≥80; pushed v2.2.1
- **Deploy** — confirmed CF Pages `strandedbuild` working; Kimi fixed E2E + `deploy:check`; CI green
- **SSH** — `id_ed25519_giveabit` wired in `~/.ssh/config` for GitHub on M3
- **M3/M4 rules rewrite** — canonical `~/projects/TWO-MACHINE-RULES.md`; Goose retired; M4 = MASTER-BRAIN logic + Obsidian REF only
- **Secured repos on GitHub** — openstrata docs pushed; `kitsboy/btcminiscript` repo created and pushed
- **Copy-paste text docs** — `SEND-TO-KIMI-TWO-MACHINE-RULES.txt`, `M3-M4-RULES-SIMPLE.txt`, `M3-M4-CLEANUP-HANDOFF.txt`
- **Uniform protocols** — AGENTS.md + GROK-SESSION-PROTOCOL.md updated across projects (commit c1359ed)

## What We Finished
- Stranded v2.2.1 live with meaningful score distribution
- Deploy pipeline ritual: `verify` → push → `deploy:check`
- M3 canonical two-machine rules documented (correct agent names)
- btcminiscript + openstrata on GitHub from M3
- Git remote SSH on stranded; github.com Host config on M3 laptop

## What We Are Still Aiming to Finish
- **Kimi M4 cleanup** — backup + delete `~/projects/{stranded,openstrata,btcminiscript}` on HERMES
- **Kimi** — mirror `TWO-MACHINE-RULES.md` → `~/MASTER-BRAIN/TWO-MACHINE-RULES.md`
- Regenerate `hermes-agent` classic PAT; never embed in git remote
- CF API token for wrangler fallback (`strandedbuild` project name)
- SSH remotes on remaining M3 projects (one-liner in COPY-PASTE-COMMANDS.txt)
- UI score color thresholds aligned to v3 tiers
- 50 improvement items from earlier session (on backlog)

## Update / Status
As of **2026-07-07**, stranded is **live at v2.2.1**. Production deploy via CF Pages git hook on `strandedbuild`. M3 holds all working code; M4 cleanup pending Kimi approval. Rules canonical path: `~/projects/TWO-MACHINE-RULES.md`.

## Key Decisions / Notes
- GiveABit-Goose-Main/ is legacy manifests only — not rules authority
- GitHub CI failure ≠ CF deploy failure (separate systems)
- Grok never touches M4 paths; Kimi never pushes code
- Text .txt handoff files for Cam (cannot copy from Grok UI)

## Mission Tie-in
Stranded maps 2,611 methane sites for Bitcoin-powered remediation under Give A Bit Safe Harbour. Clean M3/M4 split keeps coding fast on the laptop and strategy coherent in MASTER-BRAIN.

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*