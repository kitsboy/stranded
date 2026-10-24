# Official energy atlas — source record

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

Plant file: [Renewable Energy Power Plants, 1 MW or more](https://open.canada.ca/data/en/dataset/490db619-ab58-4a2a-a245-2376ce1840de) (Natural Resources Canada, NACEI). Service: `MapServer/28` on `energy_infrastructure_of_north_america_en`. Canada only (1,049 of the North American rows). Reference periods in the file run from 2000 to 201708. Most rows are August 2017. That is the latest geospatial plant file NRCan publishes. It is not a current-year capacity census.

Remote communities: the 2025 service did not answer on the plant pull. The map uses the 2018 official file, [Remote Communities Energy Database](https://open.canada.ca/data/en/dataset/0e76433c-7aeb-46dc-a019-11db10ee28dd), 276 communities. The quarterly plant job tries 2025 first.

Snapshot: `public/data/renewable-plants.geojson` and `public/data/renewable-layers.json`.

## Resource surfaces

Drawn under the pins, at an opacity you can turn down. The methane clusters and the plant dots stay on top.

| Layer | What it is |
| --- | --- |
| Solar irradiance (GHI) | NACEI resource-potential MapServer, layer 0, NSRDB global horizontal irradiance. Live map image. |
| Solar irradiance (DNI) | Same service, layer 1, direct normal irradiance. |
| Hydrokinetic open water (81) | Official map image of open water in ice-covered rivers near diesel-reliant communities. |
| Hydrokinetic possible water (59) | Same service, the “possibly water” class. |

Solar service: `https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_resource_potential_of_north_america_en/MapServer`. The live service has those two solar layers only. Wind-speed and geothermal-gradient rasters are not in it, so they are not invented.

Hydrokinetic service: [Open water regions in ice-covered rivers](https://open.canada.ca/data/en/dataset/b102925f-aa0c-41ad-9cc6-979072fc4871). The query endpoint returns attributes and no polygon rings, so the map uses the official export image. Ice polygons are not painted. The community coordinate on that file repeats the remote community, so it is not added as a second pin.

These images need `geoappext.nrcan.gc.ca` and `maps-cartes.services.geo.ca` on `img-src` and `connect-src` in `public/_headers`.

## Infrastructure point records

Canada rows from NACEI `energy_infrastructure_of_north_america_en`. Every geometry in the pull is a Point. The route between From and To is not in the file, so it is not drawn. The popup says so.

| Layer | Count | Mark |
| --- | --- | --- |
| Transmission points | 28 | violet diamond |
| Gas pipeline points | 28 | cyan square |
| Liquids pipeline points | 21 | magenta triangle |

File: `public/data/nacei-infrastructure.geojson`. Dataset: [NACEI energy infrastructure](https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674). Reference periods in the sample rows are mid-2017.

## Province shades

Boxes, not legal boundaries, and not town pins. A darker box is a higher official total. They sit under the pins.

| Layer | What the number is |
| --- | --- |
| Renewable generation, 2025 | Statistics Canada table 25-10-0015-01. Hydro, wind, solar, biomass and tidal megawatt-hours. |
| Renewable capacity, 2024 | Table 25-10-0022-01, same sources plus geothermal. Alberta’s row includes 6 MW geothermal. That is a province total. The plant layer still has 0 geothermal plants. |
| Solar PV potential | Mean of the municipal **Annual** row, south-facing latitude tilt, in kWh/kWp/year. Months are not added on top of Annual. |

Files: `public/data/statcan-renewables.json`, `public/data/pv-province.json`. PV source: [Photovoltaic potential and solar resource maps of Canada](https://open.canada.ca/data/en/dataset/8b434ac7-aedb-4698-90df-ba77424a551f). Municipality names have no coordinates and are not geocoded.

The older Province Emission Choropleth box is still the methane emission / revenue shade. Renewable Gen and Renewable Cap on that box use the same StatCan totals.

## Shown, not painted

- Canada Energy Regulator market snapshots and Canada’s Energy Future. A link in the layer panel. Projections have no coordinates. https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/index.html

## Refresh

- Plants and remote communities: `npm run refresh:renewables`. It refuses a partial plant or remote download.
- Surfaces, infrastructure points, PV province means, hydrokinetic counts: `npm run refresh:atlas`. It refuses a line geometry and a PV mean that looks like the months were counted twice.

GitHub Actions workflow `refresh-renewables.yml` runs the plant job quarterly. Run the atlas script when those services should be pulled again. Counts for the atlas live in `lib/energy-atlas.ts` and are checked against `public/data/energy-atlas.json`.
