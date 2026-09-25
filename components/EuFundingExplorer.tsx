'use client'

import { useMemo, useState } from 'react'
import { Search, ExternalLink, Info, CircleHelp, Calendar, Landmark } from 'lucide-react'
import programsData from '../lib/eu-programs.json'

type Program = {
  id: string
  name: string
  code: string
  kind: 'grant' | 'rd' | 'investment' | 'compliance'
  eligibility: 'direct' | 'eu-located' | 'conditional' | 'via-partner'
  priority: number
  budget: string
  funding: string
  region: string
  opening: string
  deadline: string
  description: string
  explainer: string
  sourceUrl: string
  sourceLabel: string
}

const ELIGIBILITY: Record<Program['eligibility'], { label: string; cls: string; tip: string }> = {
  direct: { label: 'Direct access', cls: 'bg-[#5BC0BE]/15 text-[#5BC0BE] border-[#5BC0BE]/40', tip: 'A Canadian entity can apply directly, on near-EU terms.' },
  'eu-located': { label: 'EU / EEA-located', cls: 'bg-[#FF8C00]/15 text-[#FF8C00] border-[#FF8C00]/40', tip: 'The project must physically sit in the EU/EEA; reached via a partner or subsidiary.' },
  conditional: { label: 'Conditional', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/40', tip: 'Open in limited cases — e.g. only if we form an EU entity.' },
  'via-partner': { label: 'Via EU partner', cls: 'bg-slate-400/15 text-slate-300 border-slate-400/40', tip: 'An EU partner leads; we join the consortium as a contributor.' },
}

const KINDS: Record<Program['kind'], { label: string }> = {
  grant: { label: 'Grant' },
  rd: { label: 'R&D' },
  investment: { label: 'Investment' },
  compliance: { label: 'Compliance' },
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group/tip">
      {children}
      <span className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/15 bg-[#0d1117] px-3 py-2 text-left text-[11px] leading-snug text-gray-200 opacity-0 shadow-xl transition-opacity group-hover/tip:opacity-100">
        {text}
      </span>
    </span>
  )
}

export default function EuFundingExplorer() {
  const [eligibility, setEligibility] = useState<'all' | Program['eligibility']>('all')
  const [kind, setKind] = useState<'all' | Program['kind']>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (programsData as Program[])
      .filter(p => eligibility === 'all' || p.eligibility === eligibility)
      .filter(p => kind === 'all' || p.kind === kind)
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .sort((a, b) => a.priority - b.priority)
  }, [eligibility, kind, query])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: (programsData as Program[]).length }
    for (const k of Object.keys(ELIGIBILITY)) c[k] = (programsData as Program[]).filter(p => p.eligibility === k).length
    return c
  }, [])

  return (
    <section className="rounded-2xl border border-[#5BC0BE]/30 bg-gradient-to-b from-[#5BC0BE]/8 via-black/10 to-black/20 p-5 md:p-7" id="eu-explorer">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-[#5BC0BE] text-black rounded">EUROPEAN FUNDING EXPLORER</span>
            <span className="text-[10px] text-gray-500 font-mono">Canada-associated · sourced &amp; linked</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tighter">European Opportunities for Canada</h2>
        </div>
        <p className="text-[10px] text-gray-500 max-w-[180px] text-right">Every programme links to its official source — hover the badges and info icons for plain-English explanations.</p>
      </div>

      {/* filter bar */}
      <div className="mt-4 flex flex-col gap-3">
        {/* eligibility */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1 w-20">Access</span>
          {([['all', `All (${counts.all})`]] as [string, string][]).concat(
            (Object.keys(ELIGIBILITY) as Program['eligibility'][]).map(k => [k, `${ELIGIBILITY[k].label} (${counts[k]})`])
          ).map(([val, label]) => (
            <button key={val} onClick={() => setEligibility(val as any)}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                eligibility === val ? 'bg-[#5BC0BE] text-black border-[#5BC0BE] font-semibold' : 'border-white/15 text-gray-300 hover:border-white/40'
              }`}>
              {label}
            </button>
          ))}
          <Tooltip text="How easily a Canadian entity can tap this money: Direct access · EU-located project · Via an EU partner · Conditional on forming an EU arm.">
            <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-gray-400"><CircleHelp className="h-3.5 w-3.5" /></span>
          </Tooltip>
        </div>
        {/* kind + search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {(['all', 'grant', 'rd', 'investment', 'compliance'] as const).map(k => (
              <button key={k} onClick={() => setKind(k)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  kind === k ? 'bg-[#FF8C00] text-black border-[#FF8C00] font-semibold' : 'border-white/15 text-gray-300 hover:border-white/40'
                }`}>
                {k === 'all' ? 'All types' : KINDS[k].label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search programmes, e.g. methane, CCS, Horizon…"
              className="w-full rounded-xl border border-white/15 bg-black/30 pl-9 pr-3 py-2 text-sm placeholder:text-gray-600 focus:border-[#5BC0BE]/60 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {filtered.map(p => {
          const el = ELIGIBILITY[p.eligibility]
          return (
            <div key={p.id} className="group relative flex flex-col rounded-2xl border border-white/15 bg-black/20 p-5 transition hover:border-[#5BC0BE]/50">
              {/* top row */}
              <div className="flex items-start justify-between gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${el.cls}`}>{p.code}</span>
                <Tooltip text={el.tip}>
                  <span className={`inline-flex cursor-help items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${el.cls}`}>
                    <Info className="h-3 w-3" />{el.label}
                  </span>
                </Tooltip>
              </div>
              <h3 className="mt-3 pr-2 text-lg font-bold leading-tight">{p.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#FF8C00]">
                <span className="font-semibold">{p.funding}</span>
                <span className="text-gray-400">{p.budget}</span>
              </div>

              <p className="mt-2.5 text-xs text-gray-400 leading-relaxed">{p.description}</p>

              {/* explainer tooltip */}
              <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                <Tooltip text={p.explainer}>
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-help text-[#5BC0BE]" />
                </Tooltip>
                <span className="text-[10px] text-gray-500 leading-snug">What this means — <b className="text-gray-300" title={p.explainer}>{p.region}</b></span>
              </div>

              {/* dates */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                <Calendar className="h-3 w-3" /> Opens {p.opening} · Ends {p.deadline}
              </div>

              {/* source */}
              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#5BC0BE] hover:text-white transition group/link">
                <Landmark className="h-3.5 w-3.5" />
                {p.sourceLabel}
                <ExternalLink className="h-3 w-3 opacity-60 transition group-hover/link:opacity-100" />
              </a>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-gray-500">
          No programmes match that filter. Clear the search or choose “All” to see every opportunity.
        </div>
      )}

      {/* footnote */}
      <div className="mt-4 text-[10px] text-gray-600 leading-relaxed">
        Programme figures are indicative and current as of the research vault ({new Date().toISOString().slice(0, 10)}). Always confirm terms on the official
        source before planning. Self-updating from the EU funding research — edit the vault, and this panel follows.
      </div>
    </section>
  )
}
