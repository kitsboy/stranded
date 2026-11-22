'use client'

import { useMemo, useState } from 'react'
import { Search, ExternalLink, Landmark, ShieldAlert, CheckCircle2, Layers, Calculator, Activity, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  CAPITAL_DIRECTORY,
  CAPITAL_JURISDICTIONS,
  type CapitalInstrumentType,
  type CapitalJurisdiction,
} from '@/lib/capital-directory'
import { downloadBlob } from '@/lib/export-formats'

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

  // Upgrade #22, #25, #26: Stackable Capital Calculator + DSCR Stress Tester + Equipment Lease vs Buy
  const [projectCapexM, setProjectCapexM] = useState<number>(25)
  const [spv1PowerSharePct, setSpv1PowerSharePct] = useState<number>(52)
  const [stackItc30, setStackItc30] = useState<boolean>(true)
  const [stackProvincialGrant25, setStackProvincialGrant25] = useState<boolean>(true)
  const [stackSeniorDebtLtv, setStackSeniorDebtLtv] = useState<number>(60)
  const [gensetFinancingMode, setGensetFinancingMode] = useState<'buy' | 'lease'>('buy')
  const [interestRatePct, setInterestRatePct] = useState<number>(6.2)

  const stackMath = useMemo(() => {
    const totalCapexCad = projectCapexM * 1_000_000
    const spv1CapexCad = totalCapexCad * (spv1PowerSharePct / 100)
    const spv2CapexCad = totalCapexCad - spv1CapexCad

    // If leasing generators, 70% of SPV 1 upfront CapEx converts into an operating lease
    const effectiveSpv1UpfrontCad = gensetFinancingMode === 'lease' ? spv1CapexCad * 0.30 : spv1CapexCad
    const leasedPrincipalCad = gensetFinancingMode === 'lease' ? spv1CapexCad * 0.70 : 0

    // Grants & ITC apply only to SPV 1 eligible clean power/abatement CapEx
    const provincialGrantCad = stackProvincialGrant25 ? effectiveSpv1UpfrontCad * 0.25 : 0
    const netBasisForItc = Math.max(0, effectiveSpv1UpfrontCad - provincialGrantCad)
    const itcCreditCad = stackItc30 ? netBasisForItc * 0.30 : 0

    const spv1AfterNonDilutive = Math.max(0, effectiveSpv1UpfrontCad - provincialGrantCad - itcCreditCad)
    const seniorDebtCad = spv1AfterNonDilutive * (stackSeniorDebtLtv / 100)
    const spv1EquityCad = spv1AfterNonDilutive - seniorDebtCad
    const totalNetEquityRequiredCad = spv1EquityCad + spv2CapexCad
    const nonDilutiveLeveragePct = totalCapexCad > 0 ? Math.round(((totalCapexCad - totalNetEquityRequiredCad) / totalCapexCad) * 100) : 0

    // Upgrade #25: DSCR Stress Tester (7-year amortization on senior debt + lease)
    const r = interestRatePct / 100
    const tenor = 7
    const annuityFactor = r > 0 ? (r * Math.pow(1 + r, tenor)) / (Math.pow(1 + r, tenor) - 1) : 1 / tenor
    const annualDebtServiceCad = seniorDebtCad * annuityFactor
    const annualLeasePaymentCad = leasedPrincipalCad * (annuityFactor + 0.015)
    const totalAnnualFixedServiceCad = annualDebtServiceCad + annualLeasePaymentCad

    // Model annual EBITDA (~38% of gross CapEx in base stranded methane build)
    const estAnnualEbitdaCad = totalCapexCad * 0.38
    const dscr = totalAnnualFixedServiceCad > 0 ? +(estAnnualEbitdaCad / totalAnnualFixedServiceCad).toFixed(2) : 9.99
    // Minimum BTC price to maintain 1.35x DSCR covenant
    const minBtcPriceFor135DscrCad = estAnnualEbitdaCad > 0
      ? Math.round(115000 * ((totalAnnualFixedServiceCad * 1.35) / estAnnualEbitdaCad))
      : 35000

    return {
      totalCapexCad,
      spv1CapexCad,
      spv2CapexCad,
      effectiveSpv1UpfrontCad,
      leasedPrincipalCad,
      provincialGrantCad,
      itcCreditCad,
      seniorDebtCad,
      spv1EquityCad,
      totalNetEquityRequiredCad,
      nonDilutiveLeveragePct,
      annualDebtServiceCad,
      annualLeasePaymentCad,
      totalAnnualFixedServiceCad,
      estAnnualEbitdaCad,
      dscr,
      minBtcPriceFor135DscrCad,
    }
  }, [projectCapexM, spv1PowerSharePct, stackItc30, stackProvincialGrant25, stackSeniorDebtLtv, gensetFinancingMode, interestRatePct])

  const exportDataRoomBundle = () => {
    const md = [
      `# Stranded Value — Institutional Data Room Bundle (Two-SPV Capital Stack + DSCR Stress Test)`,
      ``,
      `- **Generated:** ${new Date().toISOString()} · https://stranded.giveabit.io/funding`,
      `- **Total Cluster CapEx:** C$${stackMath.totalCapexCad.toLocaleString()} (${projectCapexM}M CAD)`,
      `- **Generator Financing Mode:** ${gensetFinancingMode === 'lease' ? 'Equipment Operating Lease (70% leased)' : 'Direct Balance-Sheet CapEx Purchase'}`,
      ``,
      `## 1. Two-SPV Capital Stack Breakdown`,
      `| Tranche / Vehicle | Amount (CAD) | Notes |`,
      `|---|---:|---|`,
      `| **SPV 1 (Clean Abatement & Power Plant Co.)** | C$${Math.round(stackMath.spv1CapexCad).toLocaleString()} | Reciprocating gensets, H₂S scrubber, heat recovery (${spv1PowerSharePct}% of total) |`,
      `| └─ Provincial Methane Grant (ERA / CleanBC 25%) | -C$${Math.round(stackMath.provincialGrantCad).toLocaleString()} | Non-dilutive abatement cost share |`,
      `| └─ Federal Clean Tech ITC (30% on net basis) | -C$${Math.round(stackMath.itcCreditCad).toLocaleString()} | Refundable investment tax credit on eligible power plant |`,
      `| └─ Senior Infrastructure Debt (${stackSeniorDebtLtv}% LTV @ ${interestRatePct}%) | -C$${Math.round(stackMath.seniorDebtCad).toLocaleString()} | CIB / AIOC / Charter Bank 7-year equipment term loan |`,
      `| **SPV 1 Net Equity Required** | **C$${Math.round(stackMath.spv1EquityCad).toLocaleString()}** | Project sponsor / Indigenous JV equity |`,
      `| **SPV 2 (Sovereign Compute Offtaker Co.)** | **C$${Math.round(stackMath.spv2CapexCad).toLocaleString()}** | Modular ASIC Capture Huts + behind-the-meter PPA with SPV 1 |`,
      `| **Total Sponsor Equity Check** | **C$${Math.round(stackMath.totalNetEquityRequiredCad).toLocaleString()}** | **${stackMath.nonDilutiveLeveragePct}% non-dilutive + debt capital efficiency** |`,
      ``,
      `## 2. Project Finance DSCR Stress Test`,
      `- **Annual Senior Debt + Lease Service:** C$${Math.round(stackMath.totalAnnualFixedServiceCad).toLocaleString()}/yr`,
      `- **Model Annual Cluster EBITDA:** C$${Math.round(stackMath.estAnnualEbitdaCad).toLocaleString()}/yr`,
      `- **Projected DSCR (Debt Service Coverage Ratio):** **${stackMath.dscr}×** (Bankable covenant threshold ≥ 1.35×)`,
      `- **Breakeven BTC Price for 1.35× DSCR Covenant:** **C$${stackMath.minBtcPriceFor135DscrCad.toLocaleString()} / BTC**`,
      ``,
      `## 3. Matched Multi-Jurisdiction Programs (${filtered.length} Active)`,
      ...filtered.map(p => `- **${p.name}** (${p.jurisdictionLabel} · ${p.instrumentLabel}) — ${p.poolSize} · ${p.matchOrRate} · ${p.url}`),
      ``,
      `> Illustrative institutional screening package only. Verify eligibility with program officers and tax counsel.`,
    ].join('\n')
    downloadBlob(md, `stranded-institutional-dataroom-${projectCapexM}M.md`, 'text/markdown')
    toast.success('1-Click Institutional Data Room Bundle exported (.md)')
  }

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

        {/* Upgrade #27: 1-Click Data Room Bundle Export */}
        <button
          type="button"
          onClick={exportDataRoomBundle}
          data-testid="capital-dataroom-export"
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF8C00] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#ff9d33] transition shrink-0"
        >
          <FileDown size={15} /> Export 1-Click Data Room Bundle (.MD)
        </button>
      </div>

      {/* Upgrades #21, #22, #25, #26: Interactive Two-SPV Stackable Capital Calculator + DSCR Stress Tester */}
      <div className="mt-6 rounded-2xl border border-[#5BC0BE]/30 bg-black/35 p-5" data-testid="two-spv-capital-calculator">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator size={16} className="text-[#5BC0BE]" /> Interactive Two-SPV Capital Stack &amp; DSCR Stress Tester
          </div>
          {/* Upgrade #26: Equipment Leasing vs CapEx Purchase Toggle */}
          <div className="inline-flex rounded-xl border border-white/15 bg-black/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setGensetFinancingMode('buy')}
              data-testid="genset-mode-buy"
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                gensetFinancingMode === 'buy' ? 'bg-[#5BC0BE] text-black' : 'text-gray-300 hover:text-white'
              }`}
            >
              CapEx Purchase (SPV 1 Owns Gensets)
            </button>
            <button
              type="button"
              onClick={() => setGensetFinancingMode('lease')}
              data-testid="genset-mode-lease"
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                gensetFinancingMode === 'lease' ? 'bg-[#FF8C00] text-black' : 'text-gray-300 hover:text-white'
              }`}
            >
              Equipment Lease (70% Leased Gensets)
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-5">
          <div>
            <label className="flex justify-between text-xs text-gray-300 mb-1">
              <span>Cluster Total CapEx</span>
              <span className="font-mono font-bold text-[#FF8C00]">C${projectCapexM}M</span>
            </label>
            <input
              type="range"
              min={2}
              max={500}
              step={2}
              value={projectCapexM}
              onChange={e => setProjectCapexM(Number(e.target.value))}
              aria-label="Cluster total CapEx in millions CAD"
              className="w-full accent-[#FF8C00]"
            />
            <div className="text-[11px] text-gray-400 mt-1">Single site (C$2M) to 100-site portfolio (C$500M)</div>
          </div>

          <div>
            <label className="flex justify-between text-xs text-gray-300 mb-1">
              <span>SPV 1 Power/Abatement Share</span>
              <span className="font-mono font-bold text-[#5BC0BE]">{spv1PowerSharePct}%</span>
            </label>
            <input
              type="range"
              min={35}
              max={75}
              step={1}
              value={spv1PowerSharePct}
              onChange={e => setSpv1PowerSharePct(Number(e.target.value))}
              aria-label="SPV 1 clean power CapEx percentage"
              className="w-full accent-[#5BC0BE]"
            />
            <div className="text-[11px] text-gray-400 mt-1">Genset + H₂S scrubber + heat recovery</div>
          </div>

          <div>
            <label className="flex justify-between text-xs text-gray-300 mb-1">
              <span>Senior Debt LTV (@ {interestRatePct}%)</span>
              <span className="font-mono font-bold text-white">{stackSeniorDebtLtv}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={75}
              step={5}
              value={stackSeniorDebtLtv}
              onChange={e => setStackSeniorDebtLtv(Number(e.target.value))}
              aria-label="Senior project debt loan to value percentage"
              className="w-full accent-emerald-400"
            />
            <div className="flex gap-3 mt-1 text-[11px]">
              <label className="inline-flex items-center gap-1 cursor-pointer text-gray-300">
                <input type="checkbox" checked={stackItc30} onChange={e => setStackItc30(e.target.checked)} className="accent-[#34D399]" />
                30% ITC
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer text-gray-300">
                <input type="checkbox" checked={stackProvincialGrant25} onChange={e => setStackProvincialGrant25(e.target.checked)} className="accent-[#FF8C00]" />
                25% ERA/BC Grant
              </label>
            </div>
          </div>

          <div>
            <label className="flex justify-between text-xs text-gray-300 mb-1">
              <span>Debt Interest Rate</span>
              <span className="font-mono font-bold text-amber-300">{interestRatePct.toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min={3.5}
              max={11.0}
              step={0.1}
              value={interestRatePct}
              onChange={e => setInterestRatePct(Number(e.target.value))}
              aria-label="Project debt interest rate percentage"
              className="w-full accent-amber-400"
            />
            <div className="text-[11px] text-gray-400 mt-1">AIOC/CIB sovereign guarantee lowers rate</div>
          </div>
        </div>

        {/* Upgrade #21: Visual Two-SPV Waterfall Readout */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/10 p-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#5BC0BE]">
              <span>SPV 1 · Abatement &amp; Power Co.</span>
              <Layers size={13} />
            </div>
            <div className="mt-1 text-lg font-bold font-mono text-white">
              C${(stackMath.spv1CapexCad / 1e6).toFixed(2)}M
            </div>
            <div className="mt-1 text-[11px] text-gray-300">
              Grants + ITC save <strong>C${((stackMath.provincialGrantCad + stackMath.itcCreditCad) / 1e6).toFixed(2)}M</strong> · Debt covers <strong>C${(stackMath.seniorDebtCad / 1e6).toFixed(2)}M</strong>
            </div>
          </div>

          <div className="rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/10 p-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#FF8C00]">
              <span>SPV 2 · ASIC Compute Offtaker</span>
              <Layers size={13} />
            </div>
            <div className="mt-1 text-lg font-bold font-mono text-white">
              C${(stackMath.spv2CapexCad / 1e6).toFixed(2)}M
            </div>
            <div className="mt-1 text-[11px] text-gray-300">
              Owns Capture Huts &amp; ASICs · Signs behind-the-meter PPA with SPV 1
            </div>
          </div>

          <div className="rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 p-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#34D399]">
              <span>Net Sponsor Equity Check</span>
              <CheckCircle2 size={13} />
            </div>
            <div className="mt-1 text-lg font-bold font-mono text-white" data-testid="capital-net-equity">
              C${(stackMath.totalNetEquityRequiredCad / 1e6).toFixed(2)}M
            </div>
            <div className="mt-1 text-[11px] text-gray-300">
              <strong>{stackMath.nonDilutiveLeveragePct}%</strong> funded via grants, ITC, debt/lease
            </div>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3" data-testid="capital-dscr-card">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-amber-300">
              <span>DSCR Debt Stress Test</span>
              <Activity size={13} />
            </div>
            <div className="mt-1 text-lg font-bold font-mono text-white">
              {stackMath.dscr}× <span className="text-xs font-normal text-gray-300">DSCR</span>
            </div>
            <div className="mt-1 text-[11px] text-gray-300">
              1.35× covenant holds down to <strong>C${stackMath.minBtcPriceFor135DscrCad.toLocaleString()}/BTC</strong>
            </div>
          </div>
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
