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
    potentialDailyProfitUsd: Math.round(emission * 0.1),
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
// Glyph PBFs are self-hosted under /fonts/ (same-origin, covered by font-src 'self'),
// so the map no longer depends on the demo-server font host.
assert.ok(!MAP_CSP_CONNECT_DOMAINS.includes('https://demotiles.maplibre.org'))
assert.ok(mapTileUrlsCoveredByCsp(MAP_TILE_URL_PATTERNS))
const headers = fs.readFileSync(path.join(__dirname, '..', 'public', '_headers'), 'utf8')
for (const domain of ['tile.openstreetmap.org', 'basemaps.cartocdn.com']) {
  assert.ok(headers.includes(domain), `_headers must allow ${domain}`)
}
assert.ok(headers.includes("font-src 'self'"), "_headers font-src must keep 'self' (self-hosted glyph PBFs)")

// map-filters (#388–389) + data-recency / flux filters
const {
  validatePresetName, shouldShowFilterToast,
  matchesRecency, matchesFlux, recencyBreakdown, fluxBreakdown,
  countActiveMapFilters, buildMapFilterChips,
  isFlaringSite, isVentingSite, fluxNotReported,
  fluxScopeNotApplicable, FLUX_NO_SPLIT_LABEL, FLUX_NO_SPLIT_HINT,
} = await import('../lib/map-filters.ts')
assert.deepEqual(validatePresetName('  elite AB  '), { ok: true, trimmed: 'elite AB' })
assert.deepEqual(validatePresetName('   '), { ok: false })
assert.equal(shouldShowFilterToast('dedupe-test'), true)
assert.equal(shouldShowFilterToast('dedupe-test'), false)

// new filters count as active, and appear as removable chips
const baseState = {
  minEmission: 0, maxEmission: 100_000, selectedProvinces: new Set(), selectedSources: new Set(),
  minScore: 0, onlyMissionSites: false, gridLayer: false, internetLayer: false,
  radiusFilter: null, recency: 'any', flux: 'any',
}
assert.equal(countActiveMapFilters(baseState), 0)
assert.equal(countActiveMapFilters({ ...baseState, recency: 'older' }), 1)
assert.equal(countActiveMapFilters({ ...baseState, recency: '2024', flux: 'flaring' }), 2)
const chipHandlers = {
  resetEmission: () => {}, clearScore: () => {}, clearProvinces: () => {}, clearSources: () => {},
  clearMissionOnly: () => {}, clearGrid: () => {}, clearInternet: () => {}, clearRadius: () => {},
  clearRecency: () => {}, clearFlux: () => {},
}
const chips = buildMapFilterChips(
  { ...baseState, recency: 'older', flux: 'flaring' },
  { emission: 'Emission', score: 'Score', provinces: 'Provinces', sources: 'Sources', missionOnly: 'Mission', grid: 'Grid', internet: 'Internet', radius: 'Radius', recency: 'Reported', flux: 'Flux' },
  chipHandlers,
)
assert.equal(chips.length, 2)
assert.ok(chips.find(c => c.id === 'recency')?.label.includes('2022 or older'))
assert.ok(chips.find(c => c.id === 'flux')?.label.includes('Already flaring'))

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

// dashboard-metrics (v2.8.0)
const {
  deploymentReadiness,
  provinceRevenueLeaders,
  emissionTierItems,
  confidenceBreakdown,
  liveModelRevenue,
  captureAtPct,
} = await import('../lib/dashboard-metrics.ts')

const dashStats = {
  siteCount: 100,
  provinceCount: 3,
  provinces: [
    { name: 'Alberta', count: 60, pct: 60, estRevenueUsd: 600_000 },
    { name: 'Ontario', count: 30, pct: 30, estRevenueUsd: 300_000 },
    { name: 'BC', count: 10, pct: 10, estRevenueUsd: 100_000 },
  ],
  sourceTypes: [{ name: 'oil_gas_extraction', count: 50, pct: 50 }],
  gensetRecommendations: [],
  emissionTiers: { mega: 5, large: 10, medium: 20, small: 40, micro: 25 },
  confidenceCounts: { high: 40, medium: 35, low: 25 },
  totals: {
    emissionKgDay: 5000,
    avgEmissionKgDay: 50,
    ch4TonnesYear: 1800,
    avgStrandedScore: 62,
    totalGeneratorKW: 250_000,
    highScoreSites: 25,
  },
  impact: { co2eAvoided5PctTonnes: 500, co2eAvoided100PctTonnes: 10_000, sitesAt5Pct: 5, methaneGwp: 28 },
  valueModel: { defaultBtcUsd: 80_000, roughDailyBtc: 1, annualBtc: 10, annualRevenueUsd: 800_000, note: 'test' },
  topSites: [],
  routes: {},
  urls: { production: '', github: '', dataSource: '' },
}

const readiness = deploymentReadiness(dashStats)
assert.ok(readiness.score >= 0 && readiness.score <= 100)
assert.ok(readiness.factors.length === 4)
assert.ok(readiness.label.length > 0)

const revLeaders = provinceRevenueLeaders(dashStats, 2)
assert.equal(revLeaders.length, 2)
assert.equal(revLeaders[0].name, 'Alberta')
assert.equal(revLeaders[0].revenueUsd, 600_000)

const tiers = emissionTierItems(dashStats)
assert.equal(tiers.length, 5)
assert.equal(tiers[0].key, 'small')
assert.equal(tiers[0].count, 40)
assert.ok(tiers.every(t => t.pct > 0))

const conf = confidenceBreakdown(dashStats)
assert.equal(conf.length, 3)
assert.equal(conf.find(c => c.level === 'high').count, 40)
assert.equal(conf.find(c => c.level === 'high').pct, 40)

const revLive = liveModelRevenue(dashStats, 100_000)
assert.equal(revLive, 1_000_000)

const cap10 = captureAtPct(dashStats, 10, 80_000)
assert.equal(cap10.sites, 10)
assert.equal(cap10.co2eTonnes, 1000)
assert.equal(cap10.revenueUsd, 80_000)
assert.equal(cap10.btcYr, 1)

const capClamped = captureAtPct(dashStats, 150, 80_000)
assert.equal(capClamped.sites, 100)

// status-health (v2.8.1)
const {
  aggregateStatusHealth,
  EXPECTED_GEOJSON_FEATURE_COUNT,
} = await import('../lib/status-health.ts')

assert.equal(EXPECTED_GEOJSON_FEATURE_COUNT, 2611)

const healthy = aggregateStatusHealth({
  liveStats: { ...dashStats, version: '2.8.1', generatedAt: new Date().toISOString() },
  liveStatsFetchOk: true,
  geojsonFeatureCount: 2611,
  expectedVersion: '2.8.1',
  statusJsonVersion: '2.8.1',
})
assert.equal(healthy.overall, 'operational')
assert.equal(healthy.checks.length, 4)
assert.ok(healthy.score >= 90)
assert.equal(healthy.checks.find(c => c.id === 'geojson-size').status, 'pass')
assert.equal(healthy.checks.find(c => c.id === 'version-match').status, 'pass')

