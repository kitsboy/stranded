import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as fleet from '../lib/fleet-template.ts'
import { computeFleetModel } from '../lib/fleet-model.ts'

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`)
// Independent fixture: 220 Nm³/h × 24 h × 0.717 kg/Nm³ supplies exactly
// one 850 kW J316, derated to 765 kW. More units cannot create fuel.
const fixture = { emission: 3785.76 }
const j = count => [{ gensetId: 'jenbacher316', count }]
close(fleet.siteGasCeilingKw(fixture, j(1)), 765)
close(fleet.siteGasCeilingKw(fixture, j(2)), 765)
close(fleet.siteGasCeilingKw({ emission: 37857.6 }, j(1)), 765)
close(fleet.siteGasCeilingKw(fixture, []), 0)
close(fleet.siteGasCeilingKw({}, j(9)), 0)

// Mixed dispatch is efficiency-first: J316 consumes 3785.76 kg/day, then
// mobile250 consumes the remaining 1462.68 kg/day, for 765 + 225 kW.
const mixed = [{ gensetId: 'mobile250', count: 1 }, ...j(1)]
const mixedSite = { emission: 5248.44 }
close(fleet.siteGasCeilingKw(mixedSite, mixed), 990)
close(fleet.siteGasCeilingKw(mixedSite, [...mixed].reverse()), 990)
for (const site of [{}, fixture, mixedSite, { emission: 100000 }]) {
  for (const gensets of [[], j(0), j(1), j(99), mixed, [...j(1), ...j(1)]]) {
    for (const demand of [0, 100, 900, Infinity]) {
      const d = fleet.dispatchSiteGas(site, gensets, 0.9, demand)
      close(d.consumedKgPerDay + d.unconvertedKgPerDay, site.emission || 0)
      close(d.allocations.reduce((sum, a) => sum + a.fuelKgPerDay, 0), d.consumedKgPerDay)
      assert.ok(d.powerKw <= d.installedDeratedKw + 1e-7)
      assert.ok(d.powerKw <= demand)
      assert.ok(d.consumedKgPerDay >= 0 && d.unconvertedKgPerDay >= 0)
      assert.ok(d.powerKw <= (site.emission || 0) * 50 / 3.6 / 24)
    }
  }
}
const base = fleet.MINER_STACK_PRESETS[0]
const noUnits = fleet.unusedCapacity(fixture, { ...base, gensets: [], minerCount: 20 })
close(noUnits.unconvertedKgPerDay, fixture.emission)
close(noUnits.consumedKgPerDay, 0)
const underfilled = fleet.unusedCapacity(mixedSite, { ...base, gensets: mixed, minerCount: 200 })
close(underfilled.consumedKgPerDay, 3785.76 + 45 * 24 * 0.717 * 85 / (250 * 0.9))
close(fleet.methaneKgPerDayForPower(765, 'jenbacher316'), fixture.emission)

const geo = JSON.parse(readFileSync(new URL('../data/stranded-sites-REAL.geojson', import.meta.url)))
const mission = geo.features.find(f => f.properties.ghgrp_id === 'G12350')
assert.ok(mission)
assert.equal(mission.properties.name, 'Mission Landfill')
const input = {
  site: mission, asic: fleet.ASIC_MACHINES[0], gensets: j(1), machineCount: 9999,
  overclockPercent: 0, btcPrice: 85000,
  btcPrices: { usd: 85000, cad: 114750, eur: 75000, gbp: 65000, jpy: 12000000 },
  uptimePercent: 95, poolFeePercent: 1.5, maintenanceAnnualPercent: 5,
  revenuePerThPerDayBtc: 0.0000009, fixedSetupCostCad: 25000,
  debtPercent: 0, interestRate: 0,
}
// Independent arithmetic from pinned G12350 input + stated manufacturer flow ratings.
const expectedKw = [2635.62 / 0.717 / 24 / 220 * 850 * 0.9, 2635.62 / 0.717 / 24 / 390 * 1500 * 0.9, 225, 2635.62 / 0.717 / 24 / 480 * 2000 * 0.9, 2635.62 / 0.717 / 24 / 220 * 850 * 0.9]
const results = []
for (const [i, preset] of fleet.MINER_STACK_PRESETS.entries()) {
  const resolved = fleet.resolveFleetForSite(preset, mission)
  assert.deepEqual(resolved.gensets, preset.gensets)
  const preview = computeFleetModel({ ...input, gensets: resolved.gensets, asic: fleet.asicById(resolved.asicId), machineCount: resolved.minerCount })
  const applied = fleet.resolveFleetForSite(fleet.decodeFleet(new URLSearchParams(fleet.encodeFleet(resolved))), mission)
  const model = computeFleetModel({ ...input, gensets: applied.gensets, asic: fleet.asicById(applied.asicId), machineCount: applied.minerCount })
  assert.deepEqual(model, preview)
  close(model.generatorPowerKw, expectedKw[i])
  const exported = fleet.fleetBlockData({ template: applied, site: mission })
  close(exported.gasCeilingKw, model.generatorPowerKw)
  close(exported.minerCount, model.effectiveMachineCount)
  assert.equal(exported.ventedKgPerDay, null, 'unknown baseline must not invent venting')
  close(fleet.resolveFleetForSite(preset, {}).minerCount, 0)
  results.push({ id: preset.id, gensets: resolved.gensets, miners: model.effectiveMachineCount, kw: model.generatorPowerKw, satsPerDay: model.effectiveDailyBtc * 1e8 })
}
// Overclock and excess purchased miners must not earn on unsupported load.
const oc = computeFleetModel({ ...input, overclockPercent: 20 })
assert.ok(oc.usedPowerKw <= oc.generatorPowerKw)
assert.equal(oc.effectiveMachineCount, Math.floor(oc.generatorPowerKw * 1000 / (4050 * 1.2 * 1.1)))
close(oc.hardwareCostBtc, 9999 * 8500 / 114750)
const empty = { ...base, mode: 'manual', minerCount: 0, gensets: [] }
assert.deepEqual(fleet.decodeFleet(new URLSearchParams(fleet.encodeFleet(empty))).gensets, [])
assert.equal(fleet.resolveFleetForSite(empty, fixture).minerCount, 0)
const clocked = { ...base, overclockPercent: 20 }
const clockedResolved = fleet.resolveFleetForSite(clocked, mission)
const clockedBack = fleet.decodeFleet(new URLSearchParams(fleet.encodeFleet(clockedResolved)))
assert.equal(clockedBack.overclockPercent, 20)
assert.deepEqual(fleet.resolveFleetForSite(clockedBack, mission), clockedResolved)
const clockedBlock = fleet.fleetBlockData({ template: clockedResolved, site: mission })
close(clockedBlock.usedPowerKw, clockedResolved.minerCount * 4050 * 1.2 * 1.1 / 1000)
assert.equal(fleet.estimateFleetPaybackDays({ template: base, site: mission, paybackDays: null }), null)
assert.equal(fleet.estimateFleetPaybackDays({ template: { ...base, minerCount: 9999 }, site: {} }), null)
const unsupported = fleet.fleetBlockData({ template: { ...base, minerCount: 9999 }, site: mission })
assert.equal(unsupported.poweredMinerCount, 131)
assert.equal(unsupported.unsupportedMinerCount, 9868)
const { bankPackCsv, bankPackTsv } = await import('../lib/bank-pack.ts')
for (const fn of [bankPackCsv, bankPackTsv]) {
  const text = fn([], { fleet: { template: empty, site: mission, paybackDays: null } })
  assert.ok(text.includes('powered_miners') && text.includes('unknown') && text.includes('unavailable'))
}
const stored = new Map()
globalThis.localStorage = { getItem: k => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v) }
const record = fleet.saveNamedFleet('Mixed saved', { ...clockedResolved, gensets: mixed })
assert.deepEqual(fleet.listNamedFleets()[0], record)
assert.deepEqual(fleet.resolveFleetForSite(record.template, mission).gensets, mixed)
delete globalThis.localStorage
console.log(JSON.stringify({ fixture: 'G12350', emissionKgDay: mission.properties.emission_rate_kg_day, results }, null, 2))
console.log('test-fuel-budget: ALL PASSED')
