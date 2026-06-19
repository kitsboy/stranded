---
title: SOURCE-OF-TRUTH
project: [Project Name]
version: 0.1.0
audience: internal
last_updated: YYYY-MM-DD
owner: Nova (Product Management & Documentation)
verified_by: [Department Head(s)]
---

# [Project Name] — Source of Truth

## Mission
[One sentence — why this project exists]

## Live URL
[Deployed URL or N/A]

## Tech Stack
- [Language/Framework]
- [Infrastructure]
- [Key libraries]

## Architecture
[Brief architecture overview or link to architecture doc]

## Deploy Info
| Field | Value |
|-------|-------|
| Deploy Type | Auto (git push → CF) / Manual (wrangler) |
| Edit Machine | M3 |
| Deploy Machine | M3 / M4 |
| CF Project Name | [cloudflare-pages-project-name] |
| Custom Domain | [domain, or N/A] |
| DNS Status | [Resolves / NXDOMAIN / Not configured] |

## Key Decisions
- [Decision 1] — [Date, rationale]
- [Decision 2] — [Date, rationale]

## Dependencies
| Depends On | Used By | Shared Infrastructure |
|------------|---------|----------------------|
| [project] | [project] | [infra] |

## Deployment Commands
```bash
# Edit:
ssh m3 "cd ~/projects/[project] && code ."

# Deploy (auto):
# git push origin main — auto-deploys via CF

# Deploy (manual from M4):
# rsync -avz --delete m3:~/projects/[project]/dist/ ./tmp-[project]-dist/
# wrangler pages deploy --project-name [project]
```

## Status
[Active / In Production / Archived / Frozen]

## Kanban ID
[board-item-id]

---

**Safe Harbour:** This project is provided for informational and educational purposes only. It does not constitute financial, legal, or investment advice.
Part of the [Give A Bit](https://giveabit.io) family.
