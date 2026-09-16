/**
 * lib/pin-proof.ts — the OTS-backed proof state behind EVERY pin on the map.
 *
 * WHY THIS EXISTS (t_fcf032ef, deliverable 3 of t_da054829)
 * --------------------------------------------------------
 * A pin is a row in the published dataset file
 * (`public/data/stranded-sites-REAL.geojson`, 2,611 rows, byte-identical to the
 * `/data/stranded-sites.geojson` the map renders). That whole file carries one
 * Bitcoin anchor. So every pin on this map has exactly one honest answer to
 * "is this proven?", and it is the same answer for all of them:
 *
 *   the pin is covered by a file whose digest a Bitcoin block commits to.
 *
 * Three rules this module will not bend:
 *
 *   1. A registry `status` is NOT proof. Only a chain-resolved
 *      `POST /api/verify { verified:true }` (or a recorded verdict produced by
 *      exactly that call, for the exact same digest) may say "anchored".
 *   2. A recorded verdict is void the moment the dataset digest changes. We
 *      never carry a verdict across payloads — that is how a stale "confirmed"
 *      becomes a lie.
 *   3. When we cannot complete the chain check, we say so. We never upgrade a
 *      check we did not finish, and we never soften a failure.
 *
 * The state machine is the family's one shared state machine — imported from
 * the ported `components/trust/HowProofWorks.jsx`, not reimplemented.
 */
import { stateFromVerdict } from '../components/trust/HowProofWorks'

export const VERIFY_ENDPOINT = 'https://api.satohash.io/api/verify'
export const DATASET_MANIFEST_URL = '/data/dataset-manifest.json'
export const RECORDED_PROOF_URL = '/data/proof-per-pin.json'
export const SATOHASH_CLIENT = 'stranded'
/** The pin file this proof covers. Named in the UI so the claim is checkable. */
export const PIN_FILE = 'stranded-sites-REAL.geojson'

export type ProofState = 'pending' | 'confirmed' | 'not-proven'

/** The /api/verify response shape we actually read. Never guess at more. */
export type VerifyResponse = {
  verified?: boolean
  verified_method?: string | null
  trust?: string | null
  bitcoin_block_height?: number | null
  block_hash?: string | null
  block_time?: number | null
  ots_download_url?: string | null
  explainer?: string | null
  reason?: string | null
  status?: string | null
  registry_status?: string | null
  error?: string | null
}

export type DatasetManifest = {
  dataSha256?: string | null
  sha256?: string | null
  proofError?: string | null
  proof?: {
    targetSha256?: string | null
    status?: string | null
    bitcoinBlockHeight?: number | null
  } | null
  primaryFile?: { name?: string; sha256?: string | null } | null
}

export type RecordedProof = {
  targetSha256?: string | null
  checkedAt?: string | null
  endpoint?: string | null
  verdict?: VerifyResponse | null
  error?: string | null
}

export type PinProof = {
  /** confirmed | pending | not-proven — the only vocabulary we use. */
  state: ProofState
  /** The verdict to hand HowProofWorks (null when there is nothing to show). */
  verdict: VerifyResponse | null
  /** The digest under discussion (the dataset digest, not a pin-level hash). */
  hash: string | null
  /** Where the verdict came from — 'chain' is the only one that proves. */
  source: 'chain' | 'recorded' | 'none'
  /** When the chain check that produced this verdict completed. */
  checkedAt: string | null
  /** Machine reason when the state is pending or not-proven. */
  reason: string | null
}

export const EMPTY_PIN_PROOF: PinProof = {
  state: 'pending',
  verdict: null,
  hash: null,
  source: 'none',
  checkedAt: null,
  reason: 'not_checked_yet',
}

export function isHex64(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value)
}

/** The digest this dataset's Bitcoin anchor covers. */
export function datasetDigest(manifest: DatasetManifest | null): string | null {
  if (!manifest) return null
  for (const candidate of [
    manifest.dataSha256,
    manifest.primaryFile?.sha256,
    manifest.proof?.targetSha256,
  ]) {
    if (isHex64(candidate)) return candidate.toLowerCase()
  }
  return null
}

/**
 * Map a raw verify response onto the family state machine, keeping the machine
 * itself in the shared component (one state machine, no drift).
 */
function stateFor(verdict: VerifyResponse): ProofState {
  return stateFromVerdict(verdict) as ProofState
}

function proofFrom(verdict: VerifyResponse, hash: string, source: 'chain' | 'recorded', checkedAt: string | null): PinProof {
  const state = stateFor(verdict)
  return {
    state,
    // Only surface a verdict that carries a real chain fact. A bare
    // "not found" rejection is message, not evidence — HowProofWorks already
    // has honest copy for that, so we hand it the reason instead.
    verdict: state === 'confirmed' ? verdict : verdict.reason || verdict.error ? verdict : null,
    hash,
    source,
    checkedAt,
    reason: state === 'confirmed' ? null : verdict.reason || verdict.error || null,
  }
}

export type ResolveInput = {
  manifest: DatasetManifest | null
  recorded?: RecordedProof | null
  live?: VerifyResponse | null
  checkedAt?: string | null
}

/**
 * Resolve the proof state for the pin file. Pure — every input is passed in, so
 * the honesty rules can be tested without a network or a browser.
 */
