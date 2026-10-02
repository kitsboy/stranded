#!/usr/bin/env node
/**
 * refresh-renewable-layers.js
 *
 * Rebuild the map overlay files from official Canadian open data.
 * Point layers only. National totals and rasters are recorded, not painted —
 * they have no coordinates, or they would cover the whole country.
 *
 *   node scripts/refresh-renewable-layers.js
 *   node scripts/refresh-renewable-layers.js --dry-run
 *
 * Fails loud if the plant download is partial. A remote-community service that
 * does not answer falls back to the last official file that does, and the
 * manifest says which one was used.
 */
'use strict'

const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const GEO_OUT = path.join(ROOT, 'public', 'data', 'renewable-plants.geojson')
const MANIFEST_OUT = path.join(ROOT, 'public', 'data', 'renewable-layers.json')

const PLANTS_QUERY = 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/28/query'
const REMOTE_2025 = 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/remote_communities_2025_en/MapServer/0/query'
const REMOTE_2018 = 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/FGP/remote_communities_2018_en/MapServer/0/query'

const OGL = 'https://open.canada.ca/en/open-government-licence-canada'

const SOURCES = {
  plants: {
    id: 'nacei-renewable-plants-1mw',
    title: 'Renewable Energy Power Plants, 1 MW or more',
    publisher: 'Natural Resources Canada (NACEI)',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/490db619-ab58-4a2a-a245-2376ce1840de',
    serviceUrl: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/28',
    licence: 'Open Government Licence - Canada',
    licenceUrl: OGL,
  },
  remote2025: {
    id: 'nrcan-rced-2025',
    title: 'Remote Communities Energy Database (2025)',
    publisher: 'Natural Resources Canada',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/1d912ea1-919b-449d-8e8b-eb6a2313a401',
    serviceUrl: 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/remote_communities_2025_en/MapServer/0',
    licence: 'Open Government Licence - Canada',
    licenceUrl: OGL,
  },
  remote2018: {
    id: 'nrcan-rced-2018',
    title: 'Remote Communities Energy Database',
    publisher: 'Natural Resources Canada',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/0e76433c-7aeb-46dc-a019-11db10ee28dd',
    serviceUrl: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/FGP/remote_communities_2018_en/MapServer/0',
    licence: 'Open Government Licence - Canada',
    licenceUrl: OGL,
  },
}

/** Verified government sources we do not paint, and why. */
const RECORDED_NOT_MAPPED = [
  {
    id: 'statcan-25-10-0015',
    title: 'Electric power generation, monthly generation by type of electricity',
    publisher: 'Statistics Canada / Canadian Centre for Energy Information',
    url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510001501',
    why: 'National and provincial totals (MWh). No plant coordinates, so it is not a map layer.',
  },
  {
    id: 'statcan-25-10-0022',
    title: 'Installed plants, annual generating capacity by type of electricity generation',
    publisher: 'Statistics Canada / Canadian Centre for Energy Information',
    url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510002201',
    why: 'Capacity totals (MW) by source and province. No coordinates.',
  },
  {
    id: 'cer-renewables',
    title: 'Canada Energy Regulator — Renewable energy and Canada’s Energy Future',
    publisher: 'Canada Energy Regulator',
    url: 'https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/index.html',
    why: 'Market trends and projections, not a verified asset-location file.',
  },
  {
    id: 'nrcan-pv-potential',
    title: 'Photovoltaic potential and solar resource maps of Canada',
    publisher: 'Natural Resources Canada',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/8b434ac7-aedb-4698-90df-ba77424a551f',
    url: 'https://ftp.maps.canada.ca/pub/nrcan_rncan/Solar-energy_Energie-solaire/photovoltaic_canada_photovoltaique/municip_potentiel-potential.csv',
    why: 'Municipality table has names and kWh/kWp, not coordinates. Geocoding those names would invent locations. The raster maps would cover the whole country and hide the pins.',
  },
  {
    id: 'nacei-resource-potential',
    title: 'NACEI energy resource potential (solar irradiance, wind, geothermal gradient)',
    publisher: 'Natural Resources Canada',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674',
    url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_resource_potential_of_north_america_en/MapServer',
    why: 'Raster / WMS potential surfaces. A country-wide wash is not a toggle that can sit beside the methane pins without hiding them.',
  },
  {
    id: 'nrcan-hydrokinetic',
    title: 'Hydrokinetic resource assessment near diesel-reliant communities',
    publisher: 'Natural Resources Canada',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/b102925f-aa0c-41ad-9cc6-979072fc4871',
    url: 'https://ftp.maps.canada.ca/pub/nrcan_rncan/Energy-supply_Disponibilites-energetiques/HYDROKINETIC_Potential/SAR_derived/River_hydrokinetic_resource_assessment_using_SAR_satellite_imagery_en.SHP.zip',
    why: 'Winter open-water polygons, not power plants. A polygon wash would cover river corridors. Kept as a research source.',
  },
  {
    id: 'nacei-transmission',
    title: 'NACEI electric transmission lines and pipelines',
    publisher: 'Natural Resources Canada',
    datasetUrl: 'https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674',
    url: 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer/1',
    why: 'Line infrastructure for all of North America. Not a renewable or stranded-energy point. Left off so it does not draw over the pins.',
  },
]

