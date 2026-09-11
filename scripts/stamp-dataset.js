#!/usr/bin/env node
/**
 * Stranded — published-dataset provenance manifest.
 *
 * Two modes, one script, because the digest recipe must be byte-identical in both:
 *
 *   node scripts/stamp-dataset.js          offline: hash the published payload, write
 *                                          public/data/dataset-manifest.json
 *                                          (this is what `prebuild` runs — no network)
 *   npm run stamp:dataset                  offline step + submit the digests to the
 *                                          Satohash proof API (OpenTimestamps → Bitcoin)
 *
 * The network step is deliberately NOT part of the build: a flaky or down proof API must
 * never block a deploy. When submission fails the manifest still gets written with
 * `proof: null` and an honest `proofError`, and the build succeeds.
 *
 * Two digests are published, and they answer different questions:
 *
 *   dataSha256      SHA-256 of stranded-sites-REAL.geojson itself. Reproducible with a
 *                   single `sha256sum` on the downloaded file, and stable until the data
 *                   changes — so a Bitcoin timestamp on it stays meaningful across
 *                   deploys. This is the digest we timestamp as the primary proof.
 *
 *   sha256          SHA-256 over every published payload file plus a canonical manifest
 *                   block. A whole-snapshot digest: it changes whenever the statistics
 *                   file is regenerated (every build), so it is stamped per build and is
 *                   never presented as a durable anchor.
 *
 * Determinism rules (so a stranger can reproduce every published digest):
 *   - only raw published file bytes enter the hash — no timestamps, no build ids
 *   - the metadata block is a canonical JSON string (keys sorted, no whitespace)
 *   - the canonical payload is published as its own file so the reproduction command
 *     needs no shell escaping: cat <fileA> <fileB> <canonicalPayload> | sha256sum
 */
'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const MANIFEST_PATH = path.join(DATA_DIR, 'dataset-manifest.json')
const CANONICAL_PATH = path.join(DATA_DIR, 'dataset-canonical-payload.json')

// Files that make up the published dataset payload, in hashing order.
const PAYLOAD_FILES = ['stranded-sites-REAL.geojson', 'live-stats.json']
const PRIMARY_FILE = PAYLOAD_FILES[0]
const DATASET_VERSION = 1
const MAX_HISTORY = 5

const withStamp = process.argv.includes('--stamp')

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

/** Canonical JSON: object keys sorted, no whitespace. Arrays keep their order. */
function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']'
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + stableJson(value[k]))
        .join(',') +
      '}'
    )
  }
  return JSON.stringify(value)
}

function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function gzipBytes(name) {
  // Local measurement of the in-transit size. The CDN may compress slightly
  // differently; the page labels it as an approximation.
  const buf = fs.readFileSync(path.join(DATA_DIR, name))
  return zlib.gzipSync(buf, { level: 9 }).length
}

/** The API returns "YYYY-MM-DD HH:MM:SS" in UTC for some fields — normalize to ISO. */
function toIso(value) {
  if (!value || typeof value !== 'string') return null
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) return value.replace(' ', 'T') + 'Z'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Derive counts from the published GeoJSON itself — never from a hard-coded number. */
function readDatasetFacts(geoBuf) {
  const geo = JSON.parse(geoBuf.toString('utf8'))
  const features = Array.isArray(geo.features) ? geo.features : []
  let newestReferenceYear = null
  for (const f of features) {
    const y = f && f.properties ? Number(f.properties.reference_year) : NaN
    if (Number.isFinite(y) && (newestReferenceYear === null || y > newestReferenceYear)) {
      newestReferenceYear = y
    }
  }
  return { siteCount: features.length, newestReferenceYear }
}

function buildManifest() {
  const fileEntries = []
  const buffers = []
  for (const name of PAYLOAD_FILES) {
    const buf = fs.readFileSync(path.join(DATA_DIR, name))
    buffers.push(buf)
    fileEntries.push({
      name,
      url: `/data/${name}`,
      bytes: buf.length,
      sizeMb: Number((buf.length / 1024 / 1024).toFixed(2)),
      gzipBytes: gzipBytes(name),
      sha256: sha256Hex(buf),
    })
  }

  const geoBuf = buffers[0]
  const { siteCount, newestReferenceYear } = readDatasetFacts(geoBuf)
  const snapshot = readJsonIfExists(path.join(DATA_DIR, 'live-stats.json')) || {}

  const canonicalPayload = stableJson({
    datasetVersion: DATASET_VERSION,
    files: fileEntries.map((f) => ({ bytes: f.bytes, name: f.name, sha256: f.sha256 })),
    newestReferenceYear,
    siteCount,
  })

  fs.writeFileSync(CANONICAL_PATH, canonicalPayload, 'utf8') // no trailing newline
  const canonicalBuf = Buffer.from(canonicalPayload, 'utf8')

  const sha256 = sha256Hex(Buffer.concat([...buffers, canonicalBuf]))
  const primary = fileEntries.find((f) => f.name === PRIMARY_FILE)
  const dataSha256 = primary.sha256

  const previous = readJsonIfExists(MANIFEST_PATH)
  const carried = pickProof(previous, sha256, dataSha256)

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    dataSnapshotAt: snapshot.generatedAt || null,
    buildId: snapshot.buildId || null,
    appVersion: snapshot.version || null,
    sha256,
    sha256Scope:
      'sha256 of the raw bytes of ' +
      PAYLOAD_FILES.join(' + ') +
      ' followed by the bytes of dataset-canonical-payload.json',
    dataSha256,
    dataSha256Scope: `sha256 of the raw bytes of ${PRIMARY_FILE}`,
    canonicalPayloadFile: {
      name: 'dataset-canonical-payload.json',
      url: '/data/dataset-canonical-payload.json',
      bytes: canonicalBuf.length,
      sha256: sha256Hex(canonicalBuf),
      contents: canonicalPayload,
    },
    files: fileEntries,
    siteCount,
    newestReferenceYear,
    primaryFile: primary || null,
    proof: carried.proof,
    snapshotProof: carried.snapshotProof,
    proofError: carried.proofError,
    proofHistory: carried.history,
    verifyInstructions: buildInstructions(primary, dataSha256, sha256),
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
  return manifest
}

