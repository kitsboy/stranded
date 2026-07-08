#!/usr/bin/env node
/**
 * Generates self-updating platform stats from the canonical GeoJSON dataset.
 * Runs on prebuild — keeps docs, pitch page, and marketing assets in sync.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const GEO_PATH = path.join(ROOT, 'data', 'stranded-sites-REAL.geojson')
const OUT_JSON = path.join(ROOT, 'public', 'data', 'live-stats.json')
const OUT_MD = path.join(ROOT, 'docs', 'LIVE-STATS.md')

const GENSET_THRESHOLDS = [
  { id: 'man', label: 'MAN 20V35/44G', min: 20000 },
  { id: 'cat3520', label: 'Caterpillar G3520H', min: 10000 },
  { id: 'jenbacher316', label: 'INNIO Jenbacher J316', min: 5000 },
  { id: 'mobile250', label: 'Mobile 250 kW', min: 0 },
]

function recommendGenset(emissionKgDay) {
  for (const g of GENSET_THRESHOLDS) {
    if (emissionKgDay >= g.min) return g.id
  }
  return 'mobile250'
}

const { computeStrandedScore } = require('../lib/scoring-shared.cjs')

function computeGeneratorPower(dailyMethaneKg, powerKW = 850, methaneNm3h = 220, derate = 0.9) {
  const dailyM3 = dailyMethaneKg / 0.717
  return (dailyM3 / methaneNm3h) * powerKW * derate
}

function tierLabel(kgDay) {
  if (kgDay >= 20000) return 'mega'
  if (kgDay >= 5000) return 'large'
  if (kgDay >= 1000) return 'medium'
  if (kgDay >= 100) return 'small'
  return 'micro'
}

function main() {
  const geo = JSON.parse(fs.readFileSync(GEO_PATH, 'utf8'))
  const features = geo.features || []

  const provinces = {}
  const sourceTypes = {}
  const gensetCounts = { man: 0, cat3520: 0, jenbacher316: 0, mobile250: 0 }
  const emissionTiers = { mega: 0, large: 0, medium: 0, small: 0, micro: 0 }
  const confidenceCounts = { high: 0, medium: 0, low: 0 }

  let totalEmissionKgDay = 0
  let totalCh4TonnesYear = 0
  let scoreSum = 0
  let totalGeneratorKW = 0
  let highScoreCount = 0

  const topSites = []

  for (const f of features) {
    const p = f.properties
    const emission = p.emission_rate_kg_day || 0
    const province = p.province || 'Unknown'
    const source = p.source_type || 'Unknown'
    const score = computeStrandedScore(p)
    const genset = recommendGenset(emission)
    const tier = tierLabel(emission)
    const conf = (p.confidence || 'medium').toLowerCase()

    provinces[province] = (provinces[province] || 0) + 1
    sourceTypes[source] = (sourceTypes[source] || 0) + 1
    gensetCounts[genset] = (gensetCounts[genset] || 0) + 1
    emissionTiers[tier] = (emissionTiers[tier] || 0) + 1
    confidenceCounts[conf] = (confidenceCounts[conf] || 0) + 1

    totalEmissionKgDay += emission
    totalCh4TonnesYear += p.ch4_tonnes_year || 0
    scoreSum += score
    totalGeneratorKW += computeGeneratorPower(emission)
    if (score >= 80) highScoreCount++

    topSites.push({
      id: p.ghgrp_id || p.id,
      name: p.name || p.facility_name || 'Unnamed site',
      province,
      emissionKgDay: Math.round(emission),
      score,
      genset,
      ch4TonnesYear: Math.round(p.ch4_tonnes_year || 0),
    })
  }

  topSites.sort((a, b) => b.score - a.score || b.emissionKgDay - a.emissionKgDay)

  const siteCount = features.length
  const avgEmission = totalEmissionKgDay / siteCount
  const avgScore = scoreSum / siteCount
  const co2eAvoided5Pct = Math.round(totalCh4TonnesYear * 0.05 * 28)
  const co2eAvoided100Pct = Math.round(totalCh4TonnesYear * 28)

  // Rough value model (aligned with lib/sites.ts heuristics)
  const defaultBtc = 85000
  const roughDailyBtcPortfolio = features.reduce((sum, f) => {
    const em = f.properties.emission_rate_kg_day || 0
    const powerKW = computeGeneratorPower(em)
    const numAsics = Math.max(1, Math.floor(powerKW * 1000 / 3500))
    return sum + numAsics * 200 * 0.0000009
  }, 0)
  const annualBtcPortfolio = roughDailyBtcPortfolio * 365 * 0.95
  const annualRevenueUsd = Math.round(annualBtcPortfolio * defaultBtc)

  const generatedAt = new Date().toISOString()
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

  const stats = {
    generatedAt,
    version: pkg.version || '2.1.0',
    buildId: generatedAt.replace(/[^0-9]/g, '').slice(0, 14),
    siteCount,
    provinceCount: Object.keys(provinces).length,
    provinces: Object.entries(provinces)
      .map(([name, count]) => ({ name, count, pct: +(count / siteCount * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count),
    sourceTypes: Object.entries(sourceTypes)
      .map(([name, count]) => ({ name, count, pct: +(count / siteCount * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count),
    gensetRecommendations: Object.entries(gensetCounts)
      .map(([id, count]) => ({ id, count, pct: +(count / siteCount * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count),
    emissionTiers,
    confidenceCounts,
    totals: {
      emissionKgDay: Math.round(totalEmissionKgDay),
      avgEmissionKgDay: Math.round(avgEmission),
      ch4TonnesYear: Math.round(totalCh4TonnesYear),
      avgStrandedScore: +(avgScore).toFixed(1),
      totalGeneratorKW: Math.round(totalGeneratorKW),
      highScoreSites: highScoreCount,
    },
    impact: {
      co2eAvoided5PctTonnes: co2eAvoided5Pct,
      co2eAvoided100PctTonnes: co2eAvoided100Pct,
      sitesAt5Pct: Math.round(siteCount * 0.05),
      methaneGwp: 28,
    },
    valueModel: {
      defaultBtcUsd: defaultBtc,
      roughDailyBtc: +roughDailyBtcPortfolio.toFixed(4),
      annualBtc: +annualBtcPortfolio.toFixed(2),
      annualRevenueUsd,
      note: 'Portfolio model uses Jenbacher-class power + ASIC heuristics; live BTC on pitch page.',
    },
    topSites: topSites.slice(0, 15),
    routes: {
      home: '/',
      map: '/map',
      education: '/education',
      sites: '/sites',
      pitch: '/pitch',
      marketingHub: '/Marketing-Hub.html',
    },
    urls: {
      production: 'https://stranded.giveabit.io',
      github: 'https://github.com/kitsboy/stranded',
      dataSource: 'https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823',
    },
  }

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
  fs.writeFileSync(OUT_JSON, JSON.stringify(stats, null, 2))

  const md = `<!-- AUTO-GENERATED by scripts/generate-live-stats.js — do not edit numbers manually -->
# Live Platform Stats

**Generated:** ${generatedAt}  
**Source:** \`data/stranded-sites-REAL.geojson\` (${siteCount} sites)

> Re-run \`npm run docs:sync\` or any build to refresh. Pitch page and docs read \`/data/live-stats.json\`.

## Headline Numbers

| Metric | Value |
|--------|-------|
| Verified sites | **${siteCount.toLocaleString()}** |
| Provinces & territories | **${Object.keys(provinces).length}** |
| Total daily methane (kg) | **${Math.round(totalEmissionKgDay).toLocaleString()}** |
| Total CH₄ (tonnes/yr) | **${Math.round(totalCh4TonnesYear).toLocaleString()}** |
| Avg Stranded Score | **${avgScore.toFixed(1)}** |
| High-score sites (≥80) | **${highScoreCount}** |
| Est. generator capacity (kW) | **${Math.round(totalGeneratorKW).toLocaleString()}** |
| 5% capture → CO₂e avoided/yr | **${co2eAvoided5Pct.toLocaleString()} t** |
| Full capture → CO₂e avoided/yr | **${co2eAvoided100Pct.toLocaleString()} t** |
| Model annual BTC (portfolio) | **${annualBtcPortfolio.toFixed(2)}** |
| Model annual revenue (@$${defaultBtc.toLocaleString()} BTC) | **$${annualRevenueUsd.toLocaleString()}** |

## Top Provinces

${stats.provinces.slice(0, 8).map(p => `- **${p.name}:** ${p.count} sites (${p.pct}%)`).join('\n')}

## Genset Recommendations

${stats.gensetRecommendations.map(g => `- **${g.id}:** ${g.count} sites (${g.pct}%)`).join('\n')}

---

*Safe Harbour · Part of the [Give A Bit](https://giveabit.io) family.*
`

  fs.writeFileSync(OUT_MD, md)

  const status = {
    status: 'operational',
    service: 'stranded.giveabit.io',
    version: stats.version,
    buildId: stats.buildId,
    siteCount,
    generatedAt,
  }
  fs.writeFileSync(path.join(ROOT, 'public', 'status.json'), JSON.stringify(status, null, 2))

  console.log(`✓ live-stats.json — ${siteCount} sites, ${Object.keys(provinces).length} provinces`)
  console.log(`✓ docs/LIVE-STATS.md updated`)
  console.log(`✓ status.json updated`)
}

main()