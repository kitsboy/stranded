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
const { scoreTier, scoreTierClass, scoreTierColor, effectiveGridKm, hasStrongConnectivity } = await import('../lib/scoring.ts')
const { glossaryLookup, GLOSSARY } = await import('../lib/glossary.ts')

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

console.log('test-helpers: ALL PASSED')
console.log(`  elite=${elite.length} top_score=${seed.strandedScore} peers=${peers.length} tornado=${tornado.length}`)