/**
 * A proof survives a rebuild only while it still covers something we publish.
 * The data-file digest is stable, so its proof persists across deploys; the whole-snapshot
 * digest is regenerated every build, so its proof is only carried within the same build.
 */
function pickProof(previous, sha256, dataSha256) {
  const priorHistory = Array.isArray(previous && previous.proofHistory) ? previous.proofHistory : []
  const seen = new Set()
  const history = priorHistory
    .filter((h) => h && h.status === 'confirmed')
    .map(normalizeHistoryEntry)
    .filter((h) => h.targetSha256 && !seen.has(h.targetSha256) && seen.add(h.targetSha256))
    .slice(0, MAX_HISTORY)

  let proof = null
  let snapshotProof = null
  let proofError = null

  if (previous) {
    if (previous.proof && previous.proof.targetSha256 === dataSha256) {
      proof = { ...previous.proof, carriedFromPreviousBuild: true }
      proofError = previous.proofError || null
    } else if (previous.proof && previous.proof.id && previous.proof.status === 'confirmed') {
      history.unshift(
        normalizeHistoryEntry({
          ...previous.proof,
          durable: true,
          superseded: true,
          note: 'Earlier data-file digest, superseded when the dataset changed — the timestamp still fixes that version in time.',
        }),
      )
    }
    if (previous.snapshotProof && previous.snapshotProof.targetSha256 === sha256) {
      snapshotProof = { ...previous.snapshotProof, carriedFromPreviousBuild: true }
    }
    if (!proof && previous.proofError) proofError = previous.proofError
  }

  return { proof, snapshotProof, proofError, history: history.slice(0, MAX_HISTORY) }
}

/** History entries predate the `targetSha256` field — normalize so de-duping works. */
function normalizeHistoryEntry(h) {
  return {
    targetSha256: h.targetSha256 || h.sha256 || null,
    target: h.target || 'earlier published digest',
    durable: Boolean(h.durable),
    id: h.id,
    status: h.status,
    submittedAt: toIso(h.submittedAt),
    confirmedAt: toIso(h.confirmedAt),
    bitcoinBlockHeight: h.bitcoinBlockHeight || null,
    verifyUrl: h.verifyUrl || null,
    superseded: true,
    note: h.note || 'Earlier published digest, superseded by a later build — the timestamp still fixes that version in time.',
  }
}

function buildInstructions(primary, dataSha256, sha256) {
  return [
    `Download the files from this page (right-click → Save link as, or use the download links).`,
    `On macOS, Linux or WSL run: sha256sum ${PRIMARY_FILE}`,
    `Compare that output with the published data-file SHA-256${primary ? ': ' + dataSha256 : ''}. It must match exactly.`,
    `Run: sha256sum live-stats.json and compare with the value listed for that file.`,
    `To reproduce the full dataset digest, download dataset-canonical-payload.json as well, then run: cat ${PAYLOAD_FILES[0]} ${PAYLOAD_FILES[1]} dataset-canonical-payload.json > stranded-payload.bin`,
    `Then run: sha256sum stranded-payload.bin — it must equal ${sha256}.`,
    'The canonical payload file is a sorted list of file names, sizes and digests with no timestamps in it, so the full dataset digest depends only on the published data, not on when you run it.',
    'If a timestamp is published above, open its verification link to see the Bitcoin block that anchors that digest.',
  ]
}

function short(e) {
  const msg = e instanceof Error ? e.message : String(e)
  return msg.length > 180 ? msg.slice(0, 180) + '…' : msg
}

