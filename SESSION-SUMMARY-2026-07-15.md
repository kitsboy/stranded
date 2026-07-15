# Session Summary — 2026-07-15 (Stranded)

## Chat Topic

Map command center polish across v2.6.0–v2.6.4, culminating in removing a long empty horizontal black bar on the live map beside the zoom controls.

## Key Things We Did

- **v2.6.0** — Fixed Filters ↔ Quick Tour overlap; emissions slider inset; shipped upgrades #301–350
- **v2.6.1** — CSP fix for CARTO tiles; map-stage wrapper; ECCC badge repositioned; upgrades #351–425
- **v2.6.2** — Light OSM default basemap; pin sync race fix; zoom pinned right; bottom safe zones
- **v2.6.3** — Quick Tour spacing; fullscreen removed; global footer hidden on `/map`; mobile `dvh`/safe-area CSS
- **v2.6.4** — **Removed ghost black bar**: empty `map-right-column` scroll-shadow painted solid `--bg-dark` band; column now hidden when empty; scroll shadows softened to radial fades only
- E2E: 21 tests (incl. `empty right column does not render ghost bar over map`)
- Production verified: `npm run deploy:check` OK at **2.6.4**

## What We Finished

- Long horizontal black bar on map (user-reported screenshot issue)
- Map layout regressions from rounds 7–8 (filters, tour, pins, basemap, mobile, footer)
- Deploy to https://stranded.giveabit.io/map/

## What We Are Still Aiming to Finish

- Optional: keyboard-help E2E is flaky (`?` shortcut) — pre-existing, not blocking
- Broader upgrade backlog beyond #425 if desired (not requested this session)
- Kimi/M4 vault sync when user is ready (hand-off files prepared on M3 only)

## Update / Status

As of **2026-07-15**, Stranded **v2.6.4** is live on Cloudflare Pages (`strandedbuild`). The map command center shows tiles, pins, filters, HUD, and zoom controls without the empty right-column ghost bar. Git `main` is clean and synced (`9c2e950`).

## Key Decisions / Notes

- `showRightColumn` gate: render desktop right column only when `selectedSite || portfolio.length || compareSites.length >= 2`
- CompareSitesModal stays outside the column wrapper so compare modal still works when column is hidden
- Scroll-shadow CSS: removed opaque `--bg-dark` linear-gradient bands; kept subtle radial edge fades
- Map page uses map-only ECCC footer strip; global site footer returns `null` on `/map`

## Mission Tie-in

Stranded maps 2,611 real ECCC methane sites so stranded energy becomes bankable Bitcoin-powered value — the command center map is the primary discovery surface; removing visual chrome bugs keeps the tool credible for partners and investors.

## Next for Kimi

- Integrate this summary into MASTER-BRAIN / Kanban / Obsidian vault
- Note production **v2.6.4** and map URL https://stranded.giveabit.io/map/
- No M4 file moves until Cam or Kimi says sync time