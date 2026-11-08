# Financing screen — 4 Nov 2026 window, written 7 Nov 2026

**Next session: remind Cam of this plan before other work.**

This is a planning screen. It is not a page on the site. It is not a vendor invoice, a generator quote, a grant award, or a pension product. Methane stays in the model. Cam asked for that on 4 Nov 2026 and asked on 7 Nov 2026 that the next chat remind him.

The deal he can stand behind is one site. The expansion is the biggest 10% of reported methane. The full file is the ceiling. The same payback ratio shows up at every share when the machine stays the same, because the coins and the cheque both follow the kilowatts. A year of the expansion is a producing pilot. It does not fund the Canada Pension Plan.

He was offered a sheet on the site that would use only these labelled rates and the site’s own machine cards. He has not said yes. Do not build that page until he asks.

## What the screen is allowed to use

- Reported methane from the public ECCC file already on the map. Newest filing year in that file: 2024. Do not re-pull ECCC unless Cam asks. 2025 reports were due 2026-06-01 and are not in the public file.
- Electricity from the existing Jenbacher rule: daily cubic metres = kilograms / 0.717, then kW = ((daily m³ / 220) × 850 × 0.9) / 24. That division by 24 makes it average power. The 850 kW and 220 Nm³/h are the site’s Jenbacher J316 reference. `capexPerKW` 1,050 is a planning figure in the code comment (“approx 2026”), not an INNIO quote.
- Machine counts from watts already on the card: floor(kW × 1000 / watts). The bitcoin rate does not change the machine count.
- Bitcoin from the public chain window below. The optimistic rate 0.0000009 BTC/TH/day stays labelled. On this window it is about twice the coins. It is not the headline.
- Hardware dollars from the site card `cost_cad`. For the S21 XP that card is 300 TH/s, 4,050 W, 13.5 J/TH, $8,500 CAD. That is a planning price, not an invoice.
- The $25,000 setup default is not in the payback below.
- Grid plants are not free power. A fuel price in dollars per litre is not a power price. Waste-methane screening uses the reported gas plus generator capex. It does not use $0/kWh and it does not buy a grid kilowatt-hour.

## The window

Checked 2026-11-04 about 20:53 UTC, mempool.space, last 144 blocks.

| Input | Value |
| --- | --- |
| Hashrate | 1.020606506392738e21 H/s (about 1,021.6 EH/s) |
| Reward | 45,238,410,563 sats (includes 238,410,563 sats of fees) |
| Window | unix 1,793,736,329 → 1,793,822,861 (86,532 seconds) |
| Rate | 4.425741112939955e-7 BTC/TH/day |

Later the same calendar day a fresh hashrate read was about 1,032 EH/s. Do not mix that hashrate into this reward window.

CoinGecko simple price during the financing turn that day: bitcoin $80,426 USD and $112,377 CAD. Prefer that dollar column. One S21 XP at the network rate is 300 × 4.425741e-7 = 0.00013277 BTC/day, about $15 CAD/day at that price. The same machine at 0.0000009 is 0.00027 BTC/day, about $30 CAD/day.

The older cards still show a frozen network-derived rate, 450 / 1,100,000,000 ≈ 0.000000409. That is a different label from this 4 Nov window. The home story uses the live window and leaves the bitcoin line blank if the check fails.

## The deal: one published vent

**TransCanada Pipeline, Ontario, pipeline transmission, 2024 filing.** Facility report 34,342 kg/day. The filing is fugitive and publishes a vented split of **14,442.03 kg/day**. The pilot uses that vented figure.

| Line | Figure |
| --- | --- |
| Average power | 2,918.3 kW |
| Antminer S21 XP | 720 |
| Bitcoin, network rate | 0.0956 BTC/day, 34.89 BTC/year |
| Gross, at $112,377 CAD | about $3.92 million CAD/year |
| Miners at the $8,500 card | $6,120,000 CAD |
| Generators at $1,050/kW | $3,064,262 CAD |
| Gross payback, miners | about 1.6 years |
| Gross payback, miners + generators | about 2.3 years |

Those years are before pool fees, downtime, permits, tax, interconnect, and gas treatment.

The other five sites in the biggest-10% slice, so the next chat does not call them all “into the air”:

| Site | Province | Report kg/day | Split |
| --- | --- | --- | --- |
| Enbridge Gas Inc. - Distribution | Ontario | 39,072 | fugitive, vented 1,737.08. Do not editorialize the source type. |
| Fording River Operations | British Columbia | 34,657 | fugitive, vented 0 |
| TransCanada Pipeline | Ontario | 34,342 | fugitive, vented 14,442.03. This is the pilot. |
| Essex-Windsor Regional Landfill | Ontario | 32,544 | not-applicable, no vent number |
| Twin Creeks Landfill (formerly Warwick Landfill) | Ontario | 31,370 | not-applicable, no vent number |
| Mildred Lake and Aurora Plant Sites | Alberta | 30,134 | fugitive, vented 983.15 |

All six are 2024 filings. A landfill with no fugitive split is not called vented.

## The expansion: biggest 10%, then the file

