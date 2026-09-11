#!/usr/bin/env node
/**
 * refresh-eccc-data.js — rebuild the canonical Stranded site dataset from the
 * live ECCC GHGRP CSVs.
 *
 * Sources (discovered at run time, never hard-coded):
 *   - Emissions by Gas    PDGES-GHGRP-GHGEmissionsGES-<year>-Present.csv
 *       → total CH4 + CH4 CO2e + total facility CO2e per facility per year.
 *   - Emissions by Source PDGES-GHGRP-GHGEmissionsSourcesGES-<year>-Present.csv
 *       → the fugitive breakdown (EC_VentingEmissions / EC_FlaringEmissions /
 *         EC_FugitiveEmissions) per facility per year.
 *
 * Discovery path: CKAN package_show(dataset) → ECCC Data Mart resource URL →
 * Data Mart `path_contents` API → resource filenames. If any hop changes shape
 * the script fails loudly instead of writing a half-empty dataset.
 *
 * Guarantees:
 *   - Additive schema only. Existing fields keep working for every consumer;
 *     new fields are added, never renamed.
 *   - Never silently drops a site. A facility missing from the newest year (or
 *     from the upstream file entirely) keeps its last known figures and says so
 *     via `last_reported_year`.
 *   - The site universe is preserved: upstream facilities that were never part
 *     of the curated Stranded set are counted and reported, not silently added
 *     or removed. Expansion is a product decision, not a data refresh.
 *
 * Usage:
 *   node scripts/refresh-eccc-data.js            # discover + download + rebuild
 *   node scripts/refresh-eccc-data.js --dry-run  # report only, do not write
 *   node scripts/refresh-eccc-data.js --cache-dir=/tmp/eccc  # reuse local CSV copies
 */
'use strict'

const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.join(__dirname, '..')
const CANONICAL = path.join(ROOT, 'data', 'stranded-sites-REAL.geojson')
const PUBLIC_COPIES = [
  path.join(ROOT, 'public', 'data', 'stranded-sites.geojson'),
  path.join(ROOT, 'public', 'data', 'stranded-sites-REAL.geojson'),
]

const CKAN_PACKAGE_SHOW = 'https://open.canada.ca/data/api/3/action/package_show'
const ECCC_API = 'https://data-donnees.az.ec.gc.ca/api'
const DATASET_ID = 'a8ba14b7-7f23-462a-bdbb-83b0ef629823'

const GAS_FILE_RE = /^PDGES-GHGRP-GHGEmissionsGES-\d{4}-Present\.csv$/i
const SOURCE_FILE_RE = /^PDGES-GHGRP-GHGEmissionsSourcesGES-\d{4}-Present\.csv$/i

/* ------------------------------------------------------------------ utils */

function fail(msg, detail) {
  const err = new Error(msg)
  if (detail) err.detail = detail
  throw err
}

function fileSize(p) {
  try { return fs.statSync(p).size } catch { return -1 }
}

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error(`Too many redirects for ${url}`))
    https
      .get(url, { headers: { 'User-Agent': 'stranded-refresh/1.0 (+https://stranded.giveabit.io)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return get(new URL(res.headers.location, url).href, redirects + 1).then(resolve, reject)
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        }
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (c) => { data += c })
        res.on('end', () => resolve(data))
      })
      .on('error', reject)
  })
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const go = (u, redirects) => {
      if (redirects > 5) return reject(new Error(`Too many redirects for ${u}`))
      https
        .get(u, { headers: { 'User-Agent': 'stranded-refresh/1.0 (+https://stranded.giveabit.io)' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            return go(new URL(res.headers.location, u).href, redirects + 1)
          }
          if (res.statusCode !== 200) {
            res.resume()
            return reject(new Error(`HTTP ${res.statusCode} downloading ${u}`))
          }
          const tmp = dest + '.part'
          const out = fs.createWriteStream(tmp)
          res.pipe(out)
          out.on('finish', () => {
            out.close(() => { fs.renameSync(tmp, dest); resolve(dest) })
          })
          out.on('error', reject)
        })
        .on('error', reject)
    }
    go(url, 0)
  })
}

