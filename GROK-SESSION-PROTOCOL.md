# Grok Session Protocol — Mandatory Handoff to Kimi

**Read this at session start. Follow at session end. No exceptions.**

---

## CANONICAL RULES SOURCE

Your canonical rules come from **MASTER-BRAIN.md** on THOR (`~/MASTER-BRAIN/MASTER-BRAIN.md`).
Do NOT create new canonical files, duplicate rules, or invent new workflows outside this protocol.

**If it is not in MASTER-BRAIN.md, it is not a rule.**

---

## Your Role

You are the **M3 coding agent** (via Grok). You edit code, run builds, and push to GitHub.
Kimi (on THOR) handles orchestration, docs, automation, and the Obsidian vault.

**M3 root:** `/Users/cam/projects/` — open this folder as workspace.
**THOR domain** (`~/MASTER-BRAIN/`, Obsidian, `.hermes/`): DO NOT touch from M3.

**M3 is code only.** No new canonical files in `~/projects/`.

---

## End-of-Session Handoff (MANDATORY — every session)

Before you say goodbye, run ALL of these steps:

### Step 1 — Write Handoff to `docs/KIMI-HANDOFF.md`

Append a new section to `docs/KIMI-HANDOFF.md` in the current project with:

```markdown
## Session — YYYY-MM-DD

**Done:**
- Item 1

**Decisions:**
- Why

**Git State:**
- SHA: `git log -1 --format=%H`
- Unpushed: `git log --oneline origin/main..HEAD`
```

### Step 2 — Verify Git

```bash
cd ~/projects/<project>
git status
git log --oneline origin/main..HEAD
```

If unpushed commits, push: `git push origin main`

### Step 3 — Write `LATEST-UPDATE.md`

```markdown
# <project> — Last Updated YYYY-MM-DD by Grok
Brief: <one line>
Commit: <sha>
```

---

## File Locations

| Project | Handoff |
|---------|---------|
| openstrata | `~/projects/openstrata/docs/KIMI-HANDOFF.md` |
| btcminiscript | `~/projects/btcminiscript/docs/KIMI-HANDOFF.md` |
| giveabit | `~/projects/giveabit/docs/KIMI-HANDOFF.md` |
| satohash | `~/projects/satohash/docs/KIMI-HANDOFF.md` |
| stranded | `~/projects/stranded/docs/KIMI-HANDOFF.md` |
| tadbuy | `~/projects/tadbuy/docs/KIMI-HANDOFF.md` |
| motopass | `~/projects/motopass/docs/KIMI-HANDOFF.md` |
| sherpacarta | `~/projects/sherpacarta/docs/KIMI-HANDOFF.md` |
| katoa | `~/projects/katoa/docs/KIMI-HANDOFF.md` |

---

## Protocol Purpose

This ensures Kimi sees what you did via handoff files synced via GitHub push.
Without it, Kimi stays blind to M3 work.

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*

---

## THOR ops note (2026-07-20 — Kimi)

- **M3 = code only (you). THOR = ops/docs/Docker/cron.**
- Read latest `docs/KIMI-HANDOFF.md` top entry every session.
- HQ glass: https://hq.giveabit.io (gate + Vault). Satohash API: https://api.satohash.io
- Cam less-chat: status via OPS pulse/HQ — you still push handoffs after code.
- Default handoff path: append to `docs/KIMI-HANDOFF.md` then `git push`.
