# KIMI / HERMES HANDOFF - Stranded Canada Update

**Date:** $(date)
**From:** Grok (M3 coding session)
**To:** Kimi on M4 HERMES / Obsidian MASTER-BRAIN

## Current State
- Project: Next.js 14 app (app router) at /Users/cam/projects/stranded
- Dev server: `npm run dev` → http://localhost:3003
- The "platform" / "Live Command Center" / "stranded" experience is now the internal **/map** route (full 2611 sites, details panel, portfolio, live BTC, etc.)
- Marketing & Sales Hub: /Marketing-Hub.html (standalone beautiful HTML with 5 docs, overlays, taxonomy, images). Served at http://localhost:3003/Marketing-Hub.html
- Home page CTAs ("Open the Live Command Center") correctly link to /map
- All old external "https://tools.giveabit.io/stranded" links (in hubs, .md docs, buttons) have been updated to **http://localhost:3003/map** for now (local dev).

## Paths & Maps (Current)
- Local dev root: http://localhost:3003
- Platform/Command Center: http://localhost:3003/map (or /map?site=... for deep links)
- Education: /education
- Sites list: /sites
- Marketing Hub (docs + visuals): /Marketing-Hub.html
- Raw docs served: /docs/1-Executive-... etc (for the "View Document" from hubs)
- Logo: /logo.png (original from main site)
- Images: /images/*.jpg (generated cinematic assets for hub)

## Future Production
- Target domain: **stranded.giveabit.io** (Cloudflare Pages, deploy from GitHub main branch)
- GitHub (current source of truth): https://github.com/kitsboy/stranded-canada.git
- This local project will replace the old repo/setup.
- Old tools.giveabit.io/stranded is deprecated/broken.

## Git
- Remote: origin = https://github.com/kitsboy/stranded-canada.git (cleaned and verified)
- Branch: main
- Git is connected and functional for pull/commit/push.
- Working tree has some old deleted files from restructure (can be committed or cleaned).

## Key Files Updated in this session
- public/Marketing-Hub.html + docs copy: fixed Live Platform buttons, logo (now uses original logo.png, title "Stranded", tagline "Value"), removed "by GiveAbit" badge per request, background brightened, modals for docs.
- .md documents (1-Executive, 2-One-Pager and their public/docs copies): updated external links.
- docs/SOURCE-OF-TRUTH.md, DEPLOYMENT.md, DOCUMENTATION.md: cleaned old URLs, noted local + future stranded.giveabit.io
- React app internal links (home, education, sites, nav, footer): already correct to /map etc. (no external old links found in UI buttons).

## For Kimi / HERMES / Obsidian
- Full current architecture, all maps (the /map is the core), paths, branding decisions (de-emphasize "Canada" on hub for now, "Stranded Value" tagline on hub logo), workloads (marketing hub polish, link cleanup, logo fixes, overlays, taxonomy), updates from this session.
- Obsidian vault sync: please pull latest from this handoff + the project docs/ folder.
- Git: pull latest main when ready. Future deploys to Cloudflare for stranded.giveabit.io.
- Parent: GiveAbit (giveabit.io) subtle in hub.
- All 5 docs + hub are self-contained marketing assets with the 5 illustrated chapters in the hub.

## Next / Open Items (per user)
- Correct paths and maps soon (to stranded.giveabit.io)
- Git connections verified.
- Keep this handoff process for every session.
- The repo this replaces: note the transition in Obsidian.

**All details above are the source of truth for current state. Sync to MASTER-BRAIN.**

