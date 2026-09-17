#!/usr/bin/env node
/**
 * Stranded — the per-site records must be exactly what the client would compute.
 *
 * `public/data/site/<id>.json` is the deep-link fast path (map fix 2/3): the map opens the
 * named site's card from that one record instead of waiting 10–37 s for the 2,611-site
 * dataset. That is only honest if a record is *the same site* the dataset would produce —
 * not a stale copy, not a rounded subset, not a leftover file from a previous data refresh.
 *
 * This proves it, for every site, from the published bytes:
 *   1. the record set matches the canonical geojson digest it claims to come from
 *   2. every feature has a record, and every record has a feature (nothing orphaned)
 *   3. each record deep-equals enrichSite(feature) + the same percentile/badge the
 *      dataset pipeline assigns — recomputed here through the client's own functions
 *   4. the per-record digests in the manifest are the bytes actually published
 *
 * Run: npm run validate  (or node --import tsx scripts/validate-site-records.mjs)
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'public', 'data', 'stranded-sites.geojson')
const RECORD_DIR = path.join(ROOT, 'public', 'data', 'site')
const MANIFEST = path.join(ROOT, 'public', 'data', 'site-records.json')

const { enrichSite } = await import('../lib/sites.ts')
const { scorePercentile, scorePercentiles, scoreBadgeLabel } = await import('../lib/percentile.ts')

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex')
const fail = (msg) => { console.error(`✖ ${msg}`); process.exit(1) }

if (!fs.existsSync(MANIFEST)) fail('public/data/site-records.json is missing — run `npm run records:build`')
if (!fs.existsSync(RECORD_DIR)) fail('public/data/site/ is missing — run `npm run records:build`')

const raw = fs.readFileSync(SRC)
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
const features = (JSON.parse(raw.toString('utf8')).features || [])

const sourceSha256 = sha256(raw)
if (manifest.sourceSha256 !== sourceSha256) {
  fail(`records were generated from a different dataset: the ${manifest.source} digest is ${sourceSha256.slice(0, 16)}… but site-records.json says ${String(manifest.sourceSha256).slice(0, 16)}… — regenerate with \`npm run records:build\``)
}
if (manifest.siteCount !== features.length) {
  fail(`site-records.json says ${manifest.siteCount} sites, the dataset has ${features.length}`)
}

// Rebuild the dataset pipeline's own answer, then compare byte-for-byte per site.
const enriched = features.map(enrichSite)
const scores = enriched.map((s) => s.strandedScore)
const percentiles = scorePercentiles(scores)
const expected = new Map()
const digests = []
let worstDrift = null
enriched.forEach((s, i) => {
  const body = JSON.stringify({ ...s, scorePercentile: percentiles[i], scoreBadge: scoreBadgeLabel(percentiles[i]) })
  expected.set(s.id, body)
  digests.push(`${s.id} ${sha256(Buffer.from(body))}`)
})

// scorePercentiles() replaced a per-site sort+scan (O(n² log n)) — prove it did not move a
// single published rank: recompute a fixed sample the slow, original way and compare.
const SAMPLE = 250
for (let i = 0; i < SAMPLE; i++) {
  const idx = Math.floor((i * enriched.length) / SAMPLE)
  const slow = scorePercentile(scores[idx], scores)
  if (slow !== percentiles[idx]) {
    fail(`percentile ${slow} != ${percentiles[idx]} for ${enriched[idx].id} — the one-pass ranking does not match the original per-site ranking`)
  }
}

const onDisk = new Set(fs.readdirSync(RECORD_DIR).filter((f) => f.endsWith('.json')))
let checked = 0
for (const [id, body] of expected) {
  const file = `${id}.json`
  if (!onDisk.has(file)) fail(`no record published for ${id}`)
  const actual = fs.readFileSync(path.join(RECORD_DIR, file), 'utf8').trim()
  if (actual !== body) {
    worstDrift = worstDrift || { id, expected: body, actual }
    fail(`record ${file} does not match the dataset-derived site — the early card would differ from the final one${worstDrift ? `\n  dataset: ${body.slice(0, 220)}\n  record : ${actual.slice(0, 220)}` : ''}`)
  }
  checked++
}
const orphans = [...onDisk].filter((f) => !expected.has(f.replace(/\.json$/, '')))
if (orphans.length) fail(`${orphans.length} record(s) have no site in the dataset (e.g. ${orphans.slice(0, 3).join(', ')}) — stale files would answer for sites that no longer exist`)

const recordsSha256 = sha256(Buffer.from(digests.sort().join('\n')))
if (manifest.recordsSha256 !== recordsSha256) {
  fail(`the records on disk do not match the digest site-records.json publishes (${recordsSha256.slice(0, 16)}… vs ${String(manifest.recordsSha256).slice(0, 16)}…)`)
}

// The deep-link contract itself: the fields the map reads to open the card before the dataset.
const probe = expected.get('G12350')
if (!probe) fail('G12350 (the audited deep link) has no record')
const rec = JSON.parse(probe)
for (const k of ['id', 'geometry', 'properties', 'emission', 'strandedScore', 'scorePercentile']) {
  if (rec[k] === undefined || rec[k] === null) fail(`record G12350 is missing ${k} — the map cannot open a card from it`)
}
if (rec.properties.name !== 'Mission Landfill') fail(`G12350 is "${rec.properties.name}", expected Mission Landfill`)

console.log(`✓ site records: ${checked} records reproduce the dataset exactly (source ${sourceSha256.slice(0, 16)}…, records ${recordsSha256.slice(0, 16)}…)`)
console.log(`✓ deep-link contract: G12350 → "${rec.properties.name}" (${rec.properties.province}, score ${rec.strandedScore}, ${rec.scoreBadge})`)
