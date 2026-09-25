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
import TermSheetCard from '@/components/TermSheetCard'
import AmortizationTable from '@/components/AmortizationTable'
import CapexFxControls from '@/components/CapexFxControls'
import EuFundingExplorer from '@/components/EuFundingExplorer'
import { USD_PER_CAD_FALLBACK } from '@/lib/capex-fx'

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
  {
    key: 'energyType',
    label: 'What does the project primarily tackle?',
    options: [
      { value: 'gas', label: 'Stranded / flare gas → energy (ideally to Bitcoin)' },
      { value: 'ch4', label: 'Landfill or coal-mine methane capture' },
      { value: 'renew', label: 'Solar / wind / other renewables' },
      { value: 'ccs', label: 'Carbon capture, use or storage' },
      { value: 'hybrid', label: 'Mixed — several of the above' },
    ],
  },
  {
    key: 'talent',
    label: 'Will you bring in specialized international (EU) engineering talent?',
    options: [
      { value: 'domestic', label: 'Canadian / local hires for now' },
      { value: 'euTalent', label: 'Yes — hiring EU engineers / specialists' },
      { value: 'researchTeam', label: 'Building an R&D / research team' },
    ],
  },
  {
    key: 'measurement',
    label: 'How verified is your methane / emissions data?',
    options: [
      { value: 'unmeasured', label: 'Estimates only so far' },
      { value: 'measured', label: 'Field-measured on our sites' },
      { value: 'ogmp', label: 'Third-party / OGMP-2.0-level verified' },
    ],
  },
  {
    key: 'monetize',
    label: 'Planned revenue / monetization?',
    options: [
      { value: 'energyOnly', label: 'Energy (and/or Bitcoin) sales only' },
      { value: 'carbon', label: 'Carbon credits / offsets' },
      { value: 'both', label: 'Energy + carbon-market revenue' },
    ],
  },
]

