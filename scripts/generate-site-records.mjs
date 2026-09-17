#!/usr/bin/env node
/**
 * Stranded — per-site records: the deep-link fast path (map fix 2/3).
 *
 * A shared link (`/map/?site=G12350`) used to wait for the whole dataset: 201 KB gzipped,
 * 2.85 MB raw, 2,611 features to parse, enrich and percentile-rank before the named site's
 * card could appear — measured 10–37 s on a phone, and provably CPU-bound (a *faster*
 * connection was slower). The person on the link saw a spinner while their phone chewed
 * the portfolio.
 *
 * This writes one tiny record per site, `/data/site/<id>.json` (~800 B, gzipped ~400 B), so
 * the client can open the deep-linked site's card from that site's own record in about a
 * second and let the full dataset load behind it.
 *
 * THE HONESTY RULE: a record is not a summary, a subset or a "quick version". It is the
 * exact `EnrichedSite` that `loadSites()` returns for that site, built by importing and
 * calling the very same functions (`enrichSite` from lib/sites.ts, `scorePercentile` /
 * `scoreBadgeLabel` from lib/percentile.ts) over the same canonical geojson. So the card the
 * person sees first IS the card they keep — `scripts/validate-site-records.mjs` proves it
 * field-by-field for every site, and refuses a record set that has drifted from the data.
 *
 * Run: npm run records:build  (also part of `prebuild`, so every build regenerates them)
 *
 * Deliberately offline and deterministic: same input bytes → same output bytes, no
 * timestamps, so a re-run on unchanged data is a no-op (no churn in the repo, and the
 * provenance digest below stays meaningful).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'public', 'data', 'stranded-sites.geojson')
const OUT_DIR = path.join(ROOT, 'public', 'data', 'site')
const MANIFEST = path.join(ROOT, 'public', 'data', 'site-records.json')
const URL_TEMPLATE = '/data/site/{id}.json'

const { enrichSite } = await import('../lib/sites.ts')
const { scorePercentiles, scoreBadgeLabel } = await import('../lib/percentile.ts')

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

const raw = fs.readFileSync(SRC)
const sourceSha256 = sha256(raw)
const geo = JSON.parse(raw.toString('utf8'))
const features = geo.features || []
if (!features.length) {
  console.error('✖ no features in ' + SRC)
  process.exit(1)
}

// Exactly the pipeline in loadSites(): enrich every feature, then rank each score against
// the whole distribution (one pass — see scorePercentiles). Same functions, same order —
// so same values, and a record is the dataset's answer, not a second opinion.
const enriched = features.map(enrichSite)
const percentiles = scorePercentiles(enriched.map((s) => s.strandedScore))
const records = enriched.map((s, i) => ({
  ...s,
  scorePercentile: percentiles[i],
  scoreBadge: scoreBadgeLabel(percentiles[i]),
}))

fs.mkdirSync(OUT_DIR, { recursive: true })

// Clean out records for sites that no longer exist (id churn would otherwise leave a
// stale file addressable by an old link).
const wanted = new Set(records.map((r) => `${r.id}.json`))
let removed = 0
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.json') && !wanted.has(f)) { fs.unlinkSync(path.join(OUT_DIR, f)); removed++ }
}

const digests = []
let written = 0
let bytes = 0
for (const r of records) {
  if (!r.id) {
    console.error('✖ a feature has no id — cannot publish a record without one')
    process.exit(1)
  }
  const body = JSON.stringify(r)
  if (body.includes('\n')) {
    console.error(`✖ record ${r.id} serialised with a newline — records must be one line`)
    process.exit(1)
  }
  bytes += Buffer.byteLength(body)
  digests.push(`${r.id} ${sha256(Buffer.from(body))}`)
  const file = path.join(OUT_DIR, `${r.id}.json`)
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (previous === body) continue // unchanged: leave mtime alone (no repo churn)
  fs.writeFileSync(file, body)
  written++
}

const manifest = {
  version: 1,
  note: 'One record per map site — the deep-link fast path. Each file is the exact EnrichedSite that loadSites() returns for that site, generated from the canonical geojson with the same functions the client uses.',
  urlTemplate: URL_TEMPLATE,
  source: 'stranded-sites.geojson',
  sourceSha256,
  siteCount: records.length,
  recordsSha256: sha256(Buffer.from(digests.sort().join('\n'))),
  bytes,
  bytesNote: 'total uncompressed payload of all records',
}
const manifestBody = JSON.stringify(manifest, null, 2) + '\n'
const previousManifest = fs.existsSync(MANIFEST) ? fs.readFileSync(MANIFEST, 'utf8') : null
if (previousManifest !== manifestBody) fs.writeFileSync(MANIFEST, manifestBody)

console.log(`✓ site records: ${records.length} files in public/data/site/ (${(bytes / 1024).toFixed(0)} KB, avg ${Math.round(bytes / records.length)} B)`)
console.log(`  wrote ${written}, unchanged ${records.length - written}, removed ${removed}`)
console.log(`  source ${manifest.source} sha256 ${sourceSha256.slice(0, 16)}…`)
console.log(`  records sha256 ${manifest.recordsSha256.slice(0, 16)}…`)
