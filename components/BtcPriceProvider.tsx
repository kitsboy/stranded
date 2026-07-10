'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import {
  DEFAULT_BTC_FIATS,
  DEFAULT_BTC_USD,
  fetchBtcPrices,
  type BtcFiatMap,
} from '@/lib/btc-price'

type BtcPriceContextValue = {
  usd: number
  fiats: BtcFiatMap
  loading: boolean
  stale: boolean
  refresh: () => void
}

const BtcPriceContext = createContext<BtcPriceContextValue>({
  usd: DEFAULT_BTC_USD,
  fiats: DEFAULT_BTC_FIATS,
  loading: false,
  stale: true,
  refresh: () => {},
})

const POLL_MS = 95_000

export function BtcPriceProvider({ children }: { children: React.ReactNode }) {
  const [fiats, setFiats] = useState<BtcFiatMap>(DEFAULT_BTC_FIATS)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(true)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const ac = new AbortController()
    setLoading(true)
    fetchBtcPrices(8000, ac.signal).then(map => {
      if (cancelled) return
      if (map) {
        setFiats(map)
        setStale(false)
      } else {
        setStale(true)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [tick])

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), POLL_MS)
    return () => clearInterval(id)
  }, [])

  const value = useMemo(
    () => ({
      usd: fiats.usd,
      fiats,
      loading,
      stale,
      refresh,
    }),
    [fiats, loading, stale, refresh]
  )

  return <BtcPriceContext.Provider value={value}>{children}</BtcPriceContext.Provider>
}

export function useBtcPrice(): BtcPriceContextValue {
  return useContext(BtcPriceContext)
}

export function useBtcUsd(fallback = DEFAULT_BTC_USD): number {
  const { usd } = useBtcPrice()
  return usd || fallback
}
