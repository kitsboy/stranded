#!/usr/bin/env node
/**
 * refresh-energy-atlas.js
 *
 * Pull the official sources that sit beside the plant pins:
 *   - NACEI Canada transmission / gas / liquids rows (points only)
 *   - NRCan photovoltaic potential, aggregated to a province mean
 *   - Hydrokinetic polygon counts (the map paints the official image)
 *
 *   node scripts/refresh-energy-atlas.js
 *   node scripts/refresh-energy-atlas.js --dry-run
 *
 * Refuses to write a line geometry. The service publishes points, and a
 * line between From and To would be invented. Refuses to write a town pin.
 */
'use strict'

const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const INFRA_OUT = path.join(ROOT, 'public', 'data', 'nacei-infrastructure.geojson')
const PV_OUT = path.join(ROOT, 'public', 'data', 'pv-province.json')
const ATLAS_OUT = path.join(ROOT, 'public', 'data', 'energy-atlas.json')

const INFRA = 'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_infrastructure_of_north_america_en/MapServer'
const HYDRO = 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/hydrokinetic_assessment_using_SAR_for_Diesel_communities_en/MapServer'
const PV_URL = 'https://ftp.maps.canada.ca/pub/nrcan_rncan/Solar-energy_Energie-solaire/photovoltaic_canada_photovoltaique/municip_potentiel-potential.csv'
const OGL = 'https://open.canada.ca/en/open-government-licence-canada'

const INFRA_LAYERS = [
  { layer: 1, kind: 'transmission', nameField: 'LineName' },
  { layer: 2, kind: 'gas-pipeline', nameField: 'Pipeline' },
  { layer: 3, kind: 'liquids-pipeline', nameField: 'Pipeline' },
]

const PROVINCE_NAME = {
  'Yukon Territory': 'Yukon',
}

function fail(msg) {
  const err = new Error(msg)
  err.fail = true
  throw err
}

function getBuf(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'stranded-refresh/1.0 (+https://stranded.giveabit.io)' },
      timeout: timeoutMs,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        return getBuf(new URL(res.headers.location, url).href, timeoutMs).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('timeout', () => { req.destroy(new Error(`timeout ${timeoutMs}ms ${url}`)) })
    req.on('error', reject)
  })
}

function str(value) {
  return value == null ? '' : String(value).trim()
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++ } else quoted = false
      } else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cur); cur = '' }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
    else if (c !== '\r') cur += c
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row) }
  return rows
}

function inCanada(lng, lat) {
  return lng >= -141.1 && lng <= -50 && lat >= 41 && lat <= 84
}

async function pullInfra() {
  const features = []
  const counts = {}
  for (const spec of INFRA_LAYERS) {
    const where = encodeURIComponent("Country='Canada'")
    const url = `${INFRA}/${spec.layer}/query?where=${where}&outFields=*&returnGeometry=true&f=geojson&outSR=4326`
    const data = JSON.parse((await getBuf(url, 120000)).toString('utf8'))
    const raw = data.features || []
    if (raw.length < 10 || raw.length > 500) {
      fail(`${spec.kind} download looks wrong: ${raw.length} features`)
    }
    for (const feature of raw) {
      const geom = feature.geometry
      if (!geom || geom.type !== 'Point') {
        fail(`${spec.kind} feature ${feature.properties && feature.properties.OBJECTID} is ${geom && geom.type}, not a Point. Refusing to invent a corridor.`)
      }
      const [lng, lat] = geom.coordinates
      if (!inCanada(lng, lat)) {
        fail(`${spec.kind} ${feature.properties && feature.properties.OBJECTID} is outside Canada (${lng}, ${lat})`)
      }
      const p = feature.properties || {}
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5] },
        properties: {
          id: `${spec.kind}-${p.OBJECTID}`,
          kind: spec.kind,
          name: str(p[spec.nameField]) || 'Unnamed line',
          owner: str(p.Owner),
          province: str(p.StateProv),
          from: str(p.FrmState),
          to: str(p.ToState),
          toCountry: str(p.ToCountry),
          voltageKv: p.Voltage_kV == null ? '' : String(p.Voltage_kV),
          diameterMm: p.Diam_mm == null ? '' : String(p.Diam_mm),
          product: str(p.TypeProd),
          period: p.Period == null ? '' : String(p.Period),
          source: str(p.Source),
        },
      })
    }
    counts[spec.kind] = raw.length
  }
  return { features, counts }
}

