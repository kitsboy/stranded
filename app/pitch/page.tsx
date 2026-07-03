'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { LiveStats } from '@/types/live-stats'

const PROD_URL = 'https://stranded.giveabit.io'

const COLORS = ['#FF8C00', '#5BC0BE', '#A78BFA', '#34D399', '#F472B6', '#60A5FA', '#FBBF24', '#FB7185', '#4ADE80', '#C084FC', '#38BDF8', '#F97316', '#2DD4BF']

function fmt(n: number) {
  return n.toLocaleString('en-CA')
}

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${fmt(n)}`
}

function BarChart({ items, maxBars = 8 }: { items: { label: string; value: number; pct?: number }[]; maxBars?: number }) {
  const slice = items.slice(0, maxBars)
  const max = Math.max(...slice.map(i => i.value), 1)
  return (
    <div className="space-y-2.5">
      {slice.map((item, i) => (
        <div key={item.label} className="group">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 truncate pr-2">{item.label}</span>
            <span className="text-gray-400 tabular-nums shrink-0">{fmt(item.value)}{item.pct != null && <span className="text-gray-500 ml-1">({item.pct}%)</span>}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.05 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]}88)` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutRing({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  let offset = 0
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        {segments.map(seg => {
          const pct = seg.value / total
          const dash = pct * c
          const el = (
            <circle
              key={seg.label}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += dash
          return el
        })}
      </svg>
      <div className="flex-1 space-y-1.5 text-xs">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: seg.color }} />
            <span className="text-gray-300 flex-1 truncate">{seg.label}</span>
            <span className="text-gray-400 tabular-nums">{fmt(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-5"
    >
      <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">{label}</div>
      <div className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: accent || '#FF8C00' }}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1.5">{sub}</div>}
    </motion.div>
  )
}

