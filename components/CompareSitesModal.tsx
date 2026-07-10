'use client'

import { X } from 'lucide-react'
import { EnrichedSite } from '@/lib/sites'
import { computeAdvancedRoi } from '@/lib/roi-model'
import FocusTrap from './FocusTrap'

export default function CompareSitesModal({
  sites,
  liveBtc,
  onClose,
}: {
  sites: EnrichedSite[]
  liveBtc: number
  onClose: () => void
}) {
  if (sites.length < 2) return null

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <FocusTrap active onEscape={onClose} className="w-full max-w-4xl">
        <div
          className="glass-strong rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-sites-title"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="compare-sites-title" className="text-xl font-bold">Compare Sites ({sites.length})</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close compare" data-autofocus>
              <X size={20} />
            </button>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sites.length}, minmax(0, 1fr))` }}>
            {sites.map(site => {
              const roi = computeAdvancedRoi(site, site.recommendedGenset || 'jenbacher316', { liveBtcUsd: liveBtc })
              const p = site.properties
              return (
                <div key={site.id} className="border border-white/10 rounded-xl p-4 bg-black/20">
                  <div className="font-semibold text-[#FF8C00] truncate">{p.name}</div>
                  <div className="text-xs text-gray-400 mb-3">{p.province}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Score</span><span>{site.strandedScore}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Emission</span><span>{site.emission.toLocaleString()} kg/d</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Power</span><span>{roi.powerKW} kW</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">ASICs</span><span>{roi.numAsics}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">LCOE</span><span>${roi.lcoeUsdPerKwh}/kWh</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Payback</span><span>{roi.paybackYears} yr</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Jobs</span><span>{roi.jobs.total} FTE</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </FocusTrap>
    </div>
  )
}
