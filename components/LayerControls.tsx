'use client'

import { useLocale } from '@/lib/useLocale'
import type { MapStyleMode } from '@/components/Map'

export type LayerPresetId = 'analysis' | 'satellite' | 'minimal'

export const LAYER_PRESETS: Record<LayerPresetId, { label: string; layers: Partial<LayerControlsProps['layers']> }> = {
  analysis: {
    label: 'Analysis',
    layers: { sites: true, grid: true, internet: true, heatmap: true, choropleth: false, satellite: false, terrain: false },
  },
  satellite: {
    label: 'Satellite',
    layers: { sites: true, satellite: true, terrain: true, grid: false, internet: false, heatmap: false, choropleth: false },
  },
  minimal: {
    label: 'Minimal',
    layers: { sites: true, grid: false, internet: false, satellite: false, terrain: false, heatmap: false, choropleth: false },
  },
}

interface LayerControlsProps {
  layers: {
    sites: boolean
    grid: boolean
    internet: boolean
    satellite?: boolean
    terrain?: boolean
    heatmap?: boolean
    choropleth?: boolean
  }
  onToggle: (layer: keyof LayerControlsProps['layers']) => void
  onApplyPreset?: (preset: LayerPresetId) => void
  heatmapOpacity?: number
  onHeatmapOpacityChange?: (v: number) => void
  terrainExaggeration?: number
  onTerrainExaggerationChange?: (v: number) => void
  mapStyle?: MapStyleMode
  onMapStyleChange?: (style: MapStyleMode) => void
  showSiteLabels?: boolean
  onSiteLabelsChange?: (v: boolean) => void
  performanceMode?: boolean
  onPerformanceModeChange?: (v: boolean) => void
  /** Tighter spacing for map corner overlay */
  compact?: boolean
  onCopyViewport?: () => void
  copyViewportLabel?: string
}

