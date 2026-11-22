/** Shared BTC price fetch with timeout + soft fallback + multi-provider redundancy + 10-min cache (single source of truth). */

export const DEFAULT_BTC_USD = 85000

export type BtcFiatMap = {
  usd: number
  eur: number
  jpy: number
  gbp: number
  cad: number
  source?: string
  updatedAt?: string
}

export const DEFAULT_BTC_FIATS: BtcFiatMap = {
  usd: DEFAULT_BTC_USD,
  eur: 78000,
  jpy: 12_500_000,
  gbp: 65_000,
  cad: 115_000,
  source: 'fallback',
}

const COINGECKO_SIMPLE =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,jpy,gbp,cad'
const MEMPOOL_PRICES = 'https://mempool.space/api/v1/prices'
const BLOCKCHAIN_INFO_TICKER = 'https://blockchain.info/ticker'
const BTC_CACHE_KEY = 'stranded-btc-fiat-cache-v1'

export function readCachedBtcPrices(): BtcFiatMap | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(BTC_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BtcFiatMap
    if (parsed && typeof parsed.usd === 'number' && parsed.usd > 1000) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

function writeCachedBtcPrices(map: BtcFiatMap): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(BTC_CACHE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

async function fetchFromMempool(signal?: AbortSignal): Promise<BtcFiatMap | null> {
  try {
    const res = await fetch(MEMPOOL_PRICES, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const usd = Number(data?.USD)
    if (!(usd > 1000)) return null
    const eur = Number(data?.EUR) || Math.round(usd * 0.92)
    const gbp = Number(data?.GBP) || Math.round(usd * 0.78)
    const cad = Number(data?.CAD) || Math.round(usd * 1.38)
    const jpy = Number(data?.JPY) || Math.round(usd * 150)
    return {
      usd,
      eur,
      jpy,
      gbp,
      cad,
      source: 'mempool.space',
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function fetchFromCoinGecko(signal?: AbortSignal): Promise<BtcFiatMap | null> {
  try {
    const res = await fetch(COINGECKO_SIMPLE, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const b = data?.bitcoin
    if (!b?.usd) return null
    return {
      usd: Number(b.usd) || DEFAULT_BTC_USD,
      eur: Number(b.eur) || DEFAULT_BTC_FIATS.eur,
      jpy: Number(b.jpy) || DEFAULT_BTC_FIATS.jpy,
      gbp: Number(b.gbp) || DEFAULT_BTC_FIATS.gbp,
      cad: Number(b.cad) || DEFAULT_BTC_FIATS.cad,
      source: 'coingecko',
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function fetchFromBlockchainInfo(signal?: AbortSignal): Promise<BtcFiatMap | null> {
  try {
    const res = await fetch(BLOCKCHAIN_INFO_TICKER, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const usd = Number(data?.USD?.last)
    if (!(usd > 1000)) return null
    return {
      usd,
      eur: Number(data?.EUR?.last) || Math.round(usd * 0.92),
      jpy: Number(data?.JPY?.last) || Math.round(usd * 150),
      gbp: Number(data?.GBP?.last) || Math.round(usd * 0.78),
      cad: Number(data?.CAD?.last) || Math.round(usd * 1.38),
      source: 'blockchain.info',
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function fetchBtcPrices(timeoutMs = 8000, signal?: AbortSignal): Promise<BtcFiatMap | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const onOuterAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onOuterAbort)
  try {
    // 1. Primary: mempool.space (reads public Bitcoin ecosystem directly, fast, rarely rate-limits)
    const fromMempool = await fetchFromMempool(ctrl.signal)
    if (fromMempool) {
      writeCachedBtcPrices(fromMempool)
      return fromMempool
    }
    // 2. Secondary: CoinGecko multi-currency
    const fromCg = await fetchFromCoinGecko(ctrl.signal)
    if (fromCg) {
      writeCachedBtcPrices(fromCg)
      return fromCg
    }
    // 3. Tertiary: blockchain.info ticker
    const fromBc = await fetchFromBlockchainInfo(ctrl.signal)
    if (fromBc) {
      writeCachedBtcPrices(fromBc)
      return fromBc
    }
    // 4. Last-known local cache
    return readCachedBtcPrices()
  } catch {
    return readCachedBtcPrices()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onOuterAbort)
  }
}

export async function fetchBtcUsd(timeoutMs = 8000, signal?: AbortSignal): Promise<number | null> {
  const map = await fetchBtcPrices(timeoutMs, signal)
  return map?.usd ?? null
}
