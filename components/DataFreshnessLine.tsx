'use client'

import { useEffect, useState } from 'react'

type Freshness = { generatedAt: string; buildId?: string | null }

/**
 * Honest freshness line — e.g. `Data snapshot: 11 Sep 2026 · build 20260911195241`.
 *
 * Both values come from the served `/data/live-stats.json` at runtime — never
 * hard-coded and never imported at build time — so the line reports what the
 * *deployed* snapshot actually says. When nobody pushes for a while the
 * snapshot date falls behind and the stale build becomes visible at a glance
 * instead of the KPI strip quietly drifting.
 *
 * It fetches on mount only and renders an empty (height-reserved) line during
 * SSR, so there is no hydration mismatch and no prop threading is needed.
 */
export default function DataFreshnessLine({ className = '' }: { className?: string }) {
  const [freshness, setFreshness] = useState<Freshness | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/data/live-stats.json')
      .then(r => (r.ok ? r.json() : null))
      .then((j: Freshness | null) => {
        if (alive && j?.generatedAt) {
          setFreshness({ generatedAt: j.generatedAt, buildId: j.buildId ?? null })
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const when = freshness ? new Date(freshness.generatedAt) : null
  const label =
    freshness && when && Number.isFinite(when.getTime())
      ? when.toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' })
      : ''

  return (
    <p
      data-testid="data-freshness-line"
      className={`min-h-[15px] text-[10px] leading-snug tabular-nums text-gray-500 ${className}`}
      title={
        freshness
          ? `Live-stats snapshot generated ${freshness.generatedAt}${freshness.buildId ? ` · build ${freshness.buildId}` : ''}`
          : undefined
      }
    >
      {freshness && (
        <>
          Data snapshot: <span className="text-gray-400">{label}</span>
          {freshness.buildId && (
            <>
              <span className="text-white/20"> · </span>
              build <span className="font-mono text-[#5BC0BE]/85">{freshness.buildId}</span>
            </>
          )}
        </>
      )}
    </p>
  )
}
