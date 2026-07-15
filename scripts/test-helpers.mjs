/**
 * Real-path unit tests for shipped pure helpers.
 * Run: node --import tsx scripts/test-helpers.mjs
 *     or: npx tsx scripts/test-helpers.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {
  computeStrandedScore,
  explainStrandedScore,
} = require('../lib/scoring-shared.cjs')

// Dynamic import of TS sources via tsx loader
const { findPeerSites, peerSummary, findSimilarByEmission } = await import('../lib/peers.ts')
const { sensitivityTornado } = await import('../lib/sensitivity.ts')
const {
  bankPackCsv,
  bankPackMarkdown,
  bankPackTsv,
  bankPackJson,
} = await import('../lib/bank-pack.ts')
const { scoreTier, scoreTierClass, scoreTierColor, scorePercentile, scoreBadgeLabel, effectiveGridKm, hasStrongConnectivity } = await import('../lib/scoring.ts')
const { searchSites, searchSitesSimple, SITE_SEARCH_PRESETS } = await import('../lib/site-search.ts')
const { MISSION_TEMPLATES, sitesForMissionTemplate, getMissionTemplate } = await import('../lib/mission-templates.ts')
const { glossaryLookup, GLOSSARY } = await import('../lib/glossary.ts')
const { parseMapUrl, buildMapUrl, buildMapShareUrl, haversineKm } = await import('../lib/map-url-state.ts')
const {
  computeMapFilterStats,
  siteDensityTier,
  buildFilterAnnouncement,
} = await import('../lib/map-stats.ts')
const {
  boundsFromSites,
  boundsAreaKm2,
  sitesPer1000Km2,
  expandBounds,
  padBounds,
  boundsToFitTuple,
  boundsCenter,
  isValidBounds,
} = await import('../lib/map-bounds.ts')
const { formatCompactNumber } = await import('../lib/format-number.ts')
const {
  MAP_CSP_IMG_DOMAINS,
  MAP_CSP_CONNECT_DOMAINS,
  MAP_TILE_URL_PATTERNS,
  mapTileUrlsCoveredByCsp,
} = await import('../lib/map-csp.ts')


// --- score explain (shared cjs is production path) ---
const sample = {
  emission_rate_kg_day: 12000,
  province: 'Alberta',
  source_type: 'landfill_waste',
  confidence: 'high',
  reference_year: 2023,
}
const score = computeStrandedScore(sample)
const explained = explainStrandedScore(sample)
assert.equal(explained.score, score)
assert.ok(explained.factors.length >= 5)
assert.ok(explained.factors.every(f => f.label && typeof f.points === 'number'))

const measured = { ...sample, distance_to_grid_km: 5, internet_type: 'fiber' }
assert.equal(explainStrandedScore(measured).factors.find(f => f.id === 'proximity').inferred, false)
assert.equal(explainStrandedScore(sample).factors.find(f => f.id === 'proximity').inferred, true)

// tiers
assert.equal(scoreTier(90), 'elite')
assert.equal(scoreTier(70), 'high')
assert.equal(scoreTier(50), 'medium')
assert.equal(scoreTier(40), 'low')
assert.ok(scoreTierClass(90).includes('elite'))
assert.ok(scoreTierColor(90).startsWith('#'))

// --- real dataset ---
const geo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'stranded-sites-REAL.geojson'), 'utf8'))
assert.equal(geo.features.length, 2611)

function enrich(f) {
  const emission = f.properties.emission_rate_kg_day || 0
  return {
    type: 'Feature',
    id: String(f.properties.ghgrp_id || f.properties.id || Math.random()),
    properties: f.properties,
    geometry: f.geometry,
    emission,
    strandedScore: computeStrandedScore(f.properties),
    potentialDailyProfitCAD: Math.round(emission * 0.1),
    recommendedGenset: 'jenbacher316',
    maxGeneratorPowerKW: Math.round(emission / 10),
  }
}

const all = geo.features.map(enrich)
const elite = all.filter(s => s.strandedScore >= 85)
assert.ok(elite.length >= 10, `elite count ${elite.length}`)

const seed = all.sort((a, b) => b.strandedScore - a.strandedScore)[0]
const peers = findPeerSites(seed, all, 5)
assert.ok(Array.isArray(peers))
if (peers.length) {
  assert.ok(peers.every(p => p.properties.province === seed.properties.province))
  assert.ok(peers.every(p => p.id !== seed.id))
}
const summary = peerSummary(seed, peers)
assert.ok(summary.rankByScore >= 1)
const similar = findSimilarByEmission(seed, all, 3)
assert.ok(similar.length <= 3)

// sensitivity on real site — index must respond to difficulty (not power/carbon-only)
const tornado = sensitivityTornado(seed, 85000)
assert.ok(tornado.length >= 3)
assert.ok(tornado.every(r => r.param && typeof r.swing === 'number'))
// should be sorted by swing desc
for (let i = 1; i < tornado.length; i++) {
  assert.ok(tornado[i - 1].swing >= tornado[i].swing - 1e-9)
}
const diffRow = tornado.find(r => r.param === 'Network difficulty')
assert.ok(diffRow, 'Network difficulty row present')
assert.ok(
  diffRow.swing > 0,
  `difficulty swing must be > 0 (got ${diffRow.swing}; low=${diffRow.lowImpact} high=${diffRow.highImpact})`
)
assert.notEqual(diffRow.lowImpact, diffRow.highImpact, 'difficulty low/high impacts must differ')
// every scenario should move something on a real high-emission site
for (const row of tornado) {
  assert.ok(row.swing > 0, `${row.param} swing must be > 0, got ${row.swing}`)
}

// bank pack — real shipped functions
const packSites = [seed, ...peers.slice(0, 2)]
const csv = bankPackCsv(packSites, { liveBtcUsd: 90000 })
assert.ok(csv.includes('stranded_score'))
assert.ok(csv.includes(String(seed.strandedScore)))
assert.ok(csv.split('\n').length === packSites.length + 1)

const tsv = bankPackTsv(packSites, { liveBtcUsd: 90000 })
assert.ok(tsv.includes('\t'))
assert.ok(tsv.includes(String(seed.strandedScore)))

const md = bankPackMarkdown(packSites, all, { liveBtcUsd: 90000, title: 'Test Pack' })
assert.ok(md.includes('Why this score'))
assert.ok(md.includes(String(seed.strandedScore)))
assert.ok(md.includes('Test Pack'))

const json = bankPackJson([seed], { liveBtcUsd: 90000 })
assert.equal(json.siteCount, 1)
assert.equal(json.sites[0].score, seed.strandedScore)
assert.ok(json.sites[0].explain.factors.length >= 5)
assert.ok(json.sites[0].sensitivity.length >= 1)

// glossary
assert.ok(GLOSSARY.length >= 8)
assert.ok(glossaryLookup('LCOE')?.def)

// grid inference (Score v3 path) — must not treat missing distance as 999
const noGrid = { emission_rate_kg_day: 5000, province: 'Alberta', source_type: 'oil_gas_extraction' }
const withGrid = { ...noGrid, distance_to_grid_km: 5 }
const kmInf = effectiveGridKm(noGrid)
const kmMeas = effectiveGridKm(withGrid)
assert.ok(kmInf < 80 && kmInf > 3, `inferred km sane got ${kmInf}`)
assert.equal(kmMeas, 5)
assert.ok(kmInf !== 999)
assert.ok(typeof hasStrongConnectivity(noGrid) === 'boolean')

// percentile helpers
const allScores = all.map(s => s.strandedScore)
const pct = scorePercentile(seed.strandedScore, allScores)
assert.ok(pct >= 0 && pct <= 100, `percentile ${pct}`)
assert.ok(scoreBadgeLabel(96) === 'Top 5%')
assert.ok(scoreBadgeLabel(40) === '')

// site-search
assert.ok(SITE_SEARCH_PRESETS.length >= 4)
const searchHits = searchSites(all, seed.properties.name?.split(' ')[0] || 'Alberta', 5)
assert.ok(searchHits.length >= 1)
assert.ok(searchHits[0].site.id)
assert.ok(searchHits[0].matchType)
const simple = searchSitesSimple(all, seed.properties.province || 'Alberta', 3)
assert.ok(simple.length >= 1)

// mission-templates
assert.ok(MISSION_TEMPLATES.length >= 3)
const tpl = getMissionTemplate('elite-national')
assert.ok(tpl)
const missionSites = sitesForMissionTemplate(all, tpl)
assert.ok(missionSites.length >= 1)
assert.ok(missionSites.every(s => s.strandedScore >= tpl.minScore))

// map-stats
const mapStats = computeMapFilterStats(all.slice(0, 50))
assert.equal(mapStats.count, 50)
assert.ok(mapStats.avgScore > 0)
assert.ok(mapStats.totalEmissionKgDay > 0)
assert.ok(mapStats.provinces.length >= 1)
assert.equal(siteDensityTier(2611, 2611), 'full')
assert.equal(siteDensityTier(100, 2611), 'sparse')
const announce = buildFilterAnnouncement(100, 2611, {
  minScore: 65,
  minEmission: 0,
  maxEmission: 100000,
  provinceCount: 2,
  sourceCount: 0,
  hasRadius: false,
  gridLayer: false,
  internetLayer: false,
}, {
  base: '{shown} of {total} sites visible',
  score: s => `min score ${s}`,
  emission: (a, b) => `emission ${a}-${b}`,
  provinces: c => `${c} provinces`,
  sources: c => `${c} sources`,
  radius: 'radius on',
  grid: 'grid on',
  internet: 'internet on',
})
assert.ok(announce.includes('100'))
assert.ok(announce.includes('min score 65'))

// map-bounds
const bounds = boundsFromSites(all.slice(0, 20))
assert.ok(isValidBounds(bounds))
assert.ok(boundsAreaKm2(bounds) > 0)
const padded = padBounds(bounds)
assert.ok(padded.minLng <= bounds.minLng)
const tuple = boundsToFitTuple(bounds)
assert.equal(tuple.length, 2)
assert.ok(tuple[0][0] < tuple[1][0])
const center = boundsCenter(bounds)
assert.ok(center[0] > -140 && center[0] < -50)
const density = sitesPer1000Km2(20, bounds)
assert.ok(density != null && density >= 0)
assert.ok(expandBounds(bounds).minLng <= bounds.minLng)
assert.ok(!isValidBounds(null))

// map-url-state (#338, #339)
const params = new URLSearchParams('site=G10001&minScore=65&maxEmission=5000&sources=landfill_waste,oil_gas&provinces=Alberta,BC&radius=50&lat=53.5&lng=-113.5')
const parsed = parseMapUrl(params)
assert.equal(parsed.site, 'G10001')
assert.equal(parsed.minScore, 65)
assert.equal(parsed.maxEmission, 5000)
assert.deepEqual(parsed.sources, ['landfill_waste', 'oil_gas'])
assert.deepEqual(parsed.provinces, ['Alberta', 'BC'])
assert.equal(parsed.radius, 50)
const built = buildMapUrl({
  site: 'G10001',
  minScore: 65,
  maxEmission: 5000,
  sources: ['landfill_waste', 'oil_gas'],
  provinces: ['Alberta', 'BC'],
  radius: 50,
  lat: 53.5,
  lng: -113.5,
})
assert.ok(built.includes('minScore=65'))
assert.ok(built.includes('maxEmission=5000'))
assert.ok(built.includes('sources=landfill_waste%2Coil_gas'))
assert.ok(built.includes('provinces=Alberta%2CBC'))
const share = buildMapShareUrl({ minEmission: 100, sources: ['landfill_waste'] }, 'https://stranded.test')
assert.equal(share, 'https://stranded.test/map?minEmission=100&sources=landfill_waste')
const km = haversineKm(53.5, -113.5, 51.0, -114.0)
assert.ok(km > 200 && km < 400)

// format-number (#371)
assert.equal(formatCompactNumber(0), '0')
assert.equal(formatCompactNumber(450), '450')
assert.equal(formatCompactNumber(12500), '12.5K')
assert.equal(formatCompactNumber(2400000), '2.4M')
assert.equal(formatCompactNumber(1500000000), '1.5B')

// map-csp (#414) — tile URLs must be covered by CSP allowlist documented in lib/map-csp.ts
assert.ok(MAP_CSP_IMG_DOMAINS.length >= 6)
assert.ok(MAP_CSP_CONNECT_DOMAINS.includes('https://demotiles.maplibre.org'))
assert.ok(mapTileUrlsCoveredByCsp(MAP_TILE_URL_PATTERNS))
const headers = fs.readFileSync(path.join(__dirname, '..', 'public', '_headers'), 'utf8')
for (const domain of ['tile.openstreetmap.org', 'basemaps.cartocdn.com', 'demotiles.maplibre.org']) {
  assert.ok(headers.includes(domain), `_headers must allow ${domain}`)
}

// map-filters (#388–389)
const { validatePresetName, shouldShowFilterToast } = await import('../lib/map-filters.ts')
assert.deepEqual(validatePresetName('  elite AB  '), { ok: true, trimmed: 'elite AB' })
assert.deepEqual(validatePresetName('   '), { ok: false })
assert.equal(shouldShowFilterToast('dedupe-test'), true)
assert.equal(shouldShowFilterToast('dedupe-test'), false)

// pitch-metrics (v2.6.5)
const { provinceOpportunities, portfolioCaptureProjection } = await import('../lib/pitch-metrics.ts')
const mockStats = {
  provinces: [{ name: 'Alberta', count: 100, pct: 50 }, { name: 'Ontario', count: 50, pct: 25 }],
  totals: { emissionKgDay: 1000, totalGeneratorKW: 5000 },
  valueModel: { annualRevenueUsd: 1_000_000, annualBtc: 10 },
  siteCount: 150,
  impact: { co2eAvoided100PctTonnes: 20_000 },
}
const ranked = provinceOpportunities(mockStats)
assert.equal(ranked[0].name, 'Alberta')
assert.equal(ranked[0].estKgDay, 500)
const cap5 = portfolioCaptureProjection(mockStats, 5)
assert.equal(cap5.sites, 8)
assert.equal(cap5.co2eTonnes, 1000)

// map-url compare + sites-export + nostr (v2.7.0)
const compareUrl = buildMapUrl({ compare: ['G10161', 'G12147'] })
assert.ok(compareUrl.includes('compare=G10161'))
assert.deepEqual(parseMapUrl(new URLSearchParams('compare=G10161,G12147')).compare, ['G10161', 'G12147'])

const { exportSitesFullCsv } = await import('../lib/sites-export.ts')
const fullCsv = exportSitesFullCsv([])
assert.ok(fullCsv.startsWith('id,name,province'))

const { buildNostrShareUrl } = await import('../lib/nostr-share.ts')
assert.ok(buildNostrShareUrl('Stranded pitch', 'https://stranded.giveabit.io/pitch').includes('snort.social'))

console.log('test-helpers: ALL PASSED')
console.log(`  elite=${elite.length} top_score=${seed.strandedScore} peers=${peers.length} tornado=${tornado.length}`)
