'use client'

import { useMemo, useState } from 'react'
import { Search, ExternalLink, Landmark, ShieldAlert, CheckCircle2 } from 'lucide-react'
import {
  CAPITAL_DIRECTORY,
  CAPITAL_JURISDICTIONS,
  type CapitalInstrumentType,
  type CapitalJurisdiction,
} from '@/lib/capital-directory'

const INSTRUMENT_FILTERS: { id: 'all' | CapitalInstrumentType; label: string }[] = [
  { id: 'all', label: 'All Instruments' },
  { id: 'grant', label: 'Non-Dilutive Grants' },
  { id: 'tax-credit', label: 'Tax & Royalty Credits' },
  { id: 'concessional-debt', label: 'Sovereign Debt & Guarantees' },
  { id: 'equity-co-invest', label: 'Sovereign Equity & CCfDs' },
  { id: 'compliance-offtake', label: 'Carbon & EUMER Offtake' },
]

export default function GlobalCapitalDirectory() {
  const [jurisdiction, setJurisdiction] = useState<'all' | CapitalJurisdiction>('all')
  const [instrument, setInstrument] = useState<'all' | CapitalInstrumentType>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CAPITAL_DIRECTORY.filter(item => {
      if (jurisdiction !== 'all' && item.jurisdiction !== jurisdiction) return false
      if (instrument !== 'all' && item.instrument !== instrument) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.agency.toLowerCase().includes(q) ||
        item.qualifyingScope.toLowerCase().includes(q) ||
        item.jurisdictionLabel.toLowerCase().includes(q)
      )
    })
  }, [jurisdiction, instrument, query])

  return (
    <section
      className="rounded-3xl border border-[#FF8C00]/35 bg-gradient-to-b from-[#0f172a] via-[#111c2d] to-black/40 p-6 md:p-8 shadow-2xl"
      data-testid="global-capital-directory"
      aria-labelledby="capital-dir-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8C00]/40 bg-[#FF8C00]/15 px-3 py-1 text-xs font-semibold tracking-wider text-[#FF8C00]">
            <Landmark size={13} /> MULTI-JURISDICTION CAPITAL STACK · CANADA · AB · BC · ON/SK · USA · EUROPE
          </div>
          <h2 id="capital-dir-heading" className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">
            Where the Billions Come From: Global Grants, Tax Credits &amp; Sovereign Debt
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-300">
            Every major funding pool across Canada (Federal, Alberta TIER/ERA, CleanBC, Ontario/Saskatchewan), the United States, and the European Union — with direct links to the official administering agency and an <strong>honest scope note</strong> separating upstream methane-capture power equipment (eligible for grants/ITCs) from ASIC compute servers.
          </p>
        </div>
      </div>

      {/* Jurisdiction Tabs */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {CAPITAL_JURISDICTIONS.map(j => {
          const count =
            j.id === 'all'
              ? CAPITAL_DIRECTORY.length
              : CAPITAL_DIRECTORY.filter(c => c.jurisdiction === j.id).length
          const active = jurisdiction === j.id
          return (
            <button
              key={j.id}
              type="button"
              onClick={() => setJurisdiction(j.id)}
              data-testid={`capital-tab-${j.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-[#FF8C00] bg-[#FF8C00] text-black'
                  : 'border-white/15 bg-black/30 text-gray-300 hover:border-white/35'
              }`}
            >
              <span>{j.flag}</span>
              <span>{j.label}</span>
              <span className={`text-[10px] ${active ? 'text-black/80' : 'text-gray-400'}`}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Instrument Filter + Search */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {INSTRUMENT_FILTERS.map(f => {
            const active = instrument === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setInstrument(f.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active
                    ? 'border-[#5BC0BE] bg-[#5BC0BE] text-black font-semibold'
                    : 'border-white/15 text-gray-300 hover:border-white/35'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by agency, province, ITC, Indigenous, EU…"
            aria-label="Filter capital directory"
            className="w-full rounded-xl border border-white/15 bg-black/40 pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:border-[#5BC0BE] focus:outline-none"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {filtered.map(item => (
          <article
            key={item.id}
            data-testid={`capital-card-${item.id}`}
            className="rounded-2xl border border-white/12 bg-black/30 p-5 flex flex-col justify-between hover:border-[#5BC0BE]/45 transition"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-gray-200">
                  <span>{item.flag}</span>
                  <span>{item.jurisdictionLabel}</span>
                </span>
                <span className="rounded-full border border-[#5BC0BE]/35 bg-[#5BC0BE]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5BC0BE]">
                  {item.instrumentLabel}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold text-white leading-snug">{item.name}</h3>
              <div className="mt-0.5 text-xs text-gray-400">{item.agency}</div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase text-gray-400">Program Pool / Mandate</div>
                  <div className="font-mono font-semibold text-[#FF8C00] mt-0.5">{item.poolSize}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400">Ticket / Match Rate</div>
                  <div className="font-mono font-semibold text-[#34D399] mt-0.5">{item.matchOrRate}</div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-gray-300 leading-relaxed">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 mb-1">
                  <CheckCircle2 size={12} /> Honest Qualifying Scope
                </div>
                {item.qualifyingScope}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-400 font-mono text-[11px]">{item.ticketRange}</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#5BC0BE] hover:text-white transition"
              >
                Official Program Page <ExternalLink size={12} />
              </a>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-gray-400">
          No funding programs match that filter. Click &ldquo;All Jurisdictions&rdquo; or clear the search box.
        </div>
      )}

      {/* Capital Stacking Architecture Explainer */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-gray-300 flex items-start gap-3">
        <ShieldAlert size={18} className="text-[#FF8C00] shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">How Institutional Deals Stack These Programs (Two-SPV Structure):</strong>{' '}
          Most federal and provincial grants/ITCs explicitly exclude cryptocurrency mining hardware. Institutional operators solve this cleanly with a <strong>Two-SPV Structure</strong>: <strong>SPV 1 (Clean Abatement &amp; Power Plant Co.)</strong> owns the gas scrubber, flare-to-power reciprocating generators, and heat recovery — qualifying for 30%–75% non-dilutive grants, Clean Tech ITCs, and 65% LTV senior infrastructure debt. <strong>SPV 2 (Sovereign Compute Offtaker Co.)</strong> owns the modular ASIC capture huts and signs a behind-the-meter PPA with SPV 1.
        </div>
      </div>
    </section>
  )
}
