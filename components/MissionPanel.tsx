'use client'

import { useState } from 'react'
import { X, TrendingUp, Zap, Leaf } from 'lucide-react'
import { EnrichedSite } from '@/lib/sites'
import { bankPackMarkdown, bankPackCsv, bankPackTsv, bankPackHtml, bankPackJson } from '@/lib/bank-pack'
import { downloadBlob } from '@/lib/export-formats'
import { portfolioDailyPotentialCad } from '@/lib/portfolio'
import { projectBtcRevenue } from '@/lib/halving'
import { toast } from 'sonner'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import { MISSION_TEMPLATES, sitesForMissionTemplate } from '@/lib/mission-templates'
import BankPackPreview from '@/components/BankPackPreview'
import ExportFormatPicker, { type ExportFormat } from '@/components/ExportFormatPicker'

interface MissionPanelProps {
  portfolio: EnrichedSite[]
  liveBtcPrice: number
  onRemove: (id: string) => void
  onRestore?: (site: EnrichedSite) => void
  onClear: () => void
  onFlyTo: (site: EnrichedSite) => void
  onApplyTemplate?: (sites: EnrichedSite[]) => void
  allSites?: EnrichedSite[]
}

export default function MissionPanel({
  portfolio,
  liveBtcPrice,
  onRemove,
  onRestore,
  onClear,
  onFlyTo,
  onApplyTemplate,
  allSites = [],
}: MissionPanelProps) {
  const { locale, t } = useLocale()
  const [showPreview, setShowPreview] = useState(false)
  const [exportFmt, setExportFmt] = useState<ExportFormat>('md')

  if (portfolio.length === 0) return null

  const totalEmission = portfolio.reduce((sum, s) => sum + s.emission, 0)
  const totalScore = Math.round(portfolio.reduce((sum, s) => sum + s.strandedScore, 0) / portfolio.length)
  const totalPotential = portfolioDailyPotentialCad(portfolio, liveBtcPrice)
  const dailyBtc = (totalPotential / 1.35 / liveBtcPrice)
  const annualCO2 = Math.round(totalEmission * 0.365 * 25)
  const totalGeneratorPower = portfolio.reduce((sum, s) => sum + (s.maxGeneratorPowerKW || 0), 0)
  const totalGensetCapex = portfolio.reduce((sum, s) => sum + ((s.maxGeneratorPowerKW || 0) * 1000), 0)
  const annualRevenueCad = totalPotential * 365
  const simpleIrrPct = totalGensetCapex > 0
    ? Math.min(99, Math.round((annualRevenueCad * 0.72 / totalGensetCapex) * 100))
    : 0

  const handleRemove = (site: EnrichedSite) => {
    onRemove(site.id)
    toast('Removed from mission', {
      description: site.properties.name || site.id,
      action: onRestore
        ? {
            label: 'Undo',
            onClick: () => {
              onRestore(site)
              toast.success('Site restored to mission')
            },
          }
        : undefined,
      duration: 6000,
    })
  }

  const runExport = (fmt: ExportFormat) => {
    const base = `stranded-mission-bank-pack-${portfolio.length}`
    if (fmt === 'md') downloadBlob(bankPackMarkdown(portfolio, allSites, { liveBtcUsd: liveBtcPrice, title: 'Mission Bank Pack' }), `${base}.md`, 'text/markdown')
    else if (fmt === 'csv') downloadBlob(bankPackCsv(portfolio, { liveBtcUsd: liveBtcPrice }), `${base}.csv`, 'text/csv')
    else if (fmt === 'tsv') downloadBlob(bankPackTsv(portfolio, { liveBtcUsd: liveBtcPrice }), `${base}.tsv`, 'text/tab-separated-values')
    else if (fmt === 'html') {
      const w = window.open('', '_blank')
      if (w) { w.document.write(bankPackHtml(portfolio, { liveBtcUsd: liveBtcPrice, title: 'Mission Bank Pack' })); w.document.close(); w.print() }
    } else downloadBlob(JSON.stringify(bankPackJson(portfolio, { liveBtcUsd: liveBtcPrice }), null, 2), `${base}.json`, 'application/json')
    toast.success(`Bank pack (${fmt.toUpperCase()}) ready`)
  }

  return (
    <div className="glass-strong rounded-2xl p-5 border border-[#FF8C00]/30 shadow-2xl w-full max-w-[340px] text-sm" data-tour="mission-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-[#FF8C00]" size={18} />
          <div>
            <div className="font-semibold tracking-tight">{t('missionActive')}</div>
            <div className="text-[10px] text-gray-400 -mt-0.5">{tf(locale, 'missionSitesSelected', { count: portfolio.length })}</div>
          </div>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1" aria-label="Clear mission portfolio">
          <X size={14} /> {t('missionClear')}
        </button>
      </div>

      {onApplyTemplate && allSites.length > 0 && (
        <div className="mb-4 pb-3 border-b border-white/10">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Mission templates</div>
          <div className="flex flex-wrap gap-1.5">
            {MISSION_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                title={tpl.description}
                onClick={() => {
                  const picked = sitesForMissionTemplate(allSites, tpl)
                  if (!picked.length) {
                    toast.info('No sites match this template with current data')
                    return
                  }
                  onApplyTemplate(picked)
                  toast.success(`${tpl.name}: ${picked.length} sites loaded`)
                }}
                className="text-[10px] px-2 py-1 rounded-full border border-[#5BC0BE]/30 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="mission-stat bg-black/30 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 flex items-center gap-1"><TrendingUp size={13} /> {t('missionDailyYield')}</div>
          <div className="text-2xl font-semibold text-[#FF8C00] tabular-nums mt-0.5">C${totalPotential.toLocaleString()}</div>
        </div>
        <div className="mission-stat bg-black/30 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 flex items-center gap-1"><Leaf size={13} /> {t('missionCo2Year')}</div>
          <div className="text-2xl font-semibold text-[#5BC0BE] tabular-nums mt-0.5">{(annualCO2 / 1000).toFixed(1)}k t</div>
        </div>
        <div className="mission-stat bg-black/30 rounded-xl p-3">
          <div className="text-[10px] text-gray-400">{t('missionAvgScore')}</div>
          <div className="text-2xl font-semibold tabular-nums mt-0.5">{totalScore}</div>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 mt-2">{t('missionGeneratorCap')} {totalGeneratorPower.toLocaleString()} kW (est. CapEx ~${(totalGensetCapex/1000000).toFixed(1)}M)</div>
      <div className="text-[10px] text-gray-500 mt-1">Cluster ROI: ~{(dailyBtc * 365).toFixed(2)} BTC/yr · {portfolio.length} site cluster</div>
      <div className="text-[10px] text-[#34D399] mt-1">
        Est. simple IRR: <span className="font-mono font-semibold">{simpleIrrPct}%</span>
        <span className="text-gray-500 ml-1">(annual net ÷ CapEx, illustrative)</span>
      </div>

      <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t('missionSelectedSites')}</div>
      <div className="max-h-[148px] overflow-auto space-y-1 pr-1 text-xs">
        {portfolio.map(site => {
          const p = site.properties
          return (
            <div key={site.id} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-1.5 group">
              <div className="min-w-0 truncate pr-2">
                <span className="font-medium">{p.name}</span>
                <span className="text-gray-500 ml-1.5">• {p.province}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onFlyTo(site)} className="text-[#5BC0BE] hover:text-white opacity-70 hover:opacity-100">{t('missionFly')}</button>
                <button onClick={() => handleRemove(site)} className="text-red-400/70 hover:text-red-400">×</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-gray-400">
        {t('missionBtcAtPrice')} <span className="font-mono text-white">≈${Math.round(liveBtcPrice).toLocaleString()}</span><br />
        {t('missionPotentialBtc')} <span className="font-mono text-[#FF8C00]">{dailyBtc.toFixed(4)}</span>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">{t('missionBankPack')}</div>
        <ExportFormatPicker value={exportFmt} onChange={setExportFmt} className="mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="text-[10px] px-2 py-1 rounded border border-white/20 text-gray-300 hover:border-[#FF8C00]/40"
            onClick={() => setShowPreview(true)}
          >
            Preview
          </button>
          <button
            type="button"
            className="text-[10px] px-2 py-1 rounded border border-[#FF8C00]/30 text-[#FF8C00] hover:bg-[#FF8C00]/10"
            onClick={() => runExport(exportFmt)}
          >
            Export {exportFmt.toUpperCase()}
          </button>
          <button
            type="button"
            className="text-[10px] px-2 py-1 rounded border border-[#5BC0BE]/30 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
            onClick={() => {
              const rows = projectBtcRevenue(dailyBtc, 10)
              const header = 'year,daily_btc,annual_btc,halving_factor,sites_in_mission,total_emission_kg_day'
              const lines = rows.map(r =>
                [r.year, r.dailyBtc.toFixed(8), r.annualBtc.toFixed(6), r.halvingFactor.toFixed(4), portfolio.length, totalEmission].join(',')
              )
              downloadBlob([header, ...lines].join('\n'), `stranded-mission-timeline-${portfolio.length}.csv`, 'text/csv')
              toast.success('Mission timeline CSV exported')
            }}
          >
            Timeline CSV
          </button>
        </div>
      </div>

      <BankPackPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sites={portfolio}
        allSites={allSites}
        liveBtcUsd={liveBtcPrice}
        title="Mission Bank Pack"
      />
    </div>
  )
}