export default function PitchPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [btc, setBtc] = useState(85000)
  const [error, setError] = useState('')
  const [btcSensitivity, setBtcSensitivity] = useState(100)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => { if (!r.ok) throw new Error('stats missing'); return r.json() })
      .then(setStats)
      .catch(() => setError('Run npm run build to generate live-stats.json'))
  }, [])

  useEffect(() => {
    const load = () =>
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        .then(r => r.json())
        .then(j => j?.bitcoin?.usd && setBtc(j.bitcoin.usd))
        .catch(() => {})
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!stats) return
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js'
    script.onload = () => {
      const canvas = document.getElementById('pitch-province-chart') as HTMLCanvasElement
      if (!canvas || !(window as any).Chart) return
      const Chart = (window as any).Chart
      if ((canvas as any)._chart) (canvas as any)._chart.destroy()
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: stats.provinces.slice(0, 10).map(p => p.name.split(' ')[0]),
          datasets: [{
            label: 'Sites',
            data: stats.provinces.slice(0, 10).map(p => p.count),
            backgroundColor: COLORS.slice(0, 10),
            borderRadius: 6,
          }],
        },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, x: { ticks: { color: '#94a3b8' } } } },
      })
      ;(canvas as any)._chart = chart
    }
    document.head.appendChild(script)
    return () => { script.remove() }
  }, [stats])

  const adjustedBtc = useMemo(() => btc * (btcSensitivity / 100), [btc, btcSensitivity])

  const liveRevenue = useMemo(() => {
    if (!stats) return 0
    return Math.round(stats.valueModel.annualBtc * adjustedBtc)
  }, [stats, adjustedBtc])

  const monteCarlo = useMemo(() => {
    if (!stats) return { low: 0, mid: 0, high: 0 }
    const base = stats.valueModel.annualRevenueUsd
    return { low: Math.round(base * 0.6), mid: base, high: Math.round(base * 1.8) }
  }, [stats])

  const tierItems = useMemo(() => {
    if (!stats) return []
    const labels: Record<string, string> = {
      mega: 'Mega (≥20k kg/day)',
      large: 'Large (5k–20k)',
      medium: 'Medium (1k–5k)',
      small: 'Small (100–1k)',
      micro: 'Micro (<100)',
    }
    return Object.entries(stats.emissionTiers)
      .map(([k, v]) => ({ label: labels[k] || k, value: v }))
      .sort((a, b) => b.value - a.value)
  }, [stats])

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center text-gray-400">
        <p>{error}</p>
        <Link href="/" className="text-[#5BC0BE] hover:underline mt-4 inline-block">← Home</Link>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading live platform data…</div>
      </div>
    )
  }

  const t = stats.totals
  const i = stats.impact

  return (
    <div className="min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-14 pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#FF8C0022_0%,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#5BC0BE18_0%,_transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] text-xs tracking-widest mb-6 border border-[#FF8C00]/25">
            LIVE PITCH · AUTO-UPDATING · {new Date(stats.generatedAt).toLocaleDateString('en-CA')}
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4">
            <span className="text-[#FF8C00]">Stranded Value</span>
            <br />
            <span className="text-3xl md:text-4xl text-gray-300 font-medium">Investor & Partner Pitch</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-8">
            {fmt(stats.siteCount)} verified methane sites · {stats.provinceCount} provinces · real ECCC data · honest generator + BTC economics
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/map" className="px-6 py-3 rounded-xl bg-[#FF8C00] text-[#1e293b] font-semibold hover:bg-[#FF8C00]/90 transition">Open Live Map →</Link>
            <Link href="/Marketing-Hub.html" className="px-6 py-3 rounded-xl border border-[#5BC0BE]/50 text-[#5BC0BE] hover:bg-[#5BC0BE]/10 transition">Marketing Hub</Link>
            <button onClick={() => window.print()} className="no-print px-6 py-3 rounded-xl border border-white/25 hover:bg-white/10 transition">Print / PDF</button>
          </div>
        </div>
      </section>

      {/* Province choropleth (simplified Canada) */}
      <section className="px-6 py-10 max-w-6xl mx-auto pitch-print">
        <h2 className="text-xl font-bold mb-4">Canada Site Density</h2>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {stats.provinces.map((p, i) => (
            <div key={p.name} className="rounded-xl p-3 text-center border transition hover:scale-105" style={{ backgroundColor: COLORS[i % COLORS.length] + '33', borderColor: COLORS[i % COLORS.length] }}>
              <div className="text-lg font-bold tabular-nums">{p.count}</div>
              <div className="text-[10px] text-gray-300 truncate">{p.name}</div>
              <div className="text-[9px] text-gray-400">{p.pct}%</div>
            </div>
          ))}
        </div>
        <canvas id="pitch-province-chart" className="w-full max-h-64 mt-6 no-print" height={200} />
      </section>

      {/* Headline stats */}
      <section className="border-y border-white/10 bg-black/25 px-6 py-10 pitch-print">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Verified Sites" value={fmt(stats.siteCount)} accent="#FF8C00" />
          <StatCard label="Daily Methane" value={`${fmt(t.emissionKgDay)} kg`} sub="aggregate vent rate" accent="#5BC0BE" />
          <StatCard label="CH₄ / Year" value={`${fmt(t.ch4TonnesYear)} t`} accent="#A78BFA" />
          <StatCard label="Avg Score" value={String(t.avgStrandedScore)} sub={`${t.highScoreSites} sites ≥80`} accent="#34D399" />
          <StatCard label="Live BTC" value={fmtUsd(btc)} sub="refreshes every 60s" accent="#FBBF24" />
          <StatCard label="Model Revenue" value={fmtUsd(liveRevenue)} sub="full portfolio @ live BTC" accent="#F472B6" />
        </div>
      </section>

      {/* Charts row 1 */}
      <section className="px-6 py-14 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Geography & Scale</h2>
        <p className="text-gray-500 text-sm mb-8">Province distribution and emission tiers — sourced from live-stats.json on every build</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold text-[#5BC0BE] mb-4 uppercase tracking-wider">Sites by Province</h3>
            <BarChart items={stats.provinces.map(p => ({ label: p.name, value: p.count, pct: p.pct }))} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold text-[#FF8C00] mb-4 uppercase tracking-wider">Emission Tiers</h3>
            <BarChart items={tierItems} />
          </div>
        </div>
      </section>

      {/* Charts row 2 */}
      <section className="px-6 pb-14 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold text-[#A78BFA] mb-4 uppercase tracking-wider">Source Types</h3>
            <DonutRing segments={stats.sourceTypes.slice(0, 6).map((s, i) => ({
              label: s.name,
              value: s.count,
              color: COLORS[i % COLORS.length],
            }))} />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold text-[#34D399] mb-4 uppercase tracking-wider">Recommended Gensets</h3>
            <BarChart items={stats.gensetRecommendations.map(g => ({
              label: g.id,
              value: g.count,
              pct: g.pct,
            }))} />
          </div>
        </div>
      </section>

      {/* BTC Sensitivity + Monte Carlo */}
      <section className="px-6 py-10 max-w-4xl mx-auto pitch-print">
        <h2 className="text-xl font-bold mb-4">Sensitivity Analysis</h2>
        <label className="text-xs text-gray-400">BTC price scenario: {btcSensitivity}% of live (${adjustedBtc.toLocaleString()})</label>
        <input type="range" min={40} max={200} value={btcSensitivity} onChange={e => setBtcSensitivity(+e.target.value)} className="w-full accent-[#FBBF24] mt-2" />
        <div className="grid grid-cols-3 gap-4 mt-6 text-center text-sm">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4"><div className="text-gray-400">Bear</div><div className="text-xl font-bold text-red-400">{fmtUsd(monteCarlo.low)}</div></div>
          <div className="rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-4"><div className="text-gray-400">Base</div><div className="text-xl font-bold text-[#FF8C00]">{fmtUsd(monteCarlo.mid)}</div></div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4"><div className="text-gray-400">Bull</div><div className="text-xl font-bold text-green-400">{fmtUsd(monteCarlo.high)}</div></div>
        </div>
      </section>

      {/* Impact + Value */}
      <section className="border-y border-white/10 bg-gradient-to-r from-[#FF8C00]/08 via-transparent to-[#5BC0BE]/08 px-6 py-14 pitch-print">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Climate + Capital Impact</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-6 text-center">
              <div className="text-4xl font-bold text-[#5BC0BE] tabular-nums">{fmt(i.co2eAvoided5PctTonnes)}</div>
              <div className="text-sm text-gray-400 mt-2">tonnes CO₂e avoided/yr at 5% capture</div>
              <div className="text-xs text-gray-500 mt-1">~{i.sitesAt5Pct} sites · GWP {i.methaneGwp}×</div>
            </div>
            <div className="rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-6 text-center">
              <div className="text-4xl font-bold text-[#FF8C00] tabular-nums">{fmt(i.co2eAvoided100PctTonnes)}</div>
              <div className="text-sm text-gray-400 mt-2">tonnes CO₂e at full portfolio capture</div>
            </div>
            <div className="rounded-2xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-6 text-center">
              <div className="text-4xl font-bold text-[#FBBF24] tabular-nums">{stats.valueModel.annualBtc.toFixed(1)}</div>
              <div className="text-sm text-gray-400 mt-2">BTC/yr model (full portfolio)</div>
              <div className="text-xs text-[#FBBF24]/80 mt-1">{fmtUsd(liveRevenue)} @ live price</div>
            </div>
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="rounded-xl border border-white/10 p-4">
              <span className="text-white font-medium">Generator capacity:</span> {fmt(t.totalGeneratorKW)} kW estimated across portfolio (Jenbacher-class derate model)
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <span className="text-white font-medium">Data confidence:</span> High {stats.confidenceCounts.high || 0} · Medium {stats.confidenceCounts.medium || 0} · Low {stats.confidenceCounts.low || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Top sites table */}
      <section className="px-6 py-14 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Top Opportunities</h2>
        <p className="text-gray-500 text-sm mb-6">Highest Stranded Score — click through to live map ROI</p>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-left text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3 text-right">kg/day</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3">Genset</th>
              </tr>
            </thead>
            <tbody>
              {stats.topSites.slice(0, 10).map((site, idx) => (
                <tr key={site.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/map?site=${site.id}`} className="text-[#5BC0BE] hover:underline">
                      {site.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{site.province}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#FF8C00]">{fmt(site.emissionKgDay)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{site.score}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{site.genset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">The data is open. The economics work.</h2>
        <p className="text-gray-400 mb-8">
          Every number on this page regenerates from the canonical {fmt(stats.siteCount)}-site ECCC dataset on build.
          Production: <a href={PROD_URL} className="text-[#5BC0BE] hover:underline">{PROD_URL}</a>
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/education" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition">Education Center</Link>
          <Link href="/sites" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition">All Sites</Link>
          <a href={stats.urls.dataSource} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl text-[#5BC0BE] border border-[#5BC0BE]/40 hover:bg-[#5BC0BE]/10 transition">ECCC Dataset ↗</a>
        </div>
        <p className="text-[10px] text-gray-600 mt-10">Stats generated {new Date(stats.generatedAt).toLocaleString('en-CA')} · Not financial advice</p>
      </section>
    </div>
  )
}