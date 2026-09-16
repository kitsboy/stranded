#!/usr/bin/env node
/**
 * Stranded — per-pin proof record (the Bitcoin anchor behind every map pin).
 *
 * Every pin on this map is one row of `stranded-sites-REAL.geojson`. That file
 * carries one OpenTimestamps proof, so the honest answer to "is this pin
 * proven?" is the answer for the file — the same answer for all 2,611 pins.
 *
 *   node scripts/generate-pin-proofs.js            offline (prebuild): carries a
 *                                                  matching verdict forward, or
 *                                                  writes an honest no-verdict
 *   npm run proof:refresh                          asks the live verify API for a
 *                                                  chain-resolved verdict and
 *                                                  records it
 *
 * Deliberately NOT a build gate: a flaky or unreachable proof API must never
 * block a deploy (same rule as stamp-dataset.js). The build succeeds; the
 * published record just says, truthfully, that no check completed.
 *
 * The record is void the moment the dataset digest changes: the client refuses
 * to reuse a verdict whose targetSha256 does not match the live manifest, so a
 * stale "confirmed" can never be served against a re-published file.
 */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const MANIFEST_PATH = path.join(DATA_DIR, 'dataset-manifest.json')
const OUT_PATH = path.join(DATA_DIR, 'proof-per-pin.json')

const VERIFY_ENDPOINT = 'https://api.satohash.io/api/verify'
const CLIENT_ID = 'stranded'
const TIMEOUT_MS = 20_000
const MAX_HISTORY = 3

const withRefresh = process.argv.includes('--refresh')

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return null }
}

function isHex64(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value)
}

/** The digest the Bitcoin anchor covers — dataSha256 is the primary one. */
function digestFromManifest(manifest) {
  if (!manifest) return null
  const candidates = [
    manifest.dataSha256,
    manifest.primaryFile && manifest.primaryFile.sha256,
    manifest.proof && manifest.proof.targetSha256,
  ]
  for (const c of candidates) if (isHex64(c)) return c.toLowerCase()
  return null
}

/** Ask the live API for a chain-resolved verdict. Returns null on ANY failure. */
async function liveVerdict(hash) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Satohash-Client': CLIENT_ID },
      body: JSON.stringify({ hash }),
      signal: controller.signal,
    })
    // The API answers 404 with a JSON rejection body — read it either way.
    const text = await res.text()
    let body = null
    try { body = JSON.parse(text) } catch { body = null }
    if (!body || typeof body !== 'object') return null
    return {
      verified: body.verified === true,
      verified_method: body.verified_method || null,
      trust: body.trust || null,
      bitcoin_block_height: body.bitcoin_block_height || null,
      block_hash: body.block_hash || null,
      block_time: body.block_time || null,
      ots_download_url: body.ots_download_url || null,
      explainer: body.explainer || null,
      reason: body.reason || null,
      registry_status: body.registry_status || (body.registry && body.registry.status) || null,
      error: body.error || null,
      httpStatus: res.status,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const manifest = readJson(MANIFEST_PATH)
  const previous = readJson(OUT_PATH)
  const hash = digestFromManifest(manifest)

  const record = {
    version: 1,
    generatedAt: new Date().toISOString(),
    endpoint: VERIFY_ENDPOINT,
    file: 'stranded-sites-REAL.geojson',
    scope:
      'One digest covers every pin: sha256 of the published stranded-sites-REAL.geojson '
      + '(byte-identical to /data/stranded-sites.geojson, which the map renders), '
      + 'reproducible with `sha256sum stranded-sites-REAL.geojson`.',
    targetSha256: hash,
    verdict: null,
    error: null,
    carriedFromPreviousBuild: false,
    history: Array.isArray(previous && previous.history) ? previous.history.slice(0, MAX_HISTORY) : [],
  }

  if (!hash) {
    record.error = 'dataset manifest has no sha256 yet — nothing to record'
    fs.writeFileSync(OUT_PATH, JSON.stringify(record, null, 2) + '\n')
    console.log('pin-proofs: no dataset digest in manifest — wrote an honest empty record')
    return
  }

  const carriedOk =
    previous && previous.verdict &&
    isHex64(previous.targetSha256) && previous.targetSha256.toLowerCase() === hash

  if (carriedOk) {
    record.verdict = previous.verdict
    record.carriedFromPreviousBuild = true
    record.error = previous.error || null
    record.checkedAt = previous.checkedAt || null
  }

  if (withRefresh) {
    const fresh = await liveVerdict(hash)
    if (fresh) {
      const checkedAt = new Date().toISOString()
      record.verdict = fresh
      record.checkedAt = checkedAt
      record.carriedFromPreviousBuild = false
      record.error = null
      record.history = [
        {
          targetSha256: hash,
          checkedAt,
          verified: fresh.verified,
          verified_method: fresh.verified_method,
          bitcoin_block_height: fresh.bitcoin_block_height,
          reason: fresh.reason,
          error: fresh.error,
        },
        ...record.history.filter((h) => h && h.checkedAt !== checkedAt),
      ].slice(0, MAX_HISTORY)
      console.log(
        `pin-proofs: live verdict verified=${fresh.verified} method=${fresh.verified_method} block=${fresh.bitcoin_block_height}`,
      )
    } else {
      record.error = 'verify API unreachable or unreadable — no chain claim recorded for this build'
      console.log('pin-proofs: verify API unreachable — recorded no verdict (build continues)')
    }
  }

  if (previous && previous.verdict && !carriedOk && !withRefresh) {
    record.error = 'recorded verdict dropped: dataset digest changed since the last chain check'
    console.log('pin-proofs: digest changed — dropped the previous verdict rather than reuse it')
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(record, null, 2) + '\n')
  console.log(
    `pin-proofs: wrote ${path.relative(ROOT, OUT_PATH)} target=${hash.slice(0, 12)}… verdict=${record.verdict ? (record.verdict.verified ? 'verified' : 'rejected') : 'none'}`,
  )
}

main().catch((err) => {
  // Never fail the build for a proof record.
  console.log('pin-proofs: unexpected error, build continues —', err && err.message ? err.message : err)
})
