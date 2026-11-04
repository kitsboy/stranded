/**
 * Biggest-first methane slice, and the public-chain hashprice window.
 */
import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Static named imports of these .ts modules fail Node's export scan.
// Dynamic import is how the other helper tests load them.
const { sliceTopMethane } = await import('../lib/methane-capture.ts')
const { networkRate } = await import('../lib/network-rate.ts')
const { computeGeneratorPower } = await import('../lib/sites.ts')

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = JSON.parse(fs.readFileSync(path.join(root, 'public/data/methane-capture.json'), 'utf8'))

const rows = [
  { kg: 50, vented: 40, flared: 10, split: true },
  { kg: 30, vented: null, flared: null, split: false },
  { kg: 20, vented: 0, flared: 20, split: true },
]
const top = sliceTopMethane(rows, 10)
assert.strictEqual(top.sites, 1)
assert.strictEqual(top.kg, 50)
assert.strictEqual(top.ventedKg, 40)
assert.strictEqual(top.flaredKg, 10)
assert.strictEqual(top.otherKg, 0)
assert.strictEqual(top.noSplitKg, 0)
assert.ok(top.actualShare > 0.1)

const half = sliceTopMethane(rows, 60)
assert.strictEqual(half.sites, 2)
assert.strictEqual(half.kg, 80)
assert.strictEqual(half.noSplitKg, 30)

const all = sliceTopMethane(rows, 100)
assert.strictEqual(all.sites, 3)
assert.strictEqual(all.kg, 100)
assert.strictEqual(all.flaredKg, 30)

assert.strictEqual(sliceTopMethane(rows, 0).kg, 0)

const gap = sliceTopMethane([{ kg: 100, vented: 10, flared: 5, split: true }], 100)
assert.strictEqual(gap.otherKg, 85)
assert.strictEqual(gap.ventedKg + gap.flaredKg + gap.otherKg + gap.noSplitKg, 100)
const over = sliceTopMethane([{ kg: 10, vented: 8, flared: 8, split: true }], 100)
assert.strictEqual(over.otherKg, 0)
assert.strictEqual(over.ventedKg, 8)
assert.strictEqual(over.flaredKg, 8)
assert.strictEqual(file.schema, 'gab.stranded.methane-capture.v1')
assert.ok(file.rows.length > 2000)
assert.ok(file.rows[0].kg >= file.rows[1].kg)
const splitRows = file.rows.filter((row) => row.split)
const unsplitVented = file.rows.filter((row) => !row.split && (row.vented != null || row.flared != null))
assert.strictEqual(unsplitVented.length, 0)
assert.ok(splitRows.length > 0)

const slice = sliceTopMethane(file.rows, 10)
assert.ok(slice.sites < file.rows.length / 5, 'the top 10% of the gas is a small number of sites')
assert.ok(slice.actualShare >= 0.1)
assert.ok(slice.otherKg > 0)
assert.ok(slice.ventedKg + slice.flaredKg + slice.otherKg + slice.noSplitKg <= slice.kg + 1)
assert.ok(computeGeneratorPower(slice.kg) > 0)

const rate = networkRate({
  hashrateHs: 1.020606506392738e21,
  totalRewardSats: 45238410563,
  totalFeeSats: 238410563,
  startUnix: 1793736329,
  endUnix: 1793822861,
  checkedAt: '2026-11-04T20:00:00.000Z',
})
assert.ok(rate)
assert.ok(Math.abs(rate.seconds - 86532) < 1)
assert.ok(Math.abs(rate.rewardBtc - 452.38410563) < 1e-6)
assert.ok(Math.abs(rate.ehPerS - 1020.606506392738) < 1e-6)
assert.ok(rate.btcPerThDay > 0.0000004 && rate.btcPerThDay < 0.0000005)
assert.strictEqual(networkRate({
  hashrateHs: 0,
  totalRewardSats: 1,
  totalFeeSats: 0,
  startUnix: 1,
  endUnix: 2,
  checkedAt: '',
}), null)

console.log('methane-capture ok', {
  sitesAt10: slice.sites,
  kgAt10: Math.round(slice.kg),
  btcPerThDay: rate.btcPerThDay,
})
