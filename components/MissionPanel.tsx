'use client'

import { motion } from 'framer-motion'
import { X, TrendingUp, Zap, Leaf } from 'lucide-react'
import { EnrichedSite } from '@/lib/sites'

interface MissionPanelProps {
  portfolio: EnrichedSite[]
  liveBtcPrice: number
  onRemove: (id: string) => void
  onClear: () => void
  onFlyTo: (site: EnrichedSite) => void
}

export default function MissionPanel({ portfolio, liveBtcPrice, onRemove, onClear, onFlyTo }: MissionPanelProps) {
  if (portfolio.length === 0) return null

  const totalEmission = portfolio.reduce((sum, s) => sum + s.emission, 0)
  const totalScore = Math.round(portfolio.reduce((sum, s) => sum + s.strandedScore, 0) / portfolio.length)
  const totalPotential = portfolio.reduce((sum, s) => sum + s.potentialDailyProfitCAD, 0)
  const dailyBtc = (totalPotential / 1.35 / liveBtcPrice) // rough back calc
  const annualCO2 = Math.round(totalEmission * 0.365 * 25) // very rough methane -> CO2e
  // Generator aggregate for mission (CapEx on production side)
  const totalGeneratorPower = portfolio.reduce((sum, s) => sum + (s.maxGeneratorPowerKW || 0), 0)
  const totalGensetCapex = portfolio.reduce((sum, s) => sum + ((s.maxGeneratorPowerKW || 0) * 1000), 0) // rough using avg $1000/kW

  return (
    <div className="glass-strong rounded-2xl p-5 border border-[#FF8C00]/30 shadow-2xl w-full max-w-[340px] text-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-[#FF8C00]" size={18} />
          <div>
            <div className="font-semibold tracking-tight">ACTIVE MISSION</div>
            <div className="text-[10px] text-gray-400 -mt-0.5">{portfolio.length} sites selected</div>
          </div>
        </div>
        <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1">
          <X size={14} /> CLEAR
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="mission-stat bg-black/30 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 flex items-center gap-1"><TrendingUp size={13} /> DAILY YIELD</div>
          <div className="text-2xl font-semibold text-[#FF8C00] tabular-nums mt-0.5">C${totalPotential.toLocaleString()}</div>
        </div>
        <div className="mission-stat bg-black/30 rounded-xl p-3">
          <div className="text-[10px] text-gray-400 flex items-center gap-1"><Leaf size={13} /> CO₂e / YR</div>
          <div className="text-2xl font-semibold text-[#5BC0BE] tabular-nums mt-0.5">{(annualCO2 / 1000).toFixed(1)}k t</div>
        </div>
        <div className="mission-stat bg-black/30 rounded-xl p-3">
          <div className="text-[10px] text-gray-400">AVG STRANDED SCORE</div>
          <div className="text-2xl font-semibold tabular-nums mt-0.5">{totalScore}</div>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 mt-2">Mission Generator Capacity: {totalGeneratorPower.toLocaleString()} kW (est. CapEx ~${(totalGensetCapex/1000000).toFixed(1)}M)</div>

      <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Selected sites</div>
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
                <button onClick={() => onFlyTo(site)} className="text-[#5BC0BE] hover:text-white opacity-70 hover:opacity-100">fly</button>
                <button onClick={() => onRemove(site.id)} className="text-red-400/70 hover:text-red-400">×</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-gray-400">
        At current BTC price <span className="font-mono text-white">≈${Math.round(liveBtcPrice).toLocaleString()}</span><br />
        Potential daily BTC ≈ <span className="font-mono text-[#FF8C00]">{dailyBtc.toFixed(4)}</span>
      </div>
    </div>
  )
}
