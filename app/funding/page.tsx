'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  type GrantQuizAnswers,
  matchGrants,
  saveGrantQuizResult,
  loadGrantQuizResult,
  decodeGrantQuizHash,
  grantQuizShareUrl,
} from '@/lib/grant-quiz'
import CopyLinkButton from '@/components/CopyLinkButton'
import { toast } from 'sonner'
import type { LiveStats } from '@/types/live-stats'
import { useBtcUsd } from '@/components/BtcPriceProvider'
import { liveModelRevenue, captureAtPct } from '@/lib/dashboard-metrics'

const CETA_PROGRAMS = [
  { id: 'cleantech', name: 'CETA Cleantech SME', max: 5000000, match: 0.5, provinces: ['All'] },
  { id: 'methane', name: 'Methane Reduction Fund', max: 10000000, match: 0.25, provinces: ['AB', 'SK', 'BC'] },
  { id: 'indigenous', name: 'Indigenous Clean Energy', max: 3000000, match: 0.75, provinces: ['All'] },
  { id: 'provincial-ab', name: 'Alberta Emissions Reduction', max: 8000000, match: 0.3, provinces: ['AB'] },
  { id: 'provincial-on', name: 'Ontario Low-Carbon Fund', max: 6000000, match: 0.35, provinces: ['ON'] },
]

const QUIZ_STEPS: { key: keyof GrantQuizAnswers; label: string; options: { value: string; label: string }[] }[] = [
  {
    key: 'orgType',
    label: 'What type of organization are you?',
    options: [
      { value: 'sme', label: 'Cleantech SME / operator' },
      { value: 'indigenous', label: 'Indigenous Nation / community corp' },
      { value: 'municipal', label: 'Municipal / regional government' },
      { value: 'research', label: 'University / research consortium' },
    ],
  },
  {
    key: 'province',
    label: 'Primary project province',
    options: ['Alberta', 'Ontario', 'British Columbia', 'Saskatchewan', 'Quebec', 'Manitoba'].map(p => ({ value: p, label: p })),
  },
  {
    key: 'capexBand',
    label: 'Estimated total CapEx band',
    options: [
      { value: 'under1m', label: 'Under $1M' },
      { value: '1to5m', label: '$1M – $5M' },
      { value: '5to20m', label: '$5M – $20M' },
      { value: 'over20m', label: 'Over $20M' },
    ],
  },
  {
    key: 'indigenousPartnership',
    label: 'Indigenous partnership or revenue share planned?',
    options: [
      { value: 'true', label: 'Yes — core to the project' },
      { value: 'false', label: 'No / not yet' },
    ],
  },
  {
    key: 'timeline',
    label: 'Deployment timeline',
    options: [
      { value: 'under12', label: 'Under 12 months' },
      { value: '12to36', label: '12 – 36 months' },
      { value: 'over36', label: 'Over 36 months' },
    ],
  },
]

const DEFAULT_ANSWERS: GrantQuizAnswers = {
  orgType: 'sme',
  province: 'Alberta',
  capexBand: '1to5m',
  indigenousPartnership: false,
  timeline: '12to36',
}

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

