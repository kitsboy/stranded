# Grok Session Protocol — Mandatory Handoff to Kimi

**Read this at session start. Follow at session end. No exceptions.**

---

## Your Role

You are the **M3 coding agent** (via Grok). You edit code, run builds, and push to GitHub.
Kimi (on M4) handles orchestration, docs, automation, and the Obsidian vault.

**DO NOT** touch M4 files (~/MASTER-BRAIN/, Obsidian, .hermes/). Your domain is `~/projects/` only.

**M3 root:** `/Users/cam/projects/` — open this folder as workspace, not `/Users/cam` (home).

**Project selection:** Only work on Finder-tagged **PRODUCTION** projects unless Cam says otherwise.
- **Green + PRODUCTION** = active now (giveabit, satohash, tadbuy, motopass, sherpacarta, stranded, openstrata, katoa).
- **Red + PRODUCTION** = queued next month — do not build yet (lindala, camtaylor).
- See `GiveABit-Goose-Main/PRODUCTION-PROJECTS.md` for the full registry.

---

## End-of-Session Handoff (MANDATORY — every session)

Before you say goodbye, YOU MUST run ALL of these steps:

### Step 1 — Write Handoff File

Append to `docs/KIMI-HANDOFF.md` in the current project:

```
## Handoff to Kimi — YYYY-MM-DD

**Machine:** M3 (Grok)
**Project:** motopass

### Done
- [x] Item 1
- [x] Item 2

### Decisions
- Why you did what you did

### What's Next
- Next steps for Kimi

### Git State
- Last commit SHA: <run `git log -1 --format=%H`>
- Branch: <run `git branch --show-current`>
- Unpushed: <run `git log --oneline origin/main..HEAD`>

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
```

### Step 2 — Save Memory Entry (Critical Cross-Platform Signal)

Grok cannot directly call Hermes memory(). Instead, write a one-line signal file:

```
echo "[YYYY-MM-DD] Grok updated motopass — see docs/KIMI-HANDOFF.md" >> ~/projects/PROJECT-UPDATE-LOG.md
```

This file is picked up by the M3 Researcher Scan (daily 1AM) and visible to Kimi.

### Step 3 — Git State Verification

```
cd ~/projects/motopass
git status                                    # should be clean
git log --oneline origin/main..HEAD           # any unpushed commits?
echo "Branch: $(git branch --show-current)"   # confirm branch
```

If there are unpushed commits, push them: `git push origin main`

### Step 4 — Summary One-Liner

Leave a clean one-line summary in the project root at `LATEST-UPDATE.md`:

```
# motopass — Last Updated YYYY-MM-DD by Grok

Brief: <what was done in 10 words or less>
Commit: <first 7 chars of last commit>
```

---

## File Locations

| Project | Path |
|---------|------|
| giveabit | `~/projects/giveabit/docs/KIMI-HANDOFF.md` |
| satohash | `~/projects/satohash/docs/KIMI-HANDOFF.md` |
| katoa | `~/projects/katoa/docs/KIMI-HANDOFF.md` |
| motopass | `~/projects/motopass/docs/KIMI-HANDOFF.md` |
| sherpacarta | `~/projects/sherpacarta/docs/KIMI-HANDOFF.md` |
| Stranded | `~/projects/stranded/docs/KIMI-HANDOFF.md` |
| Tadbuy | `~/projects/tadbuy/docs/KIMI-HANDOFF.md` |
| openstrata | `~/projects/openstrata/docs/KIMI-HANDOFF.md` |

---

## Protocol Purpose

This ensures Kimi sees what you did within 24 hours (via M3 Researcher Scan or directly next session). Without it, Kimi stays blind to M3 work until Cam mentions it. One handoff file = zero dropped context between agents.

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
