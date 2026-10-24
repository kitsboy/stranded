# Session Summary — 2026-10-24

**Chat Topic**: An honest miner card for recorded energy pins, then the phone install banner and the Give A Bit footer logo.

**Key Things We Did**:
- One editable miner card on a renewable plant or remote community that records power. Wind, solar, hydro, and tidal use the province capacity factor. Biomass, pumped storage, and other plants do not get a payback. Remote sites use recorded output, not spare power.
- Home, pitch, education, dashboard, verticals, and about now count 2,611 methane sites, 1,049 plants, and 276 remote communities.
- The phone install banner hides while Layers, Filters, a site card, or an energy card is open.
- `live-stats.json` is stamped 2.15.0. The methane counts did not change.
- The footer wordmark was removed with three image files, then put back when Cam asked.

**What We Finished**:
- Miner card on main (`44ae11c`).
- Banner hide and the 2.15.0 stats stamp (`24af5c1`).
- Footer wordmark restored (`203ef3e`). Desktop 1440 and phone 390 both show the logo at 112×56. The image files return 200.

**What We Are Still Aiming to Finish**:
- Geothermal plants, when Cam asks. The plant count stays 0.
- Phone energy card: profit and payback above the long explanation.
- Filter province names that truncate should wrap.
- The phone Layers drawer still has empty space at the bottom that used to clear the banner.
- Do not merge `buffy/v2.11.1-hud-fix`.

**Update / Status**: As of 2026-10-24 the work is on `origin/main`. The live site at https://stranded.giveabit.io updates when Cloudflare Pages deploys `203ef3e`.

**Key Decisions / Notes**:
- Do not invent kilowatts. Do not call grid plants free power.
- Regenerate live stats with `node scripts/generate-live-stats.js`. Leave `npm run version` alone unless Cam wants a docs sync.
- Keep `public/images/giveabit-logo.png` in the footer.

**Mission Tie-in**: Stranded shows real Canadian energy and an honest Bitcoin build, and the footer keeps the link home to [giveabit.io](https://giveabit.io).

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