export default function FundingPage() {
  const [province, setProvince] = useState('Alberta')
  const [capex, setCapex] = useState(2000000)
  const [sites, setSites] = useState(3)
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null)
  const [capturePct, setCapturePct] = useState(5)
  const btcUsd = useBtcUsd()

  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<GrantQuizAnswers>(DEFAULT_ANSWERS)
  const [quizDone, setQuizDone] = useState(false)
  const [quizMatches, setQuizMatches] = useState<ReturnType<typeof matchGrants>>([])

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLiveStats(data) })
      .catch(() => { /* optional */ })
  }, [])

  useEffect(() => {
    const hashMatch = typeof window !== 'undefined' ? window.location.hash.match(/^#grant=(.+)$/) : null
    if (hashMatch) {
      const decoded = decodeGrantQuizHash(hashMatch[1])
      if (decoded) {
        const matches = matchGrants(decoded.answers)
        setQuizAnswers(decoded.answers)
        setQuizMatches(matches)
        setQuizDone(true)
        saveGrantQuizResult(decoded.answers, matches)
        toast.success('Loaded grant quiz from shared link')
        return
      }
    }
    const saved = loadGrantQuizResult()
    if (saved) {
      setQuizAnswers(saved.answers)
      setQuizMatches(saved.matches)
      setQuizDone(true)
    }
  }, [])

  const eligible = CETA_PROGRAMS.filter(p =>
    p.provinces.includes('All') || p.provinces.some(pr => province.startsWith(pr) || province.includes(pr))
  )
  const totalGrant = eligible.reduce((sum, p) => sum + Math.min(capex * p.match, p.max), 0)

  const liveRevenue = useMemo(
    () => (liveStats ? liveModelRevenue(liveStats, btcUsd) : null),
    [liveStats, btcUsd],
  )

  const captureProjection = useMemo(
    () => (liveStats ? captureAtPct(liveStats, capturePct, btcUsd) : null),
    [liveStats, capturePct, btcUsd],
  )

  const currentQuiz = QUIZ_STEPS[quizStep] ?? QUIZ_STEPS[0]

  const pickQuizAnswer = (value: string) => {
    const key = currentQuiz.key
    const next: GrantQuizAnswers = {
      ...quizAnswers,
      [key]: key === 'indigenousPartnership' ? value === 'true' : value,
    } as GrantQuizAnswers
    setQuizAnswers(next)
    if (quizStep < QUIZ_STEPS.length - 1) {
      setQuizStep(s => s + 1)
    } else {
      const matches = matchGrants(next)
      setQuizMatches(matches)
      saveGrantQuizResult(next, matches)
      setQuizDone(true)
    }
  }

  const resetQuiz = () => {
    setQuizStep(0)
    setQuizAnswers(DEFAULT_ANSWERS)
    setQuizDone(false)
    setQuizMatches([])
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">CETA Funding Pathway</h1>
      <p className="text-gray-400 mb-8">Interactive wizard for Canadian-EU trade agreement aligned cleantech capital. Estimates only — verify with program officers.</p>

      {liveStats && liveRevenue != null && (
        <section className="mb-8 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-5" data-testid="funding-live-revenue">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Portfolio model @ live BTC</div>
          <div className="text-3xl font-bold text-[#5BC0BE]">{fmtUsd(liveRevenue)}<span className="text-sm font-normal text-gray-400"> /yr</span></div>
          <p className="text-xs text-gray-500 mt-2">
            Scaled from live-stats value model (BTC ${btcUsd.toLocaleString('en-CA')}) · {liveStats.siteCount.toLocaleString()} sites
          </p>
        </section>
      )}

      {liveStats && captureProjection && (
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5" data-testid="funding-capture-slider">
          <h2 className="text-lg font-semibold text-[#FF8C00] mb-1">Capture rate mini widget</h2>
          <p className="text-xs text-gray-500 mb-4">Portfolio deployment at {capturePct}% — sites, CO₂e, revenue</p>
          <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Capture rate</span>
            <span className="font-semibold text-white">{capturePct}%</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={capturePct}
            onChange={e => setCapturePct(+e.target.value)}
            className="w-full accent-[#FF8C00]"
            aria-label="Portfolio capture percentage"
          />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-xl font-bold text-[#FF8C00]">{captureProjection.sites}</div>
              <div className="text-[10px] text-gray-500">sites</div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-xl font-bold text-[#5BC0BE]">{captureProjection.co2eTonnes.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">t CO₂e/yr</div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-xl font-bold text-white">{fmtUsd(captureProjection.revenueUsd)}</div>
              <div className="text-[10px] text-gray-500">revenue/yr</div>
            </div>
          </div>
        </section>
      )}

      {/* Grant matcher quiz — upgrade 176 */}
      <section className="mb-10 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-6">
        <h2 className="text-xl font-semibold text-[#5BC0BE] mb-1">Grant Matcher Quiz</h2>
        <p className="text-xs text-gray-400 mb-4">5 questions · result saved locally on this device</p>

        {!quizDone ? (
          <>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Question {quizStep + 1} of {QUIZ_STEPS.length}</div>
            <p className="font-medium mb-3">{currentQuiz.label}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {currentQuiz.options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pickQuizAnswer(opt.value)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-white/15 hover:border-[#5BC0BE]/50 hover:bg-white/5 transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-300 mb-4">Your top program matches (saved in localStorage):</p>
            <ul className="space-y-2 mb-4">
              {quizMatches.filter(m => m.score > 0).slice(0, 4).map(m => (
                <li key={m.id} className="flex justify-between items-center text-sm rounded-xl border border-white/10 px-4 py-2 bg-black/20">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-[10px] text-gray-500">{m.reason}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-mono text-[#FF8C00]">{m.score}% fit</div>
                    <div className="text-[10px] text-[#5BC0BE]">~${Math.round(m.maxGrant).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <CopyLinkButton
                url={grantQuizShareUrl(quizAnswers, quizMatches)}
                label="Share results"
                successMessage="Grant quiz link copied (URL hash)"
              />
              <button type="button" onClick={resetQuiz} className="text-xs text-gray-400 hover:text-white">Retake quiz</button>
            </div>
          </>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="funding-province" className="text-xs text-gray-400">Province</label>
            <select id="funding-province" value={province} onChange={e => setProvince(e.target.value)} className="w-full mt-1 bg-black/30 border border-white/15 rounded-lg px-4 py-2.5">
              {['Alberta', 'Ontario', 'British Columbia', 'Saskatchewan', 'Quebec', 'Manitoba'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="funding-capex" className="text-xs text-gray-400">Total CapEx (CAD): ${capex.toLocaleString()}</label>
            <input id="funding-capex" type="range" min={500000} max={20000000} step={100000} value={capex} onChange={e => setCapex(+e.target.value)} className="w-full accent-[#FF8C00] mt-2" />
          </div>
          <div>
            <label htmlFor="funding-sites" className="text-xs text-gray-400">Sites in portfolio: {sites}</label>
            <input id="funding-sites" type="range" min={1} max={20} value={sites} onChange={e => setSites(+e.target.value)} className="w-full accent-[#5BC0BE] mt-2" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-6">
          <div className="text-sm text-gray-400 mb-1">Estimated grant stack</div>
          <div className="text-4xl font-bold text-[#FF8C00]">${Math.round(totalGrant).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">{eligible.length} programs matched · {sites} sites</div>
          <div className="mt-4 space-y-2">
            {eligible.map(p => (
              <div key={p.id} className="flex justify-between text-xs">
                <span className="text-gray-300">{p.name}</span>
                <span className="text-[#5BC0BE]">up to ${(p.max / 1e6).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/pitch" className="px-6 py-3 rounded-xl bg-[#FF8C00] text-black font-semibold">View Pitch Deck →</Link>
        <Link href="/Marketing-Hub.html" className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5">Roadmap & Funding Docs</Link>
      </div>
    </div>
  )
}