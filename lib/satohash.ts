/**
 * Thin Satohash timestamp client for Stranded.
 * Public API only — no secrets. Identify traffic via X-Satohash-Client.
 *
 * Usage:
 *   import { stampHash, getApiHealth } from '@/lib/satohash'
 *   const health = await getApiHealth()
 *   const proof = await stampHash(sha256Hex, { filename: 'site-snapshot.json' })
 */

export const SATOHASH_API = 'https://api.satohash.io'
export const SATOHASH_SITE = 'https://satohash.io'
export const SATOHASH_CLIENT_ID = 'stranded'

const DEFAULT_TIMEOUT_MS = 12_000
const STAMP_TIMEOUT_MS = 35_000

export type StampResult = {
  id: string
  hash: string
  filename?: string
  status: string
  created_at?: string
  ipfs_cid?: string
  verifyUrl: string
  proofUrl: string
}

export type ApiHealth = {
  ok: boolean
  status?: string
  details?: Record<string, unknown>
  error?: string
}

function clientHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Accept: 'application/json',
    'X-Satohash-Client': SATOHASH_CLIENT_ID,
    ...extra,
  }
}

function withTimeout(ms: number, signal?: AbortSignal): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function' && !signal) {
    return AbortSignal.timeout(ms)
  }
  if (!signal && typeof AbortController !== 'undefined') {
    const c = new AbortController()
    setTimeout(() => c.abort(), ms)
    return c.signal
  }
  return signal as AbortSignal
}

/** GET /health on api.satohash.io */
export async function getApiHealth(opts?: {
  deep?: boolean
  signal?: AbortSignal
  timeoutMs?: number
}): Promise<ApiHealth> {
  try {
    const qs = opts?.deep ? '?deep=true' : ''
    const res = await fetch(`${SATOHASH_API}/health${qs}`, {
      method: 'GET',
      headers: clientHeaders(),
      signal: withTimeout(opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS, opts?.signal),
    })
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` }
    }
    const data = (await res.json()) as {
      status?: string
      details?: Record<string, unknown>
    }
    const status = data.status ?? 'unknown'
    return {
      ok: status === 'ok' || status === 'degraded',
      status,
      details: data.details,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * POST /api/stamp — timestamp a SHA-256 hex hash via OpenTimestamps.
 * @param hash 64-char hex SHA-256
 */
export async function stampHash(
  hash: string,
  opts?: {
    filename?: string
    email?: string
    signal?: AbortSignal
    timeoutMs?: number
  },
): Promise<StampResult> {
  const clean = hash.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(clean)) {
    throw new Error('Hash must be exactly 64 hex characters (SHA-256)')
  }

  const body: Record<string, string> = {
    hash: clean,
    filename: opts?.filename ?? 'stranded-snapshot',
  }
  if (opts?.email) body.email = opts.email

  const res = await fetch(`${SATOHASH_API}/api/stamp`, {
    method: 'POST',
    headers: clientHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    signal: withTimeout(opts?.timeoutMs ?? STAMP_TIMEOUT_MS, opts?.signal),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Satohash stamp failed: ${res.status} ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    id: string
    hash?: string
    filename?: string
    status?: string
    created_at?: string
    ipfs_cid?: string
  }

  if (!data.id) {
    throw new Error('Satohash stamp response missing id')
  }

  return {
    id: data.id,
    hash: data.hash ?? clean,
    filename: data.filename,
    status: data.status ?? 'pending',
    created_at: data.created_at,
    ipfs_cid: data.ipfs_cid,
    verifyUrl: `${SATOHASH_SITE}/verify/${data.id}`,
    proofUrl: `${SATOHASH_API}/api/stamps/${data.id}`,
  }
}

/** Public verify page for a stamp id or hash. */
export function satohashVerifyUrl(idOrHash: string): string {
  return `${SATOHASH_SITE}/verify/${encodeURIComponent(idOrHash)}`
}

/** Browser stamp guide with hash prefilled. */
export function satohashStampGuideUrl(hash: string): string {
  return `${SATOHASH_SITE}/stamp?hash=${encodeURIComponent(hash)}`
}