const DEFAULT_ANSWERS: GrantQuizAnswers = {
  orgType: 'sme',
  province: 'Alberta',
  capexBand: '1to5m',
  indigenousPartnership: false,
  timeline: '12to36',
  energyType: 'hybrid',
  talent: 'domestic',
  measurement: 'unmeasured',
  monetize: 'energyOnly',
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

            {/* Horizon Europe / EU Funding — self-evolving suite */}
            <section className="mb-10 rounded-2xl border border-[#FF8C00]/30 bg-gradient-to-r from-[#FF8C00]/10 via-transparent to-[#5BC0BE]/10 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#FF8C00] text-black rounded">HORIZON EUROPE</span>
                <span className="text-[10px] text-gray-500 font-mono">EU · €95.5B pool · Canada associated</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tighter mb-2">The EU Funding Strategy</h2>
              <p className="text-gray-400 max-w-2xl mb-5">
                Beyond CETA, the primary path is a <b className="text-gray-200">Horizon Europe Pillar II · Cluster 5</b> grant
                (€2.5M–€15M) via a cross-Canada–EU consortium. Canada is an associated country — eligible on the same
                terms as EU entities. Two documents carry the full case.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <a href="/docs/stranded-eu-funding-board-deck.pdf" download className="group rounded-2xl border border-white/15 bg-black/20 p-5 hover:border-[#FF8C00]/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#FF8C00] tracking-wider">BOARD DECK · 6 SHEETS</span>
                    <svg className="h-4 w-4 text-gray-400 group-hover:text-[#FF8C00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" /></svg>
                  </div>
                  <div className="font-semibold mb-1">EU Funding Board Deck</div>
                  <div className="text-xs text-gray-400 leading-relaxed">The ask, the landscape, the consortium, and the €15M budget — for a funding board or board of directors.</div>
                </a>
                <a href="/docs/stranded-eu-consortium-outreach-brief.pdf" download className="group rounded-2xl border border-white/15 bg-black/20 p-5 hover:border-[#5BC0BE]/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#5BC0BE] tracking-wider">PARTNER BRIEF · 1 PAGE</span>
                    <svg className="h-4 w-4 text-gray-400 group-hover:text-[#5BC0BE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" /></svg>
                  </div>
                  <div className="font-semibold mb-1">EU Consortium Outreach Brief</div>
                  <div className="text-xs text-gray-400 leading-relaxed">The ready-to-send one-pager for Tier-1 partners — TNO, Fraunhofer UMSICHT, SINTEF.</div>
                </a>
              </div>
              <div className="mt-4 text-[10px] text-gray-600">
                These documents self-update from the research vault — the download links always serve the current version.
              </div>
            </section>

            <div className="mb-10"><EuFundingExplorer /></div>

      {liveStats && liveRevenue != null && (
        <section className="mb-8 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-5" data-testid="funding-live-revenue">
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Portfolio model @ live BTC</div>
          <div className="text-3xl font-bold text-[#5BC0BE]">{fmtUsd(liveRevenue)}<span className="text-sm font-normal text-gray-400"> /yr</span></div>
          <p className="text-xs text-gray-400 mt-2">
            Scaled from live-stats value model (BTC ${btcUsd.toLocaleString('en-CA')}) · {liveStats.siteCount.toLocaleString()} sites
          </p>
        </section>
      )}

      {liveStats && captureProjection && (
        <section className="mb-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5" data-testid="funding-capture-slider">
          <h2 className="text-lg font-semibold text-[#FF8C00] mb-1">Capture rate mini widget</h2>
          <p className="text-xs text-gray-400 mb-4">Portfolio deployment at {capturePct}% — sites, CO₂e, revenue</p>
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
              <div className="text-label text-gray-400">sites</div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-xl font-bold text-[#5BC0BE]">{captureProjection.co2eTonnes.toLocaleString()}</div>
              <div className="text-label text-gray-400">t CO₂e/yr</div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <div className="text-xl font-bold text-white">{fmtUsd(captureProjection.revenueUsd)}</div>
              <div className="text-label text-gray-400">revenue/yr</div>
            </div>
          </div>
        </section>
      )}

      {/* Grant matcher quiz — upgrade 176 */}
      <section className="mb-10 rounded-2xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/5 p-6">
        <h2 className="text-xl font-semibold text-[#5BC0BE] mb-1">Grant Matcher Quiz</h2>
        <p className="text-xs text-gray-400 mb-4">9 questions · result saved locally on this device</p>

        {!quizDone ? (
          <>
            <div className="text-label uppercase tracking-wider text-gray-400 mb-2">Question {quizStep + 1} of {QUIZ_STEPS.length}</div>
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
                    <div className="text-label text-gray-400">{m.reason}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-mono text-[#FF8C00]">{m.score}% fit</div>
                    <div className="text-label text-[#5BC0BE]">~${Math.round(m.maxGrant).toLocaleString()}</div>
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

      {/* Talent + Capital — two-lane EU play */}
      <section className="mb-10 rounded-2xl border border-[#FF8C00]/30 bg-gradient-to-br from-[#FF8C00]/10 via-black/10 to-[#5BC0BE]/10 p-6 md:p-7">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#FF8C00] text-black rounded">TALENT + CAPITAL</span>
          <span className="text-[10px] text-gray-500 font-mono">Canada–EU two-lane play</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tighter mb-1">Hire EU engineers. Tap EU capital.</h2>
        <p className="text-gray-400 max-w-3xl mb-5">
          One decision — forming an EU entity — opens <b className="text-gray-200">both lanes at once</b>: a fast
          talent lane to bring European engineering into Canada, and a capital lane that unlocks the EU instruments
          a Canada-only company can't touch. Here's how the two sides of the same move work.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {/* talent lane */}
          <div className="rounded-2xl border border-white/15 bg-black/20 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#5BC0BE] tracking-wider">LANE 1 · TALENT</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5BC0BE]/15 text-[#5BC0BE] border border-[#5BC0BE]/40">2-week hires</span>
            </div>
            <div className="font-semibold mb-3">EU engineers → Canadian projects</div>
            <ul className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#5BC0BE]">·</span><span><b className="text-gray-100">Global Talent Stream</b> — work permit in ~2 weeks for specialized tech/in-demand occupations. The fast lane for software, electrical and mechanical engineers.</span></li>
              <li className="flex gap-2"><span className="text-[#5BC0BE]">·</span><span><b className="text-gray-100">Provincial Nominee Programs</b> — BC PNP Tech, Alberta AAIP and Ontario OINP explicitly list mechanical, electrical and civil engineers; a practical path to permanent residence.</span></li>
              <li className="flex gap-2"><span className="text-[#5BC0BE]">·</span><span><b className="text-gray-100">Intra-company transfer</b> (needs no labour-market test) — moves staff from our EU entity to Canada quickly. The same entity that unlocks the capital lane.</span></li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-gray-500">
              Sources: <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html" target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] hover:text-white">IRCC Express Entry</a> · <a href="https://www.welcomebc.ca/immigrate-to-b-c/about-the-bc-provincial-nominee-program/the-bc-provincial-nominee-program" target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] hover:text-white">BC PNP Tech</a>
            </div>
          </div>
          {/* capital lane */}
          <div className="rounded-2xl border border-white/15 bg-black/20 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#FF8C00] tracking-wider">LANE 2 · CAPITAL</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF8C00]/15 text-[#FF8C00] border border-[#FF8C00]/40">up to €226M</span>
            </div>
            <div className="font-semibold mb-3">EU entity → EU facilities</div>
            <ul className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
              <li className="flex gap-2"><span className="text-[#FF8C00]">·</span><span><b className="text-gray-100">EIC Accelerator</b> — up to <b className="text-gray-100">€2.5M grant + €10M equity</b>, for a deeper-EU startup once our European arm relocates its activity there.</span></li>
              <li className="flex gap-2"><span className="text-[#FF8C00]">·</span><span><b className="text-gray-100">EU Innovation Fund (ETS)</b> — <b className="text-gray-100">€1.8M–€216M</b> for a CCS / net-zero demo hosted in Europe, channelled through the EU entity.</span></li>
              <li className="flex gap-2"><span className="text-[#FF8C00]">·</span><span><b className="text-gray-100">Horizon Cluster 5</b> (31 Mar 2026) — the flagship €2.5M–€15M consortium grant, accessible from Canada via our EU partners.</span></li>
            </ul>
            <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-gray-500">
              Sources: <a href="https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en" target="_blank" rel="noopener noreferrer" className="text-[#FF8C00] hover:text-white">EIC Accelerator</a> · <a href="https://climate.ec.europa.eu/areas-action/eu-funding-climate-action/innovation-fund/what-innovation-fund_en" target="_blank" rel="noopener noreferrer" className="text-[#FF8C00] hover:text-white">EU Innovation Fund</a>
            </div>
          </div>
        </div>
        <div className="mt-4 text-[10px] text-gray-600 leading-relaxed">
          These are indicative pathways, not guarantees — always confirm terms with an immigration lawyer and the relevant EU programme before acting.
          Eligibility reflects the Canada–EU Horizon Europe association (signed 3 July 2024) and Canada's status as an EUREKA/Eurostars country.
        </div>
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
          <div className="text-xs text-gray-400 mt-2">{eligible.length} programs matched · {sites} sites</div>
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

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <TermSheetCard
          projectName={`${province} stranded pilot`}
          province={province}
          siteCount={sites}
          totalCapexCad={capex}
          annualRevenueUsd={Math.round(capex * 0.22 * USD_PER_CAD_FALLBACK)}
        />
        <div className="space-y-4">
          <CapexFxControls baseCapexUsd={Math.round(capex * USD_PER_CAD_FALLBACK)} />
          <AmortizationTable defaultPrincipal={Math.round(capex * 0.6)} />
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/pitch" className="px-6 py-3 rounded-xl bg-[#FF8C00] text-black font-semibold">View Pitch Deck →</Link>
        <Link href="/Marketing-Hub.html" className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5">Roadmap & Funding Docs</Link>
      </div>
    </div>
  )
}