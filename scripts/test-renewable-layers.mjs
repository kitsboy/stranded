#!/usr/bin/env node
/**
 * Guards for the official energy overlays.
 * The map must not ship a point we did not pull from the recorded source,
 * and every painted category must be one we know how to colour.
 */
'use strict'

import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/renewable-plants.geojson'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/renewable-layers.json'), 'utf8'))

const CATS = new Set([
  'wind', 'solar', 'hydro', 'biomass', 'tidal', 'pumped', 'geothermal', 'other',
  'remote-fossil', 'remote-hydro', 'remote-grid', 'remote-unknown',
])

assert.strictEqual(geo.type, 'FeatureCollection')
assert.ok(geo.features.length >= 1200, `expected a full pull, got ${geo.features.length}`)
assert.strictEqual(geo.features.length, manifest.featureCount)
assert.strictEqual(manifest.plantCount + manifest.remoteCount, manifest.featureCount)

const counts = {}
const ids = new Set()
for (const f of geo.features) {
  const p = f.properties
  assert.ok(CATS.has(p.cat), `unknown cat ${p.cat}`)
  assert.ok(p.id && !ids.has(p.id), `duplicate or missing id ${p.id}`)
  ids.add(p.id)
  assert.strictEqual(f.geometry.type, 'Point')
  const [lng, lat] = f.geometry.coordinates
  assert.ok(lng >= -141.1 && lng <= -50 && lat >= 41 && lat <= 84, `outside Canada ${p.id}`)
  assert.ok(p.sourceUrl.startsWith('https://open.canada.ca/data/en/dataset/'), p.id)
  assert.ok(p.name, p.id)
  if (p.kind === 'plant') {
    assert.ok(p.period, `plant missing period ${p.id}`)
    assert.ok(p.mw >= 0, p.id)
  } else {
    assert.strictEqual(p.kind, 'remote')
    assert.ok(p.mainPower || p.cat === 'remote-unknown', p.id)
  }
  counts[p.cat] = (counts[p.cat] || 0) + 1
}
assert.deepStrictEqual(counts, manifest.counts)
assert.ok(manifest.vintageNote.includes('not a current-year capacity census'))
assert.ok(manifest.recordedNotMapped.length >= 5, 'research sources must stay on record')
assert.ok(manifest.mappedSources.every((s) => s.datasetUrl && s.licenceUrl))

// Geothermal is a real category. Zero rows is an honest finding, not a missing layer.
assert.strictEqual(counts.geothermal || 0, manifest.counts.geothermal || 0)

console.log(`renewable overlays ok: ${geo.features.length} features, ${Object.keys(counts).length} categories`)