const degraded = aggregateStatusHealth({
  liveStats: { ...dashStats, version: '2.8.0', generatedAt: new Date().toISOString() },
  liveStatsFetchOk: true,
  geojsonFeatureCount: 2611,
  expectedVersion: '2.8.1',
  statusJsonVersion: '2.8.0',
})
assert.equal(degraded.checks.find(c => c.id === 'version-match').status, 'warn')

const critical = aggregateStatusHealth({
  liveStatsFetchOk: false,
  geojsonFeatureCount: 2500,
})
assert.equal(critical.overall, 'critical')
assert.equal(critical.checks.find(c => c.id === 'live-stats-fetch').status, 'fail')
assert.equal(critical.checks.find(c => c.id === 'geojson-size').status, 'fail')

// compare-export + bookmarks-export (v2.8.2)
const { exportCompareCsv, buildCompareMetricRows } = await import('../lib/compare-export.ts')
const { exportBookmarksCsv } = await import('../lib/bookmarks-export.ts')

const emptyCompare = exportCompareCsv({ a: null, b: null, c: null })
assert.ok(emptyCompare.includes('metric'))

const mockSite = (id, profit) => ({
  id,
  strandedScore: 80,
  potentialDailyProfitUsd: profit,
  emission: 1000,
  recommendedGenset: 'jenbacher316',
  maxGeneratorPowerKW: 500,
  properties: { name: `Site ${id}`, province: 'Alberta', source_type: 'oil_gas_extraction', confidence: 'high' },
  geometry: { type: 'Point', coordinates: [-114, 53] },
})

const compareSites = { a: mockSite('G10161', 5000), b: mockSite('G12147', 3000), c: null }
const compareCsv = exportCompareCsv(compareSites)
assert.ok(compareCsv.includes('site_a'))
assert.ok(compareCsv.includes('Daily profit (USD'))
assert.ok(compareCsv.includes('5000'))

const metricRows = buildCompareMetricRows(compareSites)
assert.ok(metricRows.some(r => r.label === 'Stranded Score'))
assert.equal(metricRows.find(r => r.label.startsWith('Daily profit (USD'))?.values.a, '5000')

const bookmarkCsv = exportBookmarksCsv([
  { ...mockSite('G10161', 5000), tag: 'diligence' },
])
assert.ok(bookmarkCsv.startsWith('id,name,province,tag'))
assert.ok(bookmarkCsv.includes('diligence'))
assert.ok(bookmarkCsv.includes('G10161'))

// home-metrics (v2.8.3)
const {
  formatEmissionCompact,
  homeKpiItems,
  readinessMini,
  websiteSchemaExtras,
} = await import('../lib/home-metrics.ts')

assert.equal(formatEmissionCompact(12400), '12.4K kg/day')
assert.equal(formatEmissionCompact(850), '850 kg/day')

const mini = readinessMini(dashStats)
assert.ok(mini.score >= 0 && mini.score <= 100)
assert.ok(mini.label.length > 0)

const kpis = homeKpiItems(dashStats, 100_000)
assert.equal(kpis.length, 5)
assert.equal(kpis[0].key, 'sites')
assert.equal(kpis[0].value, '100')
assert.ok(kpis.some(k => k.key === 'readiness'))

const schema = websiteSchemaExtras(dashStats)
assert.equal(schema.numberOfItems, 100)
assert.ok(schema.about.description.includes('deploy readiness'))

// --- pure helpers batch (data-quality, monte-carlo, gas-decline, amortization, locale, carbon, score-confidence) ---
const {
  assessSiteDataQuality,
  qualityGrade,
} = await import('../lib/data-quality.ts')
const { runMonteCarloRoi } = await import('../lib/monte-carlo.ts')
const { projectGasDecline, cumulativeCapture } = await import('../lib/gas-decline.ts')
const { amortizeLoan, exportAmortizationCsv } = await import('../lib/amortization.ts')
const {
  formatCurrency,
  formatNumber,
  formatPercent,
  localeFromStranded,
} = await import('../lib/locale-format.ts')
const {
  methaneToCo2eTonnes,
  carbonValueUsd,
  avoidedMethaneValue,
} = await import('../lib/carbon-overlay.ts')
const { scoreConfidenceBand } = await import('../lib/score-confidence.ts')

// data-quality
const dqEmpty = assessSiteDataQuality({})
assert.ok(dqEmpty.flags.length >= 4)
assert.ok(dqEmpty.score < 100)
assert.equal(qualityGrade(90), 'A')
assert.equal(qualityGrade(75), 'B')
assert.equal(qualityGrade(55), 'C')
assert.equal(qualityGrade(20), 'D')
assert.equal(dqEmpty.grade, qualityGrade(dqEmpty.score))

const dqGood = assessSiteDataQuality({
  emission_rate_kg_day: 5000,
  province: 'Alberta',
  source_type: 'oil_gas_extraction',
  confidence: 'high',
  distance_to_grid_km: 12,
  reference_year: 2023,
  name: 'Test Site',
  company: 'Acme',
  geometry: { coordinates: [-114, 53] },
})
assert.ok(dqGood.score >= 85, `good site score ${dqGood.score}`)
assert.equal(dqGood.grade, 'A')

const dqZeroCoords = assessSiteDataQuality({
  emission_rate_kg_day: 100,
  province: 'AB',
  source_type: 'landfill',
  confidence: 'medium',
  name: 'Zero',
  geometry: { coordinates: [0, 0] },
})
assert.ok(dqZeroCoords.flags.some(f => f.id === 'missing_coords'), '0,0 coords flagged')

// monte-carlo — deterministic seed
const mc1 = runMonteCarloRoi(1000, { trials: 500, seed: 99, sampleLimit: 10 })
const mc2 = runMonteCarloRoi(1000, { trials: 500, seed: 99, sampleLimit: 10 })
assert.equal(mc1.p50, mc2.p50)
assert.equal(mc1.mean, mc2.mean)
assert.equal(mc1.p10, mc2.p10)
assert.equal(mc1.p90, mc2.p90)
assert.equal(mc1.trials, 500)
assert.ok(mc1.p10 <= mc1.p50 && mc1.p50 <= mc1.p90)
assert.equal(mc1.samples?.length, 10)
const mcOther = runMonteCarloRoi(1000, { trials: 500, seed: 1, sampleLimit: 0 })
assert.notEqual(mc1.p50, mcOther.p50)
assert.equal(mcOther.samples, undefined)

// gas-decline
const curve = projectGasDecline(1000, 10, 3)
assert.equal(curve.length, 4) // years 0..3
assert.equal(curve[0].emission, 1000)
assert.equal(curve[0].revenueFactor, 1)
assert.ok(Math.abs(curve[1].emission - 900) < 0.1)
assert.ok(curve[3].revenueFactor < curve[1].revenueFactor)
const cap = cumulativeCapture(100, 0, 2)
assert.equal(cap, 100 * 365 * 2)
const capDecline = cumulativeCapture(100, 50, 2)
assert.ok(capDecline < cap)

