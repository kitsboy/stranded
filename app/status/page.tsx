'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'

export default function StatusPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    fetch('/status.json').then(r => r.json()).then(setHealth).catch(() => setHealth({ status: 'unknown' }))
    fetch('/data/live-stats.json').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  const version = stats?.version || (health?.version as string) || '—'
  const deployBuild = stats?.buildId || (health?.buildId as string) || null
  const siteCount = (health?.siteCount as number) || stats?.siteCount
  const ok = health?.status === 'operational' || health?.status === undefined

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Status' }]} />
      <h1 className="text-3xl font-bold mb-4">Platform Status</h1>
      <div className={`rounded-2xl border p-6 mb-6 ${ok ? 'border-[#34D399]/30 bg-[#34D399]/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full animate-pulse ${ok ? 'bg-[#34D399]' : 'bg-amber-400'}`} />
          <span className={`font-semibold ${ok ? 'text-[#34D399]' : 'text-amber-400'}`}>{ok ? 'Operational' : 'Degraded'}</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">https://stranded.giveabit.io</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Version</div>
            <div className="font-mono text-[#FF8C00]">v{version}</div>
          </div>
          {deployBuild && (
            <div>
              <div className="text-gray-500 text-xs">Last deploy</div>
              <div className="font-mono text-xs text-[#5BC0BE]">{deployBuild}</div>
            </div>
          )}
          {siteCount != null && (
            <div>
              <div className="text-gray-500 text-xs">Sites</div>
              <div className="font-mono tabular-nums">{siteCount.toLocaleString()}</div>
            </div>
          )}
          {stats?.totals?.avgStrandedScore != null && (
            <div>
              <div className="text-gray-500 text-xs">Avg Score</div>
              <div className="font-mono tabular-nums">{stats.totals.avgStrandedScore}</div>
            </div>
          )}
          {stats?.totals?.highScoreSites != null && (
            <div>
              <div className="text-gray-500 text-xs">Sites ≥80</div>
              <div className="font-mono tabular-nums">{stats.totals.highScoreSites}</div>
            </div>
          )}
          {stats?.generatedAt && (
            <div className="col-span-2">
              <div className="text-gray-500 text-xs">Stats generated</div>
              <div className="font-mono text-xs text-gray-300">{new Date(stats.generatedAt).toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
      {health && (
        <pre className="text-xs bg-black/30 p-4 rounded-xl overflow-auto text-gray-300">{JSON.stringify(health, null, 2)}</pre>
      )}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard" className="text-[#5BC0BE] hover:underline">Dashboard</Link>
        <Link href="/docs/api" className="text-[#5BC0BE] hover:underline">API Docs</Link>
        <Link href="/methodology" className="text-[#5BC0BE] hover:underline">Methodology</Link>
        <a href="/data/live-stats.json" className="text-[#5BC0BE] hover:underline" target="_blank" rel="noreferrer">live-stats.json</a>
      </div>
    </div>
  )
}