S21 XP, network rate, card price, 4 Nov 2026 dollars. “Other methane” on a fugitive row is the facility total minus the published vent and flare. It is not evaporation.

| Slice | Sites | kg/day | MW | Machines | BTC/day | BTC/year | Miners | Generators |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Top 10% | 6 | 202,119 | 40.84 | 10,084 | 1.339 | 488.7 | $85.71M | $42.9M |
| Top 30% | 28 | 594,736 | 120.18 | 29,674 | 3.94 | 1,438.1 | $252.23M | $126.2M |
| Top 80% | 406 | 1,574,720 | 318.21 | 78,570 | 10.432 | 3,807.6 | $667.85M | $334.1M |
| 100% of reports | 2,588 | 1,967,567 | 397.59 | 98,170 | 13.034 | 4,757.5 | $834.45M | $417.5M |
| Published vented split, whole file | — | 196,024 | 39.61 | 9,780 | 1.299 | 474 | $83.13M | $41.6M |

Top 10% gross is about $54.9 million CAD/year at $112,377. Miners and generators together are about $129 million. The whole-file published vented split is about the same pile of coins as that top 10% (about 474 BTC/year against 489).

Inside the top 10%, about 17.2 t/day is the published vented part, about 1.7 t flared, about 119 t other facility methane, about 63.9 t with no split.

## Any machine on the list, top 10% only

Same 40.84 MW. Count is watts. “Network” is the 4 Nov window. “Optimistic” is 0.0000009. Hardware is the site card.

| Machine | Count | BTC/day network | BTC/day optimistic | Card hardware | BTC/year network |
| --- | ---: | ---: | ---: | ---: | ---: |
| S21 XP 300 TH / 4,050 W | 10,084 | 1.339 | 2.723 | $85.71M | 488.7 |
| S21 200 / 3,500 | 11,669 | 1.033 | 2.10 | $64.18M | 377 |
| M60S 186 / 3,348 | 12,199 | 1.004 | 2.042 | $58.56M | 366.5 |
| T21 190 / 3,610 | 11,313 | 0.951 | 1.935 | $47.51M | 347.2 |
| S19 XP 140 / 3,010 | 13,569 | 0.841 | 1.71 | $51.56M | 306.9 |
| M50S++ 150 / 3,276 | 12,467 | 0.828 | 1.683 | $44.88M | 302.1 |
| S19k Pro 136 / 3,264 | 12,513 | 0.753 | 1.532 | $40.04M | 274.9 |
| S19a Pro 110 / 3,250 | 12,567 | 0.612 | 1.244 | $30.16M | 223.3 |
| M30S++ 112 / 3,472 | 11,763 | 0.583 | 1.186 | $25.88M | 212.8 |
| S19 95 / 3,250 | 12,567 | 0.528 | 1.074 | $22.62M | 192.9 |

Gas is the scarce input. The S21 XP turns a watt into the most coins on this list. A cheaper older machine can show fewer hardware dollars per coin and still leave coins unmined, because the same watts produce less hashrate. Do not change `ASIC_MACHINES` in `lib/fleet-template.ts` to chase a market price.

## Market check the same day — a different SKU

These listings are not the site card. Leave them off the card until a vendor quote names 300 TH/s and 4,050 W.

- Geizhals, 4 Nov 2026: S21 XP, €4,190 including Austrian VAT, specified as 270 TH/s and 3.6 kW.
- An index listing the same day: S21 XP 270 TH/s from $3,459 USD. That page’s own bitcoin figure was $80,109. The screen uses the CoinGecko $80,426 / $112,377 pair.
- Used-sale median about $2,288 USD on 16 completed sales through 30 Oct 2026. The comps did not prove 270 TH against 300 TH.
- A sold-out S21 listing near $3,200 USD mixed 195 TH and 200 TH text. That is the S21 row, not the S21 XP.
- A hydro-cooled 473 TH listing is a different machine and was not used.

## Pension, tax, and grant pools

CPP Investments reported net assets of $863.6 billion at 30 June 2026 ($863,603 million), in the 14 Aug 2026 note “Net Assets Total $863.6 Billion at First Quarter Fiscal 2027.” One year of top-10% gross (about $54.9 million) is about 0.006% of that fund.

Tax is on profit after costs, not on gross coins. A federal bitcoin treasury held for every Canadian is a separate policy decision. This screen does not create that treasury.

The funding-page CETA boxes are quiz cards (cleantech $5M, methane $10M, and the other ceilings on that page). The education glossary line “$200B+ in European green funds” is a slogan. A real request cites the program guide itself.

## Still open after this note

- Home and some education lines still say the gas is vented or flared. The story panel is the careful copy. Pitch and funding still scale sites in a straight line and still use the optimistic rate.
- No printable top-10% card yet.
- If a demo room blocks mempool.space, keep the last successful check and its timestamp. Do not fill the blank with 0.0000009.
- One demo path: home story, Top 10%, then one pin. TransCanada is the into-the-air example. The two landfills have no vent split.
- Version stays 2.15.0. Do not run `npm run version` unless Cam asks. Do not merge `buffy/v2.11.1-hud-fix`.
