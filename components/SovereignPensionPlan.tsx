'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Landmark, ShieldCheck, Coins, Users, TrendingUp, Flame } from 'lucide-react'
import { computeSovereignPension } from '@/lib/pension-model'
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

  const [capturePct, setCapturePct] = useState<number>(25)
  const [flatTaxPct, setFlatTaxPct] = useState<number>(10)
  const [communitySharePct, setCommunitySharePct] = useState<number>(15)
  const [horizonYears, setHorizonYears] = useState<number>(20)
  const [btcCagrPct, setBtcCagrPct] = useState<number>(12)
  const [includeNuclearPhase3, setIncludeNuclearPhase3] = useState<boolean>(false)

  // Phase 3 Nuclear/SMR off-peak baseload adds ~3,200 BTC/yr capacity across 18 SMR/CANDU surplus nodes
  const effectiveAnnualBtc = useMemo(() => {
    const methaneBtc = fullPortfolioAnnualBtc * (capturePct / 100)
    const nuclearBonusBtc = includeNuclearPhase3 ? 3200 * (capturePct / 100) : 0
    return methaneBtc + nuclearBonusBtc
  }, [fullPortfolioAnnualBtc, capturePct, includeNuclearPhase3])

  const model = useMemo(
    () =>
      computeSovereignPension({
        annualPortfolioBtc: effectiveAnnualBtc,
        btcPriceFiat: cadPerBtc,
        flatTaxPct,
        communitySharePct,
        horizonYears,
        btcCagrPct,
      }),
    [effectiveAnnualBtc, cadPerBtc, flatTaxPct, communitySharePct, horizonYears, btcCagrPct],
  )

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
            What If <span className="text-[#FF8C00]">{flatTaxPct}% Is the ONLY Tax</span> — and 100% Goes Into a National Pension?
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-300 leading-relaxed">
            Instead of punitive regulations, carbon red tape, and complex corporate tax layers that drive billions in infrastructure capital out of Canada, imagine a simple sovereign compact: <strong>zero grid draw, {flatTaxPct}% flat production royalty paid directly in Bitcoin into an auditable Canadian Sovereign Pension Trust</strong>, {communitySharePct}% direct revenue share to Landowners &amp; First Nations, and {Math.max(0, 100 - flatTaxPct - communitySharePct)}% retained by the builders who fund and operate the capture huts.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
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
            ⚛️ {includeNuclearPhase3 ? 'Phase 3 Nuclear + SMR Baseload: INCLUDED' : '+ Add Phase 3 Nuclear / SMR Horizon'}
          </button>
          <span className="text-[11px] text-gray-400">
            {includeNuclearPhase3
              ? 'Methane lead story + CANDU/SMR off-peak surplus active'
              : 'Currently modelling stranded methane only (2,611 ECCC sites)'}
          </span>
        </div>
      </div>

      {/* Interactive Policy Sliders */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-black/30 rounded-2xl p-4 border border-white/10">
        <div>
          <label className="flex justify-between text-xs text-gray-300 mb-1">
            <span>National Capture Rollout</span>
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
            ~{Math.round(2611 * (capturePct / 100)).toLocaleString()} sites deployed ({effectiveAnnualBtc.toFixed(0)} BTC/yr gross)
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
            step={2}
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
            Funds <strong>{model.retireesSupportedAt25kYr.toLocaleString('en-CA')}</strong> Canadian pensions @ C$25K/yr forever
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
