'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Landmark, ShieldCheck, Coins, Users, TrendingUp, Flame, Share2, Printer, Scale } from 'lucide-react'
import { toast } from 'sonner'
import {
  computeSovereignPension,
  PENSION_TRUST_PROFILES,
  encodePensionHash,
  decodePensionHash,
  type PensionTrustId,
} from '@/lib/pension-model'
import { useBtcPrice } from '@/components/BtcPriceProvider'

type Props = {
  /** Default annual portfolio BTC at 100% capture (live-stats valueModel.annualBtc ≈ 7,079.73). */
  fullPortfolioAnnualBtc?: number
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return `C$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `C$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `C$${Math.round(n / 1_000).toLocaleString('en-CA')}K`
  return `C$${Math.round(n).toLocaleString('en-CA')}`
}

export default function SovereignPensionPlan({ fullPortfolioAnnualBtc = 7079.73 }: Props) {
  const { fiats } = useBtcPrice()
  const cadPerBtc = fiats.cad || 115000

  const [trustId, setTrustId] = useState<PensionTrustId>('canada-national')
  const [capturePct, setCapturePct] = useState<number>(25)
  const [flatTaxPct, setFlatTaxPct] = useState<number>(10)
  const [communitySharePct] = useState<number>(15)
  const [horizonYears, setHorizonYears] = useState<number>(20)
  const [btcCagrPct, setBtcCagrPct] = useState<number>(12)
  const [includeNuclearPhase3, setIncludeNuclearPhase3] = useState<boolean>(false)

  // Restore from #pension=<token> URL hash if present
  useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.location.hash.match(/#pension=([A-Za-z0-9_-]+)/)
    if (!m) return
    const decoded = decodePensionHash(m[1])
    if (!decoded) return
    setTrustId(decoded.trustId)
    setCapturePct(decoded.capturePct)
    setFlatTaxPct(decoded.flatTaxPct)
    setHorizonYears(decoded.horizonYears)
    setBtcCagrPct(decoded.btcCagrPct)
    setIncludeNuclearPhase3(decoded.nuclear)
  }, [])

  const trust = useMemo(
    () => PENSION_TRUST_PROFILES.find(t => t.id === trustId) || PENSION_TRUST_PROFILES[0],
    [trustId],
  )

  const effectiveAnnualBtc = useMemo(() => {
    const trustScale = trust.siteSharePct / 100
    const methaneBtc = fullPortfolioAnnualBtc * trustScale * (capturePct / 100)
    const nuclearBonusBtc = includeNuclearPhase3 ? 3200 * trustScale * (capturePct / 100) : 0
    return methaneBtc + nuclearBonusBtc
  }, [fullPortfolioAnnualBtc, trust.siteSharePct, capturePct, includeNuclearPhase3])

  const model = useMemo(
    () =>
      computeSovereignPension({
        annualPortfolioBtc: effectiveAnnualBtc,
        btcPriceFiat: cadPerBtc,
        flatTaxPct,
        communitySharePct,
        horizonYears,
        btcCagrPct,
        populationCount: trust.population,
        benchmarkAumCad: trust.benchmarkAumCad,
      }),
    [effectiveAnnualBtc, cadPerBtc, flatTaxPct, communitySharePct, horizonYears, btcCagrPct, trust.population, trust.benchmarkAumCad],
  )

  const copyPensionShareUrl = () => {
    const token = encodePensionHash({
      trustId,
      capturePct,
      flatTaxPct,
      communitySharePct,
      horizonYears,
      btcCagrPct,
      nuclear: includeNuclearPhase3,
    })
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'
    const path = typeof window !== 'undefined' ? window.location.pathname : '/funding'
    const url = `${origin}${path}#pension=${token}`
    navigator.clipboard?.writeText(url)
    toast.success('Sovereign Pension scenario link copied', { description: url })
  }

  const printWhitepaperBrief = () => {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${trust.name} — Policy Whitepaper Brief</title>
<style>
  body { font-family: Georgia, serif; color: #000; background: #fff; max-width: 820px; margin: 32px auto; padding: 0 24px; line-height: 1.55; }
  h1, h2, h3 { font-family: system-ui, sans-serif; color: #000; margin-bottom: 6px; }
  .meta { font-family: monospace; font-size: 12px; color: #333; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th, td { border: 1px solid #222; padding: 8px 10px; text-align: left; }
  th { background: #f3f4f6; font-weight: 700; }
  .box { border: 1px solid #000; padding: 14px; margin: 16px 0; }
</style></head><body>
  <h1>${trust.flag} ${trust.name}</h1>
  <div class="meta">Policy Simulation Brief · Stranded Value (stranded.giveabit.io) · Generated ${new Date().toISOString().slice(0, 10)}</div>
  <p><strong>Core Fiscal Compact:</strong> A single, codified <strong>${flatTaxPct}% flat production royalty in native Bitcoin</strong> on off-grid stranded-energy mining (0 kW grid draw), <strong>${communitySharePct}% direct revenue share</strong> to First Nations &amp; Landowners, and <strong>${Math.max(0, 100 - flatTaxPct - communitySharePct)}% retained by project operators</strong>.</p>
  <table>
    <tr><th>Metric</th><th>Value (${horizonYears}-Year Horizon)</th></tr>
    <tr><td>Jurisdiction / Trust Scope</td><td>${trust.name} (${trust.siteCount.toLocaleString()} mapped ECCC sites)</td></tr>
    <tr><td>Rollout &amp; Energy Scope</td><td>${capturePct}% capture ${includeNuclearPhase3 ? '+ Phase 3 Nuclear/SMR off-peak surplus' : '(Stranded Methane only)'}</td></tr>
    <tr><td>Year-1 Sovereign Royalty Deposit</td><td>${model.annualTaxBtc.toLocaleString()} BTC / yr (${fmtMoney(model.annualTaxFiatToday)}/yr at today's price)</td></tr>
    <tr><td>Cumulative Pension Reserve (${horizonYears}Y)</td><td><strong>${model.cumulativeBtcAtHorizon.toLocaleString()} BTC</strong> (includes 4-year halving retention factor)</td></tr>
    <tr><td>Fund Value at ${btcCagrPct}% BTC CAGR</td><td><strong>${fmtMoney(model.pensionValueFiatAtHorizon)}</strong> (Flat 0% price: ${fmtMoney(model.pensionValueFlatPriceFiat)})</td></tr>
    <tr><td>Status-Quo Fiat Tax Regime Comparison</td><td>${fmtMoney(model.statusQuoFiatAtHorizon)} (${model.sovereignAdvantageMultiple}× lower wealth creation due to capital flight)</td></tr>
    <tr><td>4% Perpetual Annual Pension Dividend</td><td>${fmtMoney(model.annualPayoutAt4PctDrawdownFiat)}/yr (${model.retireesSupportedAt25kYr.toLocaleString()} pensions @ C$25K/yr)</td></tr>
    <tr><td>Benchmark Share (${trust.benchmarkLabel})</td><td>${model.benchmarkSharePct}% of benchmark AUM</td></tr>
  </table>
  <div class="box">
    <strong>Honesty &amp; Safe Harbour Note:</strong> Policy and compounding simulation for public-finance and institutional discussion. Not enacted tax law or investment advice. All site counts trace to Environment and Climate Change Canada (ECCC) GHGRP open data.
  </div>
</body></html>`
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.print()
    }
  }

  return (
    <section
      className="rounded-3xl border border-[#FF8C00]/35 bg-gradient-to-br from-[#FF8C00]/10 via-[#0f172a] to-[#5BC0BE]/10 p-6 md:p-8 shadow-2xl"
      data-testid="sovereign-pension-plan"
      aria-labelledby="pension-plan-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8C00]/40 bg-[#FF8C00]/15 px-3 py-1 text-xs font-semibold tracking-wider text-[#FF8C00]">
            <Landmark size={13} /> THE CANADIAN SOVEREIGN BITCOIN PENSION COMPACT
          </div>
          <h2 id="pension-plan-heading" className="mt-2 text-2xl md:text-4xl font-bold tracking-tight text-white">
            What If <span className="text-[#FF8C00]">{flatTaxPct}% Is the ONLY Tax</span> — and 100% Goes Into a Sovereign Pension?
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-300 leading-relaxed">
            Instead of punitive regulations and multi-layered corporate taxes that drive billions in infrastructure capital out of Canada, imagine a simple sovereign compact: <strong>zero grid draw, {flatTaxPct}% flat production royalty paid directly in Bitcoin into an auditable Sovereign Pension Trust</strong>, {communitySharePct}% direct revenue share to Landowners &amp; First Nations, and {Math.max(0, 100 - flatTaxPct - communitySharePct)}% retained by the builders who fund and operate the capture huts.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIncludeNuclearPhase3(v => !v)}
              data-testid="pension-nuclear-toggle"
              aria-pressed={includeNuclearPhase3}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                includeNuclearPhase3
                  ? 'border-[#A78BFA] bg-[#A78BFA]/20 text-[#A78BFA]'
                  : 'border-white/15 bg-black/30 text-gray-300 hover:border-white/30'
              }`}
            >
              ⚛️ {includeNuclearPhase3 ? 'Phase 3 Nuclear + SMR: INCLUDED' : '+ Add Phase 3 Nuclear / SMR'}
            </button>
            <button
              type="button"
              onClick={copyPensionShareUrl}
              data-testid="pension-share-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#5BC0BE]/40 bg-[#5BC0BE]/10 px-3 py-2 text-xs font-semibold text-[#5BC0BE] hover:bg-[#5BC0BE]/20 transition"
            >
              <Share2 size={13} /> Share Scenario
            </button>
            <button
              type="button"
              onClick={printWhitepaperBrief}
              data-testid="pension-print-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <Printer size={13} /> Print Whitepaper PDF
            </button>
          </div>
          <span className="text-[11px] text-gray-400">
            {trust.flag} {trust.description}
          </span>
        </div>
      </div>

      {/* Jurisdiction / Sovereign Trust Mode Selector (Upgrade #1 & #2) */}
      <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Sovereign Trust Mode">
        {PENSION_TRUST_PROFILES.map(p => {
          const active = p.id === trustId
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`pension-trust-${p.id}`}
              onClick={() => setTrustId(p.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-[#FF8C00] bg-[#FF8C00] text-black'
                  : 'border-white/15 bg-black/30 text-gray-300 hover:border-white/35'
              }`}
            >
              <span>{p.flag}</span>
              <span>{p.name.replace(' Bitcoin Pension (National)', '').replace(' Bitcoin Trust', '')}</span>
              <span className={`text-[10px] ${active ? 'text-black/75' : 'text-gray-400'}`}>({p.siteCount})</span>
            </button>
          )
        })}
      </div>

      {/* Interactive Policy Sliders */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-black/30 rounded-2xl p-4 border border-white/10">
        <div>
          <label className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Capture Rollout</span>
            <span className="font-mono font-bold text-[#FF8C00]">{capturePct}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={capturePct}
            onChange={e => setCapturePct(Number(e.target.value))}
            aria-label="National methane capture rollout percentage"
            className="w-full accent-[#FF8C00]"
          />
          <div className="text-[11px] text-gray-400 mt-1">
            ~{Math.round(trust.siteCount * (capturePct / 100)).toLocaleString()} sites deployed ({effectiveAnnualBtc.toFixed(0)} BTC/yr gross)
          </div>
        </div>

        <div>
          <label className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Flat Pension Tax (Only Tax)</span>
            <span className="font-mono font-bold text-[#5BC0BE]">{flatTaxPct}%</span>
          </label>
          <input
            type="range"
            min={5}
            max={25}
            step={1}
            value={flatTaxPct}
            onChange={e => setFlatTaxPct(Number(e.target.value))}
            aria-label="Flat pension tax percentage"
            className="w-full accent-[#5BC0BE]"
          />
          <div className="text-[11px] text-gray-400 mt-1">
            Paid in native BTC per block to sovereign custody
          </div>
        </div>

        <div>
          <label className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Pension Horizon</span>
            <span className="font-mono font-bold text-white">{horizonYears} years</span>
          </label>
          <input
            type="range"
            min={5}
            max={35}
            step={5}
            value={horizonYears}
            onChange={e => setHorizonYears(Number(e.target.value))}
            aria-label="Pension accumulation horizon in years"
            className="w-full accent-emerald-400"
          />
          <div className="text-[11px] text-gray-400 mt-1">
            Includes 4-year Bitcoin halving supply schedule
          </div>
        </div>

        <div>
          <label className="flex justify-between text-xs text-gray-300 mb-1">
            <span>BTC Compounding Scenario</span>
            <span className="font-mono font-bold text-amber-300">{btcCagrPct}% / yr</span>
          </label>
          <input
            type="range"
            min={0}
            max={25}
            step={1}
            value={btcCagrPct}
            onChange={e => setBtcCagrPct(Number(e.target.value))}
            aria-label="Bitcoin annual CAGR scenario percentage"
            className="w-full accent-amber-400"
          />
          <div className="text-[11px] text-gray-400 mt-1">
            0% = flat today&apos;s price ({fmtMoney(cadPerBtc)}/BTC)
          </div>
        </div>
      </div>

      {/* Headline Sovereign Wealth Readout */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#FF8C00]/35 bg-[#FF8C00]/10 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#FF8C00]">
            <span>Pension BTC Accumulated</span>
            <Coins size={16} />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-white" data-testid="pension-cumulative-btc">
            {model.cumulativeBtcAtHorizon.toLocaleString('en-CA')} <span className="text-base text-[#FF8C00]">BTC</span>
          </div>
          <div className="mt-1 text-xs text-gray-300">
            Year-1 deposit: <strong>{model.annualTaxBtc.toLocaleString('en-CA')} BTC/yr</strong> ({fmtMoney(model.annualTaxFiatToday)}/yr today)
          </div>
        </div>

        <div className="rounded-2xl border border-[#34D399]/35 bg-[#34D399]/10 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#34D399]">
            <span>Sovereign Fund Value ({horizonYears}Y)</span>
            <TrendingUp size={16} />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-white" data-testid="pension-fund-value">
            {fmtMoney(model.pensionValueFiatAtHorizon)}
          </div>
          <div className="mt-1 text-xs text-gray-300">
            At flat 0% BTC price change: <strong>{fmtMoney(model.pensionValueFlatPriceFiat)}</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-[#5BC0BE]/35 bg-[#5BC0BE]/10 p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5BC0BE]">
            <span>Annual Pension Dividend (4%)</span>
            <Users size={16} />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-white">
            {fmtMoney(model.annualPayoutAt4PctDrawdownFiat)}<span className="text-sm font-normal text-gray-300">/yr</span>
          </div>
          <div className="mt-1 text-xs text-gray-300">
            Funds <strong>{model.retireesSupportedAt25kYr.toLocaleString('en-CA')}</strong> pensions @ C$25K/yr · {model.satsPerCitizenAtHorizon.toLocaleString()} sats/citizen
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-300">
            <span>Why Billions in Capital Come</span>
            <ShieldCheck size={16} className="text-[#FF8C00]" />
          </div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-[#FF8C00]">
            {Math.max(0, 100 - flatTaxPct - communitySharePct)}% <span className="text-sm font-normal text-gray-300">Operator Net</span>
          </div>
          <div className="mt-1 text-xs text-gray-300">
            <strong>{model.annualOperatorRetainedBtc.toLocaleString('en-CA')} BTC/yr</strong> to capital + <strong>{model.annualCommunityShareBtc.toLocaleString('en-CA')} BTC/yr</strong> to Nations/Landowners
          </div>
        </div>
      </div>

      {/* Tax Regime Comparison Bar & Sovereign Benchmark Overlay (Upgrades #4 & #5) */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="pension-tax-comparison">
          <div className="flex items-center justify-between text-xs font-semibold text-[#FF8C00] mb-2">
            <span className="inline-flex items-center gap-1.5"><Scale size={14} /> {flatTaxPct}% Flat BTC Compact vs. Status-Quo Fiat Tax Regime</span>
            <span className="font-mono text-[#34D399]">{model.sovereignAdvantageMultiple}× More Sovereign Wealth</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-gray-200 mb-1">
                <span>10% Flat BTC Pension Compact (High Capital Inflow + BTC Reserve)</span>
                <span className="font-mono font-bold text-[#34D399]">{fmtMoney(model.pensionValueFiatAtHorizon)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF8C00] to-[#34D399]" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Status-Quo 27% Corporate/Carbon Tax (80% Capital Flight + Spent in Fiat)</span>
                <span className="font-mono text-gray-300">{fmtMoney(model.statusQuoFiatAtHorizon)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-rose-500/70"
                  style={{ width: `${Math.max(4, Math.min(100, Math.round((model.statusQuoFiatAtHorizon / Math.max(1, model.pensionValueFiatAtHorizon)) * 100)))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-col justify-between" data-testid="pension-sovereign-benchmarks">
          <div>
            <div className="text-xs font-semibold text-[#5BC0BE] mb-2">
              Sovereign Wealth Benchmark Overlay ({trust.benchmarkLabel})
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase text-gray-400">Share of {trust.benchmarkLabel.split('(')[0]}</div>
                <div className="text-xl font-bold font-mono text-[#5BC0BE] mt-0.5">{model.benchmarkSharePct}%</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Added from wasted methane alone</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase text-gray-400">vs. Norway GPFG (C$2.3T)</div>
                <div className="text-xl font-bold font-mono text-[#FF8C00] mt-0.5">{model.norwayGpfgSharePct}%</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Non-dilutive Bitcoin reserve</div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Every satoshi deposited into the trust is anchored via OpenTimestamps (`satohash.io`) so citizens can verify the reserve on-chain.
          </div>
        </div>
      </div>

      {/* The 3-Pillar Policy Pitch to Enrich Canadians */}
      <div className="mt-6 grid gap-4 md:grid-cols-3 text-xs">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="font-semibold text-[#FF8C00] mb-1">1. Zero Tax Complexity · Zero Grid Burden</div>
          <p className="text-gray-300 leading-relaxed">
            Institutional infrastructure funds hate unpredictable royalty regimes and grid interconnection queues. A codified <strong>{flatTaxPct}% flat BTC production tax</strong> on off-grid waste methane gives multi-billion-dollar allocators 20-year certainty with zero impact on residential electricity bills.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="font-semibold text-[#5BC0BE] mb-1">2. Non-Dilutive Hard Money for Citizens</div>
          <p className="text-gray-300 leading-relaxed">
            Norway built a US$1.7T sovereign fund from oil. Canada can build a <strong>Sovereign Bitcoin Pension Reserve</strong> from waste methane that is currently vented or flared for $0 — anchored on-chain and auditable by every Canadian via OpenTimestamps.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="font-semibold text-[#A78BFA] mb-1 flex items-center gap-1">
            <Flame size={13} /> 3. Phase 1 Methane → Phase 3 Nuclear SMRs
          </div>
          <p className="text-gray-300 leading-relaxed">
            We start with <strong>2,611 verified ECCC methane sites</strong> today because the gas is already leaking and huts deploy in weeks. Once the sovereign pension rail is live, Phase 3 scales into <strong>Canadian CANDU &amp; SMR nuclear baseload</strong>.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
        <span>
          Honesty note: Policy &amp; compounding simulation for institutional and public-policy discussion. Model figures use the portfolio value model (optimistic hashprice scenario) with a 0.82 per-halving-epoch production retention factor. Not tax or investment advice.
        </span>
        <Link href="/investors" className="text-[#5BC0BE] hover:underline font-medium">
          Download Sovereign &amp; Institutional Brief →
        </Link>
      </div>
    </section>
  )
}
