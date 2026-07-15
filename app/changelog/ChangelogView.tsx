'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'

export default function ChangelogView({ initialContent }: { initialContent: string }) {
  const [version, setVersion] = useState<string | null>(null)
  const [buildId, setBuildId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then((s: LiveStats) => {
        setVersion(s.version)
        setBuildId(s.buildId ?? null)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Changelog' }]} />
      <h1 className="text-3xl font-bold mb-2">Changelog</h1>
      {version && (
        <p className="text-sm text-gray-400 mb-6">
          Live deploy: <span className="font-mono text-[#FF8C00]">v{version}</span>
          {buildId && <span className="text-gray-500"> · build {buildId}</span>}
          <span className="text-gray-600"> — from live-stats.json</span>
        </p>
      )}
      <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">{initialContent}</pre>
    </div>
  )
}