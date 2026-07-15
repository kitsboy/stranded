'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScoreHistogram from '@/components/ScoreHistogram'
import type { LiveStats } from '@/types/live-stats'
import { useBtcUsd } from '@/components/BtcPriceProvider'
import { downloadBlob } from '@/lib/export-formats'

const CARBON_SCENARIOS = [20, 50, 80] as const

export default function DashboardPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [allScores, setAllScores] = useState<number[]>([])
  const btc = useBtcUsd()

  useEffect(() => {
    const refresh = () => {
      fetch('/data/live-stats.json')
        .then(r => {
          if (!r.ok) throw new Error('stats')
          return r.json()
        })
        .then(s => { setStats(s); setLoadError(false) })
        .catch(() => setLoadError(true))
    }
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/data/stranded-sites.geojson')
      .then(r => r.json())
      .then((geo: { features?: { properties?: { stranded_score?: number } }[] }) => {
        const scores = (geo.features || [])
          .map(f => (f.properties as { stranded_score?: number })?.stranded_score)
          .filter((s): s is number => typeof s === 'number')
        if (scores.length) setAllScores(scores)
      })
      .catch(() => {
        if (stats?.topSites) setAllScores(stats.topSites.map(s => s.score))
      })
  }, [stats])

  const histogramScores = useMemo(() => {
    if (allScores.length) return allScores
    if (!stats?.scoreHistogram?.length) return []
    const expanded: number[] = []
    stats.scoreHistogram.forEach((b, i) => {
      const mid = i * 10 + 5
      for (let j = 0; j < b.count; j++) expanded.push(mid + (j % 3) - 1)
    })
    return expanded
  }, [allScores, stats])

  const carbonScenarios = useMemo(() => {
    if (!stats) return null
    const tonnes5 = stats.impact.co2eAvoided5PctTonnes
    return CARBON_SCENARIOS.map(price => ({
      price,
      usd5: Math.round(tonnes5 * price),
      tonnes5,
    }))
  }, [stats])

  const exportTop10 = () => {
    if (!stats?.topSites?.length) return
    const top = stats.topSites.slice(0, 10)
    const header = 'id,name,province,score,emission_kg_day,genset'
    const rows = top.map(s =>
      [s.id, `"${(s.name || '').replace(/"/g, '""')}"`, s.province, s.score, s.emissionKgDay, s.genset].join(',')
    )
    downloadBlob([header, ...rows].join('\n'), 'stranded-top-10-sites.csv', 'text/csv')
  }

  if (loadError && !stats) {
    return (
      <div className="p-12 text-center space-y-3" role="alert">
        <p className="text-red-400">Could not load dashboard stats.</p>
        <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold">Retry</button>
      </div>
    )
  }
  if (!stats) return <div className="p-12 text-center text-gray-400" role="status">Loading command dashboard…</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />

      {stats.ecccReportingYear && (
        <div className="mb-4 rounded-xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/10 px-4 py-2 text-xs text-gray-300 flex flex-wrap gap-2 items-center justify-between">
          <span>
            <span className="text-[#5BC0BE] font-semibold">Data freshness:</span> ECCC GHGRP reporting year{' '}
            <span className="font-mono text-white">{stats.ecccReportingYear}</span>
          </span>
          <span className="text-gray-500">Stats generated {new Date(stats.generatedAt).toLocaleString()}</span>
        </div>
      )}

      <h1 className="text-4xl font-bold tracking-tighter mb-2">Stranded Command Dashboard</h1>
      <p className="text-gray-400 mb-8">Live KPIs · auto-synced {new Date(stats.generatedAt).toLocaleString()}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Sites', value: stats.siteCount.toLocaleString(), color: '#FF8C00' },
          { label: 'Provinces', value: String(stats.provinceCount), color: '#5BC0BE' },
          { label: 'Daily Methane', value: `${(stats.totals.emissionKgDay / 1000).toFixed(0)}k kg`, color: '#A78BFA' },
          { label: 'Live BTC', value: `$${btc.toLocaleString()}`, color: '#FBBF24' },
          { label: 'Avg Score', value: String(stats.totals.avgStrandedScore), color: '#34D399' },
          { label: 'High Score Sites', value: String(stats.totals.highScoreSites), color: '#F472B6' },
          { label: '5% CO₂e/yr', value: `${(stats.impact.co2eAvoided5PctTonnes / 1000).toFixed(0)}k t`, color: '#5BC0BE' },
          { label: 'Model Revenue', value: `$${(stats.valueModel.annualRevenueUsd / 1e6).toFixed(0)}M`, color: '#FF8C00' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">{k.label}</div>
            <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold mb-4">Score Distribution</h2>
          <ScoreHistogram scores={histogramScores.length ? histogramScores : Array.from({ length: stats.siteCount }, (_, i) => stats.totals.avgStrandedScore + (i % 20) - 10)} />
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold mb-4">Province Comparison</h2>
          <div className="space-y-2">
            {stats.provinces.slice(0, 8).map((p, i) => {
              const max = stats.provinces[0]?.count || 1
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 truncate pr-2">{p.name}</span>
                    <span className="text-gray-400 tabular-nums shrink-0">{p.count} ({p.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#5BC0BE]"
                      style={{ width: `${(p.count / max) * 100}%`, opacity: 1 - i * 0.06 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#34D399]/25 bg-[#34D399]/5 p-5 mb-8">
        <h2 className="font-semibold mb-3 text-[#34D399]">Carbon Credit Scenarios (5% capture)</h2>
        {carbonScenarios && (
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {carbonScenarios.map(c => (
              <div key={c.price} className="rounded-xl border border-white/10 p-4 bg-black/20 text-center">
                <div className="text-[10px] uppercase text-gray-500">${c.price}/t CO₂e</div>
                <div className="text-xl font-bold text-[#34D399] tabular-nums mt-1">${c.usd5.toLocaleString()}/yr</div>
                <div className="text-xs text-gray-500 mt-1">{c.tonnes5.toLocaleString()} t</div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-500 mt-3">Side-by-side $20 / $50 / $80 per tonne — illustrative market bands.</p>
      </div>

      <div className="rounded-2xl border border-white/10 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Top 10 Sites</h2>
          <button
            type="button"
            onClick={exportTop10}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#FF8C00]/20 border border-[#FF8C00]/40 text-[#FF8C00] hover:bg-[#FF8C00]/30"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/10">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Site</th>
                <th className="pb-2 pr-3">Province</th>
                <th className="pb-2 pr-3">Score</th>
                <th className="pb-2">kg/day</th>
              </tr>
            </thead>
            <tbody>
              {stats.topSites.slice(0, 10).map((s, i) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                  <td className="py-2 pr-3">
                    <Link href={`/map?site=${s.id}`} className="text-[#5BC0BE] hover:underline truncate block max-w-[200px]">{s.name}</Link>
                  </td>
                  <td className="py-2 pr-3 text-gray-400">{s.province}</td>
                  <td className="py-2 pr-3 font-mono text-[#FF8C00]">{s.score}</td>
                  <td className="py-2 font-mono text-gray-400">{s.emissionKgDay.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 p-5 mb-6">
        <h2 className="font-semibold mb-4">Top Movers <span className="text-[10px] font-normal text-gray-500">(simulated WoW %)</span></h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {stats.provinces.slice(0, 4).map((p, i) => {
            const simulatedPct = [12.4, 8.1, -3.2, 5.7][i] ?? ((p.pct % 17) - 4)
            return (
              <div key={p.name} className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="text-xs text-gray-400 truncate">{p.name}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold tabular-nums">{p.count}</span>
                  <span className={`text-xs font-mono ${simulatedPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {simulatedPct >= 0 ? '+' : ''}{simulatedPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold mb-4">Top Provinces</h2>
          {stats.provinces.slice(0, 6).map(p => (
            <Link key={p.name} href={`/provinces?name=${encodeURIComponent(p.name)}`} className="flex justify-between py-2 border-b border-white/5 hover:text-[#FF8C00] text-sm">
              <span>{p.name}</span><span className="text-gray-400">{p.count} ({p.pct}%)</span>
            </Link>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/map" className="p-3 rounded-xl bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-center hover:bg-[#FF8C00]/20">Map</Link>
            <Link href="/pitch" className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10">Pitch</Link>
            <Link href="/funding" className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10">Funding</Link>
            <Link href="/docs/api" className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10">API Docs</Link>
          </div>
        </div>
      </div>
    </div>
  )
}