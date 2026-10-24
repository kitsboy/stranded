#!/usr/bin/env node
/**
 * Honest miner math for official energy locations.
 * Counts are checked against the shipped manifest so a copy change cannot drift.
 */
'use strict'

import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { fileURLToPath } from 'url'

const { atlasPopupHtml } = await import('../lib/energy-atlas.ts')
const {
  ENERGY_HOURS_PER_YEAR,
  OFFICIAL_PLANT_COUNT,
  OFFICIAL_PLANT_COUNTS,
  OFFICIAL_REMOTE_COUNT,
  OFFICIAL_REMOTE_COUNTS,
  assessEnergyLocation,
  computeEnergyBuild,
  energyMinerCeiling,
  energyPinTeaserHtml,
} = await import('../lib/energy-build.ts')
const { NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_ESTIMATE_BTC_PER_TH_DAY } = await import('../lib/fleet-model.ts')
const { ASIC_MACHINES } = await import('../lib/fleet-template.ts')

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/renewable-layers.json'), 'utf8'))
const statcan = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/statcan-renewables.json'), 'utf8'))
const plants = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/renewable-plants.geojson'), 'utf8'))
const hydro = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/hydrokinetic.geojson'), 'utf8'))

assert.strictEqual(manifest.plantCount, OFFICIAL_PLANT_COUNT)
assert.strictEqual(manifest.remoteCount, OFFICIAL_REMOTE_COUNT)
assert.strictEqual(OFFICIAL_PLANT_COUNT + OFFICIAL_REMOTE_COUNT, manifest.featureCount)
for (const [key, count] of Object.entries(OFFICIAL_PLANT_COUNTS)) {
  assert.strictEqual(manifest.counts[key] || 0, count, key)
}
for (const [key, count] of Object.entries(OFFICIAL_REMOTE_COUNTS)) {
  assert.strictEqual(manifest.counts[key], count, key)
}
assert.strictEqual(
  Object.values(OFFICIAL_PLANT_COUNTS).reduce((sum, n) => sum + n, 0),
  OFFICIAL_PLANT_COUNT,
)

const hydroKeys = new Set()
for (const feature of hydro.features) {
  for (const key of Object.keys(feature.properties || {})) hydroKeys.add(key)
}
assert.deepStrictEqual([...hydroKeys].sort(), ['community', 'kind', 'province', 'river'])

const adelaide = plants.features.find((feature) => feature.properties.id === 'nacei-5334')
assert.strictEqual(adelaide.properties.name, 'Adelaide')
assert.strictEqual(adelaide.properties.cat, 'wind')
const onWind = statcan.provinces.Ontario
const adelaideCf = onWind.generationMWh.wind / (onWind.capacityMW.wind * ENERGY_HOURS_PER_YEAR)
assert.ok(adelaideCf > 0 && adelaideCf < 1, adelaideCf)
const adelaideAssess = assessEnergyLocation(adelaide.properties, statcan)
assert.strictEqual(adelaideAssess.basisId, 'plant-cf')
assert.strictEqual(adelaideAssess.buildable, true)
assert.ok(Math.abs(adelaideAssess.capacityFactor - adelaideCf) < 1e-12)
assert.ok(Math.abs(adelaideAssess.powerKw - adelaide.properties.mw * 1000 * adelaideCf) < 1e-6)
assert.match(adelaideAssess.basis, /not a meter on this plant/)
assert.match(energyPinTeaserHtml(adelaide.properties, adelaideAssess), /Click to build it/)

const magdalen = plants.features.find((feature) => feature.properties.id === 'rced-1')
assert.strictEqual(magdalen.properties.fuelUnits, '$/l')
const expectedAvg = magdalen.properties.annualFossilMwh * 1000 / ENERGY_HOURS_PER_YEAR
assert.ok(expectedAvg < magdalen.properties.fossilKw)
const remote = assessEnergyLocation(magdalen.properties, statcan)
assert.strictEqual(remote.basisId, 'remote-average')
assert.ok(Math.abs(remote.powerKw - expectedAvg) < 1e-6)
assert.strictEqual(remote.fuelUsedInRoi, false)
assert.strictEqual(remote.fuelPrice, 0.7)
assert.match(remote.basis, /not spare power/)

