# Official energy overlays — source record

Pulled 2026-10-02. Licence for every mapped file: [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada).

The map paints only files that have coordinates. Everything else is listed here so the next refresh does not have to rediscover it, and so we do not invent locations.

## Painted on the map

Turn these on from the map layer panel, under **Official energy overlays**. They start off, so the methane pins are unchanged until you ask for them.

Filled dots are power plants. Rings are remote communities. The colours are not the methane score colours (purple / green / yellow / orange). A bigger plant dot means more megawatts in the official file, not a Stranded Score.

| Layer | Count | What it is |
| --- | --- | --- |
| Wind | 241 | NRCan plant, primary renewable source = wind |
| Solar | 138 | same file, solar |
| Hydro | 555 | same file, hydroelectric |
| Biomass | 111 | same file, biomass |
| Tidal | 1 | same file, tidal |
| Pumped storage | 1 | same file |
| Geothermal | 0 | category exists; this official file has no Canadian geothermal plant at 1 MW or more |
| Other renewable | 2 | same file, primary source recorded as Other |
| Remote — diesel, oil or gas | 208 | not on the North American grid or piped gas |
| Remote — hydro microgrid | 35 | remote, main power is hydro |
| Remote — already on a grid | 26 | in the remote file, but the row says provincial/territorial grid |
| Remote — source not stated | 7 | main power unknown or other |

Plant file: [Renewable Energy Power Plants, 1 MW or more](https://open.canada.ca/data/en/dataset/490db619-ab58-4a2a-a245-2376ce1840de) (Natural Resources Canada, NACEI). Service: `MapServer/28` on `energy_infrastructure_of_north_america_en`. Canada only (1,049 of 6,377 North American rows). Each pin keeps owner, operator, province, place, total MW, renewable MW, and the split across hydro, pumped storage, solar, wind, geothermal, biomass and tidal. Reference periods in the file run from 2000 to 201708. Most rows are August 2017. That is the latest geospatial plant file NRCan publishes. It is not a 2026 capacity census.

Remote communities: the 2025 service (`dataset/1d912ea1-919b-449d-8e8b-eb6a2313a401`) did not answer on this pull. The map uses the 2018 official file, [Remote Communities Energy Database](https://open.canada.ca/data/en/dataset/0e76433c-7aeb-46dc-a019-11db10ee28dd), 276 communities. Each pin keeps population, main power source, fossil kW, renewable kW, annual fossil MWh, fuel price and units, road access, fly-in, utility and community type. The quarterly job tries 2025 first.

## On record, not painted

These are real government sources. They are not on the map because painting them would either invent a location or cover the country and hide the pins.

- Statistics Canada table 25-10-0015-01, electric power generation by source. Monthly/annual MWh. No coordinates. https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510001501
- Statistics Canada table 25-10-0022-01, installed generating capacity by source. MW totals. No coordinates. https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510002201
- Canada Energy Regulator renewable-energy market notes and Canada’s Energy Future. Trends and projections, not asset locations. https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/index.html
- NRCan photovoltaic potential by municipality. Names and kWh/kWp, no coordinates. Geocoding the names would invent locations. https://open.canada.ca/data/en/dataset/8b434ac7-aedb-4698-90df-ba77424a551f
- NACEI resource-potential rasters (solar irradiance, wind, geothermal gradient). A country-wide wash. https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674
- NRCan hydrokinetic open-water polygons near diesel communities. Research polygons, not plants. https://open.canada.ca/data/en/dataset/b102925f-aa0c-41ad-9cc6-979072fc4871
- NACEI transmission lines and pipelines. North American linework, not stranded energy points.

## Refresh

`npm run refresh:renewables` rediscovers the live services and rewrites `public/data/renewable-plants.geojson` and `public/data/renewable-layers.json`. It refuses to write if the plant count drops below 800 or the remote count drops below 200.

GitHub Actions workflow `refresh-renewables.yml` runs on 1 January, April, July and October, and can be started by hand. These files do not update often. A quarter is enough.