async function pullPv() {
  const text = (await getBuf(PV_URL, 120000)).toString('latin1')
  const rows = parseCsv(text)
  const header = rows.find((row) => row[0] === 'Province' && row[2] === 'Mois')
  if (!header || !/latitude tilt/i.test(header[4] || '')) {
    fail('PV latitude-tilt column was not where the file used to keep it')
  }
  const sums = new Map()
  const seen = new Map()
  for (const row of rows) {
    const month = str(row[2]).split('/')[0]
    if (month !== 'Annual') continue
    const prov = PROVINCE_NAME[str(row[0]).split('/')[0]] || str(row[0]).split('/')[0]
    const muni = str(row[1])
    const value = Number(row[4])
    if (!prov || !muni || !Number.isFinite(value)) continue
    const key = `${prov}\t${muni}`
    if (seen.has(key)) fail(`Duplicate annual row for ${prov} / ${muni}`)
    seen.set(key, true)
    const bag = sums.get(prov) || { total: 0, n: 0 }
    bag.total += value
    bag.n += 1
    sums.set(prov, bag)
  }
  if (sums.size < 13) fail(`PV provinces look partial: ${sums.size}`)
  const provinces = {}
  for (const [name, bag] of [...sums.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const mean = Math.round((bag.total / bag.n) * 10) / 10
    if (mean < 700 || mean > 1600) {
      fail(`${name} mean ${mean} kWh/kWp is outside the annual latitude-tilt range. The month rows may have been summed twice.`)
    }
    provinces[name] = { meanKwhPerKwp: mean, municipalities: bag.n }
  }
  return provinces
}

async function hydroCount(layer) {
  const url = `${HYDRO}/${layer}/query?where=1%3D1&returnCountOnly=true&f=json`
  const data = JSON.parse((await getBuf(url, 60000)).toString('utf8'))
  const count = Number(data.count)
  if (!Number.isFinite(count) || count < 1) fail(`Hydrokinetic layer ${layer} count looks wrong`)
  return count
}

async function main() {
  const dry = process.argv.includes('--dry-run')
  const retrievedAt = new Date().toISOString()
  const [{ features, counts }, provinces, water, possible, ice] = await Promise.all([
    pullInfra(),
    pullPv(),
    hydroCount(1),
    hydroCount(2),
    hydroCount(3),
  ])

  const infra = { type: 'FeatureCollection', features }
  const pv = {
    schema: 'gab.stranded.pv-province.v1',
    retrievedAt,
    column: 'South-facing with latitude tilt',
    unit: 'kWh/kWp/year',
    method: 'Mean of the municipal Annual row. Months are not added on top of Annual. No municipality is pinned.',
    source: {
      title: 'Photovoltaic potential and solar resource maps of Canada',
      publisher: 'Natural Resources Canada',
      datasetUrl: 'https://open.canada.ca/data/en/dataset/8b434ac7-aedb-4698-90df-ba77424a551f',
      url: PV_URL,
      licence: 'Open Government Licence - Canada',
      licenceUrl: OGL,
    },
    provinces,
  }
  const atlas = {
    schema: 'gab.stranded.energy-atlas.v1',
    retrievedAt,
    infrastructure: {
      geometry: 'Point',
      counts,
      note: 'Canada rows on NACEI MapServer layers 1, 2 and 3. Each geometry is a point. The corridor is not published.',
      datasetUrl: 'https://open.canada.ca/data/en/dataset/aae6619f-f9f3-435d-bc32-42decd58b674',
      licence: 'Open Government Licence - Canada',
      licenceUrl: OGL,
    },
    hydrokinetic: {
      waterPolygons: water,
      possiblePolygons: possible,
      icePolygons: ice,
      ringsReturnedByQuery: false,
      painted: ['water', 'possible water'],
      geometryFile: 'public/data/hydrokinetic.geojson',
      geometrySource: 'Official shapefile. The query returns no rings. Nine thin polygons that collapsed during simplify were restored from the original rings, not from the community point.',
      notPainted: 'Ice polygons, and the community point repeated on every class.',
      datasetUrl: 'https://open.canada.ca/data/en/dataset/b102925f-aa0c-41ad-9cc6-979072fc4871',
      serviceUrl: HYDRO,
    },
    solarRasters: {
      service: 'NACEI energy_resource_potential_of_north_america_en',
      painted: ['layer 0 GHI', 'layer 1 DNI'],
      absentFromLiveService: ['wind speed', 'geothermal gradient'],
    },
    pv: { file: 'pv-province.json', provinces: Object.keys(provinces).length },
    provinces: {
      file: 'province-boundaries.geojson',
      features: 13,
      source: '2021 Census cartographic boundary, layer lpr_000b21s_e, generalized by the Statistics Canada map service. Parts under 100 km² were dropped. A province box is used only if this file fails to load.',
      datasetUrl: 'https://open.canada.ca/data/en/dataset/ef70dc3b-1069-4037-9bce-61f47e628a1d',
    },
    cer: {
      url: 'https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/market-snapshots/index.html',
      painted: false,
      why: 'Market trends and projections. No coordinates.',
    },
  }

  const summary = {
    infra: counts,
    hydro: { water, possible, ice },
    pv: Object.fromEntries(Object.entries(provinces).map(([name, row]) => [name, row.meanKwhPerKwp])),
  }
  if (dry) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }
  fs.writeFileSync(INFRA_OUT, JSON.stringify(infra))
  fs.writeFileSync(PV_OUT, JSON.stringify(pv, null, 2) + '\n')
  fs.writeFileSync(ATLAS_OUT, JSON.stringify(atlas, null, 2) + '\n')
  console.log(JSON.stringify(summary, null, 2))
  console.log(INFRA_OUT)
  console.log(PV_OUT)
  console.log(ATLAS_OUT)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
