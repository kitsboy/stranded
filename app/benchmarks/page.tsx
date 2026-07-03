'use client'

import { useEffect, useState } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'

export default function BenchmarksPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loadMs, setLoadMs] = useState<number | null>(null)

  useEffect(() => {
    const t0 = performance.now()
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(j => { setStats(j); setLoadMs(Math.round(performance.now() - t0)) })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Benchmarks' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Performance Benchmarks</h1>
      <p className="text-gray-400 mb-8">Static export targets — measured on this device.</p>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: 'live-stats.json fetch', value: loadMs != null ? `${loadMs} ms` : '…' },
          { label: 'Build routes', value: stats ? '16 static pages' : '…' },
          { label: 'Dataset size', value: stats ? `${stats.siteCount} sites` : '…' },
          { label: 'Version', value: stats?.version || '…' },
          { label: 'PWA cache', value: 'Service worker v3 + IndexedDB' },
          { label: 'Map render mode', value: 'Cluster @ 180+ pins' },
        ].map(row => (
          <div key={row.label} className="p-4 rounded-xl border border-white/10">
            <div className="text-[10px] uppercase text-gray-500">{row.label}</div>
            <div className="text-xl font-mono mt-1 text-[#5BC0BE]">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}