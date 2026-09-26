import fs from 'fs'
import path from 'path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { enrichSite, type EnrichedSite } from '@/lib/sites'
import { fleetPresetForSourceType, siteEmissionKgDay, type FleetTemplate } from '@/lib/fleet-template'
import { computeFleetModel } from '@/lib/fleet-model'
import { ASIC_MACHINES } from '@/lib/fleet-template'
import { hasCarbonBaseline, carbonBaselineLabel, methaneToCo2eTonnes } from '@/lib/carbon-overlay'
import { scoreTier, scoreTierClass } from '@/lib/scoring'

export const dynamic = 'force-static'
export const revalidate = 3600

export function generateStaticParams() {
  const sites = loadAllSites()
  return sites.map(s => ({ id: s.id }))
}

type Params = { id: string }

function loadAllSites(): EnrichedSite[] {
  const file = path.join(process.cwd(), 'public', 'data', 'stranded-sites.geojson')
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  return (data.features || []).map(enrichSite)
}

function findSite(id: string, sites: EnrichedSite[]): EnrichedSite | null {
  return sites.find(s => s.id === id || String(s.properties.ghgrp_id) === id) || null
}

function defaultBuild(site: EnrichedSite): FleetTemplate {
  const preset = fleetPresetForSourceType(site.properties.source_type || '')
  if (preset) return preset
  return {
    id: 'custom',
    name: 'Custom build',
    sourceTypes: [site.properties.source_type || ''],
    asicId: 's21xp',
    minerCount: 0,
    mode: 'auto',
    gensets: [{ gensetId: 'jenbacher316', count: 1 }],
    assumptions: {
      btcPriceUsd: 85000,
      revenuePerThPerDayBtc: 0.0000009,
      uptimePct: 95,
      powerCostUsdPerKwh: 0.04,
      poolFeePct: 1.5,
      maintenancePct: 5,
      fixedSetupCostCad: 25000,
    },
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const sites = loadAllSites()
  const site = findSite(params.id, sites)
  if (!site) return { title: 'Site not found | Stranded' }
  const name = site.properties.name || site.id
  return {
    title: `${name} — Stranded Energy ROI | Stranded Value`,
    description: `Model the Bitcoin-mining ROI of ${name} (${site.properties.province || 'Canada'}). Real ECCC methane data, honest generator + ASIC economics.`,
    openGraph: {
      title: `${name} — Stranded Energy ROI`,
      description: `Model the Bitcoin-mining ROI of ${name}. Real ECCC methane data, honest economics.`,
      images: [{ url: '/images/3.jpg' }],
    },
  }
}

export default function PublicSitePage({ params }: { params: Params }) {
  const sites = loadAllSites()
  const site = findSite(params.id, sites)
  if (!site) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Site not found</h1>
          <p className="text-gray-400 mb-4">We could not find that site in the dataset.</p>
          <Link href="/map" className="text-[#5BC0BE] underline">Open the map →</Link>
        </div>
      </main>
    )
  }

  const template = defaultBuild(site)
  const asic = ASIC_MACHINES.find(m => m.id === template.asicId) || ASIC_MACHINES[0]
  const btcUsd = template.assumptions.btcPriceUsd
  const btcPrices = { usd: btcUsd, eur: btcUsd * 0.92, jpy: btcUsd * 145, gbp: btcUsd * 0.79, cad: btcUsd * 1.36 }
  const model = computeFleetModel({
    site,
    gensets: template.gensets,
    asic,
    machineCount: template.mode === 'auto' ? 100000 : template.minerCount,
    overclockPercent: template.overclockPercent || 0,
    btcPrice: btcUsd,
    btcPrices,
    uptimePercent: template.assumptions.uptimePct,
    poolFeePercent: template.assumptions.poolFeePct,
    maintenanceAnnualPercent: template.assumptions.maintenancePct,
    revenuePerThPerDayBtc: template.assumptions.revenuePerThPerDayBtc,
    fixedSetupCostCad: template.assumptions.fixedSetupCostCad,
    debtPercent: 60,
    interestRate: 8,
  })

  const name = site.properties.name || site.id
  const province = site.properties.province || 'Canada'
  const emission = siteEmissionKgDay(site)
  const co2ePerYear = methaneToCo2eTonnes((emission * 365) / 1000)
  const tier = scoreTier(site.strandedScore)
  const tierClass = scoreTierClass(site.strandedScore)
  const carbonBaseline = hasCarbonBaseline(site.properties as Record<string, unknown>)
  const satsPerDay = Math.round(model.effectiveDailyBtc * 100_000_000)

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="text-xs text-gray-500 mb-1">Stranded Energy · Bitcoin Access</div>
          <h1 className="text-3xl font-bold leading-tight">{name}</h1>
          <div className="text-gray-400 mt-1">{province}</div>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tierClass}`}>{tier}</span>
            <span className="text-xs text-gray-400">Stranded Score {site.strandedScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Hero numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-micro text-gray-400">Daily profit (net)</div>
            <div className="text-xl font-bold text-green-400">${model.dailyProfitFiat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-micro text-gray-500">{satsPerDay.toLocaleString()} sats/day</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-micro text-gray-400">Payback</div>
            <div className="text-xl font-bold">{model.paybackDays < 365 ? 'Under 1 yr' : `${Math.round(model.paybackDays / 365)} yr`}</div>
            <div className="text-micro text-gray-500">{Math.round(model.paybackDays).toLocaleString()} days</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-micro text-gray-400">Methane captured</div>
            <div className="text-xl font-bold">{emission.toLocaleString()} kg/d</div>
            <div className="text-micro text-gray-500">~{co2ePerYear.toLocaleString(undefined, { maximumFractionDigits: 0 })} t CO₂e/yr</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-micro text-gray-400">Build</div>
            <div className="text-xl font-bold">{model.effectiveMachineCount.toLocaleString()} miners</div>
            <div className="text-micro text-gray-500">{asic.name}</div>
          </div>
        </div>

        {/* Honesty note */}
        <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200/80">
          <strong>Simplified model for educational purposes only.</strong> This is a screening estimate built on reported ECCC methane data and assumed hashprice, power cost and uptime. It is not investment advice and should not be used for actual investment decisions. {carbonBaseline ? carbonBaselineLabel(site.properties as Record<string, unknown>) : 'No published vent/flare baseline — carbon credits not established.'}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link href={`/map?site=${encodeURIComponent(site.id)}`} className="flex-1 text-center py-3 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#f59e0b] text-black font-semibold hover:opacity-90 transition">
            Model this build on the map →
          </Link>
          <Link href="/partnerships" className="flex-1 text-center py-3 rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition">
            Partner with Stranded
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600">
          <p>Data: ECCC GHGRP open reporting · Generated by Stranded Value · GiveAbit Intelligence</p>
          <p className="mt-1">BTC is always the denominator. Fiat shown in USD.</p>
        </div>
      </div>
    </main>
  )
}
