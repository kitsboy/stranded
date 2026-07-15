'use client'

import { Filter, RefreshCw, ChevronDown, X, Trash2 } from 'lucide-react'
import DualRangeSlider from '@/components/DualRangeSlider'
import type { FilterPreset } from '@/lib/bookmarks'
import type { MapViewMode } from '@/components/Map'

export type MapFiltersPanelProps = {
  minEmission: number
  maxEmission: number
  minScore: number
  selectedProvinces: Set<string>
  selectedSources: Set<string>
  showAllProvinces: boolean
  presetName: string
  provinces: string[]
  sourceTypes: string[]
  viewMode: MapViewMode
  viewModeLabel: Record<MapViewMode, string>
  savedPresets: FilterPreset[]
  recentPresets: FilterPreset[]
  layersGrid: boolean
  onMinEmissionChange: (v: number) => void
  onMaxEmissionChange: (v: number) => void
  onMinScoreChange: (v: number) => void
  onToggleProvince: (prov: string) => void
  onToggleSource: (src: string) => void
  onShowAllProvincesToggle: () => void
  onPresetNameChange: (v: string) => void
  onSavePreset: () => void
  onSharePreset: () => void
  onApplyPreset: (preset: FilterPreset) => void
  onDeletePreset: (name: string) => void
  onResetFilters: () => void
  onCycleViewMode: () => void
  onToggleGridLayer: () => void
  onClose?: () => void
  className?: string
  t: (key: string) => string
}

export default function MapFiltersPanel({
  minEmission,
  maxEmission,
  minScore,
  selectedProvinces,
  selectedSources,
  showAllProvinces,
  presetName,
  provinces,
  sourceTypes,
  viewMode,
  viewModeLabel,
  savedPresets,
  recentPresets,
  layersGrid,
  onMinEmissionChange,
  onMaxEmissionChange,
  onMinScoreChange,
  onToggleProvince,
  onToggleSource,
  onShowAllProvincesToggle,
  onPresetNameChange,
  onSavePreset,
  onSharePreset,
  onApplyPreset,
  onDeletePreset,
  onResetFilters,
  onCycleViewMode,
  onToggleGridLayer,
  onClose,
  className = '',
  t,
}: MapFiltersPanelProps) {
  return (
    <div className={className} data-tour="map-filters">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#FF8C00] font-semibold tracking-widest text-xs">
          <Filter size={16} /> {t('mapFiltersLive')}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onResetFilters} className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-white">
            <RefreshCw size={13} /> {t('mapReset')}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-1" aria-label={t('mapCloseFilters')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5 text-gray-400">
          <div>{t('mapEmissionRange')}</div>
          <div className="font-mono text-white">{minEmission.toLocaleString()} — {maxEmission.toLocaleString()}</div>
        </div>
        <DualRangeSlider
          min={0}
          max={65000}
          step={50}
          valueMin={minEmission}
          valueMax={maxEmission}
          onChange={(lo, hi) => { onMinEmissionChange(lo); onMaxEmissionChange(hi) }}
        />
      </div>

      <div className="mb-5">
        <div className="text-xs text-gray-400 mb-1.5 flex justify-between">
          {t('mapMinScore')} <span className="font-mono text-white">{minScore}</span> (0 = show all)
        </div>
        <input type="range" min="0" max="98" value={minScore} onChange={e => onMinScoreChange(Number(e.target.value))} className="w-full accent-[#5BC0BE]" />
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: 'All', v: 0 },
            { label: 'Med+', v: 45 },
            { label: 'High+', v: 65 },
            { label: 'Elite', v: 85 },
          ].map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onMinScoreChange(chip.v)}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${minScore === chip.v ? 'border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10' : 'border-white/15 text-gray-400'}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest mb-1.5 text-gray-400 flex items-center justify-between">
          {t('mapProvinces')}
          <button
            type="button"
            onClick={onShowAllProvincesToggle}
            className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-[#FF8C00] transition"
          >
            {showAllProvinces ? t('mapCollapse') : t('mapExpand')}
            <ChevronDown size={12} className={`transition-transform ${showAllProvinces ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className={`flex flex-wrap gap-1.5 pr-1 transition-all duration-200 ${showAllProvinces ? 'max-h-[220px]' : 'max-h-[78px]'} overflow-auto`}>
          {provinces.map(p => (
            <button key={p} type="button" onClick={() => onToggleProvince(p)} className={`filter-chip text-xs px-3 py-px rounded-full border ${selectedProvinces.has(p) ? 'active border-[#FF8C00]' : 'border-white/20 hover:border-white/40'}`}>
              {p}
            </button>
          ))}
        </div>
        {!showAllProvinces && provinces.length > 6 && (
          <div className="text-[9px] text-gray-500 mt-0.5">+{provinces.length - 6} more (territories &amp; provinces)</div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest mb-2 text-gray-400">{t('mapSourceType')}</div>
        <div className="flex flex-wrap gap-1.5">
          {sourceTypes.map(s => (
            <button key={s} type="button" onClick={() => onToggleSource(s)} className={`filter-chip text-xs px-3 py-px rounded-full border ${selectedSources.has(s) ? 'active border-[#FF8C00]' : 'border-white/20 hover:border-white/40'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="text-xs uppercase tracking-widest mb-2 text-gray-400">{t('mapFilterPresets')}</div>
        {recentPresets.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">{t('mapRecentPresets')}</div>
            <div className="flex flex-wrap gap-1">
              {recentPresets.map(p => (
                <button
                  key={`recent-${p.name}`}
                  type="button"
                  onClick={() => onApplyPreset(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
                  data-testid={`recent-preset-${p.name}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-1 mb-2">
          <input value={presetName} onChange={e => onPresetNameChange(e.target.value)} placeholder={t('mapPresetName')} className="flex-1 text-xs px-2 py-1 rounded-lg bg-black/30 border border-white/15" />
          <button type="button" onClick={onSavePreset} className="text-[10px] px-2 py-1 rounded-lg bg-[#FF8C00]/20 border border-[#FF8C00]/40 text-[#FF8C00]">{t('mapSave')}</button>
          <button type="button" onClick={onSharePreset} className="text-[10px] px-2 py-1 rounded-lg border border-[#5BC0BE]/40 text-[#5BC0BE]">{t('mapShare')}</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {savedPresets.map(p => (
            <span key={p.name} className="inline-flex items-center gap-0.5">
              <button type="button" onClick={() => onApplyPreset(p)} className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 hover:border-[#5BC0BE]/50">{p.name}</button>
              <button
                type="button"
                onClick={() => onDeletePreset(p.name)}
                className="p-0.5 text-gray-500 hover:text-red-400 rounded"
                aria-label={t('mapDeletePreset')}
                data-testid={`delete-preset-${p.name}`}
              >
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
        <button type="button" onClick={onCycleViewMode} className="flex-1 text-xs py-2 rounded-2xl border border-white/20 hover:bg-white/5 flex items-center justify-center gap-2">
          {viewModeLabel[viewMode]}
        </button>
        <button type="button" onClick={onToggleGridLayer} className={`text-xs px-3 rounded-2xl border ${layersGrid ? 'bg-[#5BC0BE] text-black border-[#5BC0BE]' : 'border-white/20'}`}>{t('mapGrid')}</button>
      </div>
    </div>
  )
}