// amortization
const loan = amortizeLoan(100_000, 8, 5)
assert.equal(loan.schedule.length, 5)
assert.ok(loan.annualPayment > 0)
assert.ok(loan.totalInterest > 0)
assert.equal(loan.schedule[loan.schedule.length - 1].balance, 0)
const zeroRate = amortizeLoan(10_000, 0, 4)
assert.equal(zeroRate.annualPayment, 2500)
const csvLoan = exportAmortizationCsv(loan.schedule)
assert.ok(csvLoan.startsWith('year,payment,interest,principal,balance'))
assert.equal(csvLoan.trim().split('\n').length, 6)

// locale-format
assert.equal(localeFromStranded('en'), 'en-CA')
assert.equal(localeFromStranded('fr'), 'fr-CA')
assert.equal(localeFromStranded('de'), 'de-DE')
assert.equal(localeFromStranded('es'), 'es-ES')
const cad = formatCurrency(123456, 'en-CA', 'CAD')
assert.ok(cad.includes('123') || cad.includes('123456'))
assert.ok(formatNumber(1234.5, 'en-CA').length > 0)
assert.ok(formatPercent(0.125, 'en').includes('12'))
assert.ok(formatPercent(12.5, 'en').includes('12'))

// carbon-overlay
assert.equal(methaneToCo2eTonnes(10, 28), 280)
assert.equal(carbonValueUsd(100, 45), 4500)
const avoided = avoidedMethaneValue(1000, 50, 28) // 365 t CH4/yr * 28 * 50
assert.ok(avoided > 0)
assert.equal(avoided, carbonValueUsd(methaneToCo2eTonnes(365, 28), 50))

// score-confidence (object form + positional form)
const bandHigh = scoreConfidenceBand({
  score: 80,
  confidence: 'high',
  distance_to_grid_km: 5,
  dataQualityScore: 90,
})
assert.equal(bandHigh.band, 'high')
assert.ok(bandHigh.low >= 0 && bandHigh.high <= 100)
assert.ok(bandHigh.low <= 80 && bandHigh.high >= 80)

const bandLow = scoreConfidenceBand(50, { confidence: 'low' }, 40)
assert.equal(bandLow.band, 'low')
assert.ok(bandLow.high - bandLow.low >= bandHigh.high - bandHigh.low)

const bandClamp = scoreConfidenceBand({ score: 2, confidence: 'low' })
assert.equal(bandClamp.low, 0)
const bandTop = scoreConfidenceBand({ score: 99, confidence: 'low' })
assert.equal(bandTop.high, 100)

// --- fleet templates (editable miner stack) ---
const {
  ASIC_MACHINES,
  MINER_STACK_PRESETS,
  DEFAULT_FLEET_ASSUMPTIONS,
  siteGasCeilingKw,
  minerCeiling,
  capFleetToSite,
  rescaleToSite,
  unusedCapacity,
  encodeFleet,
  decodeFleet,
  fleetPresetForSourceType,
  referenceSiteForPreset,
} = await import('../lib/fleet-template.ts')
const { computeGeneratorPower, GENSET_DATA } = await import('../lib/sites.ts')
const { GENSET_DATA: GD } = await import('../lib/sites.ts')
const { computeGeneratorPower: prebuildComputeGeneratorPower } = require('../scripts/lib/methane-power.js')

const keeleProps = geo.features.find(f => String(f.properties.ghgrp_id) === 'G10161').properties
const keele = { id: 'G10161', emission: keeleProps.emission_rate_kg_day, properties: keeleProps }
assert.equal(keeleProps.name, 'Keele Valley Landfill')
// Numbers move whenever the ECCC dataset is refreshed, so assert the *contract*, not a snapshot:
// emission kg/day is the annual CH4 tonnes spread over the year, at the site's freshest filing.
assert.ok(Math.abs(keeleProps.emission_rate_kg_day - (keeleProps.ch4_tonnes_year * 1000) / 365) < 0.5)
assert.equal(keeleProps.reference_year, keeleProps.last_reported_year)
assert.ok(keeleProps.last_reported_year >= 2023, `Keele should still be filing, got ${keeleProps.last_reported_year}`)

// presets must key on source types that really exist in the dataset
const datasetSourceTypes = new Set(geo.features.map(f => f.properties.source_type))
assert.equal(MINER_STACK_PRESETS.length, 5)
assert.equal(new Set(MINER_STACK_PRESETS.map(p => p.id)).size, 5)
const PRESET_IDS = ['landfill-basic', 'oilgas-modular', 'wastewater-small', 'coalmine-large', 'pulp-power']
for (const id of PRESET_IDS) assert.ok(MINER_STACK_PRESETS.some(p => p.id === id), `missing preset ${id}`)
for (const preset of MINER_STACK_PRESETS) {
  assert.ok(preset.sourceTypes.length > 0, `${preset.id} needs source types`)
  for (const st of preset.sourceTypes) assert.ok(datasetSourceTypes.has(st), `${preset.id}: '${st}' not in dataset`)
  assert.ok(ASIC_MACHINES.some(a => a.id === preset.asicId), `${preset.id} asicId`)
  assert.ok(preset.gensets.length > 0 && GENSET_DATA[preset.gensets[0].gensetId], `${preset.id} gensets`)
  assert.ok(['auto', 'manual'].includes(preset.mode))
  assert.equal(typeof preset.assumptions.btcPriceUsd, 'number')
}
assert.equal(fleetPresetForSourceType('landfill_waste').id, 'landfill-basic')
assert.equal(fleetPresetForSourceType('coal_mining').id, 'coalmine-large')
assert.equal(fleetPresetForSourceType('oil_gas_extraction').id, 'oilgas-modular')
assert.equal(fleetPresetForSourceType('pulp_paper').id, 'pulp-power')
assert.equal(fleetPresetForSourceType('power_generation').id, 'wastewater-small')
assert.equal(fleetPresetForSourceType('nope'), undefined)
assert.equal(fleetPresetForSourceType(''), undefined)

// gas ceiling = sum of genset capacity at this site's gas (same function the panel uses)
const oneJ316 = siteGasCeilingKw(keele, [{ gensetId: 'jenbacher316', count: 1 }])
assert.equal(oneJ316, 850 * 0.9) // Installed unit cap, not the whole site's gas-equivalent potential.

// CROSS-CHECK: the prebuild script uses a plain-JS copy of this conversion
// (scripts/lib/methane-power.js, no TS loader available there). If the two ever
// diverge, every published portfolio figure drifts from the app's own maths —
// which is exactly how a 24× error reached the pitch page. Fail loudly here.
for (const kg of [250, 1000, 5000, 21810, 56014]) {
  const a = computeGeneratorPower(kg, 'jenbacher316')
  const b = prebuildComputeGeneratorPower(kg)
  assert.ok(Math.abs(a - b) < 1e-6, `methane→power diverged at ${kg} kg/day: app ${a} vs prebuild ${b}`)
}

