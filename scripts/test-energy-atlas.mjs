#!/usr/bin/env node
/**
 * The energy atlas may paint a raster, a point, or a province shade.
 * It may not invent a town, a corridor, or a geothermal plant.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const { ATLAS_LAYERS, statcanRenewableTotal, pvProvinceTotals, atlasPopupHtml, canonicalProvince, searchInfrastructure, SOUTHERN_ALBERTA_PRESET } = await import('../lib/energy-atlas.ts')
const { renewablePopupHtml } = await import('../lib/renewable-layers.ts')
const { mapTileUrlsCoveredByCsp } = await import('../lib/map-csp.ts')

const infra = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/nacei-infrastructure.geojson'), 'utf8'))
const pv = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/pv-province.json'), 'utf8'))
const atlas = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/energy-atlas.json'), 'utf8'))
const statcan = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/statcan-renewables.json'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/renewable-layers.json'), 'utf8'))

assert.strictEqual(infra.type, 'FeatureCollection')
const counts = {}
const ids = new Set()
for (const feature of infra.features) {
  assert.strictEqual(feature.geometry.type, 'Point', feature.properties.id)
  assert.ok(feature.properties.id && !ids.has(feature.properties.id))
  ids.add(feature.properties.id)
  const [lng, lat] = feature.geometry.coordinates
  assert.ok(lng >= -141.1 && lng <= -50 && lat >= 41 && lat <= 84, feature.properties.id)
  assert.ok(feature.properties.name, feature.properties.id)
  counts[feature.properties.kind] = (counts[feature.properties.kind] || 0) + 1
}
for (const layer of ATLAS_LAYERS.filter((item) => item.group === 'infra')) {
  assert.strictEqual(counts[layer.id], layer.count, layer.id)
  assert.strictEqual(atlas.infrastructure.counts[layer.id], layer.count)
}
assert.strictEqual(atlas.hydrokinetic.waterPolygons, ATLAS_LAYERS.find((item) => item.id === 'hydrokinetic-water').count)
assert.strictEqual(atlas.hydrokinetic.possiblePolygons, ATLAS_LAYERS.find((item) => item.id === 'hydrokinetic-possible').count)
assert.strictEqual(atlas.hydrokinetic.ringsReturnedByQuery, false)
assert.ok(atlas.solarRasters.absentFromLiveService.includes('geothermal gradient'))
assert.ok(atlas.solarRasters.absentFromLiveService.includes('wind speed'))

const tiles = ATLAS_LAYERS.map((item) => item.tiles).filter(Boolean)
assert.ok(mapTileUrlsCoveredByCsp(tiles))

const { totals } = pvProvinceTotals(pv)
assert.strictEqual(Object.keys(totals).length, 13)
assert.ok(!pv.provinces['Yukon Territory'])
assert.ok(totals.Yukon > 700 && totals.Yukon < 1600)
assert.ok(totals.Saskatchewan > totals['British Columbia'])
assert.ok(!JSON.stringify(pv).includes('"municipality"'))
for (const value of Object.values(totals)) {
  assert.ok(value > 700 && value < 1600, `pv mean ${value} looks like months were double-counted`)
}

const alberta = statcan.provinces.Alberta
assert.strictEqual(alberta.capacityMW.geothermal, 6)
const withGeo = statcanRenewableTotal(alberta, 'cap')
const withoutGeo = withGeo - alberta.capacityMW.geothermal
assert.ok(withGeo === withoutGeo + 6)
assert.ok(statcanRenewableTotal(alberta, 'gen') > 0)

const html = atlasPopupHtml({
  kind: 'transmission',
  name: 'No Name',
  from: 'Alberta',
  to: 'Montana',
  toCountry: 'United States',
})
assert.match(html, /not drawn/)
assert.match(html, /No Name/)
assert.match(html, /Alberta → Montana/)
assert.ok(!html.includes('<script'))

const limitIds = manifest.recordedNotMapped.map((item) => item.id)
assert.ok(limitIds.includes('nacei-line-corridors'))
assert.ok(limitIds.includes('geothermal-plants-canada'))
assert.ok(limitIds.includes('nrcan-pv-municipalities'))
assert.ok(!manifest.recordedNotMapped.some((item) => /Left off so it does not draw/.test(item.why)))
assert.strictEqual(manifest.counts.geothermal || 0, 0)

assert.strictEqual(canonicalProvince('Québec'), 'Quebec')
assert.strictEqual(canonicalProvince('YT'), 'Yukon')
assert.strictEqual(canonicalProvince('AB'), 'Alberta')
const albertaCap = statcanRenewableTotal(alberta, 'cap')
const vintage = renewablePopupHtml({
  kind: 'plant',
  cat: 'wind',
  name: 'Box Springs',
  province: 'Alberta',
  mw: 6,
  period: '201612',
}, {
  capacityMw: albertaCap,
  capacityYear: '2024',
  capacityNote: 'The 2024 total includes 6 MW geothermal. The plant file has 0 geothermal plants of 1 MW or more.',
})
assert.match(vintage, /201612/)
assert.match(vintage, /6 MW/)
assert.match(vintage, /Not a current-year capacity census/)
assert.match(vintage, /2024/)
const formattedCap = albertaCap.toLocaleString(undefined, { maximumFractionDigits: 1 })
assert.ok(vintage.includes(`${formattedCap} MW`), formattedCap)
assert.match(vintage, /0 geothermal plants/)
assert.ok(!renewablePopupHtml({ kind: 'remote', name: 'A remote place', province: 'Nunavut', mw: 1 }, { capacityMw: 10 }).includes('capacity census'))

const tie = searchInfrastructure(infra.features, 'Montana Alberta Tie')
assert.ok(tie.length >= 1)
assert.match(tie[0].owner, /Montana Alberta Tie/)
assert.ok(tie[0].lng < -110 && tie[0].lng > -115 && tie[0].lat < 50 && tie[0].lat > 48)
assert.strictEqual(searchInfrastructure(infra.features, 'z').length, 0)

assert.strictEqual(SOUTHERN_ALBERTA_PRESET.layers.sites, true)
assert.strictEqual(SOUTHERN_ALBERTA_PRESET.overlays.solar, true)
assert.strictEqual(SOUTHERN_ALBERTA_PRESET.atlas['solar-ghi'], true)
assert.ok(SOUTHERN_ALBERTA_PRESET.fly.lat > 49 && SOUTHERN_ALBERTA_PRESET.fly.lat < 51.5)
assert.ok(SOUTHERN_ALBERTA_PRESET.fly.lng < -110 && SOUTHERN_ALBERTA_PRESET.fly.lng > -115)

console.log(`energy atlas ok: ${infra.features.length} infrastructure points, ${Object.keys(totals).length} province shades`)
