'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import type { LiveStats } from '@/types/live-stats'
import { deploymentReadiness } from '@/lib/dashboard-metrics'
import { aggregateStatusHealth, type StatusHealthReport } from '@/lib/status-health'

export default function StatusPage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null)
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [statsFetchOk, setStatsFetchOk] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    fetch('/status.json').then(r => r.json()).then(setHealth).catch(() => setHealth({ status: 'unknown' }))
    fetch('/data/live-stats.json')
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(j => { setStats(j); setStatsFetchOk(true) })
      .catch(() => { setStatsFetchOk(false) })
  }, [])

  const version = stats?.version || (health?.version as string) || '—'
  const deployBuild = stats?.buildId || (health?.buildId as string) || null
  const siteCount = (health?.siteCount as number) || stats?.siteCount
  const provinceCount = stats?.provinceCount
  const readiness = useMemo(() => (stats ? deploymentReadiness(stats) : null), [stats])

  const healthReport: StatusHealthReport | null = useMemo(() => {
    if (statsFetchOk === undefined && !health) return null
    return aggregateStatusHealth({
      liveStats: stats,
      liveStatsFetchOk: statsFetchOk,
      geojsonFeatureCount: siteCount,
      expectedVersion: stats?.version,
      statusJsonVersion: health?.version as string | undefined,
    })
  }, [stats, statsFetchOk, siteCount, health])

  const ok = healthReport?.overall === 'operational' || (health?.status === 'operational' && !healthReport)

  return (
    <div className="page-container page-container--narrow">
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Status' }]}
        title="Platform Status"
        subtitle="https://stranded.giveabit.io"
        actions={<StatusBadge status={ok ? 'operational' : 'degraded'} />}
      />

      <div className={`rounded-2xl border p-6 mb-6 ${ok ? 'border-[#34D399]/30 bg-[#34D399]/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${ok ? 'bg-[#34D399] animate-pulse' : 'bg-amber-400'}`} />
          <span className={`font-semibold ${ok ? 'text-[#34D399]' : 'text-amber-400'}`}>
            {ok ? 'All systems operational' : 'Degraded performance'}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Version</div>
            <div className="font-mono text-[#FF8C00]" data-testid="status-version">v{version}</div>
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
          {provinceCount != null && (
            <div>
              <div className="text-gray-500 text-xs">Provinces</div>
              <div className="font-mono tabular-nums" data-testid="status-province-count">{provinceCount}</div>
            </div>
          )}
          {readiness && (
            <div>
              <div className="text-gray-500 text-xs">Deployment readiness</div>
              <div className="font-mono tabular-nums text-[#5BC0BE]" data-testid="status-readiness-score">
                {readiness.score} <span className="text-gray-400 text-xs">({readiness.label})</span>
              </div>
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

      {healthReport && (
        <div className="rounded-2xl border border-white/10 p-5 mb-6" data-testid="status-health-checks">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Health checks</h2>
            <span className="text-xs font-mono text-[#5BC0BE]">{healthReport.score}/100</span>
          </div>
          <ul className="space-y-2">
            {healthReport.checks.map(check => (
              <li key={check.id} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gray-300">{check.label}</span>
                <span className={`shrink-0 font-mono uppercase ${
                  check.status === 'pass' ? 'text-[#34D399]' : check.status === 'warn' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {check.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {health && (
        <pre className="text-xs bg-black/30 p-4 rounded-xl overflow-auto text-gray-300">{JSON.stringify(health, null, 2)}</pre>
      )}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/dashboard" className="link-animated" data-testid="status-dashboard-link">Dashboard</Link>
        <Link href="/pitch" className="link-animated" data-testid="status-pitch-link">Pitch</Link>
        <Link href="/docs/api" className="link-animated">API Docs</Link>
        <Link href="/methodology" className="link-animated">Methodology</Link>
        <a href="/data/live-stats.json" className="link-animated" target="_blank" rel="noreferrer">live-stats.json</a>
      </div>
    </div>
  )
}