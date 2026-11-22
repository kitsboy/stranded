# Current Status — Stranded Value

**Version:** v2.17.0  
**Last Updated:** 2026-11-22  
**Domain:** https://stranded.giveabit.io  
**Build:** Next.js static export → `dist/` (CF Pages `strandedbuild`)  
**Dev:** `npm run dev` → localhost:3003  

## Session close (2026-11-22)

- **v2.17.0** — Top 25 Public Pitch Upgrades + Map Hover Popup Fix + Full Knowledge Sync
- **Map Hover Fix (`components/Map.tsx`, `app/globals.css`)**: 340ms hover bridge + `-12px` cursor cushion + clickable `"Click to build it →"` button inside pin & cluster hover popups
- **Map Workflow Polish**: Gated dual welcome tour, enabled 4-tab cockpit (`Overview · Build · Financials · Evidence`) on desktop docked `SiteDetailsPanel`, added 15 km Radius Cluster Builder, Mission QR code, and `⚛️ Nuclear SMR Corridor` preset
- **Codified 6-Step Math (`HowTheMathWorks.tsx`)**: Live Network vs. Optimistic hashprice toggle + Sankey energy-to-sats diagram + Excel-formula `.TSV` audit export
- **Capture Huts (`CaptureHutSizer.tsx`)**: 4 enclosure classes (10ft/20ft/40ft air & hydro), CH₄/H₂S gas sliders, Waste-Heat Co-Gen sizer, SVG schematic, Used vs. Next-Gen ASIC matrix, Vendor RFQ export
- **Sovereign Pension Plan (`SovereignPensionPlan.tsx`)**: 6 National/Provincial/First Nations trust modes, 10% Flat BTC vs. 27% Status-Quo Fiat Tax comparison, CPP/Norway benchmarks, `#pension` URL hash, Print Whitepaper PDF
- **Global Capital Directory (`GlobalCapitalDirectory.tsx`)**: 13+ verified programs across CA, AB, BC, ON/SK, US, EU + Two-SPV Stackable Calculator, DSCR Stress Tester, Lease vs. Buy toggle, 1-Click Data Room Bundle
- **Phase 3 Nuclear SMR Simulator (`app/verticals/page.tsx`)**: 300 MW SMR + IESO/AESO Grid Frequency Response + 143 Remote Community Diesel-Displacement simulator
- **Automated Link Watchdog (`scripts/check-capital-links.mjs`)**: Verifies all capital URLs and internal route links in `npm test`