export function resolvePinProof({ manifest, recorded = null, live = null, checkedAt = null }: ResolveInput): PinProof {
  const hash = datasetDigest(manifest)

  // No digest published → we have nothing anchored to point at.
  if (!hash || !manifest) {
    return {
      ...EMPTY_PIN_PROOF,
      reason: manifest?.proofError || 'no_dataset_digest',
    }
  }

  // 1. A live chain check is authoritative, either way.
  if (live) return proofFrom(live, hash, 'chain', checkedAt)

  // 2. A recorded verdict counts only for THIS digest — never carried across.
  if (recorded?.verdict && isHex64(recorded.targetSha256) && recorded.targetSha256.toLowerCase() === hash) {
    return proofFrom(recorded.verdict, hash, 'recorded', recorded.checkedAt || checkedAt)
  }

  // 3. Digests do not match: the file was re-published since the last check.
  if (recorded?.verdict && isHex64(recorded.targetSha256) && recorded.targetSha256.toLowerCase() !== hash) {
    return { ...EMPTY_PIN_PROOF, hash, reason: 'digest_changed_since_last_check' }
  }

  // 4. Nothing was ever stamped for this dataset → honestly "Not proven".
  if (!manifest.proof || manifest.proofError) {
    return { ...EMPTY_PIN_PROOF, hash, state: 'not-proven', reason: manifest.proofError || 'no_proof_recorded' }
  }

  // 5. A receipt exists but no check completed → we do not claim one.
  return { ...EMPTY_PIN_PROOF, hash, reason: 'chain_check_not_completed' }
}

export type PinProofLabels = {
  anchored: (block: string, method: string) => string
  waiting: string
  notProven: string
  unchecked: string
}

/** Plain-language, ELI16 status line — the pin's status in words a person uses. */
export function pinProofStatus(
  proof: PinProof,
  labels: Partial<PinProofLabels> = {},
): { text: string; tone: 'good' | 'wait' | 'bad' } {
  const t: PinProofLabels = {
    anchored: (block, method) => `Anchored to Bitcoin · block ${block} · ${method}`,
    waiting: 'Waiting for Bitcoin',
    notProven: 'Not proven',
    unchecked: 'Proof check did not complete',
    ...labels,
  }
  if (proof.state === 'confirmed') {
    const block = proof.verdict?.bitcoin_block_height
    const method = proof.verdict?.verified_method === 'bitcoind'
      ? 'own node'
      : proof.verdict?.verified_method === 'esplora' ? 'explorer' : 'chain-checked'
    return {
      text: t.anchored(block ? Number(block).toLocaleString() : 'unknown', method),
      tone: 'good',
    }
  }
  if (proof.state === 'not-proven') return { text: t.notProven, tone: 'bad' }
  return {
    text: proof.reason === 'chain_check_not_completed' || proof.reason === 'not_checked_yet'
      ? t.unchecked
      : t.waiting,
    tone: 'wait',
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * The proof line for the map's hover popup — the pin's status, in the same
 * words as the panel. Plain HTML string because maplibre popups take HTML.
 */
export function pinProofTeaserHtml(proof: PinProof): string {
  const { text, tone } = pinProofStatus(proof)
  const colour = tone === 'good' ? '#34D399' : tone === 'bad' ? '#F87171' : '#FBBF24'
  const glyph = tone === 'good' ? '✓' : tone === 'bad' ? '✕' : '•'
  return `<div class="text-micro mt-0.5" style="color:${colour}" data-pin-proof="${proof.state}">`
    + `${glyph} ${escapeHtml(text)}</div>`
}

// ---------------------------------------------------------------------------
// The store: one fetch per page load, shared by every pin and every surface.
// ---------------------------------------------------------------------------

let snapshot: PinProof = EMPTY_PIN_PROOF
let inflight: Promise<PinProof> | null = null
const listeners = new Set<() => void>()

export function getPinProof(): PinProof {
  return snapshot
}

export function subscribePinProof(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function publish(next: PinProof) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

/** Test/Storybook seam: seed the store without touching the network. */
export function setPinProofForTests(next: PinProof | null) {
  publish(next || EMPTY_PIN_PROOF)
  inflight = null
}

async function fetchJson(url: string, init?: RequestInit): Promise<{ status: number; body: unknown } | null> {
  try {
    const res = await fetch(url, init)
    const text = await res.text()
    let body: unknown = null
    try { body = JSON.parse(text) } catch { body = null }
    return { status: res.status, body }
  } catch {
    return null
  }
}

/**
 * Load the pin proof: the published dataset manifest, the build-recorded chain
 * verdict, then a live re-check. Never throws; every failure lands on an honest
 * 'pending' with a reason.
 */
export async function loadPinProof(): Promise<PinProof> {
  if (inflight) return inflight
  inflight = (async (): Promise<PinProof> => {
    const manifestRes = await fetchJson(DATASET_MANIFEST_URL, { cache: 'no-store' })
    const manifest = (manifestRes?.body as DatasetManifest | null) || null

    const recordedRes = await fetchJson(RECORDED_PROOF_URL, { cache: 'no-store' })
    const recorded = (recordedRes?.body as RecordedProof | null) || null

    const hash = datasetDigest(manifest)
    let live: VerifyResponse | null = null
    let checkedAt: string | null = null
    if (hash) {
      const verifyRes = await fetchJson(VERIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Satohash-Client': SATOHASH_CLIENT },
        body: JSON.stringify({ hash }),
      })
      live = verifyRes?.body ? (verifyRes.body as VerifyResponse) : null
      if (live) checkedAt = new Date().toISOString()
    }

    const resolved = resolvePinProof({ manifest, recorded, live, checkedAt })
    publish(resolved)
    inflight = null
    return resolved
  })()

  return inflight
}
