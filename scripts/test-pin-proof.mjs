/**
 * Real-path unit tests for the pin-proof resolver (lib/pin-proof.ts).
 *
 * These pin the HONESTY rules, not pixels:
 *   1. only verified:true from the chain may say "confirmed" — a registry
 *      status or a pending stamp never can
 *   2. a recorded verdict is void the moment the dataset digest changes
 *   3. forged / unresolved digests render "not-proven" — never softened
 *   4. a check we could not complete is reported as not-completed, never
 *      upgraded
 *   5. the one state machine is the shared HowProofWorks one (imported, not
 *      reimplemented)
 *
 * Run: node --import tsx scripts/test-pin-proof.mjs
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  resolvePinProof,
  datasetDigest,
  pinProofStatus,
  isHex64,
} = await import('../lib/pin-proof.ts')

const HASH = '28c99c26607b33048cae81bb0a8df50f96e101a99d3e80ed148001b128e7208b'
const OTHER = 'a'.repeat(64)

const chainVerdict = {
  verified: true,
  verified_method: 'bitcoind',
  trust: 'self-sovereign',
  bitcoin_block_height: 966549,
  block_hash: 'b'.repeat(64),
  block_time: 1789156479,
  ots_download_url: 'https://api.satohash.io/api/stamps/74449082-7b9b-4667-b5ff-7ef6e092484b?download=true',
  explainer: "Verified against Satohash's own Bitcoin node — block 966549.",
  reason: null,
}

const manifest = {
  dataSha256: HASH,
  proof: { targetSha256: HASH, status: 'confirmed', bitcoinBlockHeight: 966549 },
}

// 1. confirmed only from a chain-resolved verdict
{
  const p = resolvePinProof({ manifest, live: chainVerdict })
  assert.equal(p.state, 'confirmed')
  assert.equal(p.source, 'chain')
  assert.equal(p.verdict.verified_method, 'bitcoind')
  assert.equal(p.verdict.bitcoin_block_height, 966549)
}

// 1b. a registry status alone is NEVER proof
{
  const p = resolvePinProof({
    manifest: { dataSha256: HASH, proof: { status: 'confirmed', bitcoinBlockHeight: 999999 } },
    recorded: null,
    live: null,
  })
  assert.equal(p.state, 'pending', 'registry status must not upgrade to confirmed')
  assert.equal(p.reason, 'chain_check_not_completed')
  assert.equal(p.verdict, null)
}

// 2. recorded verdict reused ONLY for the exact same digest
{
  const recorded = { targetSha256: HASH, checkedAt: '2026-09-16T12:00:00Z', verdict: chainVerdict }
  const p = resolvePinProof({ manifest, recorded })
  assert.equal(p.state, 'confirmed')
  assert.equal(p.source, 'recorded')
}

// 2b. digest changed → the old verdict is VOID, not downgraded-and-reused
{
  const recorded = { targetSha256: OTHER, checkedAt: '2026-09-16T12:00:00Z', verdict: chainVerdict }
  const p = resolvePinProof({ manifest, recorded })
  assert.equal(p.state, 'pending')
  assert.equal(p.verdict, null, 'a verdict for another digest must never be surfaced')
  assert.equal(p.reason, 'digest_changed_since_last_check')
}

// 3. forged / unresolved → not-proven
{
  const forged = resolvePinProof({
    manifest,
    live: { verified: false, reason: 'merkle_root_mismatch', error: null },
  })
  assert.equal(forged.state, 'not-proven')
  const notFound = resolvePinProof({
    manifest,
    live: { verified: false, reason: null, error: 'Hash not found in registry.' },
  })
  assert.equal(notFound.state, 'not-proven')
}

// 3b. pending stamp is pending, never dressed up
{
  const pending = resolvePinProof({
    manifest,
    live: { verified: false, reason: 'no_block_attestation', status: 'pending' },
  })
  assert.equal(pending.state, 'pending')
}

// 4. an unreachable check reports itself, not a verdict
{
  const p = resolvePinProof({ manifest, recorded: null, live: null })
  assert.equal(p.state, 'pending')
  assert.equal(p.reason, 'chain_check_not_completed')
}

// 4b. no proof ever recorded → honestly "not proven"
{
  const p = resolvePinProof({ manifest: { dataSha256: HASH, proofError: 'stamp API down' } })
  assert.equal(p.state, 'not-proven')
  assert.equal(p.verdict, null)
}

// 4c. no digest at all → nothing to claim
{
  const p = resolvePinProof({ manifest: null })
  assert.equal(p.state, 'pending')
  assert.equal(p.hash, null)
}

// 5. status text is plain-language and honest per state
{
  const confirmed = resolvePinProof({ manifest, live: chainVerdict })
  const s = pinProofStatus(confirmed)
  assert.ok(s.text.includes('966,549'))
  assert.ok(s.text.includes('own node'))
  assert.equal(s.tone, 'good')
  const bad = pinProofStatus(resolvePinProof({ manifest, live: { verified: false, reason: 'merkle_root_mismatch' } }))
  assert.equal(bad.text, 'Not proven')
  assert.equal(bad.tone, 'bad')
}

// helpers
assert.equal(isHex64(HASH), true)
assert.equal(isHex64('short'), false)
assert.equal(isHex64(HASH.toUpperCase()), true)
assert.equal(datasetDigest(manifest), HASH)
assert.equal(datasetDigest(null), null)
assert.equal(datasetDigest({ dataSha256: 'not-hex' }), null)

console.log('test-pin-proof: ALL PASSED')
