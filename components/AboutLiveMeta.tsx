'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LiveStats } from '@/types/live-stats'

export default function AboutLiveMeta() {
  const [version, setVersion] = useState<string | null>(null)
  const [buildId, setBuildId] = useState<string | null>(null)
  const [siteCount, setSiteCount] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/live-stats.json').then(r => r.json()).catch(() => null),
      fetch('/status.json').then(r => r.json()).catch(() => null),
    ]).then(([stats, health]: [LiveStats | null, Record<string, unknown> | null]) => {
      setVersion(stats?.version ?? (health?.version as string) ?? null)
      setBuildId(stats?.buildId ?? (health?.buildId as string) ?? null)
      setSiteCount(stats?.siteCount ?? (health?.siteCount as number) ?? null)
    })
  }, [])

  return (
    <div
      data-testid="about-live-meta"
      className="mb-8 flex flex-wrap items-center gap-3 text-sm text-gray-400"
    >
      {version && (
        <span>
          Platform version{' '}
          <span className="font-mono text-[#FF8C00]">v{version}</span>
          {buildId && <span className="text-gray-600"> · build {buildId}</span>}
        </span>
      )}
      {siteCount != null && (
        <span className="text-gray-500">
          · {siteCount.toLocaleString()} sites in live dataset
        </span>
      )}
      <Link href="/changelog" className="link-animated text-[#5BC0BE]">
        Changelog →
      </Link>
    </div>
  )
}