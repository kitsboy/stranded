// stranded.giveabit.io — shared input-hardening + rate-limit guard for Pages Functions.
// Mirrors the proven giveabit family pattern (self-contained copy; do NOT import across repos).
// Production-grade edge rate limiting requires the Cloudflare dashboard rule (Cam's lane);
// this is best-effort in-memory per-isolate burst protection plus honest advisory headers.

export const ALLOWED_ORIGIN = 'https://stranded.giveabit.io'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Strip control chars, trim, hard length cap. Never trust raw client input.
export function sanitizeStr(v, max = 200) {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
}

export function isValidEmail(v, max = 254) {
  return typeof v === 'string' && v.length <= max && EMAIL_RE.test(v.trim())
}

// Best-effort in-memory sliding-window burst limiter (per-isolate).
// NOT a substitute for the Cloudflare dashboard rate-limiting rule.
const WINDOW_MS = 60_000
const LIMIT = 60
const hits = new Map()

export function rateLimit(req, { limit = LIMIT, windowMs = WINDOW_MS } = {}) {
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  const now = Date.now()
  const bucket = hits.get(ip)
  if (!bucket || now - bucket.t0 > windowMs) {
    hits.set(ip, { t0: now, n: 1 })
    return { allowed: true, remaining: limit - 1, retryAfter: null }
  }
  bucket.n += 1
  if (bucket.n > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.t0 + windowMs - now) / 1000),
    }
  }
  return { allowed: true, remaining: limit - bucket.n, retryAfter: null }
}

export function rateHeaders(req, opts) {
  const r = rateLimit(req, opts)
  const base = {
    'X-RateLimit-Limit': String(opts?.limit || LIMIT),
    'X-RateLimit-Window': '60',
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Policy': `${opts?.limit || LIMIT}/min/IP (in-memory best-effort; CF dashboard rule is authoritative)`,
  }
  if (!r.allowed) base['Retry-After'] = String(r.retryAfter)
  return { ...base, allowed: r.allowed }
}
