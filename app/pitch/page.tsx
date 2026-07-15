'use client'

import { useEffect, useMemo, useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MapPin,
  Flame,
  Cloud,
  BarChart3,
  Bitcoin,
  DollarSign,
  Presentation,
  Link2,
  Check,
} from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { useBtcUsd } from '@/components/BtcPriceProvider'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import { SENSITIVITY_PRESETS, type SensitivityPresetId, applyPresetRevenueBand } from '@/lib/sensitivity-presets'
import { formatCompactNumber } from '@/lib/format-number'
import { provinceOpportunities, scoreHistogramToScores } from '@/lib/pitch-metrics'
import PitchStatCard from '@/components/pitch/PitchStatCard'
import PitchCaptureSimulator from '@/components/pitch/PitchCaptureSimulator'
import PitchProvinceRank from '@/components/pitch/PitchProvinceRank'
import ScoreHistogram from '@/components/ScoreHistogram'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { buildNostrShareUrl } from '@/lib/nostr-share'

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
    <div className="space-y-3">
      {slice.map((item, i) => (
        <div key={item.label} className="group">
          <div className="mb-1.5 flex justify-between gap-2 text-xs">
            <span className="truncate pr-2 text-gray-300">{item.label}</span>
            <span className="shrink-0 tabular-nums text-gray-400">
              {fmt(item.value)}
              {item.pct != null && <span className="ml-1 text-gray-500">({item.pct}%)</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.value / max) * 100}%` }}
              viewport={{ once: true }}
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
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0 -rotate-90">
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
      <div className="w-full flex-1 space-y-2 text-xs">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: seg.color }} />
            <span className="min-w-0 flex-1 truncate text-gray-300">{seg.label.replace(/_/g, ' ')}</span>
            <span className="shrink-0 tabular-nums text-gray-400">{fmt(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PitchContent() {
  const searchParams = useSearchParams()
  const { locale, t } = useLocale()
  const embedParam = searchParams.get('embed')
  const present = searchParams.get('present') === '1'
  const embed = embedParam === '1' || embedParam === '2' || present
  const embedMinimal = embedParam === '2' || present
  const autoAdvance = present || embedParam === '2'
  const reducedMotion = useReducedMotion()
  const [stats, setStats] = useState<LiveStats | null>(null)
  const btc = useBtcUsd()
  const [error, setError] = useState('')
  const [btcSensitivity, setBtcSensitivity] = useState(100)
  const [activePreset, setActivePreset] = useState<SensitivityPresetId>('base')
  const [capturePct, setCapturePct] = useState(5)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (embed) document.documentElement.classList.add('pitch-embed')
    if (embedMinimal) document.documentElement.classList.add('pitch-embed-2')
    if (present) document.documentElement.classList.add('pitch-present')
    return () => {
      document.documentElement.classList.remove('pitch-embed')
      document.documentElement.classList.remove('pitch-embed-2')
      document.documentElement.classList.remove('pitch-present')
    }
  }, [embed, embedMinimal, present])

  useEffect(() => {
    if (!autoAdvance || reducedMotion || !stats) return
    const sections = Array.from(document.querySelectorAll('[data-pitch-section]')) as HTMLElement[]
    if (sections.length < 2) return
    let idx = 0
    const timer = window.setInterval(() => {
      idx = (idx + 1) % sections.length
      sections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 8000)
    return () => window.clearInterval(timer)
  }, [autoAdvance, reducedMotion, stats])

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => { if (!r.ok) throw new Error('stats missing'); return r.json() })
      .then(setStats)
      .catch(() => setError(t('pitchStatsError')))
  }, [t])

  useEffect(() => {
    if (!stats) return
    let cancelled = false
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
    script.async = true
    script.onload = () => {
      if (cancelled) return
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
            borderRadius: 8,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            x: { ticks: { color: '#94a3b8' } },
          },
        },
      })
      ;(canvas as any)._chart = chart
    }
    script.onerror = () => { /* BarChart fallback still renders */ }
    document.head.appendChild(script)
    return () => {
      cancelled = true
      script.remove()
    }
  }, [stats])

  const adjustedBtc = useMemo(() => btc * (btcSensitivity / 100), [btc, btcSensitivity])

  const liveRevenue = useMemo(() => {
    if (!stats) return 0
    return Math.round(stats.valueModel.annualBtc * adjustedBtc)
  }, [stats, adjustedBtc])

  const monteCarlo = useMemo(() => {
    if (!stats) return { low: 0, mid: 0, high: 0 }
    const base = stats.valueModel.annualRevenueUsd
    return {
      low: applyPresetRevenueBand(base, SENSITIVITY_PRESETS.bear),
      mid: applyPresetRevenueBand(base, SENSITIVITY_PRESETS.base),
      high: applyPresetRevenueBand(base, SENSITIVITY_PRESETS.bull),
    }
  }, [stats])

  const applySensitivityPreset = (id: SensitivityPresetId) => {
    const preset = SENSITIVITY_PRESETS[id]
    setActivePreset(id)
    setBtcSensitivity(Math.round(preset.btcMultiplier * 100))
  }

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

  const provinceRank = useMemo(() => (stats ? provinceOpportunities(stats) : []), [stats])

  const histogramScores = useMemo(() => {
    if (!stats?.scoreHistogram?.length) return []
    return scoreHistogramToScores(stats.scoreHistogram)
  }, [stats])

  const copyPitchLink = useCallback(() => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : PROD_URL}/pitch?present=1`
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }, [])

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
        <div className="pitch-loading-pulse text-gray-400">{t('pitchLoading')}</div>
      </div>
    )
  }

  const totals = stats.totals
  const i = stats.impact

  return (
    <div className="pitch-page min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
      {/* Hero */}
      <section data-pitch-section className="pitch-hero relative px-6 pb-12 pt-14 text-center">
        <div className="pitch-hero-mesh pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF8C00]/25 bg-[#FF8C00]/10 px-4 py-1.5 text-xs tracking-widest text-[#FF8C00]"
          >
            <span className="pitch-live-dot h-2 w-2 rounded-full bg-[#FF8C00]" />
            {t('pitchLiveBadge')} · {new Date(stats.generatedAt).toLocaleDateString('en-CA')}
            {stats.ecccReportingYear && (
              <span className="text-[#FF8C00]/70">· {t('pitchEcccYear')} {stats.ecccReportingYear}</span>
            )}
          </motion.div>
          <h1 className="mb-4 text-5xl font-bold tracking-tighter md:text-7xl">
            <span className="bg-gradient-to-r from-[#FF8C00] via-[#FFB347] to-[#5BC0BE] bg-clip-text text-transparent">
              {t('pitchTitle')}
            </span>
            <br />
            <span className="text-3xl font-medium text-gray-300 md:text-4xl">{t('pitchSubtitle')}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
            {tf(locale, 'pitchHeroDesc', { count: fmt(stats.siteCount), provinces: String(stats.provinceCount) })}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/map" className="pitch-cta-primary px-6 py-3 rounded-xl bg-[#FF8C00] font-semibold text-[#1e293b] transition hover:bg-[#FF8C00]/90">
              {t('pitchOpenMap')}
            </Link>
            <Link href="/Marketing-Hub.html" className="px-6 py-3 rounded-xl border border-[#5BC0BE]/50 text-[#5BC0BE] transition hover:bg-[#5BC0BE]/10">
              {t('pitchMarketingHub')}
            </Link>
            <Link href="/pitch?present=1" className="no-print inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 transition hover:bg-white/10">
              <Presentation className="h-4 w-4" />
              {t('pitchPresentMode')}
            </Link>
            <button type="button" onClick={copyPitchLink} className="no-print inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 transition hover:bg-white/10">
              {linkCopied ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
              {linkCopied ? t('pitchLinkCopied') : t('pitchShareLink')}
            </button>
            <button type="button" onClick={() => window.print()} className="no-print px-6 py-3 rounded-xl border border-white/25 transition hover:bg-white/10">
              {t('pitchPrintPdf')}
            </button>
          </div>
        </div>
      </section>

      {/* Live ticker */}
      <div className="pitch-ticker border-y border-white/10 bg-black/30 py-2.5">
        <div className="pitch-ticker-track flex gap-10 whitespace-nowrap text-xs text-gray-400">
          {[...Array(2)].map((_, dup) => (
            <span key={dup} className="inline-flex shrink-0 items-center gap-10">
              <span><strong className="text-[#FF8C00]">{fmt(stats.siteCount)}</strong> verified sites</span>
              <span><strong className="text-[#5BC0BE]">{formatCompactNumber(totals.emissionKgDay, 2)}</strong> kg CH₄/day</span>
              <span><strong className="text-[#A78BFA]">{formatCompactNumber(totals.ch4TonnesYear, 1)} t</strong> CH₄/yr</span>
              <span><strong className="text-[#34D399]">{totals.avgStrandedScore}</strong> avg score</span>
              <span><strong className="text-[#FBBF24]">{fmtUsd(btc)}</strong> live BTC</span>
              <span><strong className="text-[#F472B6]">{fmtUsd(liveRevenue)}</strong> model revenue</span>
            </span>
          ))}
        </div>
      </div>

      {/* Headline stats — fixed grid */}
      <section data-pitch-section className="border-b border-white/10 bg-black/25 px-6 py-10 pitch-print">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          <PitchStatCard label={t('pitchVerifiedSites')} value={fmt(stats.siteCount)} icon={MapPin} accent="#FF8C00" delay={0} />
          <PitchStatCard
            label={t('pitchDailyMethane')}
            value={`${fmt(totals.emissionKgDay)} kg`}
            compactValue={`${formatCompactNumber(totals.emissionKgDay, 2)} kg`}
            sub={t('pitchDailyMethaneSub')}
            icon={Flame}
            accent="#5BC0BE"
            delay={0.05}
          />
          <PitchStatCard
            label={t('pitchCh4Year')}
            value={`${fmt(totals.ch4TonnesYear)} t`}
            compactValue={`${formatCompactNumber(totals.ch4TonnesYear, 1)} t`}
            icon={Cloud}
            accent="#A78BFA"
            delay={0.1}
          />
          <PitchStatCard
            label={t('pitchAvgScore')}
            value={String(totals.avgStrandedScore)}
            sub={tf(locale, 'pitchAvgScoreSub', { count: String(totals.highScoreSites) })}
            icon={BarChart3}
            accent="#34D399"
            delay={0.15}
          />
          <PitchStatCard
            label={t('pitchLiveBtc')}
            value={fmtUsd(btc)}
            sub={t('pitchLiveBtcSub')}
            icon={Bitcoin}
            accent="#FBBF24"
            delay={0.2}
          />
          <PitchStatCard
            label={t('pitchModelRevenue')}
            value={fmtUsd(liveRevenue)}
            compactValue={fmtUsd(liveRevenue)}
            sub={t('pitchModelRevenueSub')}
            icon={DollarSign}
            accent="#F472B6"
            delay={0.25}
          />
        </div>
      </section>

      {/* Province density */}
      <section data-pitch-section className="pitch-print mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-4 text-xl font-bold">{t('pitchSiteDensity')}</h2>
        <div className="grid grid-cols-4 gap-2 md:grid-cols-7 md:gap-3">
          {stats.provinces.map((p, idx) => (
            <motion.div
              key={p.name}
              whileHover={{ scale: 1.04 }}
              className="rounded-xl border p-2.5 text-center transition md:p-3"
              style={{ backgroundColor: `${COLORS[idx % COLORS.length]}22`, borderColor: `${COLORS[idx % COLORS.length]}66` }}
            >
              <div className="text-base font-bold tabular-nums md:text-lg">{p.count}</div>
              <div className="truncate text-[9px] text-gray-300 md:text-[10px]">{p.name.split(' ')[0]}</div>
              <div className="text-[8px] text-gray-400 md:text-[9px]">{p.pct}%</div>
            </motion.div>
          ))}
        </div>
        <canvas id="pitch-province-chart" className="no-print mt-6 w-full max-h-64" height={200} />
      </section>

      {/* NEW: Portfolio Capture Simulator */}
      <PitchCaptureSimulator
        stats={stats}
        capturePct={capturePct}
        onCaptureChange={setCapturePct}
        liveRevenueUsd={liveRevenue}
        title={t('pitchCaptureTitle')}
        desc={t('pitchCaptureDesc')}
        sitesLabel={t('pitchCaptureSites')}
        co2eLabel={t('pitchCaptureCo2e')}
        btcLabel={t('pitchCaptureBtc')}
        revenueLabel={t('pitchCaptureRevenue')}
        powerLabel={t('pitchCapturePower')}
      />

      {/* NEW: Province Opportunity Rank */}
      <PitchProvinceRank
        provinces={provinceRank}
        title={t('pitchProvinceRankTitle')}
        desc={t('pitchProvinceRankDesc')}
      />

      {/* Charts row 1 */}
      <section data-pitch-section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-2 text-2xl font-bold">{t('pitchGeographyScale')}</h2>
        <p className="mb-8 text-sm text-gray-500">{t('pitchGeoDesc')}</p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#5BC0BE]">{t('pitchSitesByProvince')}</h3>
            <BarChart items={stats.provinces.map(p => ({ label: p.name, value: p.count, pct: p.pct }))} />
          </div>
          <div className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#FF8C00]">{t('pitchEmissionTiers')}</h3>
            <BarChart items={tierItems} />
          </div>
        </div>
      </section>

      {/* Score distribution + charts row 2 */}
      <section data-pitch-section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {histogramScores.length > 0 && (
            <div className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#34D399]">{t('pitchScoreDist')}</h3>
              <ScoreHistogram scores={histogramScores} />
            </div>
          )}
          <div className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A78BFA]">{t('pitchSourceTypes')}</h3>
            <DonutRing segments={stats.sourceTypes.slice(0, 6).map((s, idx) => ({
              label: s.name,
              value: s.count,
              color: COLORS[idx % COLORS.length],
            }))} />
          </div>
          <div className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#34D399]">{t('pitchRecommendedGensets')}</h3>
            <BarChart items={stats.gensetRecommendations.map(g => ({
              label: g.id,
              value: g.count,
              pct: g.pct,
            }))} maxBars={5} />
          </div>
        </div>
      </section>

      {/* BTC Sensitivity */}
      <section data-pitch-section className="pitch-print mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-4 text-xl font-bold">{t('pitchSensitivity')}</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(SENSITIVITY_PRESETS) as SensitivityPresetId[]).map(id => (
              <button
                key={id}
                type="button"
                onClick={() => applySensitivityPreset(id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${activePreset === id ? 'border-[#FF8C00] bg-[#FF8C00]/15 text-[#FF8C00]' : 'border-white/15 text-gray-400 hover:border-white/30'}`}
              >
                {SENSITIVITY_PRESETS[id].label}
              </button>
            ))}
          </div>
          <p className="mb-2 text-[10px] text-gray-500">{SENSITIVITY_PRESETS[activePreset].description}</p>
          <label className="text-xs text-gray-400">
            {tf(locale, 'pitchBtcScenario', { pct: String(btcSensitivity), price: adjustedBtc.toLocaleString() })}
          </label>
          <input
            type="range"
            min={40}
            max={200}
            value={btcSensitivity}
            onChange={e => setBtcSensitivity(+e.target.value)}
            className="pitch-range mt-2 w-full accent-[#FBBF24]"
          />
          <div className="mt-6 grid grid-cols-1 gap-4 text-center text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <div className="text-gray-400">{t('pitchBear')}</div>
              <div className="text-lg font-bold text-red-400 sm:text-xl">{fmtUsd(monteCarlo.low)}</div>
            </div>
            <div className="rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-4">
              <div className="text-gray-400">{t('pitchBase')}</div>
              <div className="text-lg font-bold text-[#FF8C00] sm:text-xl">{fmtUsd(monteCarlo.mid)}</div>
            </div>
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
              <div className="text-gray-400">{t('pitchBull')}</div>
              <div className="text-lg font-bold text-green-400 sm:text-xl">{fmtUsd(monteCarlo.high)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact + Value */}
      <section data-pitch-section className="pitch-print border-y border-white/10 bg-gradient-to-r from-[#FF8C00]/08 via-transparent to-[#5BC0BE]/08 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold">{t('pitchClimateImpact')}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-6 text-center">
              <div className="text-3xl font-bold tabular-nums text-[#5BC0BE] sm:text-4xl">{fmt(i.co2eAvoided5PctTonnes)}</div>
              <div className="mt-2 text-sm text-gray-400">{t('pitchCo2e5')}</div>
              <div className="mt-1 text-xs text-gray-500">~{i.sitesAt5Pct} sites · GWP {i.methaneGwp}×</div>
            </div>
            <div className="rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-6 text-center">
              <div className="text-3xl font-bold tabular-nums text-[#FF8C00] sm:text-4xl">{fmt(i.co2eAvoided100PctTonnes)}</div>
              <div className="mt-2 text-sm text-gray-400">{t('pitchCo2eFull')}</div>
            </div>
            <div className="rounded-2xl border border-[#FBBF24]/30 bg-[#FBBF24]/5 p-6 text-center">
              <div className="text-3xl font-bold tabular-nums text-[#FBBF24] sm:text-4xl">{stats.valueModel.annualBtc.toFixed(1)}</div>
              <div className="mt-2 text-sm text-gray-400">{t('pitchBtcYr')}</div>
              <div className="mt-1 text-xs text-[#FBBF24]/80">{fmtUsd(liveRevenue)} @ live price</div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 text-sm text-gray-400 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <span className="font-medium text-white">{t('pitchGenCapacity')}:</span>{' '}
              {fmt(totals.totalGeneratorKW)} kW estimated across portfolio (Jenbacher-class derate model)
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <span className="font-medium text-white">{t('pitchDataConfidence')}:</span>{' '}
              High {stats.confidenceCounts.high || 0} · Medium {stats.confidenceCounts.medium || 0} · Low {stats.confidenceCounts.low || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Top sites */}
      <section data-pitch-section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="mb-2 text-2xl font-bold">{t('pitchTopOpportunities')}</h2>
        <p className="mb-6 text-sm text-gray-500">{t('pitchTopDesc')}</p>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 w-8">#</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3 text-right">kg/day</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3">Genset</th>
              </tr>
            </thead>
            <tbody>
              {stats.topSites.slice(0, 10).map((site, idx) => (
                <tr key={site.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-gray-500 tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/map?site=${site.id}`} className="text-[#5BC0BE] hover:underline">
                      {site.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{site.province}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#FF8C00]">{fmt(site.emissionKgDay)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${site.score >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-300'}`}>
                      {site.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{site.genset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section data-pitch-section className="mx-auto max-w-4xl px-6 pb-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">{t('pitchCtaTitle')}</h2>
        <p className="mb-8 text-gray-400">
          {tf(locale, 'pitchCtaDesc', { count: fmt(stats.siteCount) })}
          {' '}Production: <a href={PROD_URL} className="text-[#5BC0BE] hover:underline">{PROD_URL}</a>
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/education" className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 transition hover:bg-white/15">{t('pitchEducation')}</Link>
          <Link href="/sites" className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 transition hover:bg-white/15">{t('pitchAllSites')}</Link>
          <a
            href={buildNostrShareUrl(
              `Stranded Value — ${fmt(stats.siteCount)} verified methane sites across Canada. Stranded methane → Bitcoin.`,
              `${PROD_URL}/pitch`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#A78BFA]/50 px-6 py-3 text-[#A78BFA] transition hover:bg-[#A78BFA]/10"
          >
            Share on Nostr
          </a>
          <a href="https://sherpacarta.giveabit.io?ref=stranded&ctx=pitch" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#5BC0BE]/40 px-6 py-3 text-[#5BC0BE] transition hover:bg-[#5BC0BE]/10">{t('pitchSherpacarta')}</a>
          <a href={stats.urls.dataSource} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#5BC0BE]/40 px-6 py-3 text-[#5BC0BE] transition hover:bg-[#5BC0BE]/10">{t('pitchEccc')}</a>
        </div>
        <p className="mt-10 text-[10px] text-gray-600">
          Stats generated {new Date(stats.generatedAt).toLocaleString('en-CA')} · Not financial advice
        </p>
      </section>
    </div>
  )
}

export default function PitchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading pitch deck…</div>}>
      <PitchContent />
    </Suspense>
  )
}