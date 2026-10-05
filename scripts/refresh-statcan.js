#!/usr/bin/env node
/**
 * refresh-statcan.js
 *
 * Rebuild public/data/statcan-renewables.json from official Statistics Canada
 * tables. These tables have province-level totals but no plant coordinates, so
 * the map paints them as a province choropleth (never invented pins).
 *
 *   node scripts/refresh-statcan.js
 *   node scripts/refresh-statcan.js --dry-run
 *
 * Generation: table 25-10-0015-01 (MWh, latest full year).
 * Capacity:   table 25-10-0022-01 (MW, latest full year).
 */
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')
const https = require('https')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'data', 'statcan-renewables.json')

const GEN_URL = 'https://www150.statcan.gc.ca/n1/tbl/csv/25100015-eng.zip'
const CAP_URL = 'https://www150.statcan.gc.ca/n1/tbl/csv/25100022-eng.zip'

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
]

// Renewable generation types (MWh) -> canonical id
const GEN_RENEW = {
  'Hydraulic turbine': 'hydro',
  'Wind power turbine': 'wind',
  'Solar': 'solar',
  'Tidal power turbine': 'tidal',
  'Total electricity production from biomass': 'biomass',
}
// Renewable capacity types (kW) -> canonical id
const CAP_RENEW = {
  'Hydraulic turbine': 'hydro',
  'Wind power turbine': 'wind',
  'Solar power': 'solar',
  'Tidal power turbine': 'tidal',
  'Geothermal': 'geothermal',
}

function fail(msg) {
  const err = new Error(msg)
  err.fail = true
  throw err
}

function download(url, dest) {
  // curl is used because the StatCan server resets Node's https.get handshake
  // (ECONNRESET) while curl negotiates fine. Follows redirects, fails loud.
  execFileSync('curl', ['-sL', '--fail', '--max-time', '120', '-o', dest, url], { stdio: 'ignore' })
  if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) fail(`download empty: ${url}`)
}

function unzip(zipPath, destDir) {
  execFileSync('unzip', ['-o', zipPath, '-d', destDir], { stdio: 'ignore' })
}

/** Parse a StatCan CSV (UTF-8 BOM, quoted fields) into rows of objects. */
function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (!lines.length) return []
  const header = parseLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = parseLine(line)
    const row = {}
    header.forEach((h, i) => { row[h] = cells[i] != null ? cells[i] : '' })
    return row
  })
}

function parseLine(line) {
  const out = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQ = false
      else cur += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

function num(v) {
  const s = String(v).trim()
  if (s === '' || s === '..' || s === 'x') return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function aggregate(rows, renewMap, totalKey, year, isCapacity) {
  const totals = {}
  const all = {}
  for (const p of PROVINCES) {
    totals[p] = {}
    for (const k of Object.values(renewMap)) totals[p][k] = 0
    all[p] = 0
  }
  for (const r of rows) {
    if (r['Class of electricity producer'] !== 'Total all classes of electricity producer') continue
    if (r['GEO'] !== year && !r['REF_DATE'].startsWith(year)) continue
    if (!PROVINCES.includes(r['GEO'])) continue
    const t = r['Type of electricity generation']
    if (renewMap[t]) totals[r['GEO']][renewMap[t]] += num(r['VALUE'])
    if (t === totalKey) all[r['GEO']] += num(r['VALUE'])
  }
  return { totals, all }
}

async function main() {
  const dry = process.argv.includes('--dry-run')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'statcan-'))
  const genZip = path.join(tmp, 'gen.zip')
  const capZip = path.join(tmp, 'cap.zip')

  download(GEN_URL, genZip)
  download(CAP_URL, capZip)
  unzip(genZip, tmp)
  unzip(capZip, tmp)

  const genRows = parseCsv(path.join(tmp, '25100015.csv'))
  const capRows = parseCsv(path.join(tmp, '25100022.csv'))
  if (!genRows.length || !capRows.length) fail('StatCan CSV parse returned no rows')

  // Latest full year: generation is monthly (YYYY-MM), capacity is annual (YYYY).
  const genYear = [...new Set(genRows.map((r) => r['REF_DATE'].slice(0, 4)))].filter((y) => y < '2026').sort().pop()
  const capYear = [...new Set(capRows.map((r) => r['REF_DATE']))].filter((y) => y < '2025').sort().pop()
  if (!genYear || !capYear) fail('Could not determine latest full year')

  const gen = aggregate(genRows, GEN_RENEW, 'Total all types of electricity generation', genYear, false)
  const cap = aggregate(capRows, CAP_RENEW, 'Total installed capacity', capYear, true)

  const provinces = {}
  for (const p of PROVINCES) {
    provinces[p] = {
      generationMWh: Object.fromEntries(Object.entries(gen.totals[p]).map(([k, v]) => [k, Math.round(v)])),
      generationTotalMWh: Math.round(gen.all[p]),
      capacityMW: Object.fromEntries(Object.entries(cap.totals[p]).map(([k, v]) => [k, Math.round(v / 1000 * 10) / 10])),
      capacityTotalMW: Math.round(cap.all[p] / 1000 * 10) / 10,
    }
  }

  const out = {
    schema: 'gab.stranded.statcan-renewables.v1',
    retrievedAt: new Date().toISOString(),
    source: {
      generation: {
        title: 'Electric power generation, monthly generation by type of electricity',
        table: '25-10-0015-01', year: genYear, unit: 'MWh',
        url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510001501',
      },
      capacity: {
        title: 'Installed plants, annual generating capacity by type of electricity generation',
        table: '25-10-0022-01', year: capYear, unit: 'MW',
        url: 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=2510002201',
      },
      publisher: 'Statistics Canada / Canadian Centre for Energy Information',
      licence: 'Statistics Canada Open Licence',
      licenceUrl: 'https://www.statcan.gc.ca/en/reference/licence',
    },
    note: 'Province-level totals from official Statistics Canada tables. No plant coordinates exist in these tables, so this is painted as a province choropleth, not point pins.',
    provinces,
  }

  if (dry) {
    console.log(JSON.stringify({ genYear, capYear, provinces: Object.keys(provinces).length }, null, 2))
    return
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`wrote ${OUT} (gen ${genYear}, cap ${capYear}, ${Object.keys(provinces).length} provinces)`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