const PLANT_CAT = {
  Solar: 'solar',
  Hydroelectric: 'hydro',
  Wind: 'wind',
  Biomass: 'biomass',
  Tidal: 'tidal',
  'Pumped Storage': 'pumped',
  Geothermal: 'geothermal',
  Other: 'other',
}

function fail(msg) {
  const err = new Error(msg)
  err.fail = true
  throw err
}

function getJson(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'stranded-refresh/1.0 (+https://stranded.giveabit.io)' },
      timeout: timeoutMs,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        return getJson(new URL(res.headers.location, url).href, timeoutMs).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch (e) { reject(e) }
      })
    })
    req.on('timeout', () => { req.destroy(new Error(`timeout ${timeoutMs}ms ${url}`)) })
    req.on('error', reject)
  })
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function str(v) {
  return v == null ? '' : String(v).trim()
}

function round5(n) {
  return Math.round(n * 1e5) / 1e5
}

function inCanada(lng, lat) {
  return lng >= -141.1 && lng <= -50 && lat >= 41 && lat <= 84
}

async function queryAll(base, where, timeoutMs, pageSize) {
  const features = []
  let offset = 0
  for (let page = 0; page < 40; page++) {
    const qs = new URLSearchParams({
      where,
      outFields: '*',
      returnGeometry: 'true',
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      orderByFields: 'OBJECTID',
    })
    const data = await getJson(`${base}?${qs}`, timeoutMs)
    const batch = data.features || []
    features.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
  }
  return features
}

function plantCategory(props) {
  const named = PLANT_CAT[str(props.PrimRenew)]
  if (named) return named
  const fields = [
    ['wind', props.Wind_MW],
    ['solar', props.Solar_MW],
    ['hydro', props.Hydro_MW],
    ['biomass', props.Bio_MW],
    ['tidal', props.Tidal_MW],
    ['pumped', props.HydroPS_MW],
    ['geothermal', props.Geo_MW],
  ]
  fields.sort((a, b) => num(b[1]) - num(a[1]))
  return num(fields[0][1]) > 0 ? fields[0][0] : 'other'
}

function remoteCategory(main) {
  const s = str(main).toLowerCase()
  if (!s || s === 'unknown' || s === 'other') return 'remote-unknown'
  if (s.includes('diesel') || s.includes('fuel oil') || s.includes('natural gas')) return 'remote-fossil'
  if (s.includes('hydro')) return 'remote-hydro'
  if (s.includes('grid')) return 'remote-grid'
  return 'remote-unknown'
}

function toPlant(feature, source) {
  const p = feature.properties || {}
  const coords = (feature.geometry && feature.geometry.coordinates) || []
  const lng = Number(coords[0])
  const lat = Number(coords[1])
  if (!inCanada(lng, lat)) return null
  const renewMw = num(p.Renew_MW)
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [round5(lng), round5(lat)] },
    properties: {
      id: `nacei-${p.OBJECTID}`,
      kind: 'plant',
      cat: plantCategory(p),
      name: str(p.Facility) || 'Unnamed plant',
      province: str(p.StateProv),
      place: str(p.City),
      mw: renewMw || num(p.Total_MW),
      renewMw,
      totalMw: num(p.Total_MW),
      hydroMw: num(p.Hydro_MW),
      pumpedMw: num(p.HydroPS_MW),
      solarMw: num(p.Solar_MW),
      windMw: num(p.Wind_MW),
      geoMw: num(p.Geo_MW),
      bioMw: num(p.Bio_MW),
      tidalMw: num(p.Tidal_MW),
      owner: str(p.Owner),
      operator: str(p.Operator),
      agency: str(p.Source),
      period: str(p.Period),
      sourceUrl: source.datasetUrl,
      sourceTitle: source.title,
      licence: source.licence,
      vintage: str(p.Period),
    },
  }
}