/**
 * Minimal RFC4180 CSV parser (Node stdlib only — the project forbids new deps).
 * Handles quoted fields, escaped quotes and newlines inside quotes.
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += c
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(cell); cell = ''
    } else if (c === '\n') {
      row.push(cell); cell = ''; rows.push(row); row = []
    } else if (c === '\r') {
      /* swallow CRLF */
    } else {
      cell += c
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

function headerIndex(header, prefix, label) {
  const i = header.findIndex((h) => h.startsWith(prefix))
  if (i < 0) {
    fail(
      `Upstream CSV shape changed: no column starting with "${prefix}" (${label}).`,
      `Columns seen: ${header.slice(0, 12).join(' | ')}…`,
    )
  }
  return i
}

function num(v) {
  if (v == null) return null
  const t = String(v).trim()
  if (t === '') return null
  const n = Number(t.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/* -------------------------------------------------------------- discovery */

async function discoverFiles() {
  const ckanRaw = await get(`${CKAN_PACKAGE_SHOW}?id=${DATASET_ID}`)
  let ckan
  try { ckan = JSON.parse(ckanRaw) } catch (e) { fail('CKAN package_show did not return JSON', e.message) }
  if (!ckan.success || !ckan.result) fail('CKAN package_show returned success=false for ' + DATASET_ID)

  const martResource = (ckan.result.resources || []).find(
    (r) => /data-donnees[^/]*\.ec\.gc\.ca\/data\//.test(r.url || ''),
  )
  if (!martResource) {
    fail(
      'Could not find the ECCC Data Mart resource on the Open Canada dataset page.',
      `Resource URLs seen: ${(ckan.result.resources || []).map((r) => r.url).join(', ')}`,
    )
  }
  const m = martResource.url.match(/\.ec\.gc\.ca\/data\/([^?#]+)/)
  if (!m) fail('Could not parse the Data Mart directory path from resource URL', martResource.url)
  const dir = m[1].replace(/\/+$/, '')

  const listingRaw = await get(`${ECCC_API}/path_contents?path=${encodeURIComponent('/' + dir)}&lang=en`)
  let listing
  try { listing = JSON.parse(listingRaw) } catch (e) { fail('Data Mart path_contents did not return JSON', e.message) }
  const files = listing.path_contents || []
  if (!files.length) fail('Data Mart path_contents returned no files for path /' + dir)

  const gas = files.filter((f) => !f.is_directory && GAS_FILE_RE.test(f.name))
  const source = files.filter((f) => !f.is_directory && SOURCE_FILE_RE.test(f.name))
  if (gas.length !== 1) {
    fail(
      `Expected exactly one "Emissions by Gas" CSV, found ${gas.length}.`,
      `Candidates: ${files.map((f) => f.name).join(' | ')}`,
    )
  }
  if (source.length !== 1) {
    fail(
      `Expected exactly one "Emissions by Source" CSV, found ${source.length}.`,
      `Candidates: ${files.map((f) => f.name).join(' | ')}`,
    )
  }
  return {
    dir,
    gas: { name: gas[0].name, path: gas[0].path, url: `${ECCC_API}/file?path=${encodeURIComponent('/' + gas[0].path)}` },
    source: { name: source[0].name, path: source[0].path, url: `${ECCC_API}/file?path=${encodeURIComponent('/' + source[0].path)}` },
    modified: gas[0].last_modified,
  }
}

/* ------------------------------------------------------------- parse CSVs */

function buildGasIndex(rows) {
  const header = rows[0]
  const I = {
    id: headerIndex(header, 'GHGRP ID No.', 'facility id'),
    year: headerIndex(header, 'Reference Year', 'reporting year'),
    name: headerIndex(header, 'Facility Name', 'facility name'),
    city: headerIndex(header, 'Facility City', 'city'),
    province: headerIndex(header, 'Facility Province', 'province'),
    lat: headerIndex(header, 'Latitude', 'latitude'),
    lng: headerIndex(header, 'Longitude', 'longitude'),
    naics: headerIndex(header, 'Facility NAICS Code', 'NAICS code'),
    naicsDesc: headerIndex(header, 'English Facility NAICS Code Description', 'NAICS description'),
    company: headerIndex(header, 'Reporting Company Legal Name', 'company'),
    ch4: headerIndex(header, 'CH4 (tonnes)', 'CH4 tonnes'),
    ch4Co2e: headerIndex(header, 'CH4 (tonnes CO2e', 'CH4 CO2e tonnes'),
    totalCo2e: headerIndex(header, 'Total Emissions (tonnes CO2e)', 'total CO2e'),
  }

  const byId = new Map() // id -> Map(year -> record)
  const years = {}
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const id = (row[I.id] || '').trim()
    if (!id) continue
    const year = parseInt(row[I.year], 10)
    if (!Number.isFinite(year)) continue
    const ch4 = num(row[I.ch4])
    const rec = {
      year,
      name: (row[I.name] || '').trim(),
      city: (row[I.city] || '').trim(),
      province: (row[I.province] || '').trim(),
      lat: num(row[I.lat]),
      lng: num(row[I.lng]),
      naics: (row[I.naics] || '').trim(),
      naicsDesc: (row[I.naicsDesc] || '').trim(),
      company: (row[I.company] || '').trim(),
      ch4: ch4 == null ? null : ch4,
      ch4Co2e: num(row[I.ch4Co2e]),
      totalCo2e: num(row[I.totalCo2e]),
    }
    if (!byId.has(id)) byId.set(id, new Map())
    byId.get(id).set(year, rec)
    years[year] = (years[year] || 0) + 1
  }
  return { byId, years }
}

const FLUX_FIELD = { venting: 'venting', flaring: 'flaring', fugitive: 'fugitive' }
function classifySource(name) {
  const n = String(name || '').toLowerCase()
  if (n.includes('venting')) return FLUX_FIELD.venting
  if (n.includes('flaring')) return FLUX_FIELD.flaring
  if (n.includes('fugitive')) return FLUX_FIELD.fugitive
  return null
}

function buildSourceIndex(rows) {
  const header = rows[0]
  const I = {
    id: headerIndex(header, 'GHGRP ID No.', 'facility id'),
    year: headerIndex(header, 'Reference Year', 'reporting year'),
    source: headerIndex(header, 'Emission Source', 'emission source'),
    ch4: headerIndex(header, 'CH4 (tonnes)', 'CH4 tonnes'),
  }
  // id -> year -> { venting, flaring, fugitive, reported: <gross row count> }
  const byId = new Map()
  const categories = {}
  let unknownFluxLike = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const id = (row[I.id] || '').trim()
    if (!id) continue
    const year = parseInt(row[I.year], 10)
    if (!Number.isFinite(year)) continue
    const srcName = row[I.source]
    categories[srcName] = (categories[srcName] || 0) + 1

    if (!byId.has(id)) byId.set(id, new Map())
    const years = byId.get(id)
    if (!years.has(year)) years.set(year, { venting: 0, flaring: 0, fugitive: 0, reported: 0, fluxRows: 0 })
    const rec = years.get(year)
    rec.reported++

    const kind = classifySource(srcName)
    if (!kind) {
      if (/vent|flar|fugitive|leak/i.test(String(srcName))) unknownFluxLike++
      continue
    }
    rec.fluxRows++
    rec[kind] += num(row[I.ch4]) || 0
  }
  return { byId, categories, unknownFluxLike }
}

/* ------------------------------------------------------------------ build */

const TONNES_PER_YEAR_TO_KG_PER_DAY = 1000 / 365

function round2(n) { return Math.round(n * 100) / 100 }

/* ------------------------------------------------------------------ */
/* Flux coverage — the venting/flaring split is NOT universal          */
/* ------------------------------------------------------------------ */
/*
 * ECCC publishes EC_VentingEmissions / EC_FlaringEmissions / EC_FugitiveEmissions
 * for facilities that report a fugitive source. Landfill gas is reported under
 * EC_WasteEmissions instead, so most landfills have NO fugitive split upstream —
 * 88 of our 111 landfills. Rows missing for a facility therefore mean "not
 * reported for this source type", never "reports no venting or flaring".
 * We keep that distinction in the data so the UI cannot assert a falsehood.
 */

const FLUX_STATUS_UNKNOWN = 'unknown'        // no Emissions-by-Source rows at all
const FLUX_STATUS_NOT_REPORTED = 'not_reported' // rows exist, but no fugitive split for this facility
const FLUX_SCOPE_FUGITIVE = 'fugitive'       // facility reports the fugitive split
const FLUX_SCOPE_NOT_APPLICABLE = 'not-applicable'

function fluxStatus(venting, flaring) {
  const v = venting > 0
  const f = flaring > 0
  if (v && f) return 'both'
  if (v) return 'venting'
  if (f) return 'flaring'
  return 'none' // reports the fugitive category, with zero venting and zero flaring
}

function rebuild({ gas, source, canonical, dryRun }) {
  const features = canonical.features || []
  const before = summarise(features)

  const refreshed = features.map((f) => {
    const p = f.properties || {}
    const id = p.ghgrp_id || p.id
    const out = { ...p }
    const warnings = []

    const years = id ? gas.byId.get(id) : null
    let best = null
    let lastReportedYear = null
    if (years && years.size) {
      const sorted = [...years.keys()].sort((a, b) => b - a)
      lastReportedYear = sorted[0]
      best = years.get(lastReportedYear)
    }

    if (best) {
      const ch4 = best.ch4 == null ? (p.ch4_tonnes_year || 0) : best.ch4
      out.ch4_tonnes_year = round2(ch4)
      out.emission_rate_kg_day = Math.round(ch4 * TONNES_PER_YEAR_TO_KG_PER_DAY * 100) / 100
      const co2e = best.ch4Co2e != null ? best.ch4Co2e : ch4 * 28
      out.ch4_co2e_tonnes = round2(co2e)
      if (best.totalCo2e != null) out.total_ghg_co2e_tonnes = round2(best.totalCo2e)
      out.reference_year = lastReportedYear
      if (!p.city && best.city) out.city = best.city
      if (!p.province && best.province) out.province = best.province
      if (!p.company && best.company) out.company = best.company
      if (!p.naics_code && best.naics) out.naics_code = best.naics
      if (!p.naics_description && best.naicsDesc) out.naics_description = best.naicsDesc
      const [lng, lat] = (f.geometry && f.geometry.coordinates) || [null, null]
      if ((lng == null || lat == null || (lng === 0 && lat === 0)) && best.lng != null && best.lat != null) {
        f.geometry = { type: 'Point', coordinates: [best.lng, best.lat] }
      }
    } else {
      // Never drop a site: keep the last known figures, make the age visible.
      lastReportedYear = p.reference_year || null
      warnings.push('absent from upstream gas file')
    }

    out.last_reported_year = lastReportedYear

    // Flux breakdown (venting / flaring) from the Emissions-by-Source file.
    // Only meaningful for facilities that actually report a fugitive source.
    const srcYears = id ? source.byId.get(id) : null
    let fluxYear = null
    let flux = null
    let hasSourceRows = false
    if (srcYears && srcYears.size) {
      hasSourceRows = true
      const fluxYears = [...srcYears.entries()].filter(([, v]) => v.fluxRows > 0).map(([y]) => y)
      if (fluxYears.length) {
        fluxYear = Math.max(...fluxYears)
        flux = srcYears.get(fluxYear)
      }
    }
    const venting = flux ? flux.venting : 0
    const flaring = flux ? flux.flaring : 0
    out.flux_scope = flux ? FLUX_SCOPE_FUGITIVE : FLUX_SCOPE_NOT_APPLICABLE
    // null (not 0) when the split is not reported — 0 would read as "has none".
    out.ch4_vented_kg_day = flux ? Math.round(venting * TONNES_PER_YEAR_TO_KG_PER_DAY * 100) / 100 : null
    out.ch4_flared_kg_day = flux ? Math.round(flaring * TONNES_PER_YEAR_TO_KG_PER_DAY * 100) / 100 : null
    out.flux_status = flux
      ? fluxStatus(venting, flaring)
      : hasSourceRows ? FLUX_STATUS_NOT_REPORTED : FLUX_STATUS_UNKNOWN
    out.flare_share_pct = flux && venting + flaring > 0
      ? Math.round((flaring / (venting + flaring)) * 1000) / 10
      : null
    out.flux_reference_year = fluxYear
    if (!flux) {
      warnings.push(hasSourceRows
        ? 'no venting/flaring split published for this facility (source type not covered)'
        : 'no Emissions-by-Source rows')
    }

    if (warnings.length) out._refresh_warnings = warnings
    else delete out._refresh_warnings

    return { ...f, properties: out }
  })

  const after = summarise(refreshed)

  const upstreamIds = new Set(gas.byId.keys())
  const ourIds = new Set(features.map((f) => f.properties.ghgrp_id || f.properties.id))
  const outsideUniverse = [...upstreamIds].filter((id) => !ourIds.has(id))
  const orphanIds = [...ourIds].filter((id) => id && !upstreamIds.has(id))

  const meta = {
    ...(canonical.metadata || {}),
    title: canonical.metadata?.title || 'Canada Methane Emitters — ECCC GHGRP',
    source: 'Environment and Climate Change Canada — Greenhouse Gas Reporting Program',
    source_url: 'https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823',
    description:
      'Facility-level methane (CH4) emissions for Canadian facilities reporting ≥10kt CO2e/year. Includes coordinates, company, source type, annual CH4 in tonnes, last reported year, and the venting/flaring split where ECCC publishes it.',
    total_features: refreshed.length,
    generated: new Date().toISOString().slice(0, 10),
    eccc_files: { gas: gas.fileName, source: source.fileName, upstream_modified: gas.modified || null },
    newest_reference_year: after.newestYear,
    notes:
      `Primary data from ECCC GHGRP. last_reported_year is the facility's most recent reporting year; ` +
      `ch4_vented_kg_day / ch4_flared_kg_day / flux_status / flare_share_pct come from the ECCC "Emissions by Source" ` +
      `file (EC_VentingEmissions / EC_FlaringEmissions, flux_reference_year says which year). ` +
      `IMPORTANT: that venting/flaring split only exists for facilities reporting a fugitive source — ` +
      `flux_scope='not-applicable' with flux_status='not_reported' means ECCC publishes no split for this facility ` +
      `(landfill gas is reported under "Waste"), NOT that the site does not flare. Never render a venting/flaring ` +
      `claim for those sites. Sites absent from the newest year keep their last known figures — check ` +
      `last_reported_year before treating a figure as current.`,
  }

  const out = { type: 'FeatureCollection', metadata: meta, features: refreshed }

  const report = {
    before,
    after,
    outsideUniverse,
    orphanIds,
    files: { gas: gas.fileName, source: source.fileName, modified: gas.modified },
  }

  if (!dryRun) {
    const json = JSON.stringify(out, null, 2)
    fs.writeFileSync(CANONICAL, json)
    for (const copy of PUBLIC_COPIES) {
      fs.mkdirSync(path.dirname(copy), { recursive: true })
      fs.writeFileSync(copy, json)
    }
    report.bytes = json.length
  }

  return report
}

function summarise(features) {
  const s = {
    count: features.length,
    years: {},
    flux: { venting: 0, flaring: 0, both: 0, none: 0, not_reported: 0, unknown: 0 },
    fluxScope: { fugitive: 0, 'not-applicable': 0 },
    bySourceType: {},
    stale: 0,
    with2024: 0,
    newestYear: 0,
    battenClass: 0,
    totalCh4: 0,
    highConfidence: 0,
    topSite: null,
  }
  for (const f of features) {
    const p = f.properties || {}
    const y = p.last_reported_year || p.reference_year || null
    if (y) {
      s.years[y] = (s.years[y] || 0) + 1
      if (y > s.newestYear) s.newestYear = y
      if (y < 2023) s.stale++
      if (y >= 2024) s.with2024++
    }
    const st = p.flux_status || 'unknown'
    if (s.flux[st] != null) s.flux[st]++
    const scope = p.flux_scope || 'not-applicable'
    s.fluxScope[scope] = (s.fluxScope[scope] || 0) + 1
    const t = p.source_type || 'unknown'
    if (!s.bySourceType[t]) s.bySourceType[t] = { sites: 0, fugitiveSplit: 0, flaring: 0 }
    s.bySourceType[t].sites++
    if (scope === 'fugitive') s.bySourceType[t].fugitiveSplit++
    if (st === 'flaring' || st === 'both') s.bySourceType[t].flaring++
    const em = p.emission_rate_kg_day || 0
    s.totalCh4 += p.ch4_tonnes_year || 0
    if (p.confidence === 'high') s.highConfidence++
    if (em >= 36000) {
      s.battenClass++
      if (!s.topSite || em > s.topSite.emission) {
        s.topSite = {
          id: p.ghgrp_id || p.id,
          name: p.name,
          province: p.province,
          emission_kg_day: em,
          ch4_tonnes_year: p.ch4_tonnes_year,
          last_reported_year: p.last_reported_year,
          flux_status: p.flux_status,
        }
      }
    }
  }
  s.totalCh4 = Math.round(s.totalCh4)
  return s
}

/* ------------------------------------------------------------------- main */

function parseArgs(argv) {
  const args = { dryRun: false, cacheDir: null }
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true
    else if (a.startsWith('--cache-dir=')) args.cacheDir = a.split('=')[1]
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const canonical = JSON.parse(fs.readFileSync(CANONICAL, 'utf8'))

  console.log('ECCC refresh — canonical:', CANONICAL)
  const found = await discoverFiles()
  console.log(`✓ discovered upstream (last modified ${found.modified})`)
  console.log(`    gas    : ${found.gas.name}`)
  console.log(`    source : ${found.source.name}`)

  const cacheDir = args.cacheDir || path.join(require('os').tmpdir(), 'stranded-eccc')
  fs.mkdirSync(cacheDir, { recursive: true })

  const paths = {
    gas: path.join(cacheDir, found.gas.name),
    source: path.join(cacheDir, found.source.name),
  }

  for (const kind of ['gas', 'source']) {
    const local = paths[kind]
    const remote = found[kind]
    if (args.cacheDir && fileSize(local) > 0) {
      console.log(`· reusing cached ${kind} CSV (${fileSize(local)} bytes)`)
      continue
    }
    console.log(`· downloading ${remote.name} …`)
    await download(remote.url, local)
    console.log(`  ${fileSize(local)} bytes → ${local}`)
  }

  console.log('· parsing CSVs …')
  const gasRows = parseCsv(fs.readFileSync(paths.gas, 'utf8'))
  const sourceRows = parseCsv(fs.readFileSync(paths.source, 'utf8'))
  const gas = buildGasIndex(gasRows)
  const source = buildSourceIndex(sourceRows)
  console.log(`  gas    : ${gasRows.length - 1} rows, ${gas.byId.size} facilities`)
  console.log(`  source : ${sourceRows.length - 1} rows, ${source.byId.size} facilities`)
  if (source.unknownFluxLike > 0) {
    console.warn(`  ⚠ ${source.unknownFluxLike} emissions-by-source rows look flux-related but were not classified:`,
      Object.keys(source.categories).filter((k) => /vent|flar|fugitive|leak/i.test(k)).join(', '))
  }

  const report = rebuild({
    gas: { byId: gas.byId, fileName: found.gas.name, modified: found.modified },
    source: { byId: source.byId, fileName: found.source.name },
    canonical,
    dryRun: args.dryRun,
  })

  printReport(report, args)
  return report
}

function printReport(report, args) {
  const { before, after } = report
  const row = (k, a, b) => console.log(`  ${k.padEnd(34)} ${String(a).padStart(10)}  →  ${String(b).padStart(10)}`)
  console.log('\n=== BEFORE → AFTER ===')
  row('site count', before.count, after.count)
  row('newest reference year', before.newestYear, after.newestYear)
  row('sites with 2024 data', before.with2024, after.with2024)
  row('stale sites (<2023)', before.stale, after.stale)
  row('total CH4 (t/yr)', before.totalCh4, after.totalCh4)
  row('Batten-class (>=36000 kg/d)', before.battenClass, after.battenClass)
  console.log('\n=== FLUX STATUS (after) ===')
  for (const k of ['venting', 'flaring', 'both', 'none', 'not_reported', 'unknown']) {
    console.log(`  ${k.padEnd(14)} ${after.flux[k]}`)
  }
  console.log(`  fugitive split reported for ${after.fluxScope.fugitive} sites · not reported for ${after.fluxScope['not-applicable']}`)
  console.log('\n=== FLUX COVERAGE BY SOURCE TYPE ===')
  console.log('  source_type            sites  with-split  flaring')
  for (const [t, v] of Object.entries(after.bySourceType).sort((a, b) => b[1].sites - a[1].sites)) {
    console.log(`  ${t.padEnd(22)} ${String(v.sites).padStart(5)} ${String(v.fugitiveSplit).padStart(9)} ${String(v.flaring).padStart(8)}`)
  }
  const lf = after.bySourceType.landfill_waste
  if (lf) {
    const beforeLf = before.bySourceType.landfill_waste || { sites: 0, flaring: 0 }
    console.log(`\n  LANDFILLS: ${lf.sites} sites · venting/flaring split published for ${lf.fugitiveSplit} · ` +
      `asserted flaring ${beforeLf.flaring} → ${lf.flaring} (before → after). ` +
      `The rest are "not_reported", NOT "not flaring" — landfill gas is reported under ECCC "Waste".`)
  }
  console.log('\n=== RECENCY HISTOGRAM (after) ===')
  Object.entries(after.years).sort((a, b) => b[0] - a[0]).forEach(([y, n]) => console.log(`  ${y}: ${n}`))
  if (after.topSite) {
    console.log('\n=== TOP BATTEN-CLASS SITE ===')
    console.log(' ', JSON.stringify(after.topSite))
  }
  console.log('\n=== UPSTREAM SCOPE ===')
  console.log(`  upstream facilities        : ${report.outsideUniverse.length + after.count}`)
  console.log(`  in the curated site set    : ${after.count}`)
  console.log(`  upstream but not curated   : ${report.outsideUniverse.length} (NOT added — product scope decision)`)
  console.log(`  our ids absent upstream    : ${report.orphanIds.length} (kept with last known figures)`)
  if (args.dryRun) console.log('\n(dry run — nothing written)')
  else console.log(`\n✓ wrote canonical + ${PUBLIC_COPIES.length} public copies (${report.bytes} bytes)`)
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n✗ ECCC refresh FAILED — dataset left untouched')
    console.error('  ' + err.message)
    if (err.detail) console.error('  ' + err.detail)
    process.exit(1)
  })
}

module.exports = { parseCsv, buildGasIndex, buildSourceIndex, discoverFiles }
