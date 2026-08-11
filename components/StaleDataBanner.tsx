'use client'

import { useEffect, useState } from 'react'
import { freshnessLabel, isStale } from '@/lib/stale-data'

export default function StaleDataBanner({
  generatedAt,
  maxDays = 45,
}: {
  generatedAt?: string
  maxDays?: number
}) {
  const [iso, setIso] = useState(generatedAt || '')

  useEffect(() => {
    if (generatedAt) {
      setIso(generatedAt)
      return
    }
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(j => setIso(j.generatedAt || ''))
      .catch(() => {})
  }, [generatedAt])

  if (!iso || !isStale(iso, maxDays)) return null

  return (
    <div
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[11px] text-amber-200"
      role="status"
      data-testid="stale-data-banner"
    >
      Dataset stats look stale — {freshnessLabel(iso)}. Run data refresh on next deploy.
    </div>
  )
}
