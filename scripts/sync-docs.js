#!/usr/bin/env node
/**
 * Syncs auto-generated stats into living docs via marker blocks.
 * Run after generate-live-stats.js (or via npm run docs:sync).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const STATS_PATH = path.join(ROOT, 'public', 'data', 'live-stats.json')

const MARKER_START = '<!-- LIVE-STATS:START -->'
const MARKER_END = '<!-- LIVE-STATS:END -->'

function injectBlock(content, block) {
  const wrapped = `${MARKER_START}\n${block}\n${MARKER_END}`
  if (content.includes(MARKER_START)) {
    const re = new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}`, 'm')
    return content.replace(re, wrapped)
  }
  return `${content.trim()}\n\n${wrapped}\n`
}

function formatBlock(stats) {
  const t = stats.totals
  const i = stats.impact
  const v = stats.valueModel
  return [
    `> **Auto-synced** from \`data/stranded-sites-REAL.geojson\` on ${stats.generatedAt}`,
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Sites | ${stats.siteCount.toLocaleString()} |`,
    `| Provinces | ${stats.provinceCount} |`,
    `| Daily methane (kg) | ${t.emissionKgDay.toLocaleString()} |`,
    `| CH₄ (tonnes/yr) | ${t.ch4TonnesYear.toLocaleString()} |`,
    `| Avg Stranded Score | ${t.avgStrandedScore} |`,
    `| High-score sites (≥80) | ${t.highScoreSites} |`,
    `| 5% CO₂e avoided/yr | ${i.co2eAvoided5PctTonnes.toLocaleString()} t |`,
    `| Model annual revenue | $${v.annualRevenueUsd.toLocaleString()} (@ $${v.defaultBtcUsd.toLocaleString()} BTC) |`,
    '',
    `Full breakdown: [docs/LIVE-STATS.md](./LIVE-STATS.md) · Live JSON: \`/data/live-stats.json\` · Pitch: [${stats.urls.production}/pitch](${stats.urls.production}/pitch)`,
  ].join('\n')
}

function syncFile(relPath, stats) {
  const full = path.join(ROOT, relPath)
  if (!fs.existsSync(full)) return
  const block = formatBlock(stats)
  const updated = injectBlock(fs.readFileSync(full, 'utf8'), block)
  fs.writeFileSync(full, updated)
  console.log(`✓ synced ${relPath}`)
}

function main() {
  if (!fs.existsSync(STATS_PATH)) {
    console.error('Run generate-live-stats.js first')
    process.exit(1)
  }
  const stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'))
  const targets = [
    'docs/SOURCE-OF-TRUTH.md',
    'docs/DOCUMENTATION.md',
    'STATUS.md',
    'README.md',
  ]
  targets.forEach(f => syncFile(f, stats))
  console.log('✓ docs sync complete')
}

main()