/** POST one digest and read back its current state. Never throws. */
async function stampOne(satohash, target, label, filename, durable) {
  const stamp = await satohash.stampHash(target, { filename })
  const record = {
    targetSha256: target,
    target: label,
    durable: Boolean(durable),
    id: stamp.id,
    filename,
    status: stamp.status || 'pending',
    submittedAt: toIso(stamp.created_at) || new Date().toISOString(),
    confirmedAt: toIso(stamp.confirmedAt),
    bitcoinBlockHeight: stamp.bitcoinBlockHeight || null,
    verifyUrl: stamp.verifyUrl,
    checkedAt: new Date().toISOString(),
  }

  // Fresh submissions start as "pending"; look up the record's current state so a
  // confirmed stamp is never rendered as merely submitted.
  if (record.status !== 'confirmed') {
    const live = await satohash.findStampByHash(target).catch(() => null)
    if (live) {
      record.status = live.status || record.status
      record.confirmedAt = toIso(live.confirmed_at) || record.confirmedAt
      record.bitcoinBlockHeight = live.bitcoin_block_height || record.bitcoinBlockHeight
      if (live.id) record.verifyUrl = `${satohash.SATOHASH_SITE}/verify/${live.id}`
      record.checkedAt = new Date().toISOString()
    }
  }

  console.log(
    `→ POST /api/stamp ${target.slice(0, 12)}… HTTP 200 · id ${record.id} · status ${record.status}` +
      (record.bitcoinBlockHeight ? ` · block ${record.bitcoinBlockHeight}` : '') +
      ` · ${record.verifyUrl}`,
  )
  return record
}

/** Records earlier confirmed stamps so the page can show a checkable anchor today. */
async function collectConfirmedHistory(satohash, manifest, currentTargets) {
  const existing = Array.isArray(manifest.proofHistory) ? manifest.proofHistory : []
  const found = await satohash.listRecentStamps({ maxPages: 8 })
  const mine = found.filter(
    (s) =>
      s &&
      (s.client === satohash.SATOHASH_CLIENT_ID || s.client_id === satohash.SATOHASH_CLIENT_ID) &&
      s.status === 'confirmed' &&
      s.hash &&
      !currentTargets.includes(s.hash),
  )

  const merged = [...existing]
  for (const s of mine) {
    if (merged.some((h) => (h.targetSha256 || h.sha256) === s.hash)) continue
    merged.push({
      targetSha256: s.hash,
      target: 'earlier published digest',
      durable: false,
      id: s.id,
      status: s.status,
      submittedAt: toIso(s.created_at),
      confirmedAt: toIso(s.confirmed_at),
      bitcoinBlockHeight: s.bitcoin_block_height || null,
      verifyUrl: `${satohash.SATOHASH_SITE}/verify/${s.id}`,
      superseded: true,
      note: 'Earlier published digest, superseded by a later build — the timestamp still fixes that version in time.',
    })
  }
  return merged.filter((h) => h && h.status === 'confirmed').slice(0, MAX_HISTORY)
}

async function submitProofs(manifest) {
  // lib/satohash.ts is the family's OTS client. Loaded lazily so the offline
  // prebuild path never needs the TypeScript loader.
  let satohash
  try {
    satohash = require('../lib/satohash.ts')
  } catch (e) {
    return { proof: null, snapshotProof: null, proofError: `stamp client unavailable: ${short(e)}` }
  }

  try {
    const proof = await stampOne(satohash, manifest.dataSha256, manifest.primaryFile.name, manifest.primaryFile.name, true)
    const snapshotProof = await stampOne(satohash, manifest.sha256, 'full dataset snapshot', 'stranded-dataset.json', false)

    const history = await collectConfirmedHistory(satohash, manifest, [manifest.dataSha256, manifest.sha256]).catch(
      () => manifest.proofHistory || [],
    )

    return { proof, snapshotProof, proofError: null, history }
  } catch (e) {
    return {
      proof: manifest.proof || null,
      snapshotProof: manifest.snapshotProof || null,
      proofError: short(e),
      history: manifest.proofHistory || [],
    }
  }
}

async function main() {
  const manifest = buildManifest()
  console.log(
    `✓ dataset-manifest.json — snapshot sha256 ${manifest.sha256.slice(0, 16)}… · data file sha256 ${manifest.dataSha256.slice(0, 16)}…`,
  )
  console.log(`  ${manifest.siteCount} sites · newest reference year ${manifest.newestReferenceYear}`)

  if (!withStamp) {
    console.log('  offline mode — no network submission (run `npm run stamp:dataset` to timestamp)')
    return
  }

  const result = await submitProofs(manifest)
  const next = {
    ...manifest,
    proof: result.proof,
    snapshotProof: result.snapshotProof,
    proofError: result.proofError,
    proofHistory: result.history,
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(next, null, 2) + '\n')

  if (result.proof) {
    console.log(`✓ manifest updated with proof (${result.proof.status}) — commit public/data/dataset-manifest.json`)
  } else {
    console.warn(`! stamp submission failed (non-fatal, build unaffected): ${result.proofError}`)
    console.warn('  manifest written with proof: null — the site will say the digest is not timestamped')
  }
}

main().catch((e) => {
  // The build must never fail on provenance plumbing.
  console.error(`! stamp-dataset: ${e && e.stack ? e.stack : e}`)
  process.exitCode = 0
})