// PHYSICAL BOUND — energy conservation, for the whole dataset.
// A site's claimed generator power can never exceed the thermal energy its
// methane carries (efficiency ≤ 100%), and should sit in a sane band above it.
// This is the check that would have caught the 24× error on day one: the old
// value was 8.4× the thermal maximum, i.e. an efficiency of 840%.
//   thermal kW = kg/day × 50 MJ/kg ÷ 3.6 ÷ 24
const effBand = []
for (const f of geo.features) {
  const em = f.properties.emission_rate_kg_day || 0
  if (!em) continue
  const thermalKw = (em * 50) / 3.6 / 24
  const claimedKw = computeGeneratorPower(em, 'jenbacher316')
  const eff = claimedKw / thermalKw
  effBand.push(eff)
  assert.ok(eff <= 1.0,
    `${f.properties.name}: claims ${Math.round(claimedKw)} kW from ${Math.round(thermalKw)} kW of methane (efficiency ${(eff * 100).toFixed(0)}%) — units are wrong`)
  assert.ok(eff >= 0.20,
    `${f.properties.name}: only ${(eff * 100).toFixed(0)}% of the methane's energy is claimed — implausibly low`)
}
const minEff = Math.min(...effBand), maxEff = Math.max(...effBand)
console.log(`  methane→power efficiency band across ${effBand.length} sites: ${(minEff * 100).toFixed(1)}%–${(maxEff * 100).toFixed(1)}%`)
const twoJ316 = siteGasCeilingKw(keele, [{ gensetId: 'jenbacher316', count: 2 }])
assert.ok(Math.abs(twoJ316 - 2 * oneJ316) < 1e-6)
assert.equal(siteGasCeilingKw(keele, []), 0)
assert.equal(minerCeiling(1000, 3500), 285)
assert.equal(minerCeiling(0, 3500), 0)
assert.equal(minerCeiling(1000, 0), 0)

// cap: auto fills to the ceiling, manual can never exceed it
const autoTpl = {
  id: 'landfill-basic',
  name: 'Landfill — Basic Capture',
  sourceTypes: ['landfill_waste'],
  asicId: 's21xp',
  minerCount: 0,
  mode: 'auto',
  gensets: [{ gensetId: 'jenbacher316', count: 1 }],
  assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
}
const ceiling = minerCeiling(oneJ316, 4050)
assert.equal(capFleetToSite(autoTpl, keele).minerCount, ceiling)
assert.equal(capFleetToSite({ ...autoTpl, mode: 'manual', minerCount: ceiling * 3 }, keele).minerCount, ceiling)
assert.equal(capFleetToSite({ ...autoTpl, mode: 'manual', minerCount: 50 }, keele).minerCount, 50)

// unusedCapacity: under-filled stack leaves real gas on the table, full stack leaves none
const halfFleet = capFleetToSite({ ...autoTpl, mode: 'manual', minerCount: Math.floor(ceiling / 2) }, keele)
const unused = unusedCapacity(keele, halfFleet)
assert.ok(unused.unusedKw > 0)
assert.ok(Math.abs(unused.unusedKgPerDay - 3785.76 / 2) < 25, `expected ~half one unit's fuel capacity, got ${unused.unusedKgPerDay}`)
assert.ok(unused.unconvertedKgPerDay > unused.unusedKgPerDay, 'equipment-limited gas must remain unconverted')
assert.ok(Math.abs(unused.unusedTPerYear - (unused.unusedKgPerDay * 365) / 1000) < 1e-9)
const fullFleet = unusedCapacity(keele, capFleetToSite(autoTpl, keele))
// At the ceiling the only remainder is the floor() of the last machine, so the
// unused gas must be LESS THAN ONE MINER'S SHARE (emission / ceiling). The old
// bound here was a hard "< 1 kg/day", which only held because the methane→kW
// conversion was inflated 24× — it made each miner's share ~0.8 kg/day. The
// invariant is relative, not absolute; do not re-hardcode a round number.
const perMinerKg = keeleProps.emission_rate_kg_day / ceiling
assert.ok(fullFleet.unusedKw < 4.05 && fullFleet.unusedKgPerDay < perMinerKg, JSON.stringify({ ...fullFleet, perMinerKg }))
assert.deepEqual(unusedCapacity(keele, { ...autoTpl, gensets: [] }), { unusedKw: 0, unusedKgPerDay: 0, unusedTPerYear: 0, consumedKgPerDay: 0, unconvertedKgPerDay: keele.emission, capacityLimitedKgPerDay: keele.emission })

// readable share params — no base64
const shareTpl = { ...autoTpl, minerCount: 468, gensets: [{ gensetId: 'jenbacher316', count: 2 }] }
const query = encodeFleet(shareTpl)
assert.equal(query, 'miners=468&asic=s21xp&gensets=j316:2&mode=auto&tpl=landfill-basic')
const decoded = decodeFleet(new URLSearchParams(query))
assert.equal(decoded.id, 'landfill-basic')
assert.equal(decoded.name, 'Landfill — Basic Capture')
assert.equal(decoded.asicId, 's21xp')
assert.equal(decoded.minerCount, 468)
assert.equal(decoded.mode, 'auto')
assert.deepEqual(decoded.gensets, [{ gensetId: 'jenbacher316', count: 2 }])
assert.equal(encodeFleet(decoded), query)
assert.deepEqual(decoded.assumptions, DEFAULT_FLEET_ASSUMPTIONS)

assert.equal(decodeFleet(new URLSearchParams('')), null)
assert.equal(decodeFleet(new URLSearchParams('site=G10161&minScore=40')), null)

const manualTpl = {
  ...shareTpl,
  id: 'pulp-power',
  mode: 'manual',
  minerCount: 1234,
  gensets: [{ gensetId: 'jenbacher316', count: 2 }, { gensetId: 'mobile250', count: 1 }],
}
const manualQuery = encodeFleet(manualTpl)
assert.ok(manualQuery.includes('gensets=j316:2,m250:1'), manualQuery)
const manualBack = decodeFleet(new URLSearchParams(manualQuery))
assert.deepEqual(manualBack.gensets, manualTpl.gensets)
assert.equal(manualBack.minerCount, 1234)
assert.equal(manualBack.mode, 'manual')
// miners without a mode are an explicit count, not auto
assert.equal(decodeFleet(new URLSearchParams('miners=99&asic=s21')).mode, 'manual')
// junk tokens fall back instead of throwing
const junk = decodeFleet(new URLSearchParams('tpl=nope&asic=nope&gensets=zzz:3'))
assert.equal(junk.id, 'nope')
assert.ok(ASIC_MACHINES.some(a => a.id === junk.asicId))
assert.deepEqual(junk.gensets, [{ gensetId: 'jenbacher316', count: 1 }])

