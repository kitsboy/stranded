'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LiveStats } from '@/types/live-stats'

export default function MethodologyLiveBanner() {
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const siteCount = stats?.siteCount ?? 2611
  const avgScore = stats?.totals?.avgStrandedScore

  return (
    <div
      data-testid="methodology-live-banner"
      className="not-prose mb-8 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/10 px-5 py-4 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="text-sm text-gray-200">
        <span className="font-semibold text-[#5BC0BE]">Live dataset</span>
        {' · '}
        <span className="tabular-nums">{siteCount.toLocaleString()}</span> verified sites
        {avgScore != null && (
          <>
            {' · avg Stranded Score '}
            <span className="font-mono text-[#FF8C00]">{avgScore.toFixed(1)}</span>
          </>
        )}
        {stats?.version && (
          <span className="text-gray-500"> · v{stats.version}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/data/live-stats.json" className="link-animated" target="_blank" rel="noreferrer">
          live-stats.json
        </Link>
        <Link href="/status" className="link-animated">Status</Link>
      </div>
    </div>
  )
}