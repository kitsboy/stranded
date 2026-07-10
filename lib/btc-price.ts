/** Shared BTC price fetch with timeout + soft fallback (single source of truth). */

export const DEFAULT_BTC_USD = 85000

export type BtcFiatMap = {
  usd: number
  eur: number
  jpy: number
  gbp: number
  cad: number
}

export const DEFAULT_BTC_FIATS: BtcFiatMap = {
  usd: DEFAULT_BTC_USD,
  eur: 78000,
  jpy: 12_500_000,
  gbp: 65_000,
  cad: 115_000,
}

const COINGECKO_SIMPLE =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,jpy,gbp,cad'

export async function fetchBtcPrices(timeoutMs = 8000, signal?: AbortSignal): Promise<BtcFiatMap | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const onOuterAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onOuterAbort)
  try {
    const res = await fetch(COINGECKO_SIMPLE, {
      signal: ctrl.signal,
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
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onOuterAbort)
  }
}

export async function fetchBtcUsd(timeoutMs = 8000, signal?: AbortSignal): Promise<number | null> {
  const map = await fetchBtcPrices(timeoutMs, signal)
  return map?.usd ?? null
}