// rescaleToSite keeps the genset mix shape, scaled to the target site's gas
const smallSite = { emission: 500, properties: { source_type: 'landfill_waste' } }
const bigSite = { emission: 50000, properties: { source_type: 'landfill_waste' } }
const shapeTpl = { ...manualTpl, minerCount: 10, gensets: [{ gensetId: 'jenbacher316', count: 2 }, { gensetId: 'mobile250', count: 2 }] }
const rescaled = rescaleToSite(shapeTpl, smallSite, bigSite)
assert.deepEqual(rescaled.gensets.map(g => g.gensetId), ['jenbacher316', 'mobile250'])
assert.ok(rescaled.gensets[0].count > shapeTpl.gensets[0].count)
assert.equal(rescaled.mode, 'manual')
assert.ok(rescaled.minerCount <= minerCeiling(siteGasCeilingKw(bigSite, rescaled.gensets), 4050))
assert.deepEqual(rescaleToSite(shapeTpl, bigSite, bigSite).gensets, shapeTpl.gensets)
const autoRescaled = rescaleToSite({ ...shapeTpl, mode: 'auto', minerCount: 0 }, bigSite, smallSite)
assert.equal(autoRescaled.minerCount, minerCeiling(siteGasCeilingKw(smallSite, autoRescaled.gensets), 4050))
// median-gas match, not the first or min
const midSite = { emission: 20000, properties: { source_type: 'landfill_waste' } }
assert.equal(referenceSiteForPreset(MINER_STACK_PRESETS[0], [smallSite, bigSite, midSite]).emission, 20000)
assert.equal(referenceSiteForPreset(MINER_STACK_PRESETS[0], [{ emission: 400, properties: { source_type: 'refinery' } }]), null)

// map URL carries the fleet additively; nothing else changes
const fleetMapUrl = buildMapUrl({ site: 'G10161', fleet: manualTpl })
assert.ok(fleetMapUrl.startsWith('/map?site=G10161&'))
assert.ok(fleetMapUrl.includes('miners=1234'))
const parsedFleet = parseMapUrl(new URLSearchParams(fleetMapUrl.split('?')[1]))
assert.equal(parsedFleet.site, 'G10161')
assert.equal(parsedFleet.fleet.minerCount, 1234)
assert.deepEqual(parsedFleet.fleet.gensets, manualTpl.gensets)
assert.equal(parsedFleet.fleet.mode, 'manual')
assert.equal(buildMapUrl({ site: 'G10161', minScore: 40, provinces: ['Alberta'] }), '/map?site=G10161&minScore=40&provinces=Alberta')
const noFleet = parseMapUrl(new URLSearchParams('site=G10161&minScore=40&sources=landfill_waste'))
assert.equal(noFleet.fleet, undefined)
assert.equal(noFleet.minScore, 40)

// --- named fleet templates (localStorage guarded — no crash on server / corrupt key) ---
const {
  saveNamedFleet,
  listNamedFleets,
  deleteNamedFleet,
  fleetBlockData,
  fleetBlockMarkdown,
  estimateFleetPaybackDays,
} = await import('../lib/fleet-template.ts')

// No localStorage in Node — list must return [] and never throw
assert.deepEqual(listNamedFleets(), [])
assert.equal(saveNamedFleet('x', autoTpl), null) // no-op without localStorage? we guard: returns null when storage unavailable is acceptable
assert.equal(deleteNamedFleet('nope'), false)

// In-memory localStorage shim to exercise the real functions end-to-end
const storageShim = new Map()
globalThis.localStorage = {
  getItem: k => storageShim.has(k) ? storageShim.get(k) : null,
  setItem: (k, v) => { storageShim.set(k, String(v)) },
  removeItem: k => { storageShim.delete(k) },
}
try {
  const saved = saveNamedFleet('Keele Valley build', autoTpl)
  assert.ok(saved && saved.id && saved.name === 'Keele Valley build')
  assert.equal(listNamedFleets().length, 1)
  assert.deepEqual(listNamedFleets()[0].template.gensets, autoTpl.gensets)
  // persistence survives a re-read (simulates page reload)
  const reread = listNamedFleets()
  assert.equal(reread[0].name, 'Keele Valley build')
  // reject junk shapes
  assert.equal(saveNamedFleet('bad', { ...autoTpl, gensets: [{ gensetId: 'zzz', count: 1 }] }), null)
  assert.equal(listNamedFleets().length, 1)
  // delete works
  assert.equal(deleteNamedFleet(saved.id), true)
  assert.equal(listNamedFleets().length, 0)
  assert.equal(deleteNamedFleet(saved.id), false)
} finally {
  delete globalThis.localStorage
}

// Corrupt the key by hand — must not throw, must return [] (no white-screen)
globalThis.localStorage = { getItem: () => '{not json', setItem: () => {}, removeItem: () => {} }
try {
  assert.deepEqual(listNamedFleets(), [])
} finally {
  delete globalThis.localStorage
}

// --- fleet export block (additive to exports, no regression without it) ---
const exportTpl = capFleetToSite({ ...autoTpl, minerCount: 0 }, keele)
assert.ok(exportTpl.minerCount > 0)
const block = fleetBlockData({ template: exportTpl, site: keele })
assert.ok(block.minerCount > 0)
assert.ok(block.asicName)
assert.ok(block.gasCeilingKw > 0)
assert.ok(block.gensetLabel.includes('Jenbacher'))
assert.ok(block.capturedPct > 0)
// Contract 4.3: no explicit session payback -> "unavailable", never a stale estimate
assert.equal(block.paybackDays, null, 'no explicit session payback -> unavailable')
assert.equal(estimateFleetPaybackDays({ template: exportTpl, site: keele }), null)
const mdBlock = fleetBlockMarkdown({ template: exportTpl, site: keele })
assert.ok(mdBlock.includes('Fleet template'))
assert.ok(mdBlock.includes(block.asicName))
assert.ok(mdBlock.includes('unavailable'))
// payback override wins over estimate (the live session model is the only source of truth)
const payback = estimateFleetPaybackDays({ template: exportTpl, site: keele, paybackDays: 123 })
assert.equal(payback, 123)
assert.equal(estimateFleetPaybackDays({ template: exportTpl, site: keele, paybackDays: 0 }), 0)

// exports carry the fleet block when present, and are unchanged when absent
const withFleet = bankPackMarkdown(packSites, all, { liveBtcUsd: 90000, title: 'Test Pack', fleet: { template: exportTpl, site: keele } })
assert.ok(withFleet.includes('### Fleet template'))
assert.ok(withFleet.includes(block.asicName))
assert.ok(withFleet.includes('Why this score')) // structure preserved
const jsonWithFleet = bankPackJson([seed], { liveBtcUsd: 90000, fleet: { template: exportTpl, site: keele } })
assert.ok(jsonWithFleet.fleet && jsonWithFleet.fleet.minerCount > 0)

// case study carries the block
const { buildCaseStudyMarkdown } = await import('../lib/case-study.ts')
const csWithFleet = buildCaseStudyMarkdown({ id: seed.id, name: seed.properties.name, fleet: { template: exportTpl, site: keele } }, 90000)
assert.ok(csWithFleet.includes('## Fleet template'))
const csPlain = buildCaseStudyMarkdown({ id: seed.id, name: seed.properties.name }, 90000)
assert.ok(!csPlain.includes('## Fleet template'))