const biomass = plants.features.find((feature) => feature.properties.cat === 'biomass')
assert.ok(biomass, 'biomass plant')
const bio = assessEnergyLocation(biomass.properties, statcan)
assert.strictEqual(bio.buildable, false)
assert.strictEqual(bio.powerKw, null)
assert.match(bio.basis, /no 2024 biomass capacity/)
assert.doesNotMatch(energyPinTeaserHtml(biomass.properties, bio), /Click to build it/)

const pumped = plants.features.find((feature) => feature.properties.cat === 'pumped')
assert.strictEqual(assessEnergyLocation(pumped.properties, statcan).buildable, false)

assert.strictEqual(assessEnergyLocation({ kind: 'water', river: 'Mackenzie' }, statcan).buildable, false)
assert.match(assessEnergyLocation({ kind: 'water', river: 'Mackenzie' }, statcan).basis, /does not publish kilowatts/)
assert.strictEqual(assessEnergyLocation({ kind: 'shade', name: 'Alberta' }, statcan).buildable, false)
assert.strictEqual(assessEnergyLocation({ kind: 'transmission', name: 'Line' }, statcan).buildable, false)
assert.match(atlasPopupHtml({ kind: 'water', river: 'Mackenzie', community: 'Tsiigehtchic' }), /does not publish kilowatts/)
assert.match(atlasPopupHtml({ kind: 'shade', name: 'Alberta', boundary: 'cartographic' }), /no miner build is sized on the shade/)
assert.match(atlasPopupHtml({ kind: 'transmission', name: 'Line' }), /Not a generation site/)

const capped = assessEnergyLocation(
  { kind: 'plant', cat: 'wind', name: 'Over', province: 'Ontario', mw: 10, period: '201612' },
  { provinces: { Ontario: { capacityMW: { wind: 10 }, generationMWh: { wind: 10 * ENERGY_HOURS_PER_YEAR * 1.4 } } } },
)
assert.strictEqual(capped.basisId, 'plant-nameplate')
assert.strictEqual(capped.capacityFactor, 1)
assert.strictEqual(capped.powerKw, 10000)
assert.match(capped.basis, /not a factor above 1/)

assert.strictEqual(energyMinerCeiling(10, 4050), 2)
const s21 = ASIC_MACHINES.find((machine) => machine.id === 's21xp')
const priced = computeEnergyBuild({
  powerKw: remote.powerKw,
  asic: s21,
  machineCount: 10_000_000,
  btcPriceUsd: 100000,
  powerCostUsdPerKwh: 0,
})
assert.ok(priced.machineCount < 10_000_000)
assert.strictEqual(priced.machineCount, priced.ceiling)
assert.strictEqual(priced.powerCostUsdPerKwh, 0.04)
assert.strictEqual(priced.powerCostSubstituted, true)
assert.notStrictEqual(priced.powerCostUsdPerKwh, 0.7)
assert.strictEqual(priced.gensetCapexCad, 0)
assert.strictEqual(priced.fixedSetupCad, 25000)
assert.strictEqual(priced.hashpriceOptimistic, NETWORK_ESTIMATE_BTC_PER_TH_DAY)
assert.ok(priced.network.dailyRevenueBtc < priced.optimistic.dailyRevenueBtc)
assert.ok(Math.abs(priced.hashpriceNetwork - NETWORK_DERIVED_BTC_PER_TH_DAY) < 1e-15)
assert.ok(priced.optimistic.dailyPowerUsd > 0)

const noTable = assessEnergyLocation(adelaide.properties, null)
assert.strictEqual(noTable.buildable, false)
assert.match(noTable.basis, /not invented/)

console.log('energy-build ok', {
  adelaideKw: Math.round(adelaideAssess.powerKw),
  magdalenKw: Math.round(remote.powerKw),
  ceiling: priced.ceiling,
})
