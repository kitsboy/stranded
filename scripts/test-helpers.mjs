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
  potentialDailyProfitCAD: profit,
  emission: 1000,
  recommendedGenset: 'jenbacher316',
  maxGeneratorPowerKW: 500,
  properties: { name: `Site ${id}`, province: 'Alberta', source_type: 'oil_gas_extraction', confidence: 'high' },
  geometry: { type: 'Point', coordinates: [-114, 53] },
})

const compareSites = { a: mockSite('G10161', 5000), b: mockSite('G12147', 3000), c: null }
const compareCsv = exportCompareCsv(compareSites)
assert.ok(compareCsv.includes('site_a'))
assert.ok(compareCsv.includes('Daily profit (CAD)'))
assert.ok(compareCsv.includes('5000'))

const metricRows = buildCompareMetricRows(compareSites)
assert.ok(metricRows.some(r => r.label === 'Stranded Score'))
assert.equal(metricRows.find(r => r.label === 'Daily profit (CAD)')?.values.a, '5000')

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

const keeleProps = geo.features.find(f => String(f.properties.ghgrp_id) === 'G10161').properties
const keele = { id: 'G10161', emission: keeleProps.emission_rate_kg_day, properties: keeleProps }
assert.equal(keeleProps.name, 'Keele Valley Landfill')
assert.equal(keeleProps.emission_rate_kg_day, 56013.9)

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
assert.ok(Math.abs(oneJ316 - computeGeneratorPower(56013.9, 'jenbacher316')) < 1e-6)
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
assert.equal(capFleetToSite({ ...autoTpl, mode: 'manual', minerCount: 500 }, keele).minerCount, 500)

// unusedCapacity: under-filled stack leaves real gas on the table, full stack leaves none
const halfFleet = capFleetToSite({ ...autoTpl, mode: 'manual', minerCount: Math.floor(ceiling / 2) }, keele)
const unused = unusedCapacity(keele, halfFleet)
assert.ok(unused.unusedKw > 0)
assert.ok(Math.abs(unused.unusedKgPerDay - 56013.9 / 2) < 5, `expected ~half the gas, got ${unused.unusedKgPerDay}`)
assert.ok(Math.abs(unused.unusedTPerYear - (unused.unusedKgPerDay * 365) / 1000) < 1e-9)
const fullFleet = unusedCapacity(keele, capFleetToSite(autoTpl, keele))
// at the ceiling the only remainder is the floor() of the last machine
assert.ok(fullFleet.unusedKw < 4.05 && fullFleet.unusedKgPerDay < 1, JSON.stringify(fullFleet))
assert.deepEqual(unusedCapacity(keele, { ...autoTpl, gensets: [] }), { unusedKw: 0, unusedKgPerDay: 0, unusedTPerYear: 0 })

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
assert.equal(referenceSiteForPreset(MINER_STACK_PRESETS[0], [smallSite, bigSite, keele]).emission, 50000)
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
assert.equal(typeof block.paybackDays, 'number')
const mdBlock = fleetBlockMarkdown({ template: exportTpl, site: keele })
assert.ok(mdBlock.includes('Fleet template'))
assert.ok(mdBlock.includes(block.asicName))
// payback override wins over estimate
const payback = estimateFleetPaybackDays({ template: exportTpl, site: keele, paybackDays: 123 })
assert.equal(payback, 123)

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

console.log('test-helpers: ALL PASSED')
console.log(`  elite=${elite.length} top_score=${seed.strandedScore} peers=${peers.length} tornado=${tornado.length}`)