// term sheet carries the block
const { sketchTermSheet } = await import('../lib/term-sheet.ts')
const tsWithFleet = sketchTermSheet({ projectName: 'P', siteCount: 1, totalCapexCad: 1000000, fleet: { template: exportTpl, site: keele } })
assert.ok(tsWithFleet.markdown.includes('Fleet template'))
const tsPlain = sketchTermSheet({ projectName: 'P', siteCount: 1, totalCapexCad: 1000000 })
assert.ok(!tsPlain.markdown.includes('Fleet template'))

// --- site cockpit (lib/cockpit.ts + lib/fleet-model.ts) ---------------------
const {
  minersPerBlock, minerBlocks, blockScaleLabel, capacityModel, satsPerDay,
  formatPayback, ventingComparison, dataRecencyBadge, fluxBadge, hashpriceRead,
  hoverTeaser, METHANE_GWP100,
} = await import('../lib/cockpit.ts')
const { computeFleetModel, NETWORK_ESTIMATE_BTC_PER_TH_DAY } = await import('../lib/fleet-model.ts')

// the cockpit model is the panel's model: same inputs -> same money
const keeleModel = computeFleetModel({
  site: keele,
  gensets: [{ gensetId: 'jenbacher316', count: 1 }],
  asic: { id: 's21xp', name: 'Antminer S21 XP', hashrate_ths: 300, power_w: 4050, cost_cad: 8500 },
  machineCount: ceiling,
  overclockPercent: 0,
  btcPrice: 85000,
  btcPrices: { usd: 85000, eur: 78000, jpy: 12500000, gbp: 65000, cad: 115000 },
  uptimePercent: 95,
  poolFeePercent: 1.5,
  maintenanceAnnualPercent: 5,
  revenuePerThPerDayBtc: 0.0000009,
  fixedSetupCostCad: 25000,
  debtPercent: 60,
  interestRate: 8,
})
// hand-check of the shipped arithmetic at the cockpit defaults
const expectedDailyBtc = 300 * ceiling * 0.0000009 * (1 - 0.015) * 0.95
assert.ok(Math.abs(keeleModel.effectiveDailyBtc - expectedDailyBtc) < 1e-15)
assert.ok(Math.abs(keeleModel.totalPowerKw - (ceiling * 4050) / 1000) < 1e-9)
assert.equal(keeleModel.ceilingMiners, ceiling)
assert.equal(satsPerDay(keeleModel.effectiveDailyBtc), Math.round(expectedDailyBtc * 1e8))

// the exports and the model must quote the same build
const hudBlock = fleetBlockData({ template: { ...autoTpl, minerCount: ceiling }, site: keele })
assert.equal(hudBlock.minerCount, keeleModel.effectiveMachineCount)
assert.ok(Math.abs(hudBlock.totalPowerKw - keeleModel.totalPowerKw) < 1e-9)
assert.equal(hudBlock.ceilingMiners, keeleModel.ceilingMiners)

// the hover teaser is the same ceiling as the cockpit (teach before the click)
const teaser = hoverTeaser(keele, 85000)
assert.equal(teaser.miners, ceiling)
assert.ok(Math.abs(teaser.usdPerDay - expectedDailyBtc * 85000) < 1e-6)
assert.equal(hoverTeaser({ properties: { emission_rate_kg_day: 0 } }, 85000).miners, 0)

// capacity bar: never past the gas ceiling, labels agree with the model
const full = capacityModel({ count: ceiling, ceilingMiners: ceiling, gasCeilingKw: oneJ316, asicWatts: 4050 })
assert.equal(full.filledPct, 100)
assert.equal(full.sparePct, 0)
assert.equal(full.atCeiling, true)
assert.equal(full.spareMiners, 0)
assert.ok(Math.abs(full.usedKw - keeleModel.totalPowerKw) < 1e-9)
const over = capacityModel({ count: ceiling * 3, ceilingMiners: ceiling, gasCeilingKw: oneJ316, asicWatts: 4050 })
assert.equal(over.miners, ceiling)
assert.equal(over.filledPct, 100)
const half = capacityModel({ count: Math.floor(ceiling / 2), ceilingMiners: ceiling, gasCeilingKw: oneJ316, asicWatts: 4050 })
assert.ok(half.filledPct > 49 && half.filledPct < 51)
assert.equal(Math.round(half.filledPct + half.sparePct), 100)
assert.equal(half.spareMiners, ceiling - Math.floor(ceiling / 2))
assert.equal(half.sparePct > 0, true)
// no gas → no miners, never a negative or NaN bar
const empty = capacityModel({ count: 10, ceilingMiners: 0, gasCeilingKw: 0, asicWatts: 4050 })
assert.equal(empty.ceilingMiners, 0)
assert.equal(empty.filledPct, 0)

// block scale is always labelled and never explodes the DOM
for (const n of [0, 1, 7, 60, 61, 468, 1524, 9999, 100000]) {
  const b = minerBlocks(n)
  assert.ok(b.perBlock >= 1)
  assert.ok(b.blocks + (b.partial > 0 ? 1 : 0) <= 61, `${n} -> ${JSON.stringify(b)}`)
  assert.ok(b.blocks * b.perBlock + Math.round(b.partial * b.perBlock) <= Math.max(n, 1))
  assert.ok(blockScaleLabel(n).startsWith('1 block ='))
}
assert.equal(minersPerBlock(468), 10)
assert.equal(blockScaleLabel(468), '1 block = 10 miners')

// venting comparison — the two numbers the Batten story is made of
const vent = ventingComparison({
  siteEmissionKgDay: 56013.9,
  capturedKgPerDay: 50000,
  dailyProfitFiat: 1234.5,
  unusedKgPerDay: 6013.9,
})
assert.equal(vent.extraUsdPerDay, 1234.5)
assert.ok(Math.abs(vent.co2eAvoidedTonnesPerYear - ((50000 * 365) / 1000) * METHANE_GWP100) < 1e-6)
assert.ok(Math.abs(vent.ventedTPerYear - (6013.9 * 365) / 1000) < 1e-9)
assert.ok(vent.capturedFraction > 0.89 && vent.capturedFraction < 0.9)

// honesty badges: render from real fields, degrade to null when absent
const recency = dataRecencyBadge(keeleProps)
assert.ok(recency && recency.label.includes('ECCC') && recency.label.includes(String(keeleProps.last_reported_year)))
assert.equal(recency.detail, 'high confidence')
assert.equal(recency.stale, false)
assert.equal(dataRecencyBadge({}), null)
assert.equal(dataRecencyBadge(null), null)
// a pre-2023 filing must announce itself instead of looking current
const staleBadge = dataRecencyBadge({ data_source: 'ECCC-GHGRP', last_reported_year: 2011, confidence: 'high' })
assert.ok(staleBadge && staleBadge.stale === true && staleBadge.tier === 'low')
assert.ok(staleBadge.detail.includes('stale'))
assert.equal(fluxBadge(keeleProps).label, 'Currently flaring') // Keele filed 77 t CH4 to flare in the refreshed data
assert.equal(fluxBadge({ flux_status: 'Currently flaring' }).label, 'Currently flaring')
assert.equal(fluxBadge({ flux_status: 'venting' }).tone, 'vent')
assert.equal(fluxBadge({ flux_status: 'both' }).label, 'Flaring + venting')
assert.equal(fluxBadge({ flux_status: 'none' }), null)
assert.equal(fluxBadge({ flux_status: 'unknown' }), null)