function toRemote(feature, source, vintageLabel) {
  const p = feature.properties || {}
  const coords = (feature.geometry && feature.geometry.coordinates) || []
  const lng = Number(p.LONGITUDE != null ? p.LONGITUDE : coords[0])
  const lat = Number(p.LATITUDE != null ? p.LATITUDE : coords[1])
  if (!inCanada(lng, lat)) return null
  const fossilKw = num(p.TOTALFFGEN)
  const renewableKw = num(p.TOTALREGEN)
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [round5(lng), round5(lat)] },
    properties: {
      id: `rced-${p.OBJECTID}`,
      kind: 'remote',
      cat: remoteCategory(p.MAINPOWERS),
      name: str(p.COMMUNITYN) || 'Unnamed community',
      altName: str(p.ALTERNATI1),
      province: str(p.PROVINCE_T),
      mw: (fossilKw + renewableKw) / 1000,
      population: num(p.POPULATION),
      mainPower: str(p.MAINPOWERS),
      fossilKw,
      renewableKw,
      annualFossilMwh: num(p.ANNUALFFGE),
      fuelPrice: p.PRICEOFFUE == null || p.PRICEOFFUE === '' ? null : num(p.PRICEOFFUE),
      fuelUnits: str(p.UNITS2),
      roadAccess: str(p.ISTHEREYEA),
      flyIn: str(p.ISTHISAFLY),
      provider: str(p.NAMEOFSERV),
      indigenous: str(p.INDIGENOU1 || p.COMMUNITYC),
      communityType: str(p.COMMUNITYT),
      status: str(p.COMMUNITYR),
      sourceUrl: source.datasetUrl,
      sourceTitle: source.title,
      licence: source.licence,
      vintage: vintageLabel,
    },
  }
}

function countsOf(features) {
  const counts = {}
  for (const f of features) {
    const cat = f.properties.cat
    counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
}

async function main() {
  const dry = process.argv.includes('--dry-run')
  const retrievedAt = new Date().toISOString()

  const rawPlants = await queryAll(PLANTS_QUERY, "Country='Canada'", 90000, 500)
  const plants = rawPlants.map((f) => toPlant(f, SOURCES.plants)).filter(Boolean)
  if (plants.length < 800) {
    fail(`Plant download looks partial: ${plants.length} Canada features (expected about 1,049). Refusing to write.`)
  }
  const droppedPlants = rawPlants.length - plants.length
  if (droppedPlants > rawPlants.length * 0.05) {
    fail(`Dropped ${droppedPlants} plants outside Canada bounds. Refusing to write.`)
  }

  let remoteSource = SOURCES.remote2025
  let remoteVintage = '2025'
  let remoteNote = '2025 Remote Communities Energy Database service answered.'
  let rawRemote
  try {
    rawRemote = await queryAll(REMOTE_2025, '1=1', 15000, 500)
    if (!rawRemote.length) throw new Error('2025 service returned 0 features')
  } catch (err) {
    remoteSource = SOURCES.remote2018
    remoteVintage = '2018'
    remoteNote = '2025 service did not answer on this pull. Used the 2018 official file instead. The quarterly job retries 2025 first.'
    console.warn('remote 2025 fallback:', err.message)
    rawRemote = await queryAll(REMOTE_2018, '1=1', 90000, 500)
  }
  const remotes = rawRemote.map((f) => toRemote(f, remoteSource, remoteVintage)).filter(Boolean)
  if (remotes.length < 200) {
    fail(`Remote-community download looks partial: ${remotes.length} features. Refusing to write.`)
  }

  const features = plants.concat(remotes)
  const periods = [...new Set(plants.map((f) => f.properties.period).filter(Boolean))].sort()
  const geo = { type: 'FeatureCollection', features }
  const manifest = {
    retrievedAt,
    featureCount: features.length,
    plantCount: plants.length,
    remoteCount: remotes.length,
    counts: countsOf(features),
    plantPeriods: periods,
    vintageNote: `Plant locations are the NRCan NACEI file (reference periods ${periods[0] || 'unknown'}–${periods[periods.length - 1] || 'unknown'}, mostly August 2017). That is the latest geospatial plant file NRCan publishes. It is not a current-year capacity census. Remote communities: ${remoteNote}`,
    mappedSources: [SOURCES.plants, remoteSource],
    remoteFallback: remoteSource.id !== SOURCES.remote2025.id,
    recordedNotMapped: RECORDED_NOT_MAPPED,
    licence: 'Open Government Licence - Canada',
    licenceUrl: OGL,
  }

  if (dry) {
    console.log(JSON.stringify({ plantCount: plants.length, remoteCount: remotes.length, counts: manifest.counts, remoteNote }, null, 2))
    return
  }

  fs.mkdirSync(path.dirname(GEO_OUT), { recursive: true })
  fs.writeFileSync(GEO_OUT, JSON.stringify(geo))
  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`wrote ${features.length} features (${plants.length} plants, ${remotes.length} remote)`)
  console.log(remoteNote)
  console.log(GEO_OUT)
  console.log(MANIFEST_OUT)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
