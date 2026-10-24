# Official energy atlas — source record

## Miner build (v2.15.0)

A click on a plant or remote pin opens one editable miner card. The ASIC list is the same menu used on methane sites. The miner count stops at the kilowatts the file supports.

- Wind, solar, hydro, and tidal: plant-file nameplate times that province’s 2025 generation divided by its 2024 capacity (Statistics Canada tables 25-10-0015-01 and 25-10-0022-01), over 8,760 hours. The factor is the province total, not a meter on the plant. If generation exceeded the 2024 capacity, the build uses the nameplate.
- Biomass, pumped storage, other, and geothermal: no payback. Biomass has 2025 generation and no 2024 capacity. Geothermal plants in this file: 0.
- Remote communities: average fossil generation when annual megawatt-hours are recorded, capped by recorded fossil capacity. Otherwise recorded renewable or fossil kilowatts. This is recorded output, not spare power. A fuel price in $/l is shown and is not a power price.
- Infrastructure points, province shades, solar images, and hydrokinetic polygons are not miner sites. The hydrokinetic GeoJSON has river, community, kind, and province only.

Power price starts at 0.04 USD/kWh, the site-wide default, and can be edited. Zero is not used. Hashprice 0.0000009 BTC/TH/day is labelled optimistic. The network-derived rate (450 / 1,100,000,000) is shown beside it. Setup is the site-wide 25,000 CAD default, not a quote. No generator capex and no carbon credit.

Pulled October 2026. Licence for every mapped government file: [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada).

The map paints a source only in a form the file actually supports. A raster stays a raster. A point stays a point. A province total stays a province shade. Nothing in this list is a guessed town, a drawn corridor, or an invented geothermal plant.

## Plants and remote communities

Turn these on from the map layer panel, under **Official energy atlas**. They start off, so the methane pins are unchanged until you ask for them.

Filled dots are power plants. Rings are remote communities. The colours are not the methane score colours. A bigger plant dot means more megawatts in the official file, not a Stranded Score.

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

Plant file: [Renewable Energy Power Plants, 1 MW or more](https://open.canada.ca/data/en/dataset/490db619-ab58-4a2a-a245-2376ce1840de) (Natural Resources Canada, NACEI). Service: `MapServer/28` on `energy_infrastructure_of_north_america_en`. Canada only (1,049 of the North American rows). Reference periods in the file run from 2000 to 201708. Most rows are August 2017. That is the latest geospatial plant file NRCan publishes. It is not a current-year capacity census. The plant popup says so, and puts that plant’s file megawatts next to the province’s 2024 Statistics Canada renewable capacity. Québec in the plant file is matched to Quebec in the StatCan table. Alberta’s 2024 total includes 6 MW geothermal. That stays a province total.

Remote communities: the 2025 service did not answer on the plant pull. The map uses the 2018 official file, [Remote Communities Energy Database](https://open.canada.ca/data/en/dataset/0e76433c-7aeb-46dc-a019-11db10ee28dd), 276 communities. The quarterly plant job tries 2025 first.

Snapshot: `public/data/renewable-plants.geojson` and `public/data/renewable-layers.json`.

## Resource surfaces

Drawn under the pins, at an opacity you can turn down. The methane clusters and the plant dots stay on top.

| Layer | What it is |
| --- | --- |
| Solar irradiance (GHI) | NACEI resource-potential MapServer, layer 0, NSRDB global horizontal irradiance. Live map image. |
| Solar irradiance (DNI) | Same service, layer 1, direct normal irradiance. |
| Hydrokinetic open water (81) | Official shapefile polygons. A click names the river and the community on that polygon. |
| Hydrokinetic possible water (59) | Same file, the “possibly water” class. |

Solar service: `https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_resource_potential_of_north_america_en/MapServer`. The live service has those two solar layers only. Wind-speed and geothermal-gradient rasters are not in it, so they are not invented.

Hydrokinetic file: [Open water regions in ice-covered rivers](https://open.canada.ca/data/en/dataset/b102925f-aa0c-41ad-9cc6-979072fc4871), saved as `public/data/hydrokinetic.geojson`. The query endpoint still returns attributes and no rings. The map paints the official shapefile. Nine thin polygons that collapsed while simplifying were restored from the original rings, not from the community point. Ice is not painted. The community is named on the polygon and is not a second pin.

Solar images need `geoappext.nrcan.gc.ca` on `img-src` and `connect-src` in `public/_headers`. `maps-cartes.services.geo.ca` stays allowed. The hydro polygons do not request it.

## Infrastructure point records

Canada rows from NACEI `energy_infrastructure_of_north_america_en`. Every geometry in the pull is a Point. The route between From and To is not in the file, so it is not drawn. The popup says so.

| Layer | Count | Mark |
| --- | --- | --- |
| Transmission points | 28 | violet diamond |
| Gas pipeline points | 28 | cyan square |
| Liquids pipeline points | 21 | magenta triangle |

File: `public/data/nacei-infrastructure.geojson`. Dataset: [NACEI energy infrastructure](https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674). Reference periods in the sample rows are mid-2017. The layer panel searches owner, line name, and the recorded from / to, then flies to that point. A search does not invent a route.

## Province shades

The 2021 Census cartographic boundary, layer `lpr_000b21s_e`, generalized by the Statistics Canada map service. File: `public/data/province-boundaries.geojson`. Names match the StatCan keys (`Quebec`, `Yukon`). Parts under 100 km² were dropped, so this is not a legal survey. A rectangle is painted only if the file fails to load. A darker province is a higher official total. These are not town pins. They sit under the pins.

Source: [2021 census boundary files](https://open.canada.ca/data/en/dataset/ef70dc3b-1069-4037-9bce-61f47e628a1d).

| Layer | What the number is |
| --- | --- |
| Renewable generation, 2025 | Statistics Canada table 25-10-0015-01. Hydro, wind, solar, biomass and tidal megawatt-hours. |
| Renewable capacity, 2024 | Table 25-10-0022-01, same sources plus geothermal. Alberta’s row includes 6 MW geothermal. That is a province total. The plant layer still has 0 geothermal plants. |
| Solar PV potential | Mean of the municipal **Annual** row, south-facing latitude tilt, in kWh/kWp/year. Months are not added on top of Annual. |

Files: `public/data/statcan-renewables.json`, `public/data/pv-province.json`. PV source: [Photovoltaic potential and solar resource maps of Canada](https://open.canada.ca/data/en/dataset/8b434ac7-aedb-4698-90df-ba77424a551f). Municipality names have no coordinates and are not geocoded.

The older province choropleth (methane emission, revenue, renewable generation, renewable capacity) uses the same boundary file.

## Shown, not painted

- Canada Energy Regulator market snapshots and Canada’s Energy Future. A link in the layer panel. Projections have no coordinates. https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/index.html

## Refresh

- Plants and remote communities: `npm run refresh:renewables`. It refuses a partial plant or remote download.
- Surfaces, infrastructure points, PV province means, hydrokinetic counts: `npm run refresh:atlas`. It refuses a line geometry and a PV mean that looks like the months were counted twice.

GitHub Actions workflow `refresh-renewables.yml` runs the plant job quarterly. Run the atlas script when those services should be pulled again. Counts for the atlas live in `lib/energy-atlas.ts` and are checked against `public/data/energy-atlas.json`.