// recency + flux filters select the right sites against the live dataset
assert.equal(matchesRecency({ last_reported_year: 2024 }, '2024'), true)
assert.equal(matchesRecency({ last_reported_year: 2011 }, '2024'), false)
assert.equal(matchesRecency({ last_reported_year: 2011 }, 'older'), true)
assert.equal(matchesRecency({ reference_year: 2023 }, '2023'), true)
assert.equal(matchesRecency({}, 'older'), false)
assert.equal(matchesFlux({ flux_status: 'both' }, 'flaring'), true)
assert.equal(matchesFlux({ flux_status: 'both' }, 'venting'), true)
assert.equal(matchesFlux({ flux_status: 'venting' }, 'flaring'), false)
assert.equal(matchesFlux({ ch4_flared_kg_day: 12 }, 'flaring'), true)
const rBreak = recencyBreakdown(geo.features)
assert.equal(rBreak.y2024 + rBreak.y2023 + rBreak.older + rBreak.unknown, geo.features.length)
assert.ok(rBreak.y2024 > 1000 && rBreak.newestYear >= 2024, JSON.stringify(rBreak))
const fBreak = fluxBreakdown(geo.features)
assert.equal(fBreak.flaring + fBreak.ventingOnly + fBreak.noneReported + fBreak.uncovered, geo.features.length)
assert.equal(fBreak.covered + fBreak.uncovered, geo.features.length)
assert.equal(fBreak.covered, geo.features.filter(f => f.properties.flux_scope === 'fugitive').length)
assert.ok(fBreak.flaring > 100 && fBreak.both > 0 && fBreak.both <= fBreak.flaring, JSON.stringify(fBreak))

// flux coverage: an uncovered landfill must never be reported as flaring or venting
const essex = geo.features.find(f => String(f.properties.ghgrp_id) === 'G10365').properties
assert.equal(essex.flux_scope, 'not-applicable')
assert.equal(essex.flux_status, 'not_reported')
assert.equal(essex.ch4_flared_kg_day, null)
assert.equal(isFlaringSite(essex), false)
assert.equal(isVentingSite(essex), false)
assert.equal(fluxNotReported(essex), true)
assert.equal(matchesFlux(essex, 'flaring'), false)
assert.equal(fluxBadge(essex), null)
const landfillSites = geo.features.filter(f => f.properties.source_type === 'landfill_waste')
const landfillCovered = landfillSites.filter(f => f.properties.flux_scope === 'fugitive').length
assert.ok(landfillCovered < landfillSites.length, 'most landfills have no published fugitive split')
assert.equal(
  landfillSites.filter(f => ['not_reported', 'unknown'].includes(f.properties.flux_status)).length,
  landfillSites.length - landfillCovered,
  'every landfill without a published split must say not_reported/unknown, never "none"')
assert.equal(landfillSites.filter(f => ['flaring', 'both'].includes(f.properties.flux_status)).length > 0, true)

// silence must be legible: a no-split site gets an explicit "no split" state,
// and the state must never be reachable for a site that does have a split
assert.equal(fluxScopeNotApplicable(essex), true)
assert.equal(FLUX_NO_SPLIT_LABEL, 'No venting/flaring split')
assert.ok(FLUX_NO_SPLIT_HINT.includes('Waste'))
const landfillNoSplit = landfillSites.filter(f => fluxScopeNotApplicable(f.properties))
assert.ok(landfillNoSplit.length > 80, `most landfills carry no fugitive split: ${landfillNoSplit.length}`)
for (const f of landfillNoSplit) {
  const props = f.properties
  assert.equal(fluxNotReported(props), true, `${props.ghgrp_id} must read as not-reported`)
  assert.equal(isFlaringSite(props), false, `${props.ghgrp_id} must never assert flaring`)
  assert.equal(isVentingSite(props), false, `${props.ghgrp_id} must never assert venting`)
  assert.equal(matchesFlux(props, 'flaring'), false)
  assert.equal(matchesFlux(props, 'venting'), false)
  assert.equal(fluxBadge(props), null, `${props.ghgrp_id} shows no flare/vent badge`)
}
// the big real-world flarers must be in that no-claim set, not silently "not flaring"
for (const id of ['G10365', 'G10343', 'G10337', 'G10443']) {
  const f = geo.features.find(x => String(x.properties.ghgrp_id) === id)
  assert.ok(f, `site ${id} present`)
  assert.equal(fluxScopeNotApplicable(f.properties), true, `${id} is not-applicable`)
}
// a covered site keeps its real split and is the only place flaring may be asserted
const keeleSplitProps = geo.features.find(f => String(f.properties.ghgrp_id) === 'G10161').properties
assert.equal(fluxScopeNotApplicable(keeleSplitProps), false)
assert.equal(fluxScopeNotApplicable({ flux_scope: 'fugitive' }), false)
assert.equal(fluxScopeNotApplicable({}), false)
// coverage counts must stay consistent with the scope field
assert.equal(fBreak.uncovered, geo.features.filter(f => fluxScopeNotApplicable(f.properties)).length)

// hashprice read: above/below the network-derived estimate, and power break-even
const hp = hashpriceRead({
  usedBtcPerThDay: 0.0000018, usdBtcPrice: 85000, networkBtcPerThDay: NETWORK_ESTIMATE_BTC_PER_TH_DAY,
  asicHashrateThs: 300, asicWatts: 4050, powerCostUsdPerKwh: 0.04,
})
assert.equal(hp.aboveNetwork, true)
assert.ok(Math.abs(hp.networkUsdPerThDay - 0.0000009 * 85000) < 1e-9)
assert.ok(hp.breakEvenUsdPerThDay > 0 && hp.breakEvenUsdPerThDay < hp.usedUsdPerThDay)
const hpSame = hashpriceRead({
  usedBtcPerThDay: NETWORK_ESTIMATE_BTC_PER_TH_DAY, usdBtcPrice: 85000,
  networkBtcPerThDay: NETWORK_ESTIMATE_BTC_PER_TH_DAY, asicHashrateThs: 300, asicWatts: 4050,
  powerCostUsdPerKwh: 0.04,
})
assert.equal(hpSame.aboveNetwork, null)

assert.equal(formatPayback(Infinity), 'N/A')
assert.equal(formatPayback(90), '90 d')
assert.equal(formatPayback(1000), '2.7 yr')

// ===========================================================================
// Economics repair 2 — carbon baseline honesty, FX contract, model alignment
// ===========================================================================
const { computeAdvancedRoi } = await import('../lib/roi-model.ts')
const { computeSiteValue } = await import('../lib/sites.ts')
const { hasCarbonBaseline, carbonBaselineLabel } = await import('../lib/carbon-overlay.ts')