export default function LayerControls({
  layers,
  onToggle,
  onApplyPreset,
  heatmapOpacity = 0.75,
  onHeatmapOpacityChange,
  terrainExaggeration = 1,
  onTerrainExaggerationChange,
  mapStyle = 'dark',
  onMapStyleChange,
  showSiteLabels = false,
  onSiteLabelsChange,
  performanceMode = false,
  onPerformanceModeChange,
  compact = false,
  onCopyViewport,
  copyViewportLabel = 'Copy viewport JSON',
}: LayerControlsProps) {
  const { t } = useLocale()

  const styleButtons: { id: MapStyleMode; label: string }[] = [
    { id: 'standard', label: t('mapStyleStandard') },
    { id: 'dark', label: t('mapStyleDark') },
    { id: 'satellite', label: t('mapStyleSatellite') },
    { id: 'terrain', label: t('mapStyleTerrain') },
  ]

  return (
    <div
      className={`bg-[#1e293b]/95 backdrop-blur border border-[#5BC0BE]/30 rounded-xl shadow-lg no-print ${
        compact ? 'p-2.5 text-xs max-w-[220px]' : 'p-4 text-sm'
      }`}
      data-compact={compact || undefined}
    >
      <h3 className={`font-bold text-[#FF8C00] flex items-center gap-2 ${compact ? 'text-xs mb-2' : 'text-sm mb-3'}`}>
        {t('mapLayers')} <span className="text-[10px] text-gray-500 font-normal">{t('mapLayersNote')}</span>
      </h3>

      {onMapStyleChange && (
        <div className={compact ? 'mb-2' : 'mb-3'}>
          <div className={`text-[10px] uppercase tracking-wider text-gray-400 ${compact ? 'mb-1' : 'mb-1.5'}`}>{t('mapStyleSwitcher')}</div>
          <div className="flex flex-wrap gap-1">
            {styleButtons.map(btn => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onMapStyleChange(btn.id)}
                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  mapStyle === btn.id
                    ? 'border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10'
                    : 'border-white/15 hover:border-white/40'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {onApplyPreset && (
        <div className={`flex flex-wrap gap-1 ${compact ? 'mb-2' : 'mb-3'}`}>
          {(Object.keys(LAYER_PRESETS) as LayerPresetId[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => onApplyPreset(id)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-white/15 hover:border-[#FF8C00]/40"
            >
              {LAYER_PRESETS[id].label}
            </button>
          ))}
        </div>
      )}

      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={layers.sites} onChange={() => onToggle('sites')} className={`accent-[#FF8C00] ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapLayerMethaneSites')}</span>
        </label>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={layers.grid} onChange={() => onToggle('grid')} className={`accent-[#5BC0BE] ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapLayerPowerGrid')}</span>
        </label>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={layers.internet} onChange={() => onToggle('internet')} className={`accent-blue-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapLayerInternet')}</span>
        </label>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={!!layers.satellite} onChange={() => onToggle('satellite')} className={`accent-purple-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapSatellite')}</span>
        </label>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={!!layers.terrain} onChange={() => onToggle('terrain')} className={`accent-emerald-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapTerrain')}</span>
        </label>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={!!layers.heatmap} onChange={() => onToggle('heatmap')} className={`accent-rose-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapLayerHeatmap')}</span>
        </label>
        <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
          <input type="checkbox" checked={!!layers.choropleth} onChange={() => onToggle('choropleth')} className={`accent-amber-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
          <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapLayerChoropleth')}</span>
        </label>
        {onSiteLabelsChange && (
          <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
            <input type="checkbox" checked={showSiteLabels} onChange={() => onSiteLabelsChange(!showSiteLabels)} className={`accent-cyan-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapSiteLabels')}</span>
          </label>
        )}
        {onPerformanceModeChange && (
          <label className={`flex items-center cursor-pointer group ${compact ? 'gap-2' : 'gap-3'}`}>
            <input type="checkbox" checked={performanceMode} onChange={() => onPerformanceModeChange(!performanceMode)} className={`accent-slate-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            <span className={`text-gray-300 group-hover:text-white ${compact ? 'text-[11px] leading-tight' : 'text-sm'}`}>{t('mapPerformanceMode')}</span>
          </label>
        )}
      </div>

      {layers.heatmap && onHeatmapOpacityChange && (
        <div className="mt-3">
          <label className="text-[10px] text-gray-400">Heatmap opacity {Math.round(heatmapOpacity * 100)}%</label>
          <input type="range" min={0.2} max={1} step={0.05} value={heatmapOpacity} onChange={e => onHeatmapOpacityChange(+e.target.value)} className="w-full accent-rose-400" />
        </div>
      )}
      {layers.terrain && onTerrainExaggerationChange && (
        <div className="mt-2">
          <label className="text-[10px] text-gray-400">Terrain exaggeration {terrainExaggeration.toFixed(1)}×</label>
          <input type="range" min={0.5} max={2} step={0.1} value={terrainExaggeration} onChange={e => onTerrainExaggerationChange(+e.target.value)} className="w-full accent-emerald-400" />
        </div>
      )}

      <div className={`border-t border-[#5BC0BE]/20 text-[10px] text-gray-500 ${compact ? 'mt-2 pt-2' : 'mt-4 pt-3'}`}>{t('mapLayerNote2')}</div>

      {onCopyViewport && (
        <details className="mt-2 group">
          <summary className="text-[9px] uppercase tracking-wider text-gray-600 cursor-pointer hover:text-gray-400 list-none [&::-webkit-details-marker]:hidden">
            Dev
          </summary>
          <button
            type="button"
            onClick={onCopyViewport}
            className="mt-2 w-full text-[10px] px-2 py-1.5 rounded-lg border border-white/10 text-gray-500 hover:text-[#5BC0BE] hover:border-[#5BC0BE]/30 transition"
            data-testid="copy-viewport-json"
          >
            {copyViewportLabel}
          </button>
        </details>
      )}
    </div>
  )
}