// (e) GWP100 = 28 is the app-wide constant, and MissionPanel uses it (not 25).
assert.equal(METHANE_GWP100, 28)
const missionPanelSrc = fs.readFileSync(path.join(__dirname, '..', 'components', 'MissionPanel.tsx'), 'utf8')
assert.ok(missionPanelSrc.includes('* 0.365 * 28'), 'MissionPanel must use GWP 28')
assert.ok(!missionPanelSrc.includes('* 0.365 * 25'), 'MissionPanel must not use GWP 25')

// (a) carbon revenue = $0 when flux_scope is not-applicable / split is null, and
//     $0 by default everywhere (credit eligibility is NOT established).
const missionProps = geo.features.find(f => String(f.properties.ghgrp_id) === 'G12350').properties
assert.equal(missionProps.flux_scope, 'not-applicable')
assert.equal(hasCarbonBaseline(missionProps), false)
assert.ok(carbonBaselineLabel(missionProps).includes('no published baseline'))
const noBaselineSite = {
  id: 'G12350',
  emission: missionProps.emission_rate_kg_day || 0,
  properties: missionProps,
}
// Default model (no opt-in capture scenario) -> $0 carbon even with a price passed.
const roiNoScenario = computeAdvancedRoi(noBaselineSite, 'jenbacher316', { liveBtcUsd: 85000, carbonCreditUsdPerTonne: 45 })
assert.equal(roiNoScenario.carbonRevenueUsd, 0)
assert.equal(roiNoScenario.carbonBaseline, false)
assert.equal(roiNoScenario.carbonScenario, false)
// Even an opt-in capture scenario cannot produce carbon revenue without a baseline.
const roiNoBaseScenario = computeAdvancedRoi(noBaselineSite, 'jenbacher316', { liveBtcUsd: 85000, carbonCreditUsdPerTonne: 45, carbonCapturePct: 30 })
assert.equal(roiNoBaseScenario.carbonRevenueUsd, 0, 'no baseline -> no carbon revenue even in a scenario')
assert.equal(roiNoBaseScenario.carbonScenario, true)

// A site with a published vent/flare split (fugitive) has a baseline; an opt-in
// scenario yields an ILLUSTRATIVE figure (>0), but the default is still $0.
const fugitive = geo.features.find(f =>
  f.properties.flux_scope === 'fugitive'
  && Number(f.properties.ch4_flared_kg_day) > 0
  && Number(f.properties.ch4_tonnes_year) > 0)
assert.ok(fugitive, 'dataset must contain a fugitive baseline site')
assert.equal(hasCarbonBaseline(fugitive.properties), true)
const baselineSite = { id: fugitive.properties.ghgrp_id || 'x', emission: fugitive.properties.emission_rate_kg_day || 0, properties: fugitive.properties }
const roiBaselineDefault = computeAdvancedRoi(baselineSite, 'jenbacher316', { liveBtcUsd: 85000 })
assert.equal(roiBaselineDefault.carbonRevenueUsd, 0, 'carbon off by default even with a baseline')
assert.equal(roiBaselineDefault.carbonBaseline, true)
const roiBaselineScenario = computeAdvancedRoi(baselineSite, 'jenbacher316', { liveBtcUsd: 85000, carbonCreditUsdPerTonne: 45, carbonCapturePct: 30 })
assert.ok(roiBaselineScenario.carbonRevenueUsd > 0, 'opt-in scenario on a baseline site is an illustrative figure')
assert.equal(roiBaselineScenario.carbonScenario, true)

// (b) price is produced once: fiat revenue scales EXACTLY linearly with BTC price
//     at a fixed hashrate (never quadratically). $170k must be 2x $85k, not 4x.
const fixedSite = {
  id: 'fx',
  emission: 5000,
  properties: {
    flux_scope: 'fugitive',
    ch4_vented_kg_day: 100,
    ch4_flared_kg_day: 50,
    source_type: 'oil_gas_extraction',
    province: 'Alberta',
  },
}
const roi85 = computeAdvancedRoi(fixedSite, 'jenbacher316', { liveBtcUsd: 85000 })
const roi170 = computeAdvancedRoi(fixedSite, 'jenbacher316', { liveBtcUsd: 170000 })
const ratio = roi170.annualRevenueUsd / roi85.annualRevenueUsd
assert.ok(Math.abs(ratio - 2) < 0.01, `revenue must be linear in price (2x at 2x price), got ${ratio.toFixed(3)}`)
assert.ok(roi170.annualRevenueUsd < roi85.annualRevenueUsd * 2.1, 'revenue must NOT be quadratic (4x)')
// computeSiteValue (compare page) also decoupled: same linear rule.
const sv85 = computeSiteValue(fixedSite, 'jenbacher316', 200, 3500, 5500, 85000)
const sv170 = computeSiteValue(fixedSite, 'jenbacher316', 200, 3500, 5500, 170000)
const svRatio = sv170.dailyBtc / sv85.dailyBtc
assert.ok(Math.abs(svRatio - 1) < 1e-9, 'computeSiteValue production must be price-independent (hashprice), got ' + svRatio)
assert.ok(Math.abs((sv170.dailyBtc * 170000 - sv85.dailyBtc * 85000) / (sv85.dailyBtc * 85000) - 1) < 1e-9, 'computeSiteValue profit linear in price')

// (c) no hardcoded 1.35 FX rate remains in any economics/export path.
const econFiles = [
  'lib/bank-pack.ts', 'lib/fleet-template.ts', 'lib/roi-model.ts', 'lib/sites.ts',
  'lib/portfolio.ts', 'lib/compare-export.ts', 'lib/bookmarks-export.ts', 'lib/case-study.ts',
  'lib/term-sheet.ts', 'lib/fleet-model.ts', 'lib/sensitivity.ts', 'components/MissionPanel.tsx',
  'app/dashboard/page.tsx', 'app/funding/page.tsx',
]
for (const f of econFiles) {
  const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
  assert.ok(!/\b1\.35\b/.test(src), `${f} must not contain a hardcoded 1.35 FX rate`)
}
const fleetModelSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'fleet-model.ts'), 'utf8')
assert.ok(!fleetModelSrc.includes('CAD_PER_USD ='), 'fleet-model must not export CAD_PER_USD')

// (d) saved-template export payback is either the live session model or 'unavailable'
//     — never a stale stored-assumption estimate.
assert.equal(estimateFleetPaybackDays({ template: exportTpl, site: keele }), null)
assert.equal(estimateFleetPaybackDays({ template: exportTpl, site: keele, paybackDays: 900 }), 900)
assert.equal(estimateFleetPaybackDays({ template: exportTpl, site: keele, paybackDays: null }), null)

console.log('test-helpers: ALL PASSED')
console.log(`  elite=${elite.length} top_score=${seed.strandedScore} peers=${peers.length} tornado=${tornado.